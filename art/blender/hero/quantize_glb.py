"""Shrink the hero GLB with KHR_mesh_quantization (no decoder: three's GLTFLoader reads it natively,
and the site's CSP forbids the WebAssembly that Meshopt/Draco decoders need).

  python3 art/blender/hero/quantize_glb.py <in.glb> <out.glb>

- POSITION inside the unit cube -> normalized SHORT (step 3e-5 units). Larger meshes (the ribbons,
  whose own node carries the animated scale, so no dequantising node transform can be added) stay float.
- NORMAL -> normalized BYTE.
- TEXCOORD_* dropped: the hero has no textures.
Prints the worst round-trip error per attribute and exits non-zero if it exceeds the budget.
"""
import json
import struct
import sys

FLOAT, BYTE, SHORT = 5126, 5120, 5122
SIZE = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
COUNT = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def read_glb(path):
    data = open(path, "rb").read()
    jlen = struct.unpack_from("<I", data, 12)[0]
    doc = json.loads(data[20:20 + jlen])
    blen = struct.unpack_from("<I", data, 20 + jlen)[0]
    return doc, data[28 + jlen:28 + jlen + blen]


def accessor_values(doc, binary, i):
    acc = doc["accessors"][i]
    view = doc["bufferViews"][acc["bufferView"]]
    n, comp = COUNT[acc["type"]], acc["componentType"]
    size = SIZE[comp] * n
    stride = view.get("byteStride", size)
    start = view.get("byteOffset", 0) + acc.get("byteOffset", 0)
    fmt = "<" + {5120: "b", 5121: "B", 5122: "h", 5123: "H", 5125: "I", 5126: "f"}[comp] * n
    return [struct.unpack_from(fmt, binary, start + k * stride) for k in range(acc["count"])]


def main(src, dst):
    doc, binary = read_glb(src)
    out = bytearray()
    views, plan = [], {}  # accessor index -> (bytes, stride, target, componentType, normalized, min, max)
    errors = {"POSITION": 0.0, "NORMAL": 0.0}
    dropped = set()

    for mesh in doc["meshes"]:
        for prim in mesh["primitives"]:
            attrs = prim["attributes"]
            for name in [k for k in attrs if k.startswith("TEXCOORD_")]:
                dropped.add(attrs.pop(name))
            pos = accessor_values(doc, binary, attrs["POSITION"])
            if max(abs(c) for v in pos for c in v) <= 1.0:
                q = [tuple(round(c * 32767) for c in v) for v in pos]
                errors["POSITION"] = max(errors["POSITION"], max(abs(a / 32767 - b) for v, w in zip(q, pos) for a, b in zip(v, w)))
                raw = b"".join(struct.pack("<hhhh", *v, 0) for v in q)
                lo = [min(v[k] for v in q) for k in range(3)]
                hi = [max(v[k] for v in q) for k in range(3)]
                plan[attrs["POSITION"]] = (raw, 8, 34962, SHORT, True, lo, hi)
            if "NORMAL" in attrs:
                nor = accessor_values(doc, binary, attrs["NORMAL"])
                q = [tuple(max(-127, min(127, round(c * 127))) for c in v) for v in nor]
                errors["NORMAL"] = max(errors["NORMAL"], max(abs(a / 127 - b) for v, w in zip(q, nor) for a, b in zip(v, w)))
                plan[attrs["NORMAL"]] = (b"".join(struct.pack("<bbbb", *v, 0) for v in q), 4, 34962, BYTE, True, None, None)

    # Rebuild the buffer: every surviving accessor gets its own tightly packed, 4-byte aligned view.
    remap, accessors = {}, []
    for i, acc in enumerate(doc["accessors"]):
        if i in dropped:
            continue
        acc = dict(acc)
        if i in plan:
            raw, stride, target, comp, norm, lo, hi = plan[i]
            acc.update(componentType=comp, normalized=norm)
            if lo is not None:
                acc["min"], acc["max"] = lo, hi
        else:
            old = doc["bufferViews"][acc["bufferView"]]
            size = SIZE[acc["componentType"]] * COUNT[acc["type"]]
            vals = accessor_values(doc, binary, i)
            fmt = "<" + {5120: "b", 5121: "B", 5122: "h", 5123: "H", 5125: "I", 5126: "f"}[acc["componentType"]] * COUNT[acc["type"]]
            raw = b"".join(struct.pack(fmt, *v) for v in vals)
            stride, target = (size if old.get("target") == 34962 and size % 4 == 0 else None), old.get("target")
        acc.pop("byteOffset", None)
        while len(out) % 4:
            out.append(0)
        view = {"buffer": 0, "byteOffset": len(out), "byteLength": len(raw)}
        if stride and target == 34962:
            view["byteStride"] = stride
        if target:
            view["target"] = target
        out += raw
        acc["bufferView"] = len(views)
        views.append(view)
        remap[i] = len(accessors)
        accessors.append(acc)

    def fix(obj):
        for k, v in list(obj.items()):
            if k in ("indices", "POSITION", "NORMAL", "input", "output") and isinstance(v, int):
                obj[k] = remap[v]
            elif k in ("attributes", "targets") and isinstance(v, dict):
                fix(v)

    for mesh in doc["meshes"]:
        for prim in mesh["primitives"]:
            fix(prim)  # recurses into attributes; a second pass would remap twice
    for anim in doc.get("animations", []):
        for sampler in anim["samplers"]:
            fix(sampler)

    while len(out) % 4:
        out.append(0)
    doc.update(accessors=accessors, bufferViews=views, buffers=[{"byteLength": len(out)}])
    for key in ("extensionsUsed", "extensionsRequired"):
        doc[key] = sorted(set(doc.get(key, [])) | {"KHR_mesh_quantization"})
    js = json.dumps(doc, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    glb = struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(out))
    glb += struct.pack("<II", len(js), 0x4E4F534A) + js + struct.pack("<II", len(out), 0x004E4942) + bytes(out)
    open(dst, "wb").write(glb)
    check(dst)
    print(f"QUANTIZED {len(open(src, 'rb').read())} -> {len(glb)} bytes; worst error position {errors['POSITION']:.2e}, normal {errors['NORMAL']:.3f}")
    if errors["POSITION"] > 2e-5 or errors["NORMAL"] > 0.005:
        sys.exit("round-trip error over budget")


def check(path):
    """Every primitive's indices stay inside its own POSITION accessor, and counts match per attribute."""
    doc, binary = read_glb(path)
    for mesh in doc["meshes"]:
        for prim in mesh["primitives"]:
            count = doc["accessors"][prim["attributes"]["POSITION"]]["count"]
            if any(doc["accessors"][a]["count"] != count for a in prim["attributes"].values()):
                sys.exit(f"{mesh['name']}: attribute counts differ")
            top = max(v[0] for v in accessor_values(doc, binary, prim["indices"]))
            if top >= count:
                sys.exit(f"{mesh['name']}: index {top} >= vertex count {count}")
    print(f"CHECKED {len(doc['meshes'])} meshes: indices and attribute counts consistent")


if __name__ == "__main__":
    main(*sys.argv[1:3])

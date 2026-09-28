"""Assert the V3 exported GLB contract without loading external resources."""
import json
import struct
import sys
from pathlib import Path


def inspect(path, arrows):
    raw = Path(path).read_bytes()
    magic, version, length = struct.unpack_from('<4sII', raw)
    assert magic == b'glTF' and version == 2 and length == len(raw), 'Invalid GLB container'
    size, kind = struct.unpack_from('<I4s', raw, 12)
    assert kind == b'JSON', 'Missing JSON chunk'
    data = json.loads(raw[20:20+size])
    expected = {'Camera', 'Thread', 'Globe', 'Globe_Smooth', 'Globe_Inner', 'Graticule', 'Pin', 'Plane', 'Arrow'}
    expected |= {'Tile_'+s for s in 'FJALE'}
    expected |= {f'Arrow_{i:03d}' for i in range(arrows)}
    names = [n.get('name','') for n in data.get('nodes',[])]
    assert len(names) == len(set(names)), 'Duplicate node names'
    assert set(names) == expected, {'missing':sorted(expected-set(names)), 'unexpected':sorted(set(names)-expected)}
    clips = [a.get('name') for a in data.get('animations',[])]
    assert clips == ['Journey'], f'Unexpected animations: {clips}'
    animation=data['animations'][0]
    duration=max(data['accessors'][sampler['input']]['max'][0] for sampler in animation['samplers'])
    assert abs(duration-10)<1e-6, f'Unexpected duration: {duration}'
    assert len(raw) <= 1600000, f'GLB exceeds 1.6MB by {len(raw)-1600000} bytes'
    assert 'KHR_draco_mesh_compression' in data.get('extensionsUsed',[]), 'Draco missing'
    result = {'file':str(path),'bytes':len(raw),'nodeCount':len(names),'objectNames':'PASS','animations':clips,'durationSeconds':duration,'draco':'PASS','budget':'PASS'}
    print(json.dumps(result,indent=2))
    return result


if __name__ == '__main__':
    assert len(sys.argv) == 3, 'Usage: check-journey-glb.py red-thread-kit-1440.glb red-thread-kit-390.glb'
    inspect(sys.argv[1],70)
    inspect(sys.argv[2],35)

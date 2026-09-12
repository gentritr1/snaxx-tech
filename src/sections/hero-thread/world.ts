import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshMatcapMaterial,
  Object3D,
  Shape,
  ExtrudeGeometry,
  SphereGeometry,
  Vector3,
} from "three";
import { globeCenter, pinAnchor, R } from "./journey";

import { continents } from "./continents";
const landBounds = continents.map((polygon) => ({
  polygon,
  minX: Math.min(...polygon.map((p) => p[0])),
  maxX: Math.max(...polygon.map((p) => p[0])),
  minY: Math.min(...polygon.map((p) => p[1])),
  maxY: Math.max(...polygon.map((p) => p[1])),
}));
function inside(x: number, y: number, polygon: number[][]) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i],
      [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      result = !result;
  }
  return result;
}
const surfacePoint = (lon: number, lat: number, radius: number) => {
  const a = ((lon - 15) * Math.PI) / 180,
    b = (lat * Math.PI) / 180;
  return new Vector3(
    Math.sin(a) * Math.cos(b),
    Math.sin(b),
    Math.cos(a) * Math.cos(b),
  ).multiplyScalar(radius);
};

export function createWorld(clay: MeshMatcapMaterial) {
  const globe = new Group();
  globe.position.copy(globeCenter);
  const ball = new Mesh(new IcosahedronGeometry(R, 4), clay);
  ball.castShadow = true;
  globe.add(ball);
  const reliefVertices: number[] = [];
  // Tessellate the silhouettes so the land follows the sphere instead of cutting through it.
  for (let lat = -58; lat < 84; lat += 2)
    for (let lon = -180; lon < 180; lon += 2) {
      if (
        !landBounds.some(
          (b) =>
            lon + 1 >= b.minX &&
            lon + 1 <= b.maxX &&
            lat + 1 >= b.minY &&
            lat + 1 <= b.maxY &&
            inside(lon + 1, lat + 1, b.polygon),
        )
      )
        continue;
      const corners = [
        [lon, lat],
        [lon + 2, lat],
        [lon + 2, lat + 2],
        [lon, lat + 2],
      ].map(([x, y]) => surfacePoint(x, y, R * 1.02));
      for (const i of [0, 1, 2, 0, 2, 3])
        corners[i].toArray(reliefVertices, reliefVertices.length);
    }
  const relief = new BufferGeometry();
  relief.setAttribute(
    "position",
    new Float32BufferAttribute(reliefVertices, 3),
  );
  relief.computeVertexNormals();
  const landMaterial = clay.clone();
  landMaterial.side = DoubleSide;
  const land = new Mesh(relief, landMaterial);
  globe.add(land);
  const coast: number[] = [];
  for (const polygon of continents)
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i],
        b = polygon[(i + 1) % polygon.length];
      for (let j = 0; j < 1; j++) {
        surfacePoint(
          a[0] + (b[0] - a[0]) * j,
          a[1] + (b[1] - a[1]) * j,
          R * 1.023,
        ).toArray(coast, coast.length);
        surfacePoint(
          a[0] + (b[0] - a[0]) * (j + 1),
          a[1] + (b[1] - a[1]) * (j + 1),
          R * 1.023,
        ).toArray(coast, coast.length);
      }
    }
  const coastGeometry = new BufferGeometry();
  coastGeometry.setAttribute("position", new Float32BufferAttribute(coast, 3));
  globe.add(
    new LineSegments(
      coastGeometry,
      new LineBasicMaterial({ color: "#DCD6CF" }),
    ),
  );
  const grid: number[] = [];
  for (let lat = -60; lat <= 60; lat += 20)
    for (let lon = -180; lon < 180; lon += 3) {
      surfacePoint(lon, lat, R * 1.005).toArray(grid, grid.length);
      surfacePoint(lon + 3, lat, R * 1.005).toArray(grid, grid.length);
    }
  for (let lon = -180; lon < 180; lon += 20)
    for (let lat = -90; lat < 90; lat += 3) {
      surfacePoint(lon, lat, R * 1.005).toArray(grid, grid.length);
      surfacePoint(lon, lat + 3, R * 1.005).toArray(grid, grid.length);
    }
  const gridGeometry = new BufferGeometry();
  gridGeometry.setAttribute("position", new Float32BufferAttribute(grid, 3));
  globe.add(
    new LineSegments(
      gridGeometry,
      new LineBasicMaterial({
        color: "#2A2D38",
        transparent: true,
        opacity: 0.25,
      }),
    ),
  );
  const pinShape = new Shape();
  pinShape.moveTo(0, -0.25);
  pinShape.bezierCurveTo(-0.09, -0.12, -0.25, 0.04, -0.22, 0.17);
  pinShape.bezierCurveTo(-0.2, 0.47, 0.2, 0.47, 0.22, 0.17);
  pinShape.bezierCurveTo(0.25, 0.04, 0.09, -0.12, 0, -0.25);
  const pin = new Mesh(
    new ExtrudeGeometry(pinShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.02,
      bevelSegments: 2,
      steps: 1,
      curveSegments: 12,
    }),
    new MeshMatcapMaterial({ matcap: clay.matcap, color: "#D73626" }),
  );
  pin.geometry.translate(0, 0.25, 0);
  pin.position.copy(pinAnchor).sub(globeCenter);
  globe.add(pin);
  const pinCenter = new Mesh(new SphereGeometry(0.075, 12, 8), clay);
  pinCenter.position.set(0, 0.42, 0.09);
  pin.add(pinCenter);
  return { globe, pin };
}

export function createFlight(clay: MeshMatcapMaterial) {
  const geometry = new BufferGeometry();
  // A folded sheet: two wings and the raised central crease; +Z points forward.
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(
      [
        0, 0.12, 0.75, -0.65, 0, -0.45, -0.1, -0.08, -0.18, 0, 0.12, 0.75, -0.1,
        -0.08, -0.18, 0, 0.12, -0.42, 0, 0.12, 0.75, 0, 0.12, -0.42, 0.1, -0.08,
        -0.18, 0, 0.12, 0.75, 0.1, -0.08, -0.18, 0.65, 0, -0.45,
      ],
      3,
    ),
  );
  geometry.computeVertexNormals();
  const material = clay.clone();
  material.side = DoubleSide;
  const plane = new Mesh(geometry, material);
  plane.castShadow = true;
  const arrow = new Shape();
  arrow.moveTo(0, 0.55);
  arrow.lineTo(-0.32, 0.05);
  arrow.lineTo(-0.1, 0.13);
  arrow.lineTo(-0.1, -0.45);
  arrow.lineTo(0.1, -0.45);
  arrow.lineTo(0.1, 0.13);
  arrow.lineTo(0.32, 0.05);
  arrow.closePath();
  const arrowGeometry = new ExtrudeGeometry(arrow, {
    depth: 0.06,
    bevelEnabled: false,
    steps: 1,
  });
  arrowGeometry.rotateX(Math.PI / 2);
  const swarm = new InstancedMesh(arrowGeometry, material, 70);
  swarm.frustumCulled = false;
  for (let i = 0; i < 70; i++)
    swarm.setColorAt(i, new Color(i >= 49 ? "#8D8579" : "#FFFFFF"));
  return { plane, swarm, instance: new Object3D(), tangent: new Vector3() };
}

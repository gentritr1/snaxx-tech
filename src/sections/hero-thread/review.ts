import { Box3, Camera, Object3D, Vector3 } from "three";
import { createThreadCurve, sampleScalar, type JourneyData } from "./journey";

/** On-demand evidence only; no allocation or DOM work during playback. */
export function measureJourney(root: Object3D, camera: Camera, data: JourneyData, p: number, width: number, height: number) {
  root.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const project = (point: Vector3) => {
    const v = point.clone().project(camera);
    return [((v.x + 1) * width) / 2, ((1 - v.y) * height) / 2, v.z];
  };
  const objects = root.children.filter(o => /^(Globe|Graticule|Pin|Plane|Arrow|Tile_)/.test(o.name)).flatMap(object => {
    if (object.getWorldScale(new Vector3()).length() < 1e-6) return [];
    const bounds = new Box3().setFromObject(object);
    if (bounds.isEmpty()) return [];
    const corners = [];
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) corners.push(project(new Vector3(x,y,z)));
    return [{name:object.name,box:[Math.min(...corners.map(v=>v[0])),Math.min(...corners.map(v=>v[1])),Math.max(...corners.map(v=>v[0])),Math.max(...corners.map(v=>v[1]))],crossesCameraClip:corners.some(v=>v[2] < -1 || v[2] > 1)}];
  });
  const curve = createThreadCurve(data), start = sampleScalar(data.reveal.start,p), end = sampleScalar(data.reveal.end,p);
  const cord = [];
  for (let i=0;i<=2048;i++) {
    const t=i/2048;if(t<start || t>end)continue;
    const point=project(curve.getPoint(t));
    if(point[2]>=-1 && point[2]<=1 && point[0]>=0 && point[0]<width && point[1]>=0 && point[1]<height)cord.push(point.slice(0,2));
  }
  return {p,viewport:[width,height],objects,cord,reveal:[start,end],zones:data.zones,sourceSHA256:data.sourceSHA256};
}

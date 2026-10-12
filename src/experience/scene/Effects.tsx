import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Bloom, DepthOfField, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { DepthOfFieldEffect, ToneMappingMode } from 'postprocessing';
import { Vector3 } from 'three';
import { sceneState } from '../sceneState';
import type { Quality } from '../quality';

/** Art-directed post stack: HDR bloom on emissives only, shallow DoF on desktop. */
export function Effects({ quality }: { quality: Quality }) {
  const dof = useRef<DepthOfFieldEffect>(null);
  const focus = useMemo(() => new Vector3(), []);

  useEffect(() => {
    if (dof.current) dof.current.target = focus;
  }, [focus]);

  useFrame(() => {
    focus.copy(sceneState.target);
  });

  return (
    <EffectComposer multisampling={quality.multisampling} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.9} luminanceThreshold={1} luminanceSmoothing={0.3} radius={0.65} />
      {quality.dof ? (
        <DepthOfField ref={dof} focalLength={0.04} bokehScale={2.4} worldFocusRange={16} />
      ) : (
        <></>
      )}
      <Vignette eskil={false} offset={0.22} darkness={0.72} />
      <Noise premultiply opacity={0.06} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}

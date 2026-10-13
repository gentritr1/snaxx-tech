import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import type { Quality } from '../quality';

/**
 * Art-directed post stack. Bloom is reserved for the few emissive parts
 * (caramel centre, portal rim); depth of field was dropped because on a
 * bright, evenly lit scene it costs a full-resolution pass for almost no
 * visible gain.
 */
export function Effects({ quality }: { quality: Quality }) {
  return (
    <EffectComposer multisampling={quality.multisampling} enableNormalPass={false}>
      {quality.bloom ? (
        <Bloom mipmapBlur intensity={0.45} luminanceThreshold={1} luminanceSmoothing={0.3} radius={0.6} levels={5} />
      ) : (
        <></>
      )}
      <Vignette eskil={false} offset={0.1} darkness={0.22} />
      <Noise premultiply opacity={0.03} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}

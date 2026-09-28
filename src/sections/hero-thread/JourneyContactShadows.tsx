/* Contact-shadow depth/blur method adapted from drei ContactShadows (MIT).
 * Its public `frames` counter cannot be paused through a ref. This scoped adapter
 * keeps the baked result while idle without React updates on scroll frames. */
/* eslint-disable react-hooks/immutability */
import { useEffect, useMemo, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  OrthographicCamera,
  PlaneGeometry,
  ShaderMaterial,
  WebGLRenderTarget,
} from "three";
import { HorizontalBlurShader } from "three/examples/jsm/shaders/HorizontalBlurShader.js";
import { VerticalBlurShader } from "three/examples/jsm/shaders/VerticalBlurShader.js";
import type { MotionDriver } from "./motion";

export function JourneyContactShadows({
  driver,
}: {
  driver: RefObject<MotionDriver>;
}) {
  const { gl, scene } = useThree();
  const shadow = useMemo(() => {
    const group = new Group();
    const target = new WebGLRenderTarget(512, 512),
      temporary = new WebGLRenderTarget(512, 512);
    target.texture.generateMipmaps = temporary.texture.generateMipmaps = false;
    const geometry = new PlaneGeometry(24, 16);
    const material = new MeshBasicMaterial({
      map: target.texture,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const floor = new Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(18, -3, 0);
    group.add(floor);
    const camera = new OrthographicCamera(-12, 12, 8, -8, 0, 6);
    camera.position.set(18, -2.99, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(18, 3, 0);
    camera.updateMatrixWorld();
    camera.layers.set(1);
    const depth = new MeshDepthMaterial();
    depth.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "vec4( vec3( 1.0 - fragCoordZ ), opacity );",
        "vec4(vec3(0.0), (1.0-fragCoordZ));",
      );
    };
    const horizontal = new ShaderMaterial(HorizontalBlurShader),
      vertical = new ShaderMaterial(VerticalBlurShader);
    const blurPlane = new Mesh(new PlaneGeometry(2, 2), horizontal);
    const blurCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    return {
      group,
      target,
      temporary,
      geometry,
      material,
      camera,
      depth,
      horizontal,
      vertical,
      blurPlane,
      blurCamera,
      painted: false,
      lastP: -1,
    };
  }, []);
  useEffect(
    () => () => {
      shadow.target.dispose();
      shadow.temporary.dispose();
      shadow.geometry.dispose();
      shadow.material.dispose();
      shadow.depth.dispose();
      shadow.horizontal.dispose();
      shadow.vertical.dispose();
      shadow.blurPlane.geometry.dispose();
    },
    [shadow],
  );
  useFrame(() => {
    const state = driver.current;
    shadow.group.visible = state.p > 0.2 && state.p < 0.48;
    if (!state.inView || (state.p === shadow.lastP && shadow.painted) || state.p >= 0.48 || state.p <= 0.2)
      return;
    const background = scene.background,
      override = scene.overrideMaterial,
      previous = gl.getRenderTarget();
    shadow.group.visible = false;
    scene.background = null;
    const clearAlpha = gl.getClearAlpha();
    gl.setClearAlpha(0);
    scene.overrideMaterial = shadow.depth;
    gl.setRenderTarget(shadow.target);
    gl.render(scene, shadow.camera);
    for (const blur of [2.4, 0.96]) {
      shadow.blurPlane.material = shadow.horizontal;
      shadow.horizontal.uniforms.tDiffuse.value = shadow.target.texture;
      shadow.horizontal.uniforms.h.value = blur / 256;
      gl.setRenderTarget(shadow.temporary);
      gl.render(shadow.blurPlane, shadow.blurCamera);
      shadow.blurPlane.material = shadow.vertical;
      shadow.vertical.uniforms.tDiffuse.value = shadow.temporary.texture;
      shadow.vertical.uniforms.v.value = blur / 256;
      gl.setRenderTarget(shadow.target);
      gl.render(shadow.blurPlane, shadow.blurCamera);
    }
    gl.setRenderTarget(previous);
    gl.setClearAlpha(clearAlpha);
    scene.background = background;
    scene.overrideMaterial = override;
    shadow.group.visible = state.p > 0.2;
    shadow.painted = true;
    shadow.lastP = state.p;
  });
  return <primitive object={shadow.group} />;
}

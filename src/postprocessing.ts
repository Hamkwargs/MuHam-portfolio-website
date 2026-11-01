
/**
 * EffectComposer + Bloom + Truth Vision
 *
 * Circular grayscale reveal using GPU ShaderPass.
 * The circle radius is measured in CSS pixels.
 */

import * as THREE from 'three';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

import { BLOOM } from './config';
import { camera, renderer, scene } from './core';

// ========================================
// EFFECT COMPOSER
// ========================================

export const composer = new EffectComposer(
  renderer,
  new THREE.WebGLRenderTarget(256, 256, {
    type: THREE.UnsignedByteType,
  })
);

composer.addPass(new RenderPass(scene, camera));

// ========================================
// BLOOM — PRESERVE ORIGINAL SETTINGS
// ========================================

export const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(256, 256),
  BLOOM,
  0.7,
  0.75
);

composer.addPass(bloomPass);

// ========================================
// TRUTH VISION SHADER
// ========================================

export const truthPass = new ShaderPass({
  uniforms: {
    tDiffuse: {
      value: null,
    },

    uCenter: {
      value: new THREE.Vector2(0.5, 0.5),
    },

    uResolution: {
      value: new THREE.Vector2(1, 1),
    },

    uRadius: {
      value: 0,
    },
  },

  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;

      gl_Position =
        projectionMatrix *
        modelViewMatrix *
        vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uCenter;
    uniform vec2 uResolution;
    uniform float uRadius;

    varying vec2 vUv;

    void main() {
      vec4 original = texture2D(
        tDiffuse,
        vUv
      );

      // Current pixel in CSS-pixel coordinates.
      vec2 pixelPosition = vUv * uResolution;

      // Circle origin in the same coordinate system.
      vec2 pixelCenter = uCenter * uResolution;

      float distanceFromCenter = length(
        pixelPosition - pixelCenter
      );

      // Hard circular boundary with a subtle
      // 2-pixel antialiasing region.
      float circleMask = 1.0 - smoothstep(
        uRadius - 1.0,
        uRadius + 1.0,
        distanceFromCenter
      );

      // True grayscale: zero saturation.
      float luminance = dot(
        original.rgb,
        vec3(0.2126, 0.7152, 0.0722)
      );

      // Preserve a slightly cinematic contrast,
      // but never reintroduce color.
      float noir = clamp(
        (luminance - 0.5) * 1.055 + 0.5,
        0.0,
        1.0
      ) * 0.99;

      vec3 grayscale = vec3(noir);

      // Outside: original color.
      // Inside: grayscale.
      vec3 finalColor = mix(
        original.rgb,
        grayscale,
        circleMask
      );

      gl_FragColor = vec4(
        finalColor,
        original.a
      );
    }
  `,
});

composer.addPass(truthPass);

truthPass.enabled = false;

// ========================================
// UPDATE SHADER
// ========================================

/**
 * Important:
 * ShaderPass clones uniforms internally.
 *
 * Update truthPass.uniforms, NOT the object
 * passed to the ShaderPass constructor.
 */
export function updateTruthShader(
  centerX: number,
  centerY: number,
  radiusCss: number
) {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);

  const uniforms = truthPass.uniforms;

  uniforms.uResolution.value.set(
    width,
    height
  );

  // DOM origin: top-left
  // WebGL UV origin: bottom-left
  uniforms.uCenter.value.set(
    centerX / width,
    1 - centerY / height
  );

  uniforms.uRadius.value = Math.max(
    0,
    radiusCss
  );

  truthPass.enabled = radiusCss > 0.01;
}

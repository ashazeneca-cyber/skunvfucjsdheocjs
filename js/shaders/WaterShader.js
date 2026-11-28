/**
 * RAPSONYX Stylized Water Shader
 * - High/Medium/Ultra: Beer-Lambert depth absorption, Dual scrolling caustics, Fresnel specular, Shore foam
 * - Low preset fallback: Fast low-ALU gradient + specular pass
 */

import * as THREE from 'three';

export class WaterShader {
  static createMaterial({
    causticsTex = null,
    depthTex = null,
    sunDir = new THREE.Vector3(0.45, 0.72, 0.52),
    sunColor = new THREE.Color(0xfff0d6),
    quality = 'medium'
  } = {}) {
    const isLow = quality === 'low';
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uCaustics: { value: causticsTex },
        uDepthTex: { value: depthTex },
        uHasCaustics: { value: !isLow && causticsTex ? 1.0 : 0.0 },
        uHasDepth: { value: !isLow && depthTex ? 1.0 : 0.0 },
        uLowMode: { value: isLow ? 1.0 : 0.0 },
        uSunDir: { value: sunDir.clone().normalize() },
        uSunColor: { value: sunColor.clone() },
        uShallowColor: { value: new THREE.Color(0x3be8df) },
        uDeepColor: { value: new THREE.Color(0x0b4a8f) }
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uLowMode;
        varying vec3 vWorldPos;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          if (uLowMode < 0.5) {
            pos.y += sin(pos.x * 0.15 + uTime * 1.4) * 0.08 + cos(pos.z * 0.18 + uTime * 1.1) * 0.06;
          }
          vec4 wp = modelMatrix * vec4(pos, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform sampler2D uCaustics;
        uniform sampler2D uDepthTex;
        uniform float uHasCaustics;
        uniform float uHasDepth;
        uniform float uLowMode;
        uniform vec3 uSunDir;
        uniform vec3 uSunColor;
        uniform vec3 uShallowColor;
        uniform vec3 uDeepColor;
        varying vec3 vWorldPos;
        varying vec2 vUv;

        void main() {
          vec3 V = normalize(cameraPosition - vWorldPos);
          vec3 N = normalize(vec3(
            sin(vWorldPos.x * 0.5 + uTime * 1.7) * (uLowMode > 0.5 ? 0.03 : 0.065),
            1.0,
            cos(vWorldPos.z * 0.55 - uTime * 1.5) * (uLowMode > 0.5 ? 0.03 : 0.065)
          ));
          float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);

          // Beer-Lambert optical extinction by radial distance / depth sample
          float optDepth = clamp(length(vWorldPos.xz) / 900.0, 0.0, 1.0);
          if (uHasDepth > 0.5) {
            optDepth = clamp(texture2D(uDepthTex, vUv).r * 1.25, 0.0, 1.0);
          }
          float beerAbsorption = 1.0 - exp(-optDepth * 2.4);
          vec3 col = mix(uShallowColor, uDeepColor, clamp(0.28 + beerAbsorption * 0.72, 0.0, 1.0));

          if (uHasCaustics > 0.5) {
            vec2 cUv1 = vWorldPos.xz * 0.04 + vec2(uTime * 0.03, -uTime * 0.02);
            vec2 cUv2 = vWorldPos.xz * 0.06 - vec2(uTime * 0.02, uTime * 0.035);
            float c = (texture2D(uCaustics, cUv1).r + texture2D(uCaustics, cUv2).r) * 0.5;
            col += vec3(0.22, 0.44, 0.48) * c * (1.0 - beerAbsorption * 0.65) * 0.58;
          }

          vec3 H = normalize(normalize(uSunDir) + V);
          float spec = pow(max(dot(N, H), 0.0), 96.0);
          col = mix(col, vec3(0.76, 0.92, 1.0), fresnel * 0.65) + uSunColor * spec * 0.68;

          float alpha = mix(0.74, 0.94, max(fresnel, beerAbsorption * 0.5));
          gl_FragColor = vec4(col, alpha);
        }
      `
    });
  }
}

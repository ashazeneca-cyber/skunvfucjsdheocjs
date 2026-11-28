/**
 * RAPSONYX VFX & 2-Stage Structure Shield Lock Shaders
 * - Hex-grid Fresnel Forcefield Dome shader (Front Crystal / Base Nexus invulnerability shell)
 * - Luminous Slash & Additive Energy Orb shader
 */

import * as THREE from 'three';

export class VFXAndShieldShaders {
  static createShieldDomeMaterial(colorHex = '#38bdf8', isLocked = true) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(colorHex) },
        uActive: { value: isLocked ? 1.0 : 0.0 }
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormalW;
        varying vec3 vViewDir;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vViewDir = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uActive;
        varying vec3 vNormalW;
        varying vec3 vViewDir;
        varying vec2 vUv;

        void main() {
          if (uActive <= 0.02) discard;
          float fresnel = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir))), 2.6);
          float hexGrid = abs(sin((vUv.x * 24.0 + uTime * 0.6) * 3.14159) * sin((vUv.y * 16.0 - uTime * 0.4) * 3.14159));
          float pulse = 0.72 + 0.28 * sin(uTime * 3.4);
          float alpha = (fresnel * 0.82 + smoothstep(0.75, 0.98, hexGrid) * 0.28) * pulse * uActive;
          gl_FragColor = vec4(uColor * (1.2 + fresnel), clamp(alpha, 0.0, 0.92));
        }
      `
    });
  }

  static createAdditiveSlashMaterial(colorHex = '#5ce1ff') {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(colorHex) },
        uOpacity: { value: 0.9 }
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          float edge = sin(vUv.x * 3.14159);
          float core = exp(-pow((vUv.y - 0.5) * 3.8, 2.0));
          float alpha = edge * core * uOpacity;
          gl_FragColor = vec4(uColor * 1.45, alpha);
        }
      `
    });
  }
}

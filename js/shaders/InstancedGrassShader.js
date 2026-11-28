/**
 * RAPSONYX Instanced Grass Shader
 * - 2-Octave procedural wind gusts
 * - Multi-hero trample bending via uTrampleHeroes[8] (xyz + radius/strength w)
 * - Micro-cavity root ambient occlusion & backlit SSS sunlight translucency
 */

import * as THREE from 'three';

export class InstancedGrassShader {
  static createMaterial({
    sunDir = new THREE.Vector3(0.45, 0.72, 0.52),
    sunColor = new THREE.Color(0xfff0d6),
    playerPos = new THREE.Vector3()
  } = {}) {
    const trampleSlots = Array.from({ length: 8 }, () => new THREE.Vector4(99999, 0, 99999, 0));
    trampleSlots[0].set(playerPos.x, playerPos.y, playerPos.z, 1.45);

    return new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uPlayerPos: { value: playerPos },
        uTrampleHeroes: { value: trampleSlots },
        uSunDir: { value: sunDir.clone().normalize() },
        uSunColor: { value: sunColor.clone() },
        uTranslucencyStrength: { value: 0.44 }
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uPlayerPos;
        uniform vec4 uTrampleHeroes[8];
        varying float vTip;
        varying vec3 vWorldPos;
        varying vec3 vNormalW;
        void main() {
          vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
          float tip = pow(clamp(uv.y, 0.0, 1.0), 1.6);
          vTip = tip;

          // 2-octave wind sway
          float gust = sin(wp.x * 0.09 + wp.z * 0.07 + uTime * 2.1) * 0.24
                     + sin(wp.x * 0.45 + uTime * 4.8) * 0.05;
          wp.x += gust * tip;
          wp.z += gust * 0.65 * tip;

          // Multi-hero trample bending (Player + up to 7 nearby heroes/units)
          vec2 pushTotal = vec2(0.0);
          float maxBend = 0.0;
          vec2 toMain = wp.xz - uPlayerPos.xz;
          float dMain = length(toMain);
          float bendMain = smoothstep(1.45, 0.0, dMain) * 0.68;
          pushTotal += normalize(toMain + vec2(1e-4)) * bendMain;
          maxBend = max(maxBend, bendMain);

          for (int i = 0; i < 8; i++) {
            float rad = uTrampleHeroes[i].w;
            if (rad > 0.05) {
              vec2 toHero = wp.xz - uTrampleHeroes[i].xz;
              float d = length(toHero);
              float b = smoothstep(rad, 0.0, d) * 0.62;
              pushTotal += normalize(toHero + vec2(1e-4)) * b;
              maxBend = max(maxBend, b);
            }
          }

          wp.xz += pushTotal * tip;
          wp.y -= min(0.32, maxBend * 0.24) * tip;

          vWorldPos = wp.xyz;
          vNormalW = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uSunDir;
        uniform vec3 uSunColor;
        uniform float uTranslucencyStrength;
        varying float vTip;
        varying vec3 vWorldPos;
        varying vec3 vNormalW;
        void main() {
          vec3 N = normalize(vNormalW);
          vec3 V = normalize(cameraPosition - vWorldPos);
          vec3 L = normalize(uSunDir);
          vec3 baseCol = mix(vec3(0.16, 0.34, 0.16), vec3(0.42, 0.64, 0.28), vTip);

          // Micro-cavity root darkening
          baseCol *= mix(0.68, 1.0, smoothstep(0.0, 0.75, vTip));

          // Backlit foliage translucency
          vec3 backDir = normalize(L + N * 0.35);
          float trans = pow(clamp(dot(V, -backDir), 0.0, 1.0), 3.5);
          float ndotl = max(dot(N, L), 0.25);
          vec3 col = baseCol * (0.45 + 0.65 * ndotl) + baseCol * uSunColor * trans * uTranslucencyStrength;
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
  }

  static updateTramplePositions(material, positions = []) {
    if (!material?.uniforms?.uTrampleHeroes) return;
    const arr = material.uniforms.uTrampleHeroes.value;
    for (let i = 0; i < 8; i++) {
      const p = positions[i];
      if (p) arr[i].set(p.x, p.y || 0, p.z, p.radius || 1.35);
      else arr[i].set(99999, 0, 99999, 0);
    }
  }
}

/**
 * RAPSONYX World, Terrain, Instanced Foliage & Water Shaders
 * - 16-bit RG16 Bilinear Heightmap Vertex Decode
 * - Physical Albedo Compression + PBR Roughness/Metalness Bounds Clamp
 * - Anti-Tiling textureNoTile + Triplanar Cliff Rock (>32 deg)
 * - Backlit Foliage Translucency + 2-Octave Wind Sway + Player Trample
 * - Exponential Height Fog + Henyey-Greenstein Mie Scattering (g = 0.72)
 * - Stylized Depth-Foam Water Shader with dual scrolling normal ripples & Fresnel
 */

import * as THREE from 'three';
import { InstancedGrassShader } from './InstancedGrassShader.js';
import { WaterShader } from './WaterShader.js';

export class RapsonyxWorldShader {
  static normalizeWorldMaterials(rootGroup, isTerrainOrRock = true) {
    rootGroup.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
        if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace;
        if (m.normalMap) m.normalMap.colorSpace = THREE.NoColorSpace;
        if (m.roughnessMap) m.roughnessMap.colorSpace = THREE.NoColorSpace;
        if (m.metalnessMap) m.metalnessMap.colorSpace = THREE.NoColorSpace;
        if (!m.metalnessMap && typeof m.metalness === 'number') {
          m.metalness = Math.min(m.metalness, 0.25);
        }
        if (typeof m.roughness === 'number') {
          m.roughness = Math.max(m.roughness, isTerrainOrRock ? 0.68 : 0.55);
        }
        if (m.color) {
          // Physical albedo compression to prevent sunlit whiteout
          const lum = m.color.r * 0.2126 + m.color.g * 0.7152 + m.color.b * 0.0722;
          const comp = 1.0 / (1.0 + 0.36 * lum);
          m.color.multiplyScalar(comp);
        }
      }
    });
  }

  static createTerrainMaterial({
    heightmapTex = null,
    splatTex = null,
    grassTex = null,
    cliffTex = null,
    dirtTex = null,
    sandTex = null,
    sunDir = new THREE.Vector3(0.45, 0.72, 0.52),
    sunColor = new THREE.Color(0xfff0d6),
    fogColor = new THREE.Color(0x95c8f0),
    fogDensity = 0.00058,
    worldSize = 11110.0,
    maxHeight = 260.0
  } = {}) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uHeightMap: { value: heightmapTex },
        uSplatMap: { value: splatTex },
        uGrassTex: { value: grassTex },
        uCliffTex: { value: cliffTex },
        uDirtTex: { value: dirtTex },
        uSandTex: { value: sandTex },
        uHasHeightMap: { value: heightmapTex ? 1.0 : 0.0 },
        uHasTextures: { value: grassTex ? 1.0 : 0.0 },
        uSunDir: { value: sunDir.clone().normalize() },
        uSunColor: { value: sunColor.clone() },
        uFogColorBlue: { value: fogColor.clone() },
        uFogDensity: { value: fogDensity },
        uFogBaseHeight: { value: 2.0 },
        uFogHeightFalloff: { value: 0.014 },
        uWorldSize: { value: worldSize },
        uMaxHeight: { value: maxHeight },
        uOriginOffset: { value: new THREE.Vector2(0, 0) }
      },
      vertexShader: /* glsl */ `
        uniform sampler2D uHeightMap;
        uniform float uHasHeightMap;
        uniform float uWorldSize;
        uniform float uMaxHeight;
        uniform vec2 uOriginOffset;
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
        varying vec2 vTerrainUv;

        float decodeRG16(vec2 rg) {
          return (rg.r * 255.0 * 256.0 + rg.g * 255.0) / 65535.0;
        }

        float sampleBilinearHeight(vec2 uv) {
          vec2 texSize = vec2(2048.0);
          vec2 px = uv * texSize - 0.5;
          vec2 i = floor(px);
          vec2 f = fract(px);
          float h00 = decodeRG16(texture2D(uHeightMap, (i + vec2(0.0, 0.0) + 0.5) / texSize).rg);
          float h10 = decodeRG16(texture2D(uHeightMap, (i + vec2(1.0, 0.0) + 0.5) / texSize).rg);
          float h01 = decodeRG16(texture2D(uHeightMap, (i + vec2(0.0, 1.0) + 0.5) / texSize).rg);
          float h11 = decodeRG16(texture2D(uHeightMap, (i + vec2(1.0, 1.0) + 0.5) / texSize).rg);
          return mix(mix(h00, h10, f.x), mix(h01, h11, f.x), f.y) * uMaxHeight;
        }

        void main() {
          vec3 pos = position;
          vec4 wpPre = modelMatrix * vec4(pos, 1.0);
          vec2 tUv = clamp(((wpPre.xz + uOriginOffset) / uWorldSize) + 0.5, 0.0, 1.0);
          vTerrainUv = tUv;
          if (uHasHeightMap > 0.5) {
            pos.y = sampleBilinearHeight(tUv);
          }
          vec4 wp = modelMatrix * vec4(pos, 1.0);
          vWorldPos = wp.xyz;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uSplatMap;
        uniform sampler2D uGrassTex;
        uniform sampler2D uCliffTex;
        uniform sampler2D uDirtTex;
        uniform sampler2D uSandTex;
        uniform float uHasTextures;
        uniform vec2 uOriginOffset;
        uniform vec3 uSunDir;
        uniform vec3 uSunColor;
        uniform vec3 uFogColorBlue;
        uniform float uFogDensity;
        uniform float uFogBaseHeight;
        uniform float uFogHeightFalloff;

        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
        varying vec2 vTerrainUv;

        vec4 hash4(vec2 p) {
          return fract(sin(vec4(
            1.0 + dot(p, vec2(37.0, 17.0)),
            2.0 + dot(p, vec2(11.0, 47.0)),
            3.0 + dot(p, vec2(41.0, 29.0)),
            4.0 + dot(p, vec2(23.0, 31.0))
          )) * 103.0);
        }

        vec3 textureNoTile(sampler2D samp, vec2 uv) {
          vec2 iuv = floor(uv);
          vec2 fuv = fract(uv);
          vec4 ofa = hash4(iuv);
          vec4 ofb = hash4(iuv + vec2(1.0, 0.0));
          vec4 ofc = hash4(iuv + vec2(0.0, 1.0));
          vec4 ofd = hash4(iuv + vec2(1.0, 1.0));
          vec2 ddx = dFdx(uv);
          vec2 ddy = dFdy(uv);
          ofa.zw = sign(ofa.zw - 0.5);
          ofb.zw = sign(ofb.zw - 0.5);
          ofc.zw = sign(ofc.zw - 0.5);
          ofd.zw = sign(ofd.zw - 0.5);
          vec2 b = smoothstep(0.25, 0.75, fuv);
          vec3 sA = mix(
            textureGrad(samp, uv * ofa.zw + ofa.xy, ddx * ofa.zw, ddy * ofa.zw).rgb,
            textureGrad(samp, uv * ofb.zw + ofb.xy, ddx * ofb.zw, ddy * ofb.zw).rgb,
            b.x
          );
          vec3 sB = mix(
            textureGrad(samp, uv * ofc.zw + ofc.xy, ddx * ofc.zw, ddy * ofc.zw).rgb,
            textureGrad(samp, uv * ofd.zw + ofd.xy, ddx * ofd.zw, ddy * ofd.zw).rgb,
            b.x
          );
          return mix(sA, sB, b.y);
        }

        void main() {
          vec3 N = normalize(vWorldNormal);
          vec2 uvTile = (vWorldPos.xz + uOriginOffset) * 0.065;
          vec3 grassCol = vec3(0.29, 0.46, 0.23);
          vec3 cliffCol = vec3(0.32, 0.34, 0.38);
          vec3 dirtCol  = vec3(0.41, 0.33, 0.24);
          vec3 sandCol  = vec3(0.66, 0.59, 0.44);

          if (uHasTextures > 0.5) {
            grassCol = textureNoTile(uGrassTex, uvTile);
            cliffCol = textureNoTile(uCliffTex, vWorldPos.xy * 0.05 + vWorldPos.zy * 0.05);
            dirtCol  = textureNoTile(uDirtTex, uvTile * 0.9);
            sandCol  = textureNoTile(uSandTex, uvTile * 0.8);
          }

          // Height-modulated 4-layer splat blending (organic dirt/grass/sand edges)
          vec4 splat = uHasTextures > 0.5 ? texture2D(uSplatMap, vTerrainUv) : vec4(0.75, 0.15, 0.05, 0.05);
          float hGrass = dot(grassCol, vec3(0.333)) + splat.r;
          float hDirt = dot(dirtCol, vec3(0.333)) + splat.g * 1.15;
          float hSand = dot(sandCol, vec3(0.333)) + splat.b * 1.15;
          float hMax = max(max(hGrass, hDirt), hSand) - 0.18;
          float wGrass = max(hGrass - hMax, 0.001);
          float wDirt = max(hDirt - hMax, 0.001);
          float wSand = max(hSand - hMax, 0.001);
          float wSum = wGrass + wDirt + wSand;
          vec3 albedo = (grassCol * wGrass + dirtCol * wDirt + sandCol * wSand) / wSum;

          // Triplanar Cliff Rock on slopes > 32 degrees (cos 32 ~ 0.848)
          float cliffWeight = smoothstep(0.848, 0.766, N.y);
          albedo = mix(albedo, cliffCol, cliffWeight);

          // Physical Albedo Compression
          float lum = dot(albedo, vec3(0.2126, 0.7152, 0.0722));
          albedo = albedo / (1.0 + 0.36 * lum);

          // Micro-cavity Ground AO
          float cavityAo = mix(0.68, 1.0, smoothstep(0.0, 1.4, abs(vWorldPos.y)));
          float ndotl = max(dot(N, normalize(uSunDir)), 0.0);
          vec3 lit = albedo * cavityAo * (vec3(0.36, 0.42, 0.50) + uSunColor * ndotl * 0.95);

          // Exponential Height Fog + Henyey-Greenstein Mie Scattering (g = 0.72)
          vec3 viewVec = vWorldPos - cameraPosition;
          float dist = length(viewVec);
          float cosTheta = dot(normalize(viewVec), normalize(uSunDir));
          float g = 0.72;
          float miePhase = (1.0 - g * g) / (4.0 * 3.14159265 * pow(max(0.05, 1.0 + g * g - 2.0 * g * cosTheta), 1.5));
          float heightFactor = exp(-max(0.0, vWorldPos.y - uFogBaseHeight) * uFogHeightFalloff);
          float fogAmount = clamp(1.0 - exp(-dist * uFogDensity * heightFactor), 0.0, 0.94);
          vec3 fogCol = mix(uFogColorBlue, uSunColor, clamp(miePhase * 0.42, 0.0, 1.0));
          vec3 finalCol = mix(lit, fogCol, fogAmount);

          gl_FragColor = vec4(finalCol, 1.0);
        }
      `
    });
  }

  static createInstancedGrassMaterial(opts = {}) {
    return InstancedGrassShader.createMaterial(opts);
  }

  static createWaterMaterial(opts = {}) {
    return WaterShader.createMaterial(opts);
  }
}

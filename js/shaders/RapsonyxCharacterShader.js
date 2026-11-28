/**
 * RAPSONYX Stylized Anime Character Shader
 * - 3-Band Half-Lambert Cel Ramp + Artificial Subsurface Scattering terminator
 * - Clean Anime Face Shader (No Self-Shadowing + Spherical Normal Smoothing)
 * - Kajiya-Kay Anisotropic Hair & Angel Ring highlight
 * - Sharp View-Dependent Team Rim Light
 * - Averaged Smooth Normal Inverted Hull Outline (BackSide, constant screen thickness)
 */

import * as THREE from 'three';

const FACE_MESH_REGEX = /face|eye|iris|lash|brow|mouth|tongue|teeth|head_skin|skin_face/i;
const HAIR_MESH_REGEX = /hair|ponytail|bangs|twin|braid/i;

export class RapsonyxCharacterShader {
  static buildSmoothNormalsAttribute(geometry) {
    const posAttr = geometry.getAttribute('position');
    const normAttr = geometry.getAttribute('normal');
    if (!posAttr || !normAttr) return;

    const map = new Map();
    const tmp = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i++) {
      const key = `${Math.round(posAttr.getX(i) * 1000)}_${Math.round(posAttr.getY(i) * 1000)}_${Math.round(posAttr.getZ(i) * 1000)}`;
      tmp.fromBufferAttribute(normAttr, i);
      if (map.has(key)) {
        map.get(key).add(tmp);
      } else {
        map.set(key, tmp.clone());
      }
    }

    const smoothArr = new Float32Array(posAttr.count * 3);
    for (let i = 0; i < posAttr.count; i++) {
      const key = `${Math.round(posAttr.getX(i) * 1000)}_${Math.round(posAttr.getY(i) * 1000)}_${Math.round(posAttr.getZ(i) * 1000)}`;
      const avg = map.get(key).clone().normalize();
      smoothArr[i * 3] = avg.x;
      smoothArr[i * 3 + 1] = avg.y;
      smoothArr[i * 3 + 2] = avg.z;
    }
    geometry.setAttribute('aSmoothNormal', new THREE.BufferAttribute(smoothArr, 3));
  }

  static createOutlineMesh(sourceMesh, { outlineColor = 0x2a1d2e, thickness = 0.0024 } = {}) {
    if (!sourceMesh.geometry) return null;
    if (!sourceMesh.geometry.getAttribute('aSmoothNormal')) {
      RapsonyxCharacterShader.buildSmoothNormalsAttribute(sourceMesh.geometry);
    }

    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: true,
      uniforms: {
        uOutlineColor: { value: new THREE.Color(outlineColor) },
        uThickness: { value: thickness },
        uMaxDist: { value: 28.0 }
      },
      vertexShader: /* glsl */ `
        attribute vec3 aSmoothNormal;
        uniform float uThickness;
        uniform float uMaxDist;
        varying float vFade;
        #include <common>
        #include <skinning_pars_vertex>
        void main() {
          #include <skinbase_vertex>
          #include <begin_vertex>
          #include <skinning_vertex>
          vec4 mvPos = modelViewMatrix * vec4(transformed, 1.0);
          float dist = length(mvPos.xyz);
          vFade = 1.0 - smoothstep(uMaxDist * 0.72, uMaxDist, dist);
          vec3 nObj = normalize(aSmoothNormal);
          vec4 clipPos = projectionMatrix * mvPos;
          vec3 clipNorm = mat3(projectionMatrix) * (mat3(modelViewMatrix) * nObj);
          vec2 offset = normalize(clipNorm.xy + vec2(1e-5)) * uThickness * clipPos.w * vFade;
          clipPos.xy += offset * vec2(1.0, 1.6);
          gl_Position = clipPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uOutlineColor;
        varying float vFade;
        void main() {
          if (vFade <= 0.02) discard;
          gl_FragColor = vec4(uOutlineColor, vFade);
        }
      `
    });

    const outlineMesh = sourceMesh.isSkinnedMesh
      ? new THREE.SkinnedMesh(sourceMesh.geometry, mat)
      : new THREE.Mesh(sourceMesh.geometry, mat);

    if (sourceMesh.isSkinnedMesh && sourceMesh.skeleton) {
      outlineMesh.bind(sourceMesh.skeleton, sourceMesh.bindMatrix);
    }
    outlineMesh.name = `${sourceMesh.name || 'mesh'}_outline`;
    outlineMesh.frustumCulled = false;
    outlineMesh.castShadow = false;
    outlineMesh.receiveShadow = false;
    outlineMesh.userData.isRapsonyxOutline = true;
    return outlineMesh;
  }

  static applyToHero(heroRoot, {
    teamColorHex = '#5ce1ff',
    sunDirection = new THREE.Vector3(0.45, 0.72, 0.52),
    enableOutline = true,
    enableFullCel = true
  } = {}) {
    const teamColor = new THREE.Color(teamColorHex);
    const outlinesAdded = [];

    heroRoot.traverse((obj) => {
      if (!obj.isMesh || obj.userData.isRapsonyxOutline) return;
      obj.frustumCulled = false;

      const isFace = FACE_MESH_REGEX.test(obj.name);
      const isHair = HAIR_MESH_REGEX.test(obj.name);

      // Clean face: prevent ponytail/hair bangs from casting harsh shadow spots onto face
      obj.castShadow = !isFace;
      obj.receiveShadow = !isFace;

      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of materials) {
        if (!m) continue;
        if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
        if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace;
        if (m.normalMap) m.normalMap.colorSpace = THREE.NoColorSpace;
        if (m.roughnessMap) m.roughnessMap.colorSpace = THREE.NoColorSpace;
        if (m.metalnessMap) m.metalnessMap.colorSpace = THREE.NoColorSpace;

        if (!m.metalnessMap && typeof m.metalness === 'number') {
          m.metalness = Math.min(m.metalness, 0.25);
        }
        if (typeof m.roughness === 'number') {
          m.roughness = Math.max(m.roughness, 0.55);
        }

        if (!m.userData.rapsonyxCelPatched) {
          m.userData.rapsonyxCelPatched = true;
          m.userData.uSunDir = { value: sunDirection.clone().normalize() };
          m.userData.uTeamRim = { value: teamColor.clone() };
          m.userData.uIsFace = { value: isFace ? 1.0 : 0.0 };
          m.userData.uIsHair = { value: isHair ? 1.0 : 0.0 };
          m.userData.uFullCel = { value: enableFullCel ? 1.0 : 0.0 };

          m.onBeforeCompile = (shader) => {
            shader.uniforms.uSunDir = m.userData.uSunDir;
            shader.uniforms.uTeamRim = m.userData.uTeamRim;
            shader.uniforms.uIsFace = m.userData.uIsFace;
            shader.uniforms.uIsHair = m.userData.uIsHair;
            shader.uniforms.uFullCel = m.userData.uFullCel;

            shader.vertexShader = shader.vertexShader
              .replace(
                '#include <common>',
                `#include <common>
                varying vec3 vRapWorldNormal;
                varying vec3 vRapViewDir;`
              )
              .replace(
                '#include <worldpos_vertex>',
                `#include <worldpos_vertex>
                vec4 rapWp = modelMatrix * vec4(transformed, 1.0);
                vRapWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
                vRapViewDir = normalize(cameraPosition - rapWp.xyz);`
              );

            shader.fragmentShader = shader.fragmentShader
              .replace(
                '#include <common>',
                `#include <common>
                uniform vec3 uSunDir;
                uniform vec3 uTeamRim;
                uniform float uIsFace;
                uniform float uIsHair;
                uniform float uFullCel;
                varying vec3 vRapWorldNormal;
                varying vec3 vRapViewDir;`
              )
              .replace(
                '#include <dithering_fragment>',
                `
                vec3 nW = normalize(vRapWorldNormal);
                vec3 vW = normalize(vRapViewDir);
                float ndotl = dot(nW, normalize(uSunDir));
                float halfL = clamp(ndotl * 0.5 + 0.5, 0.0, 1.0);

                // Stepped 3-band cel shading
                float band1 = smoothstep(0.42, 0.48, halfL);
                float band2 = smoothstep(0.72, 0.78, halfL);
                float celShade = mix(0.66, 1.04, band1 * 0.72 + band2 * 0.28);

                // Artificial SSS warm terminator band
                float sssZone = exp(-pow((halfL - 0.45) * 9.5, 2.0)) * uFullCel;
                vec3 sssTint = mix(vec3(1.0, 0.70, 0.42), vec3(1.0, 0.76, 0.56), uIsFace);

                // Kajiya-Kay Anisotropic Angel Ring on hair
                vec3 H = normalize(normalize(uSunDir) + vW);
                vec3 hairTangent = normalize(cross(nW, vec3(0.0, 1.0, 0.0)) + vec3(0.0, 0.25, 0.0));
                float sinTH = sqrt(max(0.0, 1.0 - pow(dot(hairTangent, H), 2.0)));
                float angelRing = smoothstep(0.78, 0.92, pow(sinTH, 24.0)) * uIsHair * uFullCel * 0.42;

                // Sharp view-dependent team rim light
                float fresnel = pow(1.0 - max(dot(nW, vW), 0.0), 3.2);
                float rimMask = step(0.64, fresnel) * max(ndotl, 0.18);

                gl_FragColor.rgb = gl_FragColor.rgb * mix(1.0, celShade, 0.55)
                  + gl_FragColor.rgb * sssTint * sssZone * 0.16
                  + vec3(angelRing)
                  + uTeamRim * rimMask * 0.26;
                #include <dithering_fragment>
                `
              );
          };
          m.needsUpdate = true;
        } else if (m.userData.uTeamRim) {
          m.userData.uTeamRim.value.copy(teamColor);
          m.userData.uSunDir.value.copy(sunDirection).normalize();
          m.userData.uFullCel.value = enableFullCel ? 1.0 : 0.0;
        }
      }

      if (enableOutline && !isFace && obj.parent) {
        const alreadyHasOutline = obj.parent.children.some(
          (c) => c.userData?.isRapsonyxOutline && c.geometry === obj.geometry
        );
        if (!alreadyHasOutline) {
          const outline = RapsonyxCharacterShader.createOutlineMesh(obj);
          if (outline) outlinesAdded.push({ parent: obj.parent, outline });
        }
      }
    });

    for (const { parent, outline } of outlinesAdded) {
      parent.add(outline);
    }
  }

  static setOutlineVisible(heroRoot, visible) {
    if (!heroRoot) return;
    heroRoot.traverse((obj) => {
      if (obj.userData && obj.userData.isRapsonyxOutline) {
        obj.visible = visible;
      }
    });
  }
}

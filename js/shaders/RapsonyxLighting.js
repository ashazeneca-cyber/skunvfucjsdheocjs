/**
 * RAPSONYX Lighting & Atmosphere System
 * - Default THREE.NeutralToneMapping (0.92 Lobby/Sandbox, 0.95 Arena), optional AgX Cinematic
 * - Zero light stacking budget: low AmbientLight (0.08), balanced Hemisphere, single texel-snapped Directional Sun
 * - 5 dynamic atmosphere presets (rapsonyx_morning, rapsonyx_day, rapsonyx_mist, rapsonyx_sunset, rapsonyx_night)
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { ATMOSPHERE_PRESETS } from '../config/constants.js';
import { AssetRegistry } from '../core/AssetRegistry.js';

export class RapsonyxLighting {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.pmremGenerator = new THREE.PMREMGenerator(renderer);
    this.pmremGenerator.compileEquirectangularShader();

    this.ambientLight = new THREE.AmbientLight(0xdce8ff, 0.08);
    this.hemiLight = new THREE.HemisphereLight(0x7cb8eb, 0x222e24, 0.45);
    this.sunLight = new THREE.DirectionalLight(0xfff0d6, 1.60);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.bias = -0.00045;
    this.sunLight.shadow.normalBias = 0.025;
    this.sunDirection = new THREE.Vector3(0.45, 0.72, 0.52).normalize();
    this.currentPresetId = 'rapsonyx_day';
    this.iblCache = new Map();

    scene.add(this.ambientLight);
    scene.add(this.hemiLight);
    scene.add(this.sunLight);
    scene.add(this.sunLight.target);
    scene.environmentIntensity = 0.34;
  }

  applyModeExposure(mode = 'LOBBY', toneMode = 'neutral') {
    if (!this.renderer) return;
    if (toneMode === 'cinematic') {
      this.renderer.toneMapping = THREE.AgXToneMapping;
      this.renderer.toneMappingExposure = mode === 'ARENA' ? 0.98 : 0.96;
    } else {
      this.renderer.toneMapping = THREE.NeutralToneMapping;
      this.renderer.toneMappingExposure = mode === 'ARENA' ? 0.95 : 0.92;
    }
  }

  applyPreset(presetId = 'rapsonyx_day', activeConfig = {}) {
    const p = ATMOSPHERE_PRESETS[presetId] || ATMOSPHERE_PRESETS.rapsonyx_day;
    this.currentPresetId = p.id;

    this.ambientLight.intensity = p.ambientIntensity;
    this.hemiLight.color.setHex(p.hemiSky);
    this.hemiLight.groundColor.setHex(p.hemiGround);
    this.hemiLight.intensity = p.hemiIntensity;
    this.sunLight.color.setHex(p.sunColor);
    this.sunLight.intensity = p.sunIntensity;

    const elevRad = THREE.MathUtils.degToRad(p.sunElevationDeg);
    const azimRad = THREE.MathUtils.degToRad(p.sunAzimuthDeg);
    this.sunDirection.set(
      Math.cos(elevRad) * Math.cos(azimRad),
      Math.sin(elevRad),
      Math.cos(elevRad) * Math.sin(azimRad)
    ).normalize();

    const shadowMapSize = activeConfig.shadowMapSize ?? 1024;
    const shadowRadius = activeConfig.shadowRadius ?? 32;

    if (shadowMapSize > 0) {
      this.sunLight.castShadow = true;
      if (this.sunLight.shadow.mapSize.x !== shadowMapSize) {
        this.sunLight.shadow.mapSize.set(shadowMapSize, shadowMapSize);
        if (this.sunLight.shadow.map) {
          this.sunLight.shadow.map.dispose();
          this.sunLight.shadow.map = null;
        }
      }
      const cam = this.sunLight.shadow.camera;
      cam.left = -shadowRadius;
      cam.right = shadowRadius;
      cam.top = shadowRadius;
      cam.bottom = -shadowRadius;
      cam.near = 1;
      cam.far = 220;
      cam.updateProjectionMatrix();
    } else {
      this.sunLight.castShadow = false;
    }

    if (this.scene.fog) {
      this.scene.fog.color.setHex(p.fogColor);
      this.scene.fog.density = p.fogDensity;
    } else {
      this.scene.fog = new THREE.FogExp2(p.fogColor, p.fogDensity);
    }

    if (!this.scene.background) {
      this.scene.background = new THREE.Color(p.fogColor).lerp(new THREE.Color(0x0b0f19), 0.35);
    }
    return p;
  }

  /**
   * Snap directional shadow camera target to world-space texel increments
   * to prevent shadow shimmer while moving across terrain.
   */
  updateShadowSnap(anchorPos, shadowRadius = 32, shadowMapSize = 1024) {
    if (!this.sunLight.castShadow || shadowMapSize <= 0) {
      this.sunLight.position.copy(anchorPos).addScaledVector(this.sunDirection, 90);
      this.sunLight.target.position.copy(anchorPos);
      return;
    }
    const texelSize = (shadowRadius * 2) / shadowMapSize;
    const snappedX = Math.floor(anchorPos.x / texelSize) * texelSize;
    const snappedZ = Math.floor(anchorPos.z / texelSize) * texelSize;
    this.sunLight.target.position.set(snappedX, anchorPos.y, snappedZ);
    this.sunLight.position.set(snappedX, anchorPos.y, snappedZ).addScaledVector(this.sunDirection, 95);
    this.sunLight.target.updateMatrixWorld();
  }

  async applyEnvironmentIBL(iblAlias = 'skybox_twilight_512', iblMode = 'pmrem') {
    if (iblMode === 'pmrem') {
      if (!this.iblCache.has('__room__')) {
        const roomScene = new RoomEnvironment();
        const rt = this.pmremGenerator.fromScene(roomScene, 0.04);
        roomScene.dispose();
        this.iblCache.set('__room__', rt.texture);
      }
      this.scene.environment = this.iblCache.get('__room__');
      this.scene.environmentIntensity = 0.34;
      return;
    }

    const key = iblAlias;
    if (this.iblCache.has(key)) {
      this.scene.environment = this.iblCache.get(key);
      this.scene.environmentIntensity = 0.36;
      return;
    }

    try {
      const buf = await AssetRegistry.fetchAssetArrayBuffer(key, { saveToCache: true, packId: 'pkg_ibl' });
      const loader = new RGBELoader();
      const texData = loader.parse(buf);
      const dataTex = new THREE.DataTexture(
        texData.data,
        texData.width,
        texData.height,
        texData.format || THREE.RGBAFormat,
        texData.type || THREE.FloatType
      );
      dataTex.mapping = THREE.EquirectangularReflectionMapping;
      dataTex.magFilter = THREE.LinearFilter;
      dataTex.minFilter = THREE.LinearFilter;
      dataTex.needsUpdate = true;
      const envRT = this.pmremGenerator.fromEquirectangular(dataTex);
      dataTex.dispose();
      this.iblCache.set(key, envRT.texture);
      this.scene.environment = envRT.texture;
      this.scene.environmentIntensity = 0.36;
    } catch (_) {
      await this.applyEnvironmentIBL(iblAlias, 'pmrem');
    }
  }

  dispose() {
    for (const tex of this.iblCache.values()) {
      try {
        tex.dispose();
      } catch (_) {}
    }
    this.iblCache.clear();
    this.pmremGenerator.dispose();
  }
}

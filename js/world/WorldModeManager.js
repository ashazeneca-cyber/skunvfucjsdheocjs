/**
 * RAPSONYX World & Scene Mode Manager
 * Orchestrates seamless transitions across:
 * - LOBBY: RAPSONYX Imperial Terrarium + 3-point hero showcase lights
 * - ARENA: Ocean Bridge (2-team), Grand Colosseum (3-team), Sky Sanctuary (3-team), Mist Duel (2-team/Boss)
 * - SANDBOX: 11.11km Open-World (SectorStreamer + SkyIslands) & RAPSONYX Celestial Valley
 */

import * as THREE from 'three';
import { MAP_CATALOG } from '../config/constants.js';
import { AssetRegistry } from '../core/AssetRegistry.js';
import { ResourceDisposer } from '../core/ResourceDisposer.js';
import { AudioDirector } from '../core/AudioDirector.js';
import { GraphicsPresetManager } from '../core/GraphicsPresetManager.js';
import { RapsonyxWorldShader } from '../shaders/RapsonyxWorldShader.js';
import { HybridPhysicsEngine } from './HybridPhysicsEngine.js';
import { RenderDistanceEngine } from './RenderDistanceEngine.js';
import { SectorStreamer11km } from './SectorStreamer11km.js';
import { SkyIslandsLayer } from './SkyIslandsLayer.js';
import { ExploreMobilityManager } from './ExploreMobilityManager.js';

export class WorldModeManager {
  constructor(scene, camera, renderer, lighting) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.lighting = lighting;

    this.physics = new HybridPhysicsEngine(16);
    this.renderDistance = new RenderDistanceEngine(scene, camera);
    this.skyIslands = new SkyIslandsLayer(scene);
    this.sectorStreamer = new SectorStreamer11km(scene, this.physics, lighting);
    this.exploreMobility = new ExploreMobilityManager(scene, this.physics, this.skyIslands);

    this.activeMapId = null;
    this.activeWorldGroup = null;
    this.lobbyHeroSpotLight = null;
    this.lobbyRimSpotLight = null;
    this.waterMeshes = [];
    this.elapsed = 0;
  }

  async loadMap(mapId, onProgress = null) {
    const mapCfg = MAP_CATALOG[mapId] || MAP_CATALOG.lobby_terrarium;
    this.unloadCurrentWorld();
    this.activeMapId = mapCfg.id;

    // Synchronize lighting preset + exposure + IBL + render distance
    const presetCfg = GraphicsPresetManager.activeConfig;
    this.lighting.applyPreset(mapCfg.atmosphere || 'rapsonyx_day', presetCfg);
    this.lighting.applyModeExposure(mapCfg.mode, presetCfg.toneMapping);
    this.renderDistance.applyTier(presetCfg.renderDistanceTier, this.renderer, this.lighting);
    await this.lighting.applyEnvironmentIBL(mapCfg.iblAlias, presetCfg.ibLMode);

    if (mapCfg.id === 'lobby_terrarium') {
      await this._loadLobby(mapCfg, onProgress);
    } else if (mapCfg.id === 'sandbox_open_world') {
      await this._loadOpenWorld11km(mapCfg, onProgress);
    } else if (mapCfg.id === 'sandbox_valley') {
      await this._loadValleySandbox(mapCfg, onProgress);
    } else {
      await this._loadArena(mapCfg, onProgress);
    }

    return mapCfg;
  }

  async _loadLobby(mapCfg, onProgress) {
    const group = new THREE.Group();
    group.name = 'RAPSONYX_WORLD_LOBBY';

    try {
      const gltf = await AssetRegistry.loadGLTF(mapCfg.modelAlias, this.renderer, {
        cachePackId: mapCfg.packageId,
        onProgress
      });
      const root = gltf.scene;
      RapsonyxWorldShader.normalizeWorldMaterials(root, false);
      root.traverse((obj) => {
        if (obj.isMesh) {
          obj.castShadow = false;
          obj.receiveShadow = true;
        }
      });
      group.add(root);
      this.physics.registerFloorMeshes(root);
    } catch (_) {
      // Fallback dark obsidian pedestal floor if GLB failed
      const deck = new THREE.Mesh(
        new THREE.CylinderGeometry(18, 20, 0.8, 36),
        new THREE.MeshStandardMaterial({ color: 0x161b26, roughness: 0.42, metalness: 0.25 })
      );
      deck.position.y = -0.4;
      deck.receiveShadow = true;
      group.add(deck);
    }

    // 3-Point Showcase Lighting for Lobby Character + Stand
    this.lobbyHeroSpotLight = new THREE.SpotLight(0xfff4e0, 2.2, 18, Math.PI * 0.24, 0.45, 1.2);
    this.lobbyHeroSpotLight.position.set(2.4, 4.8, 3.6);
    this.lobbyHeroSpotLight.target.position.set(0, 1.0, 0);
    group.add(this.lobbyHeroSpotLight, this.lobbyHeroSpotLight.target);

    this.lobbyRimSpotLight = new THREE.SpotLight(0x5ce1ff, 1.6, 16, Math.PI * 0.3, 0.55, 1.0);
    this.lobbyRimSpotLight.position.set(-2.6, 3.2, -3.2);
    this.lobbyRimSpotLight.target.position.set(0, 1.1, 0);
    group.add(this.lobbyRimSpotLight, this.lobbyRimSpotLight.target);

    this.activeWorldGroup = group;
    this.scene.add(group);
    AudioDirector.playBgm('bgm_01_lobby_pad');
  }

  async _loadArena(mapCfg, onProgress) {
    const group = new THREE.Group();
    group.name = `RAPSONYX_ARENA_${mapCfg.id.toUpperCase()}`;

    let root = null;
    try {
      const gltf = await AssetRegistry.loadGLTF(mapCfg.modelAlias, this.renderer, {
        cachePackId: mapCfg.packageId,
        onProgress
      });
      root = gltf.scene;
    } catch (_) {
      if (mapCfg.fallbackModelAlias && mapCfg.fallbackModelAlias !== mapCfg.modelAlias) {
        const gltf = await AssetRegistry.loadGLTF(mapCfg.fallbackModelAlias, this.renderer, {
          cachePackId: mapCfg.packageId,
          onProgress
        });
        root = gltf.scene;
      }
    }

    if (root) {
      RapsonyxWorldShader.normalizeWorldMaterials(root, true);
      root.traverse((obj) => {
        if (obj.isMesh) {
          obj.castShadow = false;
          obj.receiveShadow = true;
        }
      });
      group.add(root);
      this.physics.registerFloorMeshes(root);
      this.physics.loadObstaclesFromMeshGroup(root);
    } else {
      // Deterministic sculpted fallback arena platform matching objective geometry
      const fallbackMat = new THREE.MeshStandardMaterial({ color: 0x30394d, roughness: 0.78, metalness: 0.1 });
      const arenaMesh = mapCfg.width
        ? new THREE.Mesh(new THREE.BoxGeometry(mapCfg.width, 2, mapCfg.depth || 84), fallbackMat)
        : new THREE.Mesh(new THREE.CylinderGeometry(mapCfg.radius || 180, (mapCfg.radius || 180) + 6, 2, 48), fallbackMat);
      arenaMesh.position.y = -1.0;
      arenaMesh.receiveShadow = true;
      group.add(arenaMesh);
    }

    // Load spatial/nav constraints
    if (mapCfg.navAlias) {
      try {
        const navJson = await AssetRegistry.fetchAssetJson(mapCfg.navAlias, { cachePackId: mapCfg.packageId });
        this.physics.loadFromSpatialJson(navJson, mapCfg.id);
      } catch (_) {}
    }

    // Configure perimeter boundaries
    if (mapCfg.width) {
      this.physics.setArenaBounds({
        type: 'rect',
        minX: -mapCfg.width * 0.48,
        maxX: mapCfg.width * 0.48,
        minZ: -(mapCfg.depth || 80) * 0.46,
        maxZ: (mapCfg.depth || 80) * 0.46
      });
    } else if (mapCfg.radius) {
      this.physics.setArenaBounds({ type: 'circle', radius: mapCfg.radius * 0.94 });
    }

    // Stylized Water surrounding Grand Ocean Bridge or Sky Sanctuary
    if (mapCfg.id === 'arena_ocean_bridge' || mapCfg.id === 'arena_sky_sakura') {
      const waterMat = RapsonyxWorldShader.createWaterMaterial({
        sunDir: this.lighting.sunLight.position.clone().normalize(),
        sunColor: this.lighting.sunLight.color.clone()
      });
      const wPlane = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400, 32, 32), waterMat);
      wPlane.rotation.x = -Math.PI / 2;
      wPlane.position.y = -6.0;
      group.add(wPlane);
      this.waterMeshes.push(wPlane);
    }

    this.activeWorldGroup = group;
    this.scene.add(group);
    AudioDirector.playBgm('bgm_04_arena_base_pulse');
  }

  async _loadOpenWorld11km(mapCfg, onProgress) {
    await this.sectorStreamer.mount(this.renderer);
    await this.skyIslands.load();
    await this.exploreMobility.mountWorldProps(this.renderer, null, { spawnChests: true, spawnSlimes: true });
    if (typeof onProgress === 'function') onProgress(1);
    AudioDirector.playBgm('bgm_08_openworld_breeze');
  }

  async _loadValleySandbox(mapCfg, onProgress) {
    const group = new THREE.Group();
    group.name = 'RAPSONYX_SANDBOX_VALLEY';

    const gltf = await AssetRegistry.loadGLTF(mapCfg.modelAlias, this.renderer, {
      cachePackId: mapCfg.packageId,
      onProgress
    });
    const root = gltf.scene;
    RapsonyxWorldShader.normalizeWorldMaterials(root, true);
    root.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = true;
      }
    });
    group.add(root);
    this.physics.registerFloorMeshes(root);
    this.physics.loadObstaclesFromMeshGroup(root);
    this.physics.setArenaBounds({ type: 'circle', radius: 420 });

    this.activeWorldGroup = group;
    this.scene.add(group);
    await this.exploreMobility.mountWorldProps(this.renderer, null, { spawnChests: true, spawnSlimes: true });
    AudioDirector.playBgm('bgm_07_sandbox_meadow');
  }

  update(dt, playerPos = null, heroRotY = 0) {
    this.elapsed += dt;
    this.renderDistance.update(this.camera);

    for (let i = 0; i < this.waterMeshes.length; i++) {
      const m = this.waterMeshes[i].material;
      if (m?.uniforms?.uTime) m.uniforms.uTime.value = this.elapsed;
    }

    if (this.activeMapId === 'sandbox_open_world') {
      this.sectorStreamer.update(dt, playerPos);
      this.skyIslands.update(dt);
      if (playerPos) {
        this.physics.checkOriginShift(playerPos, this.sectorStreamer.group);
      }
    }

    if (this.activeMapId === 'sandbox_open_world' || this.activeMapId === 'sandbox_valley') {
      this.exploreMobility.update(dt, playerPos, heroRotY);
    }

    if (playerPos && this.lighting) {
      this.lighting.updateShadowSnap(
        playerPos,
        GraphicsPresetManager.activeConfig.shadowRadius || 48,
        GraphicsPresetManager.activeConfig.shadowMapSize || 2048
      );
    }
  }

  unloadCurrentWorld() {
    if (this.activeWorldGroup) {
      this.scene.remove(this.activeWorldGroup);
      ResourceDisposer.disposeObject3D(this.activeWorldGroup);
      this.activeWorldGroup = null;
    }
    this.waterMeshes = [];
    this.lobbyHeroSpotLight = null;
    this.lobbyRimSpotLight = null;
    this.sectorStreamer.dispose();
    this.skyIslands.dispose();
    this.exploreMobility.dispose();
    this.renderDistance.clearRegistrations();
    this.physics.clear();
  }
}

/**
 * RAPSONYX Explore Mobility & Interactive World Entities
 * Uses 02_explore_mobility_interactive GLBs:
 * - Mount: mount_crystal_steed (toggle speed boost)
 * - Glider: glider_dream / glider_sakura (auto-deploy in air, thermal lift support)
 * - Collectibles & Companions: treasure_chest, slime_dream, slime_love, slime_passion, butterfly_crystal, fairy_seelie
 */

import * as THREE from 'three';
import { AssetRegistry } from '../core/AssetRegistry.js';
import { ResourceDisposer } from '../core/ResourceDisposer.js';
import { AudioDirector } from '../core/AudioDirector.js';

export class ExploreMobilityManager {
  constructor(scene, physics, skyIslands = null) {
    this.scene = scene;
    this.physics = physics;
    this.skyIslands = skyIslands;
    this.group = new THREE.Group();
    this.group.name = 'RAPSONYX_EXPLORE_MOBILITY';

    this.mountMounted = false;
    this.gliderActive = false;
    this.mountNode = null;
    this.gliderNode = null;
    this.companions = [];
    this.chests = [];
    this.mixers = [];
    this.elapsed = 0;
    this.onChestOpened = null;
  }

  async mountWorldProps(renderer, heroRoot = null, options = { spawnChests: true, spawnSlimes: true }) {
    this.dispose();
    this.group.clear();

    // Load interactive Glider & Mount attachments lazily if downloaded in Starter/OpenWorld
    const [gliderGltf, mountGltf] = await Promise.allSettled([
      AssetRegistry.loadGLTF('glider_dream', renderer, { cachePackId: 'pkg_openworld' }),
      AssetRegistry.loadGLTF('mount_crystal_steed', renderer, { cachePackId: 'pkg_openworld' })
    ]);

    if (gliderGltf.status === 'fulfilled') {
      this.gliderNode = gliderGltf.value.scene;
      this.gliderNode.visible = false;
      this.gliderNode.scale.setScalar(1.0);
      this.gliderNode.position.set(0, 1.75, -0.15);
      if (heroRoot) heroRoot.add(this.gliderNode);
      else this.group.add(this.gliderNode);
    }

    if (mountGltf.status === 'fulfilled') {
      this.mountNode = mountGltf.value.scene;
      this.mountNode.visible = false;
      this.group.add(this.mountNode);
    }

    if (options.spawnChests) {
      await this._spawnTreasureChests(renderer);
    }
    if (options.spawnSlimes) {
      await this._spawnAmbientCreatures(renderer);
    }

    this.scene.add(this.group);
  }

  async _spawnTreasureChests(renderer) {
    const spots = [
      { id: 'chest_01', x: 24, z: -18, rewardGold: 350, rewardCoins: 25 },
      { id: 'chest_02', x: -38, z: 28, rewardGold: 500, rewardCoins: 40 },
      { id: 'chest_03', x: 65, z: 54, rewardGold: 750, rewardCoins: 60 },
      { id: 'chest_04', x: -72, z: -62, rewardGold: 1000, rewardCoins: 80 }
    ];

    let chestTemplate = null;
    try {
      const gltf = await AssetRegistry.loadGLTF('treasure_chest', renderer, { cachePackId: 'pkg_openworld' });
      chestTemplate = gltf.scene;
    } catch (_) {
      chestTemplate = null;
    }

    for (let i = 0; i < spots.length; i++) {
      const s = spots[i];
      const y = this.physics ? this.physics.getHeightAt(s.x, s.z) : 0;
      const node = chestTemplate
        ? chestTemplate.clone()
        : new THREE.Mesh(
            new THREE.BoxGeometry(1.1, 0.85, 0.85),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, emissive: 0x854d0e, emissiveIntensity: 0.45, roughness: 0.35 })
          );
      node.position.set(s.x, y + 0.42, s.z);
      node.rotation.y = (i * 0.9) % Math.PI;
      this.group.add(node);
      this.chests.push({ ...s, y, node, opened: false });
    }
  }

  async _spawnAmbientCreatures(renderer) {
    const specs = [
      { alias: 'slime_dream', x: 14, z: 12, radius: 4, speed: 0.9, yOffset: 0.4 },
      { alias: 'slime_love', x: -18, z: -14, radius: 5, speed: 0.8, yOffset: 0.4 },
      { alias: 'slime_passion', x: 28, z: -26, radius: 4.5, speed: 1.0, yOffset: 0.4 },
      { alias: 'fairy_seelie', x: 6, z: -8, radius: 3.2, speed: 1.3, yOffset: 1.85 },
      { alias: 'butterfly_crystal', x: -8, z: 9, radius: 4.5, speed: 1.5, yOffset: 2.1 }
    ];

    for (let i = 0; i < specs.length; i++) {
      const sp = specs[i];
      try {
        const gltf = await AssetRegistry.loadGLTF(sp.alias, renderer, { cachePackId: 'pkg_openworld' });
        const model = gltf.scene;
        const y = (this.physics ? this.physics.getHeightAt(sp.x, sp.z) : 0) + sp.yOffset;
        model.position.set(sp.x, y, sp.z);
        this.group.add(model);

        let mixer = null;
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(gltf.animations[0]).play();
          this.mixers.push(mixer);
        }

        this.companions.push({
          node: model,
          anchorX: sp.x,
          anchorZ: sp.z,
          radius: sp.radius,
          speed: sp.speed,
          yOffset: sp.yOffset,
          phase: i * 1.25
        });
      } catch (_) {
        // Optional creature asset skipped smoothly if pack not downloaded yet
      }
    }
  }

  toggleMount() {
    this.mountMounted = !this.mountMounted;
    if (this.mountMounted) this.gliderActive = false;
    if (this.mountNode) this.mountNode.visible = this.mountMounted;
    if (this.gliderNode) this.gliderNode.visible = false;
    return this.mountMounted;
  }

  setGliderActive(active) {
    this.gliderActive = Boolean(active);
    if (this.gliderActive && this.mountMounted) {
      this.mountMounted = false;
      if (this.mountNode) this.mountNode.visible = false;
    }
    if (this.gliderNode) this.gliderNode.visible = this.gliderActive;
  }

  getSpeedMultiplier() {
    if (this.mountMounted) return 1.65;
    if (this.gliderActive) return 1.32;
    return 1.0;
  }

  update(dt, playerPos, playerRotY = 0) {
    this.elapsed += dt;

    for (let i = 0; i < this.mixers.length; i++) {
      this.mixers[i].update(dt);
    }

    if (this.mountNode && this.mountMounted && playerPos) {
      this.mountNode.position.set(playerPos.x, playerPos.y - 0.15, playerPos.z);
      this.mountNode.rotation.y = playerRotY;
    }

    // Update wandering creatures & companions
    for (let i = 0; i < this.companions.length; i++) {
      const c = this.companions[i];
      const t = this.elapsed * c.speed + c.phase;
      const nx = c.anchorX + Math.cos(t) * c.radius;
      const nz = c.anchorZ + Math.sin(t * 0.8) * c.radius;
      const groundY = this.physics ? this.physics.getHeightAt(nx, nz) : 0;
      const bob = Math.sin(t * 3.0) * 0.16;
      c.node.position.set(nx, groundY + c.yOffset + bob, nz);
      c.node.rotation.y = Math.atan2(-Math.sin(t), Math.cos(t * 0.8));
    }

    // Check chest proximity pickup
    if (playerPos) {
      for (let i = 0; i < this.chests.length; i++) {
        const ch = this.chests[i];
        if (ch.opened) continue;
        const dx = playerPos.x - ch.x;
        const dz = playerPos.z - ch.z;
        if (dx * dx + dz * dz < 6.25) {
          ch.opened = true;
          ch.node.scale.setScalar(1.22);
          ch.node.position.y += 0.25;
          AudioDirector.playSfx('sfx_chest_open', { volume: 0.9 });
          if (typeof this.onChestOpened === 'function') {
            this.onChestOpened(ch);
          }
        }
      }
    }
  }

  dispose() {
    if (this.group.parent) {
      this.scene.remove(this.group);
    }
    if (this.gliderNode && this.gliderNode.parent) {
      this.gliderNode.parent.remove(this.gliderNode);
      ResourceDisposer.disposeObject3D(this.gliderNode);
    }
    for (let i = 0; i < this.mixers.length; i++) {
      this.mixers[i].stopAllAction();
    }
    this.mixers = [];
    this.companions = [];
    this.chests = [];
    ResourceDisposer.disposeObject3D(this.group);
    this.group.clear();
    this.mountNode = null;
    this.gliderNode = null;
    this.mountMounted = false;
    this.gliderActive = false;
  }
}

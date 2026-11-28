/**
 * RAPSONYX Sky Islands Layer & Thermal Updraft System
 * Renders floating sanctuaries over the 11.11km Open World from sky_islands_layout.json
 */

import * as THREE from 'three';
import { AssetRegistry } from '../core/AssetRegistry.js';
import { ResourceDisposer } from '../core/ResourceDisposer.js';

export class SkyIslandsLayer {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'RAPSONYX_SKY_ISLANDS';
    this.islands = [];
    this.thermals = [];
    this.elapsed = 0;
  }

  async load() {
    this.dispose();
    let layoutData = null;
    try {
      layoutData = await AssetRegistry.fetchAssetJson('sky_islands_layout', { cachePackId: 'pkg_openworld' });
    } catch (_) {
      layoutData = null;
    }

    const rawList = layoutData?.islands || [
      { id: 'sky_dream_spire', x: -640, y: 185, z: -480, radius: 58, color: 0x5ce1ff },
      { id: 'sky_love_garden', x: 580, y: 210, z: -420, radius: 64, color: 0xff6bb5 },
      { id: 'sky_passion_forge', x: 40, y: 235, z: 680, radius: 72, color: 0xffb347 },
      { id: 'sky_rapsonyx_citadel', x: 0, y: 290, z: 0, radius: 85, color: 0xf7b955 }
    ];

    const topGeo = new THREE.CylinderGeometry(1, 0.85, 0.35, 16);
    const spireGeo = new THREE.ConeGeometry(0.84, 1.4, 8);
    spireGeo.rotateX(Math.PI);

    for (let i = 0; i < rawList.length; i++) {
      const cfg = rawList[i];
      const r = cfg.radius || 55;
      const accent = cfg.color || 0x5ce1ff;
      const island = new THREE.Group();
      island.position.set(cfg.x || 0, cfg.y || 200, cfg.z || 0);

      const grassMat = new THREE.MeshStandardMaterial({ color: 0x3b6e52, roughness: 0.78, metalness: 0.05 });
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4b5368, roughness: 0.85, metalness: 0.1 });
      const crystalMat = new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: 0.85,
        roughness: 0.25,
        metalness: 0.2
      });

      const deck = new THREE.Mesh(topGeo, grassMat);
      deck.scale.set(r, r * 0.22, r);
      deck.receiveShadow = true;

      const under = new THREE.Mesh(spireGeo, stoneMat);
      under.scale.set(r, r * 0.45, r);
      under.position.y = -r * 0.32;

      const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(r * 0.1, 0), crystalMat);
      beacon.position.y = r * 0.18;

      island.add(deck, under, beacon);
      this.group.add(island);
      this.islands.push({ node: island, baseY: island.position.y, phase: i * 1.37, beacon });

      // Thermal wind updraft ring at edge/center of island
      this.thermals.push({
        x: island.position.x,
        y: island.position.y - 160,
        maxY: island.position.y + 45,
        z: island.position.z,
        radius: r * 0.55,
        liftForce: 14.5
      });
    }

    this.scene.add(this.group);
  }

  sampleThermalLift(pos) {
    for (let i = 0; i < this.thermals.length; i++) {
      const t = this.thermals[i];
      if (pos.y < t.y || pos.y > t.maxY) continue;
      const dx = pos.x - t.x;
      const dz = pos.z - t.z;
      if (dx * dx + dz * dz <= t.radius * t.radius) {
        return t.liftForce;
      }
    }
    return 0;
  }

  update(dt) {
    this.elapsed += dt;
    for (let i = 0; i < this.islands.length; i++) {
      const item = this.islands[i];
      item.node.position.y = item.baseY + Math.sin(this.elapsed * 0.55 + item.phase) * 2.2;
      item.beacon.rotation.y += dt * 0.6;
    }
  }

  dispose() {
    if (this.group.parent) {
      this.scene.remove(this.group);
    }
    ResourceDisposer.disposeObject3D(this.group);
    this.group.clear();
    this.islands = [];
    this.thermals = [];
  }
}

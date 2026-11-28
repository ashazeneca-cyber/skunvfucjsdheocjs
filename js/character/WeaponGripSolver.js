/**
 * RAPSONYX Weapon Grip Solver & PCA Alignment
 * - Aligns weapon principal axis along grip direction via lightweight bounding PCA heuristic
 * - Compensates parent bone world scale when parenting to RightHand / LeftHand
 * - Handles dual-wield off-hand symmetry and Erine floating orbital chessboard socket
 */

import * as THREE from 'three';
import { AssetRegistry } from '../core/AssetRegistry.js';
import { ResourceDisposer } from '../core/ResourceDisposer.js';
import { GraphicsPresetManager } from '../core/GraphicsPresetManager.js';
import { RapsonyxCharacterShader } from '../shaders/RapsonyxCharacterShader.js';

export class WeaponGripSolver {
  constructor() {
    this.gripsConfig = null;
    this.primaryWeapon = null;
    this.offhandWeapon = null;
    this.orbitalAnchor = null;
    this.orbitalHeroId = null;
    this.elapsed = 0;
  }

  async loadCalibrations() {
    if (this.gripsConfig) return this.gripsConfig;
    try {
      this.gripsConfig = await AssetRegistry.fetchAssetJson('calib_weapon_grips', { cachePackId: 'pkg_starter' });
    } catch (_) {
      this.gripsConfig = {};
    }
    return this.gripsConfig;
  }

  async attachWeaponForHero(heroMeta, rigController, renderer) {
    this.dispose();
    await this.loadCalibrations();

    const preferRigged = GraphicsPresetManager.activeConfig.id === 'ULTRA' && heroMeta.weaponRiggedPath;
    const path = preferRigged ? heroMeta.weaponRiggedPath : heroMeta.weaponAnimPath;

    let weaponRoot = null;
    try {
      const gltf = await AssetRegistry.loadGLTF(path, renderer, { cachePackId: heroMeta.id === 'freya' ? 'pkg_starter' : `hero_${heroMeta.id}` });
      weaponRoot = gltf.scene;
    } catch (_) {
      // Fallback to weaponAnimPath if rigged Ultra weapon failed
      if (preferRigged && heroMeta.weaponAnimPath) {
        try {
          const gltf2 = await AssetRegistry.loadGLTF(heroMeta.weaponAnimPath, renderer);
          weaponRoot = gltf2.scene;
        } catch (__) {
          weaponRoot = null;
        }
      }
    }

    if (!weaponRoot) {
      weaponRoot = this._createStylizedFallbackWeapon(heroMeta.team);
    }

    // Apply character rim/cel shading cleanly onto weapon meshes
    RapsonyxCharacterShader.applyToHero(weaponRoot, {
      enableOutline: false,
      enableFullCel: GraphicsPresetManager.activeConfig.id !== 'LOW'
    });

    this._normalizePrincipalAxis(weaponRoot, heroMeta.weaponType);

    // Special case: Erine uses floating orbital Checkmate Flame Chessboard near right shoulder
    if (heroMeta.id === 'erine') {
      const orbitAnchor = new THREE.Group();
      orbitAnchor.name = 'RAPSONYX_ERINE_ORBIT_SOCKET';
      orbitAnchor.position.set(0.56, 1.56, 0.22);
      weaponRoot.scale.multiplyScalar(0.55);
      orbitAnchor.add(weaponRoot);
      rigController.container.add(orbitAnchor);
      this.primaryWeapon = weaponRoot;
      this.orbitalAnchor = orbitAnchor;
      this.orbitalHeroId = 'erine';
      return;
    }

    const socketBone = rigController.bones.rightHand || rigController.bones.chest || rigController.container;
    // Compensate accumulated world scale of hand bone so weapon stays ~0.85m..1.35m crisp
    const worldScale = new THREE.Vector3(1, 1, 1);
    if (socketBone.getWorldScale) {
      socketBone.getWorldScale(worldScale);
    }
    const invScale = 1 / Math.max(0.08, (worldScale.x + worldScale.y + worldScale.z) / 3);
    weaponRoot.scale.multiplyScalar(invScale);

    // Apply calibration offset if present in weapon_grip_sockets_42.json
    const calib = this.gripsConfig?.[heroMeta.id] || this.gripsConfig?.heroes?.[heroMeta.id] || {};
    weaponRoot.position.set(calib.offsetX ?? 0.02, calib.offsetY ?? 0.04, calib.offsetZ ?? 0.02);
    weaponRoot.rotation.set(calib.rotX ?? Math.PI * 0.45, calib.rotY ?? 0, calib.rotZ ?? 0);

    socketBone.add(weaponRoot);
    this.primaryWeapon = weaponRoot;

    // Dual-wield mirror for Daggers & Chakrams when LeftHand exists
    if ((heroMeta.weaponType === 'daggers' || heroMeta.weaponType === 'chakram') && rigController.bones.leftHand) {
      const off = weaponRoot.clone();
      const lWorldScale = new THREE.Vector3(1, 1, 1);
      rigController.bones.leftHand.getWorldScale(lWorldScale);
      const lInv = 1 / Math.max(0.08, (lWorldScale.x + lWorldScale.y + lWorldScale.z) / 3);
      off.scale.multiplyScalar(lInv / invScale);
      rigController.bones.leftHand.add(off);
      this.offhandWeapon = off;
    }
  }

  _normalizePrincipalAxis(root, weaponType) {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const targetLen = weaponType === 'staff' || weaponType === 'halberd' ? 1.48 : weaponType === 'bow' ? 1.15 : 0.88;
    const maxDim = Math.max(0.12, size.x, size.y, size.z);
    const normScale = targetLen / maxDim;
    root.scale.multiplyScalar(normScale);

    // Re-center grip near hilt/handle
    root.position.sub(center.multiplyScalar(normScale * 0.6));
  }

  _createStylizedFallbackWeapon(teamId) {
    const color = teamId === 'team_love' ? 0xff6bb5 : teamId === 'team_passion' ? 0xffb347 : 0x5ce1ff;
    const g = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.035, 1.35, 8),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.25 })
    );
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.14, 0),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.4, roughness: 0.15 })
    );
    gem.position.y = 0.72;
    g.add(shaft, gem);
    return g;
  }

  update(dt) {
    this.elapsed += dt;
    if (this.orbitalAnchor && this.orbitalHeroId === 'erine') {
      this.orbitalAnchor.position.y = 1.54 + Math.sin(this.elapsed * 2.4) * 0.09;
      this.orbitalAnchor.rotation.y += dt * 1.1;
      this.orbitalAnchor.rotation.z = Math.sin(this.elapsed * 1.5) * 0.12;
    }
  }

  dispose() {
    if (this.primaryWeapon && this.primaryWeapon.parent) {
      this.primaryWeapon.parent.remove(this.primaryWeapon);
      ResourceDisposer.disposeObject3D(this.primaryWeapon);
    }
    if (this.offhandWeapon && this.offhandWeapon.parent) {
      this.offhandWeapon.parent.remove(this.offhandWeapon);
      ResourceDisposer.disposeObject3D(this.offhandWeapon);
    }
    if (this.orbitalAnchor && this.orbitalAnchor.parent) {
      this.orbitalAnchor.parent.remove(this.orbitalAnchor);
    }
    this.primaryWeapon = null;
    this.offhandWeapon = null;
    this.orbitalAnchor = null;
    this.orbitalHeroId = null;
  }
}

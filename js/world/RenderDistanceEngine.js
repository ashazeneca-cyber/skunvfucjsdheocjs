/**
 * RAPSONYX Render Distance, Frustum Culling, LOD Hysteresis & 100km Horizon Manager
 */

import * as THREE from 'three';
import { AssetRegistry } from '../core/AssetRegistry.js';
import { ResourceDisposer } from '../core/ResourceDisposer.js';
import { RapsonyxWorldShader } from '../shaders/RapsonyxWorldShader.js';

export const RENDER_DISTANCE_TIERS = Object.freeze({
  near:    { id: 'near',    label: 'Dekat (750m)',    cameraFar: 750,   propFadeDist: 220,  shadowDist: 28,  sectorRing: 1, horizonEnabled: false, fogScale: 1.45 },
  medium:  { id: 'medium',  label: 'Sedang (1.6km)',  cameraFar: 1600,  propFadeDist: 420,  shadowDist: 40,  sectorRing: 1, horizonEnabled: false, fogScale: 1.15 },
  far:     { id: 'far',     label: 'Jauh (3.6km)',    cameraFar: 3600,  propFadeDist: 780,  shadowDist: 56,  sectorRing: 2, horizonEnabled: true,  fogScale: 0.90 },
  horizon: { id: 'horizon', label: 'Horizon 100km',   cameraFar: 16000, propFadeDist: 1400, shadowDist: 72,  sectorRing: 2, horizonEnabled: true,  fogScale: 0.58 }
});

export class RenderDistanceEngine {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.tier = RENDER_DISTANCE_TIERS.medium;
    this.frustum = new THREE.Frustum();
    this.projScreenMatrix = new THREE.Matrix4();
    this.horizonGroup = null;
    this.horizonLoaded = false;
    this.cullables = new Set();
    this.lods = [];
    this._tempBox = new THREE.Box3();
    this._tempSphere = new THREE.Sphere();
  }

  getTierConfig(tierId) {
    return RENDER_DISTANCE_TIERS[tierId] || RENDER_DISTANCE_TIERS.medium;
  }

  applyTier(tierId, renderer = null, lighting = null) {
    this.tier = this.getTierConfig(tierId);
    if (this.camera) {
      this.camera.far = this.tier.cameraFar;
      this.camera.updateProjectionMatrix();
    }
    if (lighting && lighting.scene?.fog) {
      lighting.scene.fog.density *= this.tier.fogScale;
    }
    if (this.horizonGroup) {
      this.horizonGroup.visible = this.tier.horizonEnabled;
    }
    if (this.tier.horizonEnabled && !this.horizonLoaded && renderer) {
      this.mountHorizonMacroLayer(renderer).catch(() => {});
    }
    return this.tier;
  }

  registerCullable(object3d, maxDist = null) {
    if (!object3d) return;
    object3d.userData.__rapsonyxMaxRenderDist = maxDist;
    this.cullables.add(object3d);
  }

  unregisterCullable(object3d) {
    this.cullables.delete(object3d);
  }

  registerLOD(lodObject) {
    if (lodObject && lodObject.isLOD) {
      this.lods.push(lodObject);
    }
  }

  clearRegistrations() {
    this.cullables.clear();
    this.lods = [];
  }

  async mountHorizonMacroLayer(renderer) {
    if (this.horizonLoaded) {
      if (this.horizonGroup) this.horizonGroup.visible = this.tier.horizonEnabled;
      return;
    }
    this.horizonLoaded = true;
    const group = new THREE.Group();
    group.name = 'RAPSONYX_100KM_HORIZON_LAYER';
    group.visible = this.tier.horizonEnabled;

    const horizonAliases = ['horizon_arch_sky', 'horizon_cliffs', 'horizon_trees', 'horizon_foliage'];
    for (let i = 0; i < horizonAliases.length; i++) {
      try {
        const gltf = await AssetRegistry.loadGLTF(horizonAliases[i], renderer, { cachePackId: 'pkg_openworld' });
        const root = gltf.scene;
        RapsonyxWorldShader.normalizeWorldMaterials(root, true);
        root.traverse((c) => {
          if (c.isMesh) {
            c.castShadow = false;
            c.receiveShadow = false;
            c.matrixAutoUpdate = false;
            c.updateMatrix();
          }
        });
        group.add(root);
      } catch (_) {
        // Optional macro horizon pack skipped if not yet downloaded
      }
    }

    // Add stylized distant atmospheric ridge silhouettes if horizon packs aren't cached
    if (group.children.length === 0) {
      const ridgeMat = new THREE.MeshBasicMaterial({
        color: 0x3b5882,
        transparent: true,
        opacity: 0.42,
        fog: true
      });
      const ridgeGeo = new THREE.ConeGeometry(420, 380, 6);
      const count = 24;
      const inst = new THREE.InstancedMesh(ridgeGeo, ridgeMat, count);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const r = 4800 + (i % 3) * 950;
        dummy.position.set(Math.cos(angle) * r, 80 + (i % 4) * 28, Math.sin(angle) * r);
        dummy.scale.set(1.2 + (i % 3) * 0.4, 0.9 + (i % 5) * 0.25, 1.2);
        dummy.rotation.y = angle;
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
      }
      inst.instanceMatrix.needsUpdate = true;
      inst.frustumCulled = false;
      group.add(inst);
    }

    this.horizonGroup = group;
    this.scene.add(group);
  }

  update(camera) {
    if (!camera) return;
    camera.updateMatrixWorld();
    this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);

    const camPos = camera.position;
    const defaultMaxDist = this.tier.propFadeDist;
    const hysteresis = 1.08;

    for (const obj of this.cullables) {
      const maxDist = obj.userData.__rapsonyxMaxRenderDist || defaultMaxDist;
      const distSq = camPos.distanceToSquared(obj.position);
      const cutoff = obj.visible ? maxDist * hysteresis : maxDist;
      if (distSq > cutoff * cutoff) {
        obj.visible = false;
        continue;
      }
      if (obj.geometry && obj.geometry.boundingSphere) {
        this._tempSphere.copy(obj.geometry.boundingSphere).applyMatrix4(obj.matrixWorld);
        obj.visible = this.frustum.intersectsSphere(this._tempSphere);
      } else {
        obj.visible = true;
      }
    }

    for (let i = 0; i < this.lods.length; i++) {
      this.lods[i].update(camera);
    }
  }

  dispose() {
    if (this.horizonGroup) {
      this.scene.remove(this.horizonGroup);
      ResourceDisposer.disposeObject3D(this.horizonGroup);
      this.horizonGroup = null;
    }
    this.horizonLoaded = false;
    this.clearRegistrations();
  }
}

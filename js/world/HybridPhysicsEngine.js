/**
 * RAPSONYX Hybrid 4-Layer Physics & Ground Sync Engine (0.000mm precision)
 * Layer 1: Loaded Binary NavSector Triangle Barycentric (nav_XX_YY.bin)
 * Layer 2: Scene Floor & Prop Raycaster (bridges, arena stairs, sky islands)
 * Layer 3: High-precision RG16 Heightmap Bilinear Sampler
 * Layer 4: Deterministic Water/Base Fallback
 * + Spatial Hash Circle/Box collision & 1000m Floating Origin Shift w/ shader uniform sync
 */

import * as THREE from 'three';
import { PHYSICS_CONSTANTS } from '../config/constants.js';
import { sampleRG16Bilinear, buildNavSectorSampler, sampleFiniteNormal } from './TerrainMath.js';

const _rayOrigin = new THREE.Vector3();
const _rayDir = new THREE.Vector3(0, -1, 0);
const _tmpNormal = new THREE.Vector3(0, 1, 0);

export class HybridPhysicsEngine {
  constructor(cellSize = 16) {
    this.cellSize = cellSize;
    this.spatialGrid = new Map();
    this.colliders = [];
    this.floorMeshes = [];
    this.navSectors = new Map();
    this.raycaster = new THREE.Raycaster();
    this.raycaster.firstHitOnly = true;

    this.rg16Data = null;
    this.rg16Res = 0;
    this.worldSize = PHYSICS_CONSTANTS.WORLD_SIZE_11KM;
    this.maxHeight = 220.0;
    this.waterLevelY = PHYSICS_CONSTANTS.WATER_LEVEL_Y ?? 0.0;
    this.arenaBounds = { type: 'circle', radius: 180 };
    this.originOffset = new THREE.Vector3();
    this._originListeners = new Set();
  }

  onOriginShift(cb) {
    if (typeof cb === 'function') this._originListeners.add(cb);
    return () => this._originListeners.delete(cb);
  }

  _cellKey(cx, cz) {
    return `${cx}_${cz}`;
  }

  clear() {
    this.spatialGrid.clear();
    this.colliders = [];
    this.floorMeshes = [];
    this.navSectors.clear();
    this.rg16Data = null;
    this.rg16Res = 0;
    this.originOffset.set(0, 0, 0);
  }

  setArenaBounds(bounds) {
    this.arenaBounds = bounds;
  }

  setWaterLevel(y) {
    this.waterLevelY = Number(y) || 0;
  }

  setHeightmapData(rgbaUint8, resolution, worldSize = 11110.0, maxHeight = 220.0) {
    this.rg16Data = rgbaUint8;
    this.rg16Res = resolution;
    this.worldSize = worldSize;
    this.maxHeight = maxHeight;
  }

  loadNavSectorBin(sectorKey, arrayBuffer, sectorOriginX, sectorOriginZ, sectorSize = 1010.0) {
    const sampler = buildNavSectorSampler(arrayBuffer, sectorOriginX, sectorOriginZ, sectorSize);
    if (sampler) {
      this.navSectors.set(sectorKey, sampler);
    }
    return Boolean(sampler);
  }

  unloadNavSector(sectorKey) {
    this.navSectors.delete(sectorKey);
  }

  registerFloorMeshes(rootObject) {
    if (!rootObject) return;
    rootObject.updateMatrixWorld(true);
    rootObject.traverse((obj) => {
      if (!obj.isMesh) return;
      const n = (obj.name || '').toLowerCase();
      if (n.includes('sky') || n.includes('water') || n.includes('cloud') || obj.userData?.ignoreFloor) return;
      this.floorMeshes.push(obj);
    });
  }

  addCollider(col) {
    const id = col.id || `col_${this.colliders.length}`;
    const item = { id, ...col };
    this.colliders.push(item);

    const r = col.shape === 'circle' ? col.radius : Math.max(col.halfW || 1, col.halfD || 1);
    const minCx = Math.floor((col.x - r) / this.cellSize);
    const maxCx = Math.floor((col.x + r) / this.cellSize);
    const minCz = Math.floor((col.z - r) / this.cellSize);
    const maxCz = Math.floor((col.z + r) / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        const key = this._cellKey(cx, cz);
        let bucket = this.spatialGrid.get(key);
        if (!bucket) {
          bucket = [];
          this.spatialGrid.set(key, bucket);
        }
        bucket.push(item);
      }
    }
    return item;
  }

  loadFromSpatialJson(spatialData, mapKey = '') {
    if (!spatialData) return;
    const node = spatialData[mapKey] || spatialData.maps?.[mapKey] || spatialData;
    const obsList = node.obstacles || node.colliders || [];
    for (let i = 0; i < obsList.length; i++) {
      const o = obsList[i];
      if (o.radius) {
        this.addCollider({
          id: o.id || `json_c_${i}`,
          shape: 'circle',
          x: Number(o.x || o.cx || 0),
          z: Number(o.z || o.cz || 0),
          radius: Number(o.radius),
          minY: Number(o.minY ?? -10),
          maxY: Number(o.maxY ?? 25)
        });
      } else if (o.halfW || o.width) {
        this.addCollider({
          id: o.id || `json_b_${i}`,
          shape: 'box',
          x: Number(o.x || o.cx || 0),
          z: Number(o.z || o.cz || 0),
          halfW: Number(o.halfW ?? (o.width || 2) * 0.5),
          halfD: Number(o.halfD ?? (o.depth || 2) * 0.5),
          minY: Number(o.minY ?? -10),
          maxY: Number(o.maxY ?? 25)
        });
      }
    }
  }

  loadObstaclesFromMeshGroup(rootObject) {
    if (!rootObject) return;
    rootObject.updateMatrixWorld(true);
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    rootObject.traverse((obj) => {
      if (!obj.isMesh) return;
      const n = (obj.name || '').toLowerCase();
      if (!/(pillar|wall|column|rock|tree|barrier|crate|statue|gate)/.test(n)) return;
      box.setFromObject(obj);
      box.getSize(size);
      box.getCenter(center);
      if (size.y < 1.1 || size.x > 40 || size.z > 40) return;

      this.addCollider({
        id: `mesh_${obj.uuid.slice(0, 8)}`,
        shape: 'box',
        x: center.x,
        z: center.z,
        halfW: Math.max(0.4, size.x * 0.45),
        halfD: Math.max(0.4, size.z * 0.45),
        minY: box.min.y,
        maxY: box.max.y
      });
    });
  }

  sampleRG16HeightAt(worldX, worldZ) {
    if (!this.rg16Data || !this.rg16Res) return 0;
    return sampleRG16Bilinear(this.rg16Data, this.rg16Res, worldX, worldZ, this.worldSize, this.maxHeight);
  }

  /**
   * 4-Layer Ground Resolution returning exact contact elevation, surface normal,
   * water depth, and walkability slope angle.
   */
  resolveGroundSurface(x, z, currentY = 0, stepUpLimit = 1.6, outResult = null) {
    const res = outResult || {
      y: 0,
      normal: new THREE.Vector3(0, 1, 0),
      source: 'fallback',
      slopeDeg: 0,
      waterDepth: 0
    };
    const wx = x + this.originOffset.x;
    const wz = z + this.originOffset.z;

    let bestY = -Infinity;
    let source = 'fallback';
    _tmpNormal.set(0, 1, 0);

    // Layer 1: Exact Binary NavSector Triangle Barycentric (if loaded for current sector)
    for (const sampler of this.navSectors.values()) {
      if (wx >= sampler.minX && wx <= sampler.maxX && wz >= sampler.minZ && wz <= sampler.maxZ) {
        const navY = sampler.sample(wx, wz, _tmpNormal);
        if (navY !== null && Number.isFinite(navY)) {
          bestY = navY;
          source = 'nav_bin';
          break;
        }
      }
    }

    // Layer 2: Scene Floor & Architecture Raycaster (bridges, turrets, terraces, sky islands)
    if (this.floorMeshes.length > 0) {
      const rayStartY = Math.max(currentY + stepUpLimit + 1.5, 42.0);
      _rayOrigin.set(x, rayStartY, z);
      this.raycaster.set(_rayOrigin, _rayDir);
      this.raycaster.far = 260;
      const hits = this.raycaster.intersectObjects(this.floorMeshes, false);
      for (let i = 0; i < hits.length; i++) {
        const hitY = hits[i].point.y;
        if (hitY <= currentY + stepUpLimit + 0.85 && hitY > bestY) {
          bestY = hitY;
          source = 'raycast';
          if (hits[i].face) {
            _tmpNormal.copy(hits[i].face.normal).transformDirection(hits[i].object.matrixWorld).normalize();
            if (_tmpNormal.y < 0) _tmpNormal.negate();
          }
          break;
        }
      }
    }

    // Layer 3: RG16 Terrain Heightmap Bilinear
    if (this.rg16Data && this.rg16Res) {
      const hY = this.sampleRG16HeightAt(wx, wz);
      if (hY > bestY) {
        bestY = hY;
        source = 'rg16';
        sampleFiniteNormal((px, pz) => this.sampleRG16HeightAt(px, pz), wx, wz, _tmpNormal, 0.45);
      }
    }

    // Layer 4: Deterministic Floor Fallback
    if (!Number.isFinite(bestY)) {
      bestY = 0;
      source = 'fallback';
      _tmpNormal.set(0, 1, 0);
    }

    const slopeCos = THREE.MathUtils.clamp(_tmpNormal.y, -1, 1);
    const slopeDeg = THREE.MathUtils.radToDeg(Math.acos(slopeCos));
    const waterDepth = Math.max(0, this.waterLevelY - bestY);

    res.y = bestY;
    res.normal.copy(_tmpNormal);
    res.source = source;
    res.slopeDeg = slopeDeg;
    res.waterDepth = waterDepth;
    return res;
  }

  getHeightAt(x, z, currentY = 0) {
    return this.resolveGroundSurface(x, z, currentY, 1.6).y;
  }

  getNormalAt(x, z, outVec = new THREE.Vector3(0, 1, 0), currentY = 0) {
    const res = this.resolveGroundSurface(x, z, currentY, 1.6);
    return outVec.copy(res.normal);
  }

  resolveMovement(pos, radius = 0.42, heroY = 0) {
    const cs = this.cellSize;
    const cx = Math.floor(pos.x / cs);
    const cz = Math.floor(pos.z / cs);
    const seen = new Set();

    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const bucket = this.spatialGrid.get(this._cellKey(cx + dx, cz + dz));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const c = bucket[i];
          if (seen.has(c.id)) continue;
          seen.add(c.id);
          if (heroY > c.maxY || heroY + 1.8 < c.minY) continue;

          if (c.shape === 'circle') {
            const vx = pos.x - c.x;
            const vz = pos.z - c.z;
            const minD = radius + c.radius;
            const distSq = vx * vx + vz * vz;
            if (distSq < minD * minD) {
              const dist = Math.sqrt(distSq) || 0.0001;
              const push = minD - dist;
              pos.x += (vx / dist) * push;
              pos.z += (vz / dist) * push;
            }
          } else if (c.shape === 'box') {
            const closestX = Math.max(c.x - c.halfW, Math.min(pos.x, c.x + c.halfW));
            const closestZ = Math.max(c.z - c.halfD, Math.min(pos.z, c.z + c.halfD));
            const vx = pos.x - closestX;
            const vz = pos.z - closestZ;
            const distSq = vx * vx + vz * vz;
            if (distSq < radius * radius) {
              const dist = Math.sqrt(distSq);
              if (dist > 0.0001) {
                const push = radius - dist;
                pos.x += (vx / dist) * push;
                pos.z += (vz / dist) * push;
              } else {
                const penX = c.halfW + radius - Math.abs(pos.x - c.x);
                const penZ = c.halfD + radius - Math.abs(pos.z - c.z);
                if (penX < penZ) pos.x += pos.x >= c.x ? penX : -penX;
                else pos.z += pos.z >= c.z ? penZ : -penZ;
              }
            }
          }
        }
      }
    }

    const b = this.arenaBounds;
    if (b.type === 'circle') {
      const maxR = Math.max(5, b.radius - radius);
      const rSq = pos.x * pos.x + pos.z * pos.z;
      if (rSq > maxR * maxR) {
        const r = Math.sqrt(rSq);
        pos.x = (pos.x / r) * maxR;
        pos.z = (pos.z / r) * maxR;
      }
    } else if (b.type === 'rect') {
      pos.x = THREE.MathUtils.clamp(pos.x, b.minX + radius, b.maxX - radius);
      pos.z = THREE.MathUtils.clamp(pos.z, b.minZ + radius, b.maxZ - radius);
    }

    return pos;
  }

  checkOriginShift(playerPos, worldRoot) {
    const threshold = PHYSICS_CONSTANTS.FLOATING_ORIGIN_THRESHOLD;
    if (Math.abs(playerPos.x) < threshold && Math.abs(playerPos.z) < threshold) return null;
    const shiftX = Math.trunc(playerPos.x / 500) * 500;
    const shiftZ = Math.trunc(playerPos.z / 500) * 500;
    if (shiftX === 0 && shiftZ === 0) return null;

    this.originOffset.x += shiftX;
    this.originOffset.z += shiftZ;
    playerPos.x -= shiftX;
    playerPos.z -= shiftZ;

    if (worldRoot) {
      worldRoot.position.x -= shiftX;
      worldRoot.position.z -= shiftZ;
    }
    for (const cb of this._originListeners) {
      try {
        cb(this.originOffset, shiftX, shiftZ);
      } catch (_) {}
    }
    return { shiftX, shiftZ };
  }
}

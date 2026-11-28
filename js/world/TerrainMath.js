/**
 * RAPSONYX Terrain Math Utilities
 * - Exact RG16 height decoding + manual bilinear interpolation (pixel-exact without blur corruption)
 * - Binary NavSector (nav_XX_YY.bin) loader & Triangle Barycentric Height/Normal interpolation
 * - Finite-difference terrain normal calculation
 */

import * as THREE from 'three';

const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();
const _ab = new THREE.Vector3();
const _ac = new THREE.Vector3();

export function decodeRG16Height(r, g, maxHeight = 220.0) {
  const val16 = (r << 8) | g;
  return (val16 / 65535.0) * maxHeight;
}

/**
 * Manual bilinear interpolation over raw RG16 RGBA Uint8Array pixels.
 */
export function sampleRG16Bilinear(data, resolution, worldX, worldZ, worldSize = 11110.0, maxHeight = 220.0) {
  if (!data || !resolution) return 0;
  const u = Math.max(0, Math.min(0.99999, (worldX + worldSize * 0.5) / worldSize));
  const v = Math.max(0, Math.min(0.99999, (worldZ + worldSize * 0.5) / worldSize));
  const fx = u * (resolution - 1);
  const fz = v * (resolution - 1);
  const x0 = Math.floor(fx);
  const z0 = Math.floor(fz);
  const x1 = Math.min(resolution - 1, x0 + 1);
  const z1 = Math.min(resolution - 1, z0 + 1);
  const tx = fx - x0;
  const tz = fz - z0;

  const idx00 = (z0 * resolution + x0) * 4;
  const idx10 = (z0 * resolution + x1) * 4;
  const idx01 = (z1 * resolution + x0) * 4;
  const idx11 = (z1 * resolution + x1) * 4;

  const h00 = decodeRG16Height(data[idx00], data[idx00 + 1], maxHeight);
  const h10 = decodeRG16Height(data[idx10], data[idx10 + 1], maxHeight);
  const h01 = decodeRG16Height(data[idx01], data[idx01 + 1], maxHeight);
  const h11 = decodeRG16Height(data[idx11], data[idx11 + 1], maxHeight);

  const hx0 = h00 + (h10 - h00) * tx;
  const hx1 = h01 + (h11 - h01) * tx;
  return hx0 + (hx1 - hx0) * tz;
}

/**
 * Compute Barycentric weights of point (px, pz) within XZ triangle (ax,az)-(bx,bz)-(cx,cz).
 */
export function computeBarycentricXZ(px, pz, ax, az, bx, bz, cx, cz) {
  const v0x = bx - ax;
  const v0z = bz - az;
  const v1x = cx - ax;
  const v1z = cz - az;
  const v2x = px - ax;
  const v2z = pz - az;

  const denom = v0x * v1z - v1x * v0z;
  if (Math.abs(denom) < 1e-6) return null;
  const invD = 1.0 / denom;
  const v = (v2x * v1z - v1x * v2z) * invD;
  const w = (v0x * v2z - v2x * v0z) * invD;
  const u = 1.0 - v - w;
  if (u < -0.02 || v < -0.02 || w < -0.02) return null;
  return { u, v, w };
}

/**
 * Parse binary nav sector (nav_XX_YY.bin) into uniform grid or triangle soup sampler.
 * Supports float32 height grid (N x N) as well as float32 vertex triples (9 floats per tri).
 */
export function buildNavSectorSampler(arrayBuffer, sectorOriginX, sectorOriginZ, sectorSize = 1010.0, fallbackHeight = 0) {
  const byteLen = arrayBuffer?.byteLength || 0;
  if (byteLen < 16) return null;

  const view = new Float32Array(arrayBuffer);
  const gridN = Math.round(Math.sqrt(view.length));

  // Case 1: Square float32 height grid (e.g. 91x91 = 8281 floats ~ 33KB / 32.5KB)
  if (gridN * gridN === view.length && gridN >= 4) {
    const cell = sectorSize / (gridN - 1);
    return {
      kind: 'grid_barycentric',
      minX: sectorOriginX,
      maxX: sectorOriginX + sectorSize,
      minZ: sectorOriginZ,
      maxZ: sectorOriginZ + sectorSize,
      sample(wx, wz, outNormal = null) {
        const lx = wx - sectorOriginX;
        const lz = wz - sectorOriginZ;
        if (lx < 0 || lz < 0 || lx > sectorSize || lz > sectorSize) return null;

        const gx = Math.min(gridN - 2, Math.max(0, Math.floor(lx / cell)));
        const gz = Math.min(gridN - 2, Math.max(0, Math.floor(lz / cell)));
        const u = (lx - gx * cell) / cell;
        const v = (lz - gz * cell) / cell;

        const h00 = Number.isFinite(view[gz * gridN + gx]) ? view[gz * gridN + gx] : fallbackHeight;
        const h10 = Number.isFinite(view[gz * gridN + gx + 1]) ? view[gz * gridN + gx + 1] : h00;
        const h01 = Number.isFinite(view[(gz + 1) * gridN + gx]) ? view[(gz + 1) * gridN + gx] : h00;
        const h11 = Number.isFinite(view[(gz + 1) * gridN + gx + 1]) ? view[(gz + 1) * gridN + gx + 1] : h00;

        // Exact triangle split matching PlaneGeometry diagonal (u + v <= 1 vs > 1)
        let y;
        if (u + v <= 1.0) {
          y = h00 + u * (h10 - h00) + v * (h01 - h00);
          if (outNormal) {
            _vA.set(0, h00, 0);
            _vB.set(0, h01, cell);
            _vC.set(cell, h10, 0);
            _ab.subVectors(_vB, _vA);
            _ac.subVectors(_vC, _vA);
            outNormal.crossVectors(_ab, _ac).normalize();
            if (outNormal.y < 0) outNormal.negate();
          }
        } else {
          const iu = 1.0 - u;
          const iv = 1.0 - v;
          y = h11 + iu * (h01 - h11) + iv * (h10 - h11);
          if (outNormal) {
            _vA.set(cell, h11, cell);
            _vB.set(cell, h10, 0);
            _vC.set(0, h01, cell);
            _ab.subVectors(_vB, _vA);
            _ac.subVectors(_vC, _vA);
            outNormal.crossVectors(_ab, _ac).normalize();
            if (outNormal.y < 0) outNormal.negate();
          }
        }
        return y;
      }
    };
  }

  return null;
}

export function sampleFiniteNormal(heightFn, x, z, outNormal, eps = 0.35) {
  const hL = heightFn(x - eps, z);
  const hR = heightFn(x + eps, z);
  const hD = heightFn(x, z - eps);
  const hU = heightFn(x, z + eps);
  outNormal.set(hL - hR, 2.0 * eps, hD - hU).normalize();
  return outNormal;
}

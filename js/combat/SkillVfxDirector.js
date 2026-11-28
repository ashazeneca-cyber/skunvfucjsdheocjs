/**
 * RAPSONYX Per-Millisecond Skill Coordinate & Pooled VFX Director
 * - Continuous tracked skill coordinates: homing, line, caster_anchor, target_anchor, ground_zone
 * - Pooled GPU particle system scaled by preset (30% / 60% / 85% / 100%)
 * - 24-segment dynamic weapon ribbon trail + terrain-conforming ground telegraph
 * - Zero-GC pooled DOM floating damage numbers projected to viewport
 * - Micro hitstop (40ms) + decaying directional camera shake
 */

import * as THREE from 'three';
import { TEAM_CONFIG } from '../config/constants.js';
import { AssetRegistry } from '../core/AssetRegistry.js';
import { AudioDirector } from '../core/AudioDirector.js';
import { GraphicsPresetManager } from '../core/GraphicsPresetManager.js';
import { VFXAndShieldShaders } from '../shaders/VFXAndShieldShaders.js';

const _projVec = new THREE.Vector3();
const _tmpStep = new THREE.Vector3();

export class SkillVfxDirector {
  constructor(scene, renderer = null) {
    this.scene = scene;
    this.renderer = renderer;
    this.vfxGroup = new THREE.Group();
    this.vfxGroup.name = 'RAPSONYX_VFX_ROOT';

    this.trackedInstances = [];
    this.rings = [];
    this.templateCache = new Map();
    this.hitstopTimer = 0;
    this.shakeIntensity = 0;
    this.elapsed = 0;

    // Pooled GPU Particles (single draw call)
    this.maxParticles = 320;
    this.particleCursor = 0;
    this.pPositions = new Float32Array(this.maxParticles * 3);
    this.pVelocities = new Float32Array(this.maxParticles * 3);
    this.pColors = new Float32Array(this.maxParticles * 3);
    this.pLife = new Float32Array(this.maxParticles);
    this.pMaxLife = new Float32Array(this.maxParticles);
    this.particlePoints = null;

    // 24-segment dynamic weapon ribbon
    this.ribbonSegments = 24;
    this.ribbonPoints = [];
    this.ribbonMesh = null;
    this.ribbonColor = new THREE.Color(0x5ce1ff);

    // Pooled Floating Damage Numbers
    this.dmgPool = [];
    this.activeDmgs = [];
    this.dmgLayer = null;

    this.onSkillCoordUpdate = null;

    this._initParticlePool();
    this._initWeaponRibbon();
  }

  _initParticlePool() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.pColors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.34,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.particlePoints = new THREE.Points(geo, mat);
    this.particlePoints.frustumCulled = false;
    this.vfxGroup.add(this.particlePoints);
  }

  _initWeaponRibbon() {
    const vertCount = this.ribbonSegments * 2;
    const positions = new Float32Array(vertCount * 3);
    const uvs = new Float32Array(vertCount * 2);
    const indices = [];
    for (let i = 0; i < this.ribbonSegments - 1; i++) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, b, c, b, d, c);
    }
    for (let i = 0; i < this.ribbonSegments; i++) {
      const u = i / (this.ribbonSegments - 1);
      uvs[i * 4] = u;
      uvs[i * 4 + 1] = 0;
      uvs[i * 4 + 2] = u;
      uvs[i * 4 + 3] = 1;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    const mat = VFXAndShieldShaders.createAdditiveSlashMaterial('#5ce1ff');
    this.ribbonMesh = new THREE.Mesh(geo, mat);
    this.ribbonMesh.frustumCulled = false;
    this.ribbonMesh.visible = false;
    this.vfxGroup.add(this.ribbonMesh);
  }

  ensureAttached() {
    if (!this.vfxGroup.parent && this.scene) {
      this.scene.add(this.vfxGroup);
    }
    if (!this.dmgLayer) {
      this.dmgLayer = document.getElementById('floating-damage-layer');
    }
    if (this.dmgLayer && this.dmgPool.length === 0) {
      for (let i = 0; i < 24; i++) {
        const el = document.createElement('div');
        el.className = 'dmg-float-item hidden';
        this.dmgLayer.appendChild(el);
        this.dmgPool.push(el);
      }
    }
  }

  emitParticleBurst(pos, colorHex = '#5ce1ff', count = 16, speed = 4.5, life = 0.55) {
    this.ensureAttached();
    const density = GraphicsPresetManager.activeConfig?.particleDensity ?? 0.6;
    const scaledCount = Math.max(2, Math.round(count * density));
    const col = new THREE.Color(colorHex);

    for (let i = 0; i < scaledCount; i++) {
      const idx = this.particleCursor;
      this.particleCursor = (this.particleCursor + 1) % this.maxParticles;

      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.25) * Math.PI * 0.7;
      const spd = speed * (0.45 + Math.random() * 0.75);

      this.pPositions[idx * 3] = pos.x + (Math.random() - 0.5) * 0.35;
      this.pPositions[idx * 3 + 1] = (pos.y || 0) + 0.55 + (Math.random() - 0.5) * 0.35;
      this.pPositions[idx * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.35;

      this.pVelocities[idx * 3] = Math.cos(theta) * Math.cos(phi) * spd;
      this.pVelocities[idx * 3 + 1] = Math.abs(Math.sin(phi) * spd) + 1.2;
      this.pVelocities[idx * 3 + 2] = Math.sin(theta) * Math.cos(phi) * spd;

      this.pColors[idx * 3] = col.r;
      this.pColors[idx * 3 + 1] = col.g;
      this.pColors[idx * 3 + 2] = col.b;
      this.pLife[idx] = life;
      this.pMaxLife[idx] = life;
    }
  }

  updateWeaponRibbon(worldPos, isActive = true, colorHex = '#5ce1ff') {
    if (!this.ribbonMesh) return;
    if (!isActive || !worldPos) {
      if (this.ribbonPoints.length > 0) this.ribbonPoints.shift();
      if (this.ribbonPoints.length < 2) {
        this.ribbonMesh.visible = false;
        return;
      }
    } else {
      this.ribbonMesh.visible = true;
      if (this.ribbonMesh.material?.uniforms?.uColor) {
        this.ribbonColor.set(colorHex);
        this.ribbonMesh.material.uniforms.uColor.value.copy(this.ribbonColor);
      }
      this.ribbonPoints.push(worldPos.clone());
      if (this.ribbonPoints.length > this.ribbonSegments) {
        this.ribbonPoints.shift();
      }
    }

    const posAttr = this.ribbonMesh.geometry.getAttribute('position');
    const arr = posAttr.array;
    const len = this.ribbonPoints.length;
    if (len < 2) return;

    for (let i = 0; i < this.ribbonSegments; i++) {
      const pt = this.ribbonPoints[Math.min(i, len - 1)];
      const width = (i / this.ribbonSegments) * 0.24;
      arr[i * 6] = pt.x;
      arr[i * 6 + 1] = pt.y + width;
      arr[i * 6 + 2] = pt.z;
      arr[i * 6 + 3] = pt.x;
      arr[i * 6 + 4] = pt.y - width;
      arr[i * 6 + 5] = pt.z;
    }
    posAttr.needsUpdate = true;
  }

  /**
   * Core per-millisecond tracked skill/projectile engine.
   * Modes: 'homing' | 'line' | 'caster_anchor' | 'target_anchor' | 'ground_zone'
   */
  spawnTrackedSkillInstance({
    id = `sk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    mode = 'line',
    origin = new THREE.Vector3(),
    targetPos = null,
    direction = new THREE.Vector3(0, 0, 1),
    casterUnit = null,
    targetUnit = null,
    speed = 24,
    radius = 1.4,
    duration = 0.75,
    colorHex = '#5ce1ff',
    onSweepHit = null,
    onArrive = null,
    syncOnline = false
  } = {}) {
    this.ensureAttached();
    const currPos = origin.clone();
    const prevPos = origin.clone();
    const dir = direction.clone().normalize();
    if (dir.lengthSq() < 1e-5) dir.set(0, 0, 1);

    let mesh = null;
    if (mode === 'ground_zone' || mode === 'caster_anchor' || mode === 'target_anchor') {
      const ringGeo = new THREE.RingGeometry(Math.max(0.25, radius * 0.65), radius, 36);
      ringGeo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide
      });
      mesh = new THREE.Mesh(ringGeo, mat);
      mesh.position.set(currPos.x, currPos.y + 0.14, currPos.z);
    } else {
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(Math.min(0.65, radius * 0.45), 12, 12),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex) })
      );
      mesh.position.copy(currPos);
    }
    this.vfxGroup.add(mesh);

    const inst = {
      id,
      mode,
      currPos,
      prevPos,
      targetPos: targetPos ? targetPos.clone() : null,
      direction: dir,
      casterUnit,
      targetUnit,
      speed,
      radius,
      duration,
      elapsed: 0,
      hitIds: new Set(),
      onSweepHit,
      onArrive,
      syncOnline,
      colorHex,
      mesh
    };
    this.trackedInstances.push(inst);
    this.emitParticleBurst(currPos, colorHex, 14, 4.0, 0.45);
    return inst;
  }

  spawnBasicAttackProjectile({
    originPos,
    targetPos,
    targetUnit = null,
    casterTeam = 'team_dream',
    isRanged = false,
    speed = 26,
    onHit = null
  }) {
    const teamCfg = TEAM_CONFIG[casterTeam] || TEAM_CONFIG.team_dream;
    if (!isRanged) {
      this.spawnRingBurst(targetPos, teamCfg.colorInt, 1.8, 0.24);
      this.emitParticleBurst(targetPos, teamCfg.colorHex, 10, 3.8, 0.35);
      if (onHit) onHit();
      return null;
    }

    const start = originPos.clone().add(new THREE.Vector3(0, 1.15, 0));
    const end = targetPos.clone().add(new THREE.Vector3(0, 1.0, 0));
    const dir = end.clone().sub(start).normalize();
    return this.spawnTrackedSkillInstance({
      mode: 'homing',
      origin: start,
      targetPos: end,
      targetUnit,
      direction: dir,
      speed,
      radius: 0.75,
      duration: 1.4,
      colorHex: teamCfg.colorHex,
      onArrive: onHit
    });
  }

  async castHeroSkill3D({ heroMeta, slotIndex, originPos, forwardYaw, targetPos }) {
    this.ensureAttached();
    const teamCfg = TEAM_CONFIG[heroMeta.team] || TEAM_CONFIG.team_dream;
    const s = heroMeta.id;
    const t = heroMeta.team;

    const sfxMap = [
      null,
      `assets/skills_sfx/skills_sfx_168_ogg/${t}/${s}/sfx_${s}_s1_strike.ogg`,
      `assets/skills_sfx/skills_sfx_168_ogg/${t}/${s}/sfx_${s}_s2_tactical.ogg`,
      `assets/skills_sfx/skills_sfx_168_ogg/${t}/${s}/sfx_${s}_s4_ultimate.ogg`
    ];
    if (sfxMap[slotIndex]) {
      AudioDirector.playSfx(sfxMap[slotIndex], { worldPos: originPos, volume: 0.92 });
    }

    const start = targetPos ? targetPos.clone() : originPos.clone();
    const fwd = new THREE.Vector3(Math.sin(forwardYaw), 0, Math.cos(forwardYaw));
    const radius = slotIndex === 3 ? 6.8 : 4.2;
    this.spawnRingBurst(start, teamCfg.colorInt, radius, 0.72);
    this.emitParticleBurst(start, teamCfg.colorHex, slotIndex === 3 ? 34 : 20, slotIndex === 3 ? 7.0 : 5.0, 0.65);

    if (slotIndex === 3) {
      this.triggerHitstop(0.04);
      this.triggerCameraShake(0.32);
    }

    const vfxMap = [
      null,
      `assets/skills_vfx_3d/skills_3d_vfx_168_glb/${t}/${s}/vfx3d_${s}_s1_strike.glb`,
      `assets/skills_vfx_3d/skills_3d_vfx_168_glb/${t}/${s}/vfx3d_${s}_s2_tactical.glb`,
      `assets/skills_vfx_3d/skills_3d_vfx_168_glb/${t}/${s}/vfx3d_${s}_s4_ultimate.glb`
    ];
    const vfxPath = vfxMap[slotIndex];
    if (!vfxPath) return;

    try {
      let template = this.templateCache.get(vfxPath);
      if (!template) {
        const gltf = await AssetRegistry.loadGLTF(vfxPath, this.renderer, { cachePackId: `hero_${s}` });
        template = gltf.scene;
        this.templateCache.set(vfxPath, template);
      }
      const inst = template.clone();
      inst.position.copy(start).add(fwd.clone().multiplyScalar(0.35));
      inst.position.y += 0.25;
      inst.rotation.y = forwardYaw;
      this.vfxGroup.add(inst);
      setTimeout(() => {
        if (inst.parent) this.vfxGroup.remove(inst);
      }, slotIndex === 3 ? 1850 : 1150);
    } catch (_) {}
  }

  spawnSkillCastEffect(pos, colorHex = '#38bdf8') {
    this.spawnRingBurst(pos, new THREE.Color(colorHex).getHex(), 2.4, 0.55);
    this.emitParticleBurst(pos, colorHex, 20, 4.5, 0.55);
  }

  spawnRingBurst(pos, colorInt = 0x5ce1ff, maxRadius = 4.2, duration = 0.55) {
    this.ensureAttached();
    const geo = new THREE.RingGeometry(0.4, maxRadius * 0.5, 36);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: colorInt,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, (pos.y || 0) + 0.16, pos.z);
    this.vfxGroup.add(mesh);
    this.rings.push({ mesh, age: 0, duration, maxScale: 1.9 });
  }

  spawnFloatingNumber(worldPos, amount, { isCrit = false, dmgType = 'physical', isHeal = false, isShield = false } = {}) {
    this.ensureAttached();
    const el = this.dmgPool.find((n) => n.classList.contains('hidden')) || this.dmgPool[0];
    if (!el) return;

    el.className = 'dmg-float-item';
    if (isHeal) el.classList.add('dmg-heal');
    else if (isShield) el.classList.add('dmg-shield');
    else if (dmgType === 'magic') el.classList.add('dmg-magic');
    else if (dmgType === 'true') el.classList.add('dmg-true');
    else el.classList.add('dmg-phys');
    if (isCrit) el.classList.add('dmg-crit');

    el.textContent = isHeal ? `+${Math.round(amount)}` : `${Math.round(amount)}${isCrit ? '!' : ''}`;
    this.activeDmgs.push({
      el,
      worldPos: worldPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.6, 1.9, 0)),
      age: 0,
      duration: 0.78
    });
  }

  spawnHitFlash(pos, isCrit = false, amount = 0, dmgType = 'physical') {
    this.spawnRingBurst(pos, isCrit ? 0xfbbf24 : 0xffffff, isCrit ? 1.6 : 1.0, 0.25);
    this.emitParticleBurst(pos, isCrit ? '#fbbf24' : '#38bdf8', isCrit ? 16 : 8, 4.2, 0.35);
    if (amount > 0) {
      this.spawnFloatingNumber(pos, amount, { isCrit, dmgType });
    }
    if (isCrit) {
      this.triggerHitstop(0.036);
      this.triggerCameraShake(0.16);
    }
  }

  triggerHitstop(sec = 0.04) {
    this.hitstopTimer = Math.max(this.hitstopTimer, Math.min(0.06, sec));
  }

  triggerCameraShake(intensity = 0.25) {
    this.shakeIntensity = Math.min(0.65, Math.max(this.shakeIntensity, intensity));
  }

  consumeHitstop(dt) {
    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      return true;
    }
    return false;
  }

  update(dt, camera = null, physics = null) {
    this.elapsed += dt;

    if (this.ribbonMesh?.material?.uniforms?.uTime) {
      this.ribbonMesh.material.uniforms.uTime.value = this.elapsed;
    }

    // 1. Step per-millisecond tracked skill instances
    for (let i = this.trackedInstances.length - 1; i >= 0; i--) {
      const inst = this.trackedInstances[i];
      inst.elapsed += dt;
      inst.prevPos.copy(inst.currPos);

      if (inst.mode === 'homing') {
        if (inst.targetUnit?.alive && inst.targetUnit?.position) {
          if (!inst.targetPos) inst.targetPos = new THREE.Vector3();
          inst.targetPos.copy(inst.targetUnit.position).add(new THREE.Vector3(0, 1.0, 0));
        }
        if (inst.targetPos) {
          _tmpStep.subVectors(inst.targetPos, inst.currPos);
          const dist = _tmpStep.length();
          const step = inst.speed * dt;
          if (dist <= step + 0.35) {
            inst.currPos.copy(inst.targetPos);
            if (inst.onSweepHit) inst.onSweepHit(inst, dt);
            if (inst.onArrive) inst.onArrive(inst);
            this.vfxGroup.remove(inst.mesh);
            this.trackedInstances.splice(i, 1);
            continue;
          }
          _tmpStep.normalize();
          inst.currPos.addScaledVector(_tmpStep, step);
        }
      } else if (inst.mode === 'line') {
        inst.currPos.addScaledVector(inst.direction, inst.speed * dt);
      } else if (inst.mode === 'caster_anchor' && inst.casterUnit?.position) {
        inst.currPos.copy(inst.casterUnit.position);
      } else if (inst.mode === 'target_anchor' && inst.targetUnit?.position) {
        inst.currPos.copy(inst.targetUnit.position);
      }

      if (physics && (inst.mode === 'ground_zone' || inst.mode === 'caster_anchor' || inst.mode === 'target_anchor')) {
        inst.currPos.y = physics.getHeightAt(inst.currPos.x, inst.currPos.z, inst.currPos.y);
        inst.mesh.position.set(inst.currPos.x, inst.currPos.y + 0.14, inst.currPos.z);
        inst.mesh.rotation.z += dt * 1.4;
      } else {
        inst.mesh.position.copy(inst.currPos);
      }

      if (inst.onSweepHit) {
        inst.onSweepHit(inst, dt);
      }
      if (inst.syncOnline && this.onSkillCoordUpdate) {
        this.onSkillCoordUpdate(inst);
      }

      if (inst.elapsed >= inst.duration) {
        if (inst.onArrive) inst.onArrive(inst);
        this.vfxGroup.remove(inst.mesh);
        this.trackedInstances.splice(i, 1);
      }
    }

    // 2. Step Expanding Terrain-Aligned Rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.age += dt;
      const t = Math.min(1, r.age / r.duration);
      const sc = 0.65 + t * (r.maxScale - 0.65);
      r.mesh.scale.set(sc, 1, sc);
      r.mesh.material.opacity = (1 - t) * 0.85;
      if (t >= 1) {
        this.vfxGroup.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
        this.rings.splice(i, 1);
      }
    }

    // 3. Step GPU Particle Pool
    let aliveParticles = false;
    for (let i = 0; i < this.maxParticles; i++) {
      if (this.pLife[i] <= 0) continue;
      aliveParticles = true;
      this.pLife[i] = Math.max(0, this.pLife[i] - dt);
      if (this.pLife[i] === 0) {
        this.pPositions[i * 3 + 1] = -9999;
        continue;
      }
      this.pPositions[i * 3] += this.pVelocities[i * 3] * dt;
      this.pPositions[i * 3 + 1] += this.pVelocities[i * 3 + 1] * dt;
      this.pPositions[i * 3 + 2] += this.pVelocities[i * 3 + 2] * dt;
      this.pVelocities[i * 3 + 1] -= 9.5 * dt;
    }
    if (aliveParticles && this.particlePoints) {
      this.particlePoints.geometry.getAttribute('position').needsUpdate = true;
      this.particlePoints.geometry.getAttribute('color').needsUpdate = true;
    }

    // 4. Step Pooled Floating Damage Numbers
    if (camera) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (let i = this.activeDmgs.length - 1; i >= 0; i--) {
        const d = this.activeDmgs[i];
        d.age += dt;
        const t = d.age / d.duration;
        if (t >= 1) {
          d.el.classList.add('hidden');
          this.activeDmgs.splice(i, 1);
          continue;
        }
        _projVec.copy(d.worldPos);
        _projVec.y += t * 1.15;
        _projVec.project(camera);
        if (_projVec.z > 1) {
          d.el.classList.add('hidden');
          continue;
        }
        const sx = (_projVec.x * 0.5 + 0.5) * w;
        const sy = (-_projVec.y * 0.5 + 0.5) * h;
        d.el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -50%) scale(${1 + Math.sin(t * Math.PI) * 0.14})`;
        d.el.style.opacity = String(Math.max(0, 1 - Math.pow(t, 2)));
      }
    }

    // 5. Decaying Camera Shake
    if (camera && this.shakeIntensity > 0.005) {
      camera.position.x += (Math.random() - 0.5) * this.shakeIntensity * 0.25;
      camera.position.y += (Math.random() - 0.5) * this.shakeIntensity * 0.18;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 2.4);
    }
  }

  dispose() {
    for (const p of this.trackedInstances) this.vfxGroup.remove(p.mesh);
    this.trackedInstances = [];
    for (const r of this.rings) {
      this.vfxGroup.remove(r.mesh);
      r.mesh.geometry.dispose();
      r.mesh.material.dispose();
    }
    this.rings = [];
    for (const d of this.activeDmgs) d.el.classList.add('hidden');
    this.activeDmgs = [];
    this.ribbonPoints = [];
    if (this.ribbonMesh) this.ribbonMesh.visible = false;
  }
}

/**
 * RAPSONYX Facial Animation Director & Weighted Random Expression Scheduler
 * - Random weighted expressions every 4.5 - 8.5s in Lobby showcase (smile, joy, wink, curious, focused)
 * - Instant happy tap-reaction via triggerTapReaction()
 * - Natural blinks (2.8 - 5.5s) & micro eye saccades
 * - Dual Fallback: drives GLB morphTargets cleanly when present; smoothly animates head/neck tilt when morphs absent
 */

import * as THREE from 'three';

const EXPRESSION_WEIGHTS = [
  { id: 'smile', weight: 0.42 },
  { id: 'wink', weight: 0.20 },
  { id: 'happy', weight: 0.18 },
  { id: 'surprised', weight: 0.12 },
  { id: 'focused', weight: 0.08 }
];

const _axisX = new THREE.Vector3(1, 0, 0);
const _axisY = new THREE.Vector3(0, 1, 0);
const _axisZ = new THREE.Vector3(0, 0, 1);

export class FacialAnimationDirector {
  constructor() {
    this.morphMeshes = [];
    this.morphIndices = new Map();
    this.currentMood = 'smile';
    this.overrideMood = null;
    this.overrideTimer = 0;

    this.nextMoodTimer = 5.2;
    this.blinkTimer = 3.2;
    this.isBlinking = false;
    this.blinkProgress = 0;

    this.saccadeTimer = 1.8;
    this.targetLookX = 0;
    this.targetLookY = 0;
    this.lookX = 0;
    this.lookY = 0;
    this.moodBlend = 0;
    this.elapsed = 0;
  }

  async initConfig() {
    return true;
  }

  attachHero(heroRoot) {
    this.morphMeshes = [];
    this.morphIndices.clear();
    if (!heroRoot) return;

    heroRoot.traverse((obj) => {
      if (!obj.isMesh || !obj.morphTargetDictionary || !obj.morphTargetInfluences) return;
      this.morphMeshes.push(obj);
      const dict = obj.morphTargetDictionary;
      const map = { blink: [], smile: [], happy: [], wink: [], surprised: [], focused: [] };

      for (const [key, idx] of Object.entries(dict)) {
        const k = key.toLowerCase();
        if (k.includes('blink') || k.includes('close')) map.blink.push(idx);
        if (k.includes('smile') || k.includes('mouth_happy')) map.smile.push(idx);
        if (k.includes('happy') || k.includes('joy') || k.includes('laugh')) map.happy.push(idx);
        if (k.includes('wink')) map.wink.push(idx);
        if (k.includes('surprise') || k.includes('shock') || k.includes('wow')) map.surprised.push(idx);
        if (k.includes('angry') || k.includes('focus') || k.includes('serious')) map.focused.push(idx);
      }
      this.morphIndices.set(obj, map);
    });
  }

  setExpression(mood = 'smile', holdSec = 0) {
    if (holdSec > 0) {
      this.overrideMood = mood;
      this.overrideTimer = holdSec;
    } else {
      this.currentMood = mood;
    }
  }

  triggerTapReaction() {
    this.setExpression('happy', 2.4);
    this.moodBlend = 1.0;
    this.nextMoodTimer = 5.5;
  }

  _pickWeightedMood() {
    let r = Math.random();
    for (const item of EXPRESSION_WEIGHTS) {
      if (r <= item.weight) return item.id;
      r -= item.weight;
    }
    return 'smile';
  }

  update(rigController, dt, { enableLookAt = true, enableRandomMoods = true } = {}) {
    this.elapsed += dt;

    if (this.overrideTimer > 0) {
      this.overrideTimer = Math.max(0, this.overrideTimer - dt);
      if (this.overrideTimer === 0) this.overrideMood = null;
    } else if (enableRandomMoods) {
      this.nextMoodTimer -= dt;
      if (this.nextMoodTimer <= 0) {
        this.currentMood = this._pickWeightedMood();
        this.nextMoodTimer = 4.5 + Math.random() * 4.0;
      }
    }

    const activeMood = this.overrideMood || this.currentMood;
    this.moodBlend = THREE.MathUtils.lerp(this.moodBlend, activeMood === 'happy' || activeMood === 'wink' ? 1.0 : 0.65, Math.min(1, dt * 8));

    // Natural blinks (2.8 - 5.5s cycle)
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0 && !this.isBlinking) {
      this.isBlinking = true;
      this.blinkProgress = 0;
      this.blinkTimer = 2.8 + Math.random() * 2.7;
    }

    let blinkWeight = 0;
    if (this.isBlinking) {
      this.blinkProgress += dt / 0.14;
      if (this.blinkProgress >= 1) {
        this.isBlinking = false;
        blinkWeight = 0;
      } else {
        blinkWeight = Math.sin(this.blinkProgress * Math.PI);
      }
    }

    // Apply morph targets if rigged in GLB
    let hasAnyMorphs = false;
    for (let i = 0; i < this.morphMeshes.length; i++) {
      const mesh = this.morphMeshes[i];
      const map = this.morphIndices.get(mesh);
      const inf = mesh.morphTargetInfluences;
      if (!map || !inf) continue;

      for (const idx of map.blink) {
        inf[idx] = blinkWeight;
        hasAnyMorphs = true;
      }
      for (const mKey of ['smile', 'happy', 'wink', 'surprised', 'focused']) {
        const targetVal = activeMood === mKey ? (activeMood === 'happy' ? 0.78 : 0.56) : 0;
        for (const idx of map[mKey]) {
          inf[idx] = THREE.MathUtils.lerp(inf[idx] || 0, targetVal, Math.min(1, dt * 10));
          hasAnyMorphs = true;
        }
      }
    }

    // Head look-at saccades + Dual Fallback expressive head/neck tilts when GLB has no morphs
    if (enableLookAt && rigController?.bones?.head) {
      this.saccadeTimer -= dt;
      if (this.saccadeTimer <= 0) {
        this.targetLookX = (Math.random() - 0.5) * 0.22;
        this.targetLookY = (Math.random() - 0.5) * 0.12;
        this.saccadeTimer = 1.6 + Math.random() * 2.4;
      }
      this.lookX = THREE.MathUtils.lerp(this.lookX, this.targetLookX, Math.min(1, dt * 5));
      this.lookY = THREE.MathUtils.lerp(this.lookY, this.targetLookY, Math.min(1, dt * 5));

      let moodTiltZ = 0;
      let moodNodX = 0;
      if (activeMood === 'happy') {
        moodNodX = Math.sin(this.elapsed * 7.5) * (hasAnyMorphs ? 0.03 : 0.075);
        moodTiltZ = 0.08;
      } else if (activeMood === 'wink' || activeMood === 'surprised') {
        moodTiltZ = hasAnyMorphs ? 0.04 : 0.11;
      }

      rigController.rotateBoneModelSpace(rigController.bones.head, _axisY, this.lookX);
      rigController.rotateBoneModelSpace(rigController.bones.head, _axisX, this.lookY + moodNodX);
      if (moodTiltZ !== 0) {
        rigController.rotateBoneModelSpace(rigController.bones.head, _axisZ, moodTiltZ);
      }
    }
  }
}

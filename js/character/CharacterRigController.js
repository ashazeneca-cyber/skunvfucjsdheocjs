/**
 * RAPSONYX Character Rig Controller & 67-Bone Normalization
 * - Clones skinned GLB safely via SkeletonUtils.clone
 * - Normalizes hero height to 1.85m
 * - Snapshots bind pose matrices and resets unanimated bones cleanly before procedural IK
 * - Provides model-space bone rotation independent of Blender/Mixamo bone roll
 * - Manages GLB clip playback + procedural fallback locomotion
 */

import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { PHYSICS_CONSTANTS } from '../config/constants.js';
import { RapsonyxCharacterShader } from '../shaders/RapsonyxCharacterShader.js';
import { ResourceDisposer } from '../core/ResourceDisposer.js';

const BONE_PATTERNS = {
  hips: /^(mixamorig:?|armature\|)?(hips|pelvis|root_hips|bip01_pelvis)$/i,
  spine: /^(mixamorig:?|armature\|)?(spine|spine01|spine_01)$/i,
  chest: /^(mixamorig:?|armature\|)?(spine2|spine_02|chest|upperchest)$/i,
  neck: /^(mixamorig:?|armature\|)?(neck|neck_01)$/i,
  head: /^(mixamorig:?|armature\|)?(head|head_01)$/i,
  leftUpLeg: /^(mixamorig:?|armature\|)?(leftupleg|thigh_l|l_thigh|upleg_l|leg_upper_l)$/i,
  leftLeg: /^(mixamorig:?|armature\|)?(leftleg|calf_l|shin_l|l_calf|knee_l|leg_lower_l)$/i,
  leftFoot: /^(mixamorig:?|armature\|)?(leftfoot|foot_l|l_foot|ankle_l)$/i,
  rightUpLeg: /^(mixamorig:?|armature\|)?(rightupleg|thigh_r|r_thigh|upleg_r|leg_upper_r)$/i,
  rightLeg: /^(mixamorig:?|armature\|)?(rightleg|calf_r|shin_r|r_calf|knee_r|leg_lower_r)$/i,
  rightFoot: /^(mixamorig:?|armature\|)?(rightfoot|foot_r|r_foot|ankle_r)$/i,
  leftArm: /^(mixamorig:?|armature\|)?(leftarm|upperarm_l|l_upperarm|arm_upper_l)$/i,
  leftForeArm: /^(mixamorig:?|armature\|)?(leftforearm|forearm_l|l_forearm|lowerarm_l)$/i,
  leftHand: /^(mixamorig:?|armature\|)?(lefthand|hand_l|l_hand|wrist_l)$/i,
  rightArm: /^(mixamorig:?|armature\|)?(rightarm|upperarm_r|r_upperarm|arm_upper_r)$/i,
  rightForeArm: /^(mixamorig:?|armature\|)?(rightforearm|forearm_r|r_forearm|lowerarm_r)$/i,
  rightHand: /^(mixamorig:?|armature\|)?(righthand|hand_r|r_hand|wrist_r)$/i
};

const _qWorld = new THREE.Quaternion();
const _qParentWorld = new THREE.Quaternion();
const _qDelta = new THREE.Quaternion();

export class CharacterRigController {
  constructor() {
    this.container = new THREE.Group();
    this.container.name = 'RAPSONYX_HERO_CONTAINER';
    this.visualRoot = null;
    this.mixer = null;
    this.actions = new Map();
    this.currentAction = null;
    this.upperBodyMaskTimer = 0;
    this.upperBodyActionType = null; // 'ATTACK' | 'SKILL_1' | 'SKILL_2' | 'ULTIMATE' | 'HAPPY_INTERACT' | 'HIT'
    this.springBones = [];
    this.bones = {};
    this.allBones = [];
    this.bindSnapshot = new Map();
    this.hasEmbeddedClips = false;
    this.targetHeight = PHYSICS_CONSTANTS.HERO_TARGET_HEIGHT;
    this.elapsed = 0;
  }

  mountFromGLTF(gltf, { teamColorHex = '#5ce1ff', enableOutline = true, enableFullCel = true } = {}) {
    this.dispose();

    const cloned = SkeletonUtils.clone(gltf.scene);
    cloned.updateMatrixWorld(true);

    // Measure height and normalize cleanly to 1.85m standing height
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const rawHeight = Math.max(0.2, size.y);
    const scaleFactor = this.targetHeight / rawHeight;
    cloned.scale.multiplyScalar(scaleFactor);
    cloned.updateMatrixWorld(true);

    // Seat feet flush on Y = 0
    const boxScaled = new THREE.Box3().setFromObject(cloned);
    cloned.position.y -= boxScaled.min.y;
    cloned.updateMatrixWorld(true);

    // Apply RAPSONYX Anime Character Shader + Outlines
    RapsonyxCharacterShader.applyToHero(cloned, {
      teamColorHex,
      enableOutline,
      enableFullCel
    });

    this.visualRoot = cloned;
    this.container.add(this.visualRoot);

    this._discoverBones(this.visualRoot);
    this._snapshotBindPose();
    this._setupAnimations(gltf.animations || []);
    return this.container;
  }

  _discoverBones(root) {
    this.bones = {};
    this.allBones = [];
    const seen = new Set();

    root.traverse((obj) => {
      if (!obj.isBone || seen.has(obj)) return;
      seen.add(obj);
      this.allBones.push(obj);

      const cleanName = obj.name.trim();
      for (const [key, regex] of Object.entries(BONE_PATTERNS)) {
        if (!this.bones[key] && regex.test(cleanName)) {
          this.bones[key] = obj;
        }
      }
      // Fuzzy fallback for custom Blender bone names & secondary spring chains (hair/skirt/ribbon)
      const lower = cleanName.toLowerCase();
      if (!this.bones.hips && (lower.includes('hip') || lower.includes('pelvis'))) this.bones.hips = obj;
      if (!this.bones.head && lower === 'head') this.bones.head = obj;
      if (!this.bones.neck && lower.includes('neck')) this.bones.neck = obj;
      if (!this.bones.rightHand && lower.includes('hand') && (lower.endsWith('r') || lower.includes('right') || lower.includes('.r'))) {
        this.bones.rightHand = obj;
      }
      if (!this.bones.leftHand && lower.includes('hand') && (lower.endsWith('l') || lower.includes('left') || lower.includes('.l'))) {
        this.bones.leftHand = obj;
      }
      if (/hair|ponytail|twin|bangs|skirt|ribbon|cape|scarf/i.test(lower)) {
        this.springBones.push({ bone: obj, phase: this.springBones.length * 0.7 });
      }
    });
  }

  _snapshotBindPose() {
    this.bindSnapshot.clear();
    for (let i = 0; i < this.allBones.length; i++) {
      const b = this.allBones[i];
      this.bindSnapshot.set(b, {
        pos: b.position.clone(),
        quat: b.quaternion.clone(),
        scale: b.scale.clone()
      });
    }
  }

  resetUnanimatedBones() {
    for (const [bone, snap] of this.bindSnapshot.entries()) {
      bone.position.copy(snap.pos);
      bone.quaternion.copy(snap.quat);
      bone.scale.copy(snap.scale);
    }
  }

  _setupAnimations(clips) {
    this.actions.clear();
    this.currentAction = null;
    this.hasEmbeddedClips = clips.length > 0;
    if (!this.visualRoot || clips.length === 0) return;

    this.mixer = new THREE.AnimationMixer(this.visualRoot);
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const action = this.mixer.clipAction(clip);
      const key = (clip.name || `clip_${i}`).toLowerCase();
      this.actions.set(key, action);
    }

    const idleKey = this._findClipKey(['idle', 'stand', 'lobby', 'breath']) || [...this.actions.keys()][0];
    if (idleKey) {
      const act = this.actions.get(idleKey);
      act.play();
      this.currentAction = act;
    }
  }

  _findClipKey(keywords) {
    for (const key of this.actions.keys()) {
      if (keywords.some((k) => key.includes(k))) return key;
    }
    return null;
  }

  playState(stateName, { fadeSec = 0.16, loop = true } = {}) {
    if (!this.mixer) return false;
    const matchKey = this._findClipKey([stateName.toLowerCase()]);
    if (!matchKey) return false;
    const nextAction = this.actions.get(matchKey);
    if (!nextAction || nextAction === this.currentAction) return true;

    nextAction.reset();
    nextAction.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    nextAction.clampWhenFinished = !loop;
    if (this.currentAction) {
      this.currentAction.crossFadeTo(nextAction, fadeSec, true);
    }
    nextAction.play();
    this.currentAction = nextAction;
    return true;
  }

  rotateBoneModelSpace(bone, axisModelSpace, angleRad) {
    if (!bone || Math.abs(angleRad) < 1e-5) return;
    bone.updateWorldMatrix(true, false);
    bone.getWorldQuaternion(_qWorld);
    if (bone.parent) {
      bone.parent.getWorldQuaternion(_qParentWorld);
    } else {
      _qParentWorld.identity();
    }
    _qDelta.setFromAxisAngle(axisModelSpace, angleRad);
    // Desired world = delta * currentWorld -> local = parentWorldInv * desiredWorld
    _qWorld.premultiply(_qDelta);
    bone.quaternion.copy(_qParentWorld).invert().multiply(_qWorld);
  }

  triggerUpperBodyAction(actionType = 'ATTACK', durationSec = 0.55) {
    this.upperBodyActionType = actionType;
    this.upperBodyMaskTimer = Math.max(0.18, durationSec);
  }

  updateAnimation(dt, moveSpeed = 0, isAirborne = false, isSprinting = false, isCombatSwing = false, flags = {}) {
    this.elapsed += dt;
    if (this.upperBodyMaskTimer > 0) {
      this.upperBodyMaskTimer = Math.max(0, this.upperBodyMaskTimer - dt);
      if (this.upperBodyMaskTimer === 0) this.upperBodyActionType = null;
    }

    const { isGliding = false, isSwimming = false, isDead = false, isFidget = false, velY = 0 } = flags;

    // Resolve canonical 14-state target
    let state = 'IDLE';
    if (isDead) state = 'DEATH';
    else if (this.upperBodyActionType) state = this.upperBodyActionType;
    else if (isCombatSwing) state = 'ATTACK';
    else if (isSwimming) state = 'SWIM';
    else if (isGliding) state = 'GLIDE';
    else if (isAirborne) state = velY < -1.5 ? 'FALL' : 'JUMP';
    else if (isSprinting || moveSpeed > 6.6) state = 'SPRINT';
    else if (moveSpeed > 3.6) state = 'RUN';
    else if (moveSpeed > 0.35) state = 'WALK';
    else if (isFidget) state = 'IDLE_FIDGET';

    if (this.mixer && this.hasEmbeddedClips) {
      const clipMap = {
        DEATH: ['death', 'ko', 'die'],
        ULTIMATE: ['ult', 's4', 'ultimate'],
        SKILL_2: ['s2', 'skill_2', 'skill'],
        SKILL_1: ['s1', 'skill_1', 'attack', 'slash'],
        HAPPY_INTERACT: ['happy', 'celebrate', 'victory', 'cheer', 'idle'],
        ATTACK: ['attack', 'slash', 'hit'],
        HIT: ['hurt', 'hit', 'damage'],
        SWIM: ['swim', 'run', 'idle'],
        GLIDE: ['glide', 'fly', 'jump'],
        FALL: ['fall', 'jump'],
        JUMP: ['jump'],
        SPRINT: ['sprint', 'run'],
        RUN: ['run', 'walk'],
        WALK: ['walk', 'run'],
        IDLE_FIDGET: ['fidget', 'emote', 'idle'],
        IDLE: ['idle', 'stand', 'lobby', 'breath']
      };
      const kwList = clipMap[state] || ['idle'];
      let played = false;
      for (const kw of kwList) {
        if (this.playState(kw, { fadeSec: state === 'IDLE' ? 0.22 : 0.12, loop: state !== 'DEATH' })) {
          played = true;
          break;
        }
      }
      this.mixer.update(dt);
      if (played && this.upperBodyActionType) {
        this._applyUpperBodyMaskOverlay(this.upperBodyActionType, moveSpeed);
      }
    } else {
      this.resetUnanimatedBones();
      this._applyProceduralLocomotion(moveSpeed, isAirborne, isSprinting, isCombatSwing, state);
      if (this.upperBodyActionType) {
        this._applyUpperBodyMaskOverlay(this.upperBodyActionType, moveSpeed);
      }
    }

    this._updateSecondarySpringBones(dt, moveSpeed);
  }

  _applyUpperBodyMaskOverlay(actionType) {
    const t = this.elapsed;
    const axisX = new THREE.Vector3(1, 0, 0);
    const axisY = new THREE.Vector3(0, 1, 0);
    const axisZ = new THREE.Vector3(0, 0, 1);
    const progress = 1.0 - Math.min(1.0, this.upperBodyMaskTimer / 0.55);
    const swing = Math.sin(progress * Math.PI);

    if (actionType === 'HAPPY_INTERACT') {
      this.rotateBoneModelSpace(this.bones.rightArm, axisZ, -1.15 * swing);
      this.rotateBoneModelSpace(this.bones.rightForeArm, axisX, -0.65 * swing);
      this.rotateBoneModelSpace(this.bones.leftArm, axisZ, 0.55 * swing);
      this.rotateBoneModelSpace(this.bones.head, axisZ, Math.sin(t * 7.0) * 0.14);
      return;
    }

    if (actionType === 'ULTIMATE') {
      this.rotateBoneModelSpace(this.bones.leftArm, axisZ, 1.35 * swing);
      this.rotateBoneModelSpace(this.bones.rightArm, axisZ, -1.35 * swing);
      this.rotateBoneModelSpace(this.bones.chest, axisX, -0.18 * swing);
      return;
    }

    if (actionType === 'SKILL_1' || actionType === 'SKILL_2' || actionType === 'ATTACK') {
      const dir = actionType === 'SKILL_2' ? -1 : 1;
      this.rotateBoneModelSpace(this.bones.rightArm, axisX, -1.18 * swing);
      this.rotateBoneModelSpace(this.bones.rightForeArm, axisX, -0.52 * swing);
      this.rotateBoneModelSpace(this.bones.chest, axisY, 0.38 * dir * swing);
      return;
    }

    if (actionType === 'HIT') {
      this.rotateBoneModelSpace(this.bones.chest, axisX, 0.25 * swing);
      this.rotateBoneModelSpace(this.bones.head, axisX, -0.16 * swing);
    }
  }

  _updateSecondarySpringBones(dt, moveSpeed) {
    if (!this.springBones.length) return;
    const axisX = new THREE.Vector3(1, 0, 0);
    const axisZ = new THREE.Vector3(0, 0, 1);
    const amp = 0.035 + Math.min(0.16, moveSpeed * 0.018);
    const spd = 2.6 + moveSpeed * 0.65;
    for (let i = 0; i < this.springBones.length; i++) {
      const s = this.springBones[i];
      const wave = Math.sin(this.elapsed * spd + s.phase);
      this.rotateBoneModelSpace(s.bone, axisX, wave * amp + Math.min(0.28, moveSpeed * 0.032));
      this.rotateBoneModelSpace(s.bone, axisZ, Math.cos(this.elapsed * spd * 0.7 + s.phase) * amp * 0.45);
    }
  }

  _applyProceduralLocomotion(moveSpeed, isAirborne, isSprinting, isCombatSwing, state = 'IDLE') {
    const t = this.elapsed;
    const axisX = new THREE.Vector3(1, 0, 0);
    const axisY = new THREE.Vector3(0, 1, 0);
    const axisZ = new THREE.Vector3(0, 0, 1);

    if (state === 'DEATH') {
      this.rotateBoneModelSpace(this.bones.chest, axisX, 1.15);
      this.rotateBoneModelSpace(this.bones.head, axisX, 0.35);
      return;
    }

    if (state === 'GLIDE') {
      this.rotateBoneModelSpace(this.bones.leftArm, axisZ, 1.25);
      this.rotateBoneModelSpace(this.bones.rightArm, axisZ, -1.25);
      this.rotateBoneModelSpace(this.bones.chest, axisX, 0.24);
      this.rotateBoneModelSpace(this.bones.leftUpLeg, axisX, 0.28);
      this.rotateBoneModelSpace(this.bones.rightUpLeg, axisX, 0.16);
      return;
    }

    if (state === 'SWIM') {
      const stroke = Math.sin(t * 5.2);
      this.rotateBoneModelSpace(this.bones.chest, axisX, 0.65);
      this.rotateBoneModelSpace(this.bones.leftArm, axisX, -1.1 + stroke * 0.7);
      this.rotateBoneModelSpace(this.bones.rightArm, axisX, -1.1 - stroke * 0.7);
      this.rotateBoneModelSpace(this.bones.leftUpLeg, axisX, stroke * 0.35);
      this.rotateBoneModelSpace(this.bones.rightUpLeg, axisX, -stroke * 0.35);
      return;
    }

    if (isAirborne) {
      this.rotateBoneModelSpace(this.bones.leftUpLeg, axisX, -0.45);
      this.rotateBoneModelSpace(this.bones.leftLeg, axisX, 0.72);
      this.rotateBoneModelSpace(this.bones.rightUpLeg, axisX, 0.22);
      this.rotateBoneModelSpace(this.bones.leftArm, axisX, -0.35);
      this.rotateBoneModelSpace(this.bones.rightArm, axisX, -0.35);
      return;
    }

    if (moveSpeed > 0.35) {
      const freq = isSprinting ? 11.5 : 8.2;
      const amp = Math.min(0.68, moveSpeed * 0.085);
      const stride = Math.sin(t * freq);
      const counter = Math.sin(t * freq + Math.PI);

      this.rotateBoneModelSpace(this.bones.leftUpLeg, axisX, stride * amp);
      this.rotateBoneModelSpace(this.bones.leftLeg, axisX, Math.max(0, -stride) * amp * 1.15);
      this.rotateBoneModelSpace(this.bones.rightUpLeg, axisX, counter * amp);
      this.rotateBoneModelSpace(this.bones.rightLeg, axisX, Math.max(0, -counter) * amp * 1.15);

      this.rotateBoneModelSpace(this.bones.leftArm, axisX, counter * amp * 0.72);
      this.rotateBoneModelSpace(this.bones.rightArm, axisX, stride * amp * 0.72);
      this.rotateBoneModelSpace(this.bones.spine, axisX, isSprinting ? 0.14 : 0.06);
      this.rotateBoneModelSpace(this.bones.hips, axisY, stride * 0.06);
    } else if (state === 'IDLE_FIDGET') {
      const sway = Math.sin(t * 2.8);
      this.rotateBoneModelSpace(this.bones.chest, axisY, sway * 0.12);
      this.rotateBoneModelSpace(this.bones.head, axisZ, Math.cos(t * 2.1) * 0.08);
      this.rotateBoneModelSpace(this.bones.rightArm, axisX, -0.35 + sway * 0.14);
    } else {
      const breath = Math.sin(t * 2.2) * 0.025;
      this.rotateBoneModelSpace(this.bones.chest, axisX, breath);
      this.rotateBoneModelSpace(this.bones.leftArm, axisY, Math.sin(t * 1.1) * 0.03);
      this.rotateBoneModelSpace(this.bones.rightArm, axisY, -Math.sin(t * 1.1) * 0.03);
    }

    if (isCombatSwing) {
      this.rotateBoneModelSpace(this.bones.rightArm, axisX, -1.05);
      this.rotateBoneModelSpace(this.bones.rightForeArm, axisX, -0.55);
      this.rotateBoneModelSpace(this.bones.chest, axisY, 0.35);
    }
  }

  getSocketWorldPosition(boneName = 'rightHand', outVec = new THREE.Vector3()) {
    const bone = this.bones[boneName];
    if (bone) {
      bone.updateWorldMatrix(true, false);
      return bone.getWorldPosition(outVec);
    }
    this.container.getWorldPosition(outVec);
    outVec.y += 1.25;
    return outVec;
  }

  dispose() {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }
    this.actions.clear();
    this.currentAction = null;
    this.upperBodyActionType = null;
    this.upperBodyMaskTimer = 0;
    this.springBones = [];
    this.bindSnapshot.clear();
    this.bones = {};
    this.allBones = [];
    if (this.visualRoot) {
      this.container.remove(this.visualRoot);
      ResourceDisposer.disposeObject3D(this.visualRoot);
      this.visualRoot = null;
    }
  }
}

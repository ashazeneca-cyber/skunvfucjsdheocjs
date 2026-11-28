/**
 * RAPSONYX 2-Bone Analytical Foot IK Solver (Zero-GC, True Local-Space Pelvis Drop)
 * - Soften ratio 0.97 prevents straight-knee hyper-extension snapping
 * - Transforms desired pelvis world offset into hips.parent local space via worldToLocal
 * - Grounds each foot independently onto terrain/stairs/navmesh + stance foot-lock
 */

import * as THREE from 'three';

const _hipW = new THREE.Vector3();
const _kneeW = new THREE.Vector3();
const _footW = new THREE.Vector3();
const _targetFootW = new THREE.Vector3();
const _hipParentPosW = new THREE.Vector3();
const _hipDropTargetW = new THREE.Vector3();
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();
const _rotAxis = new THREE.Vector3();
const _groundNormal = new THREE.Vector3(0, 1, 0);
const _surfOut = { y: 0, normal: new THREE.Vector3(0, 1, 0), source: 'fallback', slopeDeg: 0, waterDepth: 0 };

export class FootIKSolver {
  constructor() {
    this.enabled = true;
    this.smoothedPelvisDrop = 0;
    this.leftOffsetY = 0;
    this.rightOffsetY = 0;
    this.boneLengthsMeasured = false;
    this.leftUpperLen = 0.42;
    this.leftLowerLen = 0.42;
    this.rightUpperLen = 0.42;
    this.rightLowerLen = 0.42;
    this.hipsRestLocalY = null;
  }

  _measureLegLengths(bones) {
    if (this.boneLengthsMeasured) return;
    if (bones.leftUpLeg && bones.leftLeg && bones.leftFoot) {
      bones.leftUpLeg.getWorldPosition(_vA);
      bones.leftLeg.getWorldPosition(_vB);
      bones.leftFoot.getWorldPosition(_vC);
      this.leftUpperLen = Math.max(0.22, _vA.distanceTo(_vB));
      this.leftLowerLen = Math.max(0.22, _vB.distanceTo(_vC));
    }
    if (bones.rightUpLeg && bones.rightLeg && bones.rightFoot) {
      bones.rightUpLeg.getWorldPosition(_vA);
      bones.rightLeg.getWorldPosition(_vB);
      bones.rightFoot.getWorldPosition(_vC);
      this.rightUpperLen = Math.max(0.22, _vA.distanceTo(_vB));
      this.rightLowerLen = Math.max(0.22, _vB.distanceTo(_vC));
    }
    if (bones.hips) {
      this.hipsRestLocalY = bones.hips.position.y;
    }
    this.boneLengthsMeasured = true;
  }

  solve(rigController, physics, heroPos, dt, isGrounded = true, moveSpeed = 0) {
    if (!this.enabled || !isGrounded || !rigController?.bones) return;
    const { hips, leftUpLeg, leftLeg, leftFoot, rightUpLeg, rightLeg, rightFoot } = rigController.bones;
    if (!leftUpLeg || !leftLeg || !leftFoot || !rightUpLeg || !rightLeg || !rightFoot) return;

    rigController.container.updateMatrixWorld(true);
    this._measureLegLengths(rigController.bones);

    leftFoot.getWorldPosition(_vA);
    rightFoot.getWorldPosition(_vB);

    physics.resolveGroundSurface(_vA.x, _vA.z, heroPos.y, 1.0, _surfOut);
    const groundLY = _surfOut.y;
    physics.resolveGroundSurface(_vB.x, _vB.z, heroPos.y, 1.0, _surfOut);
    const groundRY = _surfOut.y;

    const deltaL = THREE.MathUtils.clamp(groundLY - heroPos.y, -0.34, 0.34);
    const deltaR = THREE.MathUtils.clamp(groundRY - heroPos.y, -0.34, 0.34);
    const lerpRate = Math.min(1, dt * 16);
    this.leftOffsetY = THREE.MathUtils.lerp(this.leftOffsetY, deltaL, lerpRate);
    this.rightOffsetY = THREE.MathUtils.lerp(this.rightOffsetY, deltaR, lerpRate);

    // Lower pelvis to lowest foot so bent leg reaches comfortably without over-stretching
    const desiredPelvisDrop = Math.min(0, Math.min(this.leftOffsetY, this.rightOffsetY));
    this.smoothedPelvisDrop = THREE.MathUtils.lerp(this.smoothedPelvisDrop, desiredPelvisDrop, lerpRate);

    if (hips) {
      if (hips.parent) {
        hips.getWorldPosition(_hipParentPosW);
        const restOffset = this.hipsRestLocalY ?? hips.position.y;
        _hipDropTargetW.set(_hipParentPosW.x, _hipParentPosW.y + this.smoothedPelvisDrop, _hipParentPosW.z);
        hips.parent.worldToLocal(_hipDropTargetW);
        hips.position.y = Math.max(restOffset - 0.36, _hipDropTargetW.y);
      } else {
        hips.position.y += this.smoothedPelvisDrop;
      }
      hips.updateMatrixWorld(true);
    }

    // Stance lock factor: slightly firmer when standing still
    const ikWeight = moveSpeed > 3.5 ? 0.52 : 1.0;
    this._solve2BoneLeg(rigController, leftUpLeg, leftLeg, leftFoot, groundLY + 0.04, this.leftUpperLen, this.leftLowerLen, ikWeight);
    this._solve2BoneLeg(rigController, rightUpLeg, rightLeg, rightFoot, groundRY + 0.04, this.rightUpperLen, this.rightLowerLen, ikWeight);

    // Foot slope sole alignment
    physics.resolveGroundSurface(_vA.x, _vA.z, heroPos.y, 1.0, _surfOut);
    _groundNormal.copy(_surfOut.normal);
    if (_groundNormal.y > 0.72) {
      const pitchL = THREE.MathUtils.clamp(-_groundNormal.z * 0.45 * ikWeight, -0.28, 0.28);
      rigController.rotateBoneModelSpace(leftFoot, _rotAxis.set(1, 0, 0), pitchL);
    }
    physics.resolveGroundSurface(_vB.x, _vB.z, heroPos.y, 1.0, _surfOut);
    _groundNormal.copy(_surfOut.normal);
    if (_groundNormal.y > 0.72) {
      const pitchR = THREE.MathUtils.clamp(-_groundNormal.z * 0.45 * ikWeight, -0.28, 0.28);
      rigController.rotateBoneModelSpace(rightFoot, _rotAxis.set(1, 0, 0), pitchR);
    }
  }

  _solve2BoneLeg(rig, upperBone, lowerBone, footBone, targetGroundY, lenA, lenB, weight) {
    upperBone.getWorldPosition(_hipW);
    lowerBone.getWorldPosition(_kneeW);
    footBone.getWorldPosition(_footW);

    _targetFootW.set(_footW.x, THREE.MathUtils.lerp(_footW.y, targetGroundY, weight), _footW.z);
    // Soften ratio 0.97 prevents harsh full-extension knee lock
    const maxReach = (lenA + lenB) * 0.97;
    const minReach = Math.abs(lenA - lenB) + 0.06;
    const dist = THREE.MathUtils.clamp(_hipW.distanceTo(_targetFootW), minReach, maxReach);

    // Law of Cosines angles
    const cosKnee = THREE.MathUtils.clamp((lenA * lenA + lenB * lenB - dist * dist) / (2 * lenA * lenB), -0.99, 0.99);
    const kneeInterior = Math.acos(cosKnee);
    const desiredKneeBend = Math.max(0.06, Math.PI - kneeInterior);

    _vA.subVectors(_kneeW, _hipW).normalize();
    _vB.subVectors(_footW, _kneeW).normalize();
    const currentKneeDot = THREE.MathUtils.clamp(_vA.dot(_vB), -0.99, 0.99);
    const currentBend = Math.acos(currentKneeDot);
    const kneeDelta = THREE.MathUtils.clamp((desiredKneeBend - currentBend) * weight, -0.75, 0.75);

    _vC.subVectors(_targetFootW, _hipW).normalize();
    const hipAlignDot = THREE.MathUtils.clamp(_vA.dot(_vC), -0.99, 0.99);
    const hipAdjustAngle = Math.acos(hipAlignDot) * 0.5 * weight;

    _rotAxis.crossVectors(_vA, _vC);
    if (_rotAxis.lengthSq() > 1e-6) {
      _rotAxis.normalize();
      rig.rotateBoneModelSpace(upperBone, _rotAxis, hipAdjustAngle);
    }
    rig.rotateBoneModelSpace(lowerBone, _rotAxis.set(1, 0, 0), kneeDelta * 0.65);
  }
}

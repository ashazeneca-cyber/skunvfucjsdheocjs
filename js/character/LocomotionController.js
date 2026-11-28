/**
 * RAPSONYX Zero-GC Character Locomotion, 3-Zone Slope Physics, Water Swimming & Dual Camera
 * - <=35° full walkable, 36°–51° downhill slide + speed penalty, >=52° sheer cliff wall projection
 * - Water wading & buoyancy swimming above waterLevel
 * - Coyote time (120ms) & Jump input buffer (140ms) + Glider slow-descent
 * - Dual Camera: Action Orbit vs MOBA Tactical Overhead w/ scroll zoom & collision clipping guard
 * - Compatible with both main.js Fixed-Timestep stepPhysics/updateCamera & direct update loop
 */

import * as THREE from 'three';
import { PHYSICS_CONSTANTS } from '../config/constants.js';
import { GraphicsPresetManager } from '../core/GraphicsPresetManager.js';

const _camForward = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _wishDir = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _groundInfo = {
  y: 0,
  normal: new THREE.Vector3(0, 1, 0),
  source: 'fallback',
  slopeDeg: 0,
  waterDepth: 0
};
const _slopeTangent = new THREE.Vector3();

export class LocomotionController {
  constructor(rigOrCamera = null, footIKOrDom = null, facial = null, weaponSolver = null) {
    this.rigController = rigOrCamera && !rigOrCamera.isCamera ? rigOrCamera : null;
    this.footIK = footIKOrDom && typeof footIKOrDom.solve === 'function' ? footIKOrDom : null;
    this.facial = facial || null;
    this.weaponSolver = weaponSolver || null;
    this.camera = rigOrCamera && rigOrCamera.isCamera ? rigOrCamera : null;
    this.domElement = footIKOrDom && typeof footIKOrDom.addEventListener === 'function' ? footIKOrDom : null;

    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotationY = 0;

    this.isGrounded = true;
    this.isGliding = false;
    this.isSwimming = false;
    this.isSlidingSlope = false;
    this.slopeAngleDeg = 0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.combatSwingTimer = 0;
    this.isSprinting = false;
    this.dashCooldown = 0;
    this.dashTimer = 0;
    this.dashDir = new THREE.Vector3(0, 0, 1);

    this.keys = new Set();
    this.joystickVec = new THREE.Vector2(0, 0);
    this.baseMoveSpeed = 6.5;

    this.cameraMode = GraphicsPresetManager.settings.defaultCameraMode || 'action';
    this.orbitYaw = 0;
    this.orbitPitch = 0.28;
    this.cameraDistance = 6.2;

    if (this.domElement) {
      this._bindDomOrbit(this.domElement);
    }
  }

  get facingYaw() {
    return this.rotationY;
  }

  set facingYaw(val) {
    this.rotationY = val;
  }

  attachCanvas(canvas) {
    if (canvas && !this._domBound) {
      this._bindDomOrbit(canvas);
    }
  }

  _bindDomOrbit(dom) {
    this._domBound = true;
    this.domElement = dom;
    dom.addEventListener(
      'wheel',
      (e) => {
        if (e.target !== dom) return;
        this.cameraDistance = THREE.MathUtils.clamp(this.cameraDistance + e.deltaY * 0.006, 3.6, 16.5);
      },
      { passive: true }
    );
  }

  setMoveSpeed(speed) {
    this.baseMoveSpeed = Math.max(2.0, Number(speed) || 6.5);
  }

  setJoystickVector(nx, ny) {
    this.joystickVec.set(nx, ny);
  }

  triggerJump() {
    if (!this.isGrounded && !this.isSwimming && this.velocity.y < 1.0 && !this.isGliding && this.coyoteTimer <= 0) {
      this.isGliding = true;
      return;
    }
    this.jumpBufferTimer = PHYSICS_CONSTANTS.JUMP_BUFFER_S;
  }

  triggerJumpBuffer(exploreMobility = null) {
    this.triggerJump();
    if (exploreMobility && !this.isGrounded && this.isGliding) {
      exploreMobility.setGliderActive?.(true);
    }
  }

  triggerCombatSwing() {
    this.combatSwingTimer = 0.42;
    this.rigController?.triggerUpperBodyAction?.('ATTACK', 0.42);
  }

  triggerDash() {
    if (this.dashCooldown > 0) return false;
    this.dashTimer = 0.22;
    this.dashCooldown = 2.5;
    this.dashDir.set(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).normalize();
    return true;
  }

  toggleCameraMode() {
    this.cameraMode = this.cameraMode === 'action' ? 'tactical' : 'action';
    return this.cameraMode;
  }

  teleportTo(x, yOrZ, zOrPhysics = null) {
    if (zOrPhysics && typeof zOrPhysics.getHeightAt === 'function') {
      const z = yOrZ;
      const y = zOrPhysics.getHeightAt(x, z, 28);
      this.position.set(x, y, z);
    } else {
      const y = yOrZ || 0;
      const z = typeof zOrPhysics === 'number' ? zOrPhysics : 0;
      this.position.set(x, y, z);
    }
    this.velocity.set(0, 0, 0);
    this.isGrounded = true;
    this.isGliding = false;
    this.isSwimming = false;
  }

  stepPhysics(dt, { inputMove = null, isSprinting = false, baseMoveSpeed = 6.5, physics, skyIslands = null, exploreMobility = null } = {}) {
    const safeDt = Math.min(dt, PHYSICS_CONSTANTS.MAX_FRAME_DT);
    this.baseMoveSpeed = Math.max(2.0, Number(baseMoveSpeed) || 6.5);
    this.isSprinting = Boolean(isSprinting);

    if (this.coyoteTimer > 0) this.coyoteTimer -= safeDt;
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= safeDt;
    if (this.combatSwingTimer > 0) this.combatSwingTimer = Math.max(0, this.combatSwingTimer - safeDt);
    if (this.dashCooldown > 0) this.dashCooldown = Math.max(0, this.dashCooldown - safeDt);

    const inX = inputMove ? (inputMove.x || 0) : this.joystickVec.x;
    const inZ = inputMove ? -(inputMove.z || inputMove.y || 0) : -this.joystickVec.y;

    if (this.cameraMode === 'tactical' || !this.camera) {
      _camForward.set(Math.sin(this.orbitYaw), 0, -Math.cos(this.orbitYaw));
      if (this.cameraMode === 'tactical') _camForward.set(0, 0, -1);
    } else {
      this.camera.getWorldDirection(_camForward);
      _camForward.y = 0;
      if (_camForward.lengthSq() < 1e-6) _camForward.set(0, 0, -1);
    }
    _camForward.normalize();
    _camRight.set(-_camForward.z, 0, _camForward.x);

    _wishDir.set(0, 0, 0).addScaledVector(_camRight, inX).addScaledVector(_camForward, inZ);
    const hasMoveInput = _wishDir.lengthSq() > 0.001;
    if (hasMoveInput) _wishDir.normalize();

    if (physics?.resolveGroundSurface) {
      physics.resolveGroundSurface(this.position.x, this.position.z, this.position.y, 1.5, _groundInfo);
    } else {
      _groundInfo.y = 0;
      _groundInfo.normal.set(0, 1, 0);
      _groundInfo.slopeDeg = 0;
      _groundInfo.waterDepth = 0;
    }
    this.slopeAngleDeg = _groundInfo.slopeDeg;

    // Sky islands thermal check
    if (skyIslands?.getSurfaceAt) {
      const skyY = skyIslands.getSurfaceAt(this.position.x, this.position.z, this.position.y);
      if (Number.isFinite(skyY) && skyY > _groundInfo.y && skyY <= this.position.y + 1.6) {
        _groundInfo.y = skyY;
        _groundInfo.normal.set(0, 1, 0);
        _groundInfo.slopeDeg = 0;
        _groundInfo.waterDepth = 0;
      }
    }

    // 3-Zone Slope Physics + Wading/Swimming
    this.isSlidingSlope = false;
    const slopeWalkMax = PHYSICS_CONSTANTS.MAX_WALK_SLOPE_DEG ?? 35.0;
    const cliffWallDeg = PHYSICS_CONSTANTS.CLIFF_WALL_DEG ?? 52.0;
    let speedMult = this.isSprinting ? 1.38 : 1.0;
    if (exploreMobility?.mountMounted) speedMult *= 1.55;

    if (_groundInfo.waterDepth > 0.35 && _groundInfo.waterDepth <= 1.15) {
      speedMult *= 0.80;
    } else if (_groundInfo.waterDepth > 1.15) {
      this.isSwimming = true;
      speedMult *= 0.72;
    } else {
      this.isSwimming = false;
    }

    if (this.isGrounded && !this.isSwimming && _groundInfo.slopeDeg > slopeWalkMax) {
      _slopeTangent.set(_groundInfo.normal.x, 0, _groundInfo.normal.z);
      if (_slopeTangent.lengthSq() > 1e-5) {
        _slopeTangent.normalize();
        const uphillDot = _wishDir.dot(_slopeTangent);
        if (_groundInfo.slopeDeg >= cliffWallDeg) {
          if (uphillDot < 0) _wishDir.addScaledVector(_slopeTangent, -uphillDot).normalize();
          this.isSlidingSlope = true;
        } else {
          if (uphillDot < 0) speedMult *= 0.45;
          this.position.addScaledVector(_slopeTangent, safeDt * 3.8);
          this.isSlidingSlope = true;
        }
      }
    }

    if (this.dashTimer > 0) {
      this.dashTimer -= safeDt;
      this.velocity.x = this.dashDir.x * (this.baseMoveSpeed * 3.1);
      this.velocity.z = this.dashDir.z * (this.baseMoveSpeed * 3.1);
    } else if (hasMoveInput) {
      const targetSpd = this.baseMoveSpeed * speedMult;
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, _wishDir.x * targetSpd, safeDt * 14);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, _wishDir.z * targetSpd, safeDt * 14);
      const targetRot = Math.atan2(_wishDir.x, _wishDir.z);
      let diff = targetRot - this.rotationY;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.rotationY += diff * Math.min(1, safeDt * 14);
    } else {
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, safeDt * 16);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, safeDt * 16);
    }

    if (this.jumpBufferTimer > 0 && (this.isGrounded || this.coyoteTimer > 0 || this.isSwimming)) {
      this.velocity.y = PHYSICS_CONSTANTS.JUMP_VELOCITY;
      this.isGrounded = false;
      this.isSwimming = false;
      this.isGliding = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
    }

    if (this.isSwimming) {
      const swimSurfaceY = (physics?.waterLevelY ?? 0) - 0.95;
      this.velocity.y = (swimSurfaceY - this.position.y) * 5.0;
    } else {
      const grav = this.isGliding ? PHYSICS_CONSTANTS.GLIDER_GRAVITY : PHYSICS_CONSTANTS.GRAVITY;
      const minFall = this.isGliding ? PHYSICS_CONSTANTS.GLIDER_MAX_FALL : PHYSICS_CONSTANTS.MAX_FALL_SPEED;
      this.velocity.y = Math.max(minFall, this.velocity.y + grav * safeDt);
    }

    this.position.x += this.velocity.x * safeDt;
    this.position.z += this.velocity.z * safeDt;
    this.position.y += this.velocity.y * safeDt;

    physics?.resolveMovement?.(this.position, 0.42, this.position.y);
    if (physics?.resolveGroundSurface) {
      physics.resolveGroundSurface(this.position.x, this.position.z, this.position.y, 1.5, _groundInfo);
    }
    const groundY = _groundInfo.y;

    if (!this.isSwimming && this.position.y <= groundY + 0.04) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
      this.isGliding = false;
      this.coyoteTimer = PHYSICS_CONSTANTS.COYOTE_TIME_S;
    } else if (!this.isSwimming && this.position.y > groundY + 0.16) {
      this.isGrounded = false;
    }

    if (exploreMobility?.setGliderActive) {
      exploreMobility.setGliderActive(this.isGliding);
    }

    const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (this.rigController) {
      this.rigController.container.position.copy(this.position);
      this.rigController.container.rotation.y = this.rotationY;
      this.rigController.updateAnimation(safeDt, horizSpeed, !this.isGrounded, this.isSprinting, this.combatSwingTimer > 0, {
        isGliding: this.isGliding,
        isSwimming: this.isSwimming,
        velY: this.velocity.y
      });
      if (this.footIK && GraphicsPresetManager.activeConfig.footIK && !this.isSwimming && physics) {
        this.footIK.solve(this.rigController, physics, this.position, safeDt, this.isGrounded, horizSpeed);
      }
    }
    this.weaponSolver?.update?.(safeDt);
    return horizSpeed;
  }

  updateCamera(camera, dt, lookDelta = null, physics = null) {
    if (!camera) return;
    this.camera = camera;
    const safeDt = Math.min(dt, PHYSICS_CONSTANTS.MAX_FRAME_DT);

    if (lookDelta) {
      const sens = 0.0048 * (GraphicsPresetManager.settings.cameraSensitivity || 1.0);
      this.orbitYaw -= (lookDelta.x || 0) * sens;
      this.orbitPitch = THREE.MathUtils.clamp(this.orbitPitch + (lookDelta.y || 0) * sens, -0.25, 1.15);
    }

    if (this.cameraMode === 'tactical') {
      _camTarget.set(this.position.x, this.position.y + 1.2, this.position.z);
      const tacticalDist = THREE.MathUtils.clamp(this.cameraDistance * 1.45, 7.5, 19.0);
      _desiredCamPos.set(
        this.position.x,
        this.position.y + tacticalDist * 0.85,
        this.position.z + tacticalDist * 0.72
      );
    } else {
      _camTarget.set(this.position.x, this.position.y + 1.38, this.position.z);
      const cosP = Math.cos(this.orbitPitch);
      _desiredCamPos.set(
        _camTarget.x + Math.sin(this.orbitYaw) * cosP * this.cameraDistance,
        _camTarget.y + Math.sin(this.orbitPitch) * this.cameraDistance + 0.45,
        _camTarget.z + Math.cos(this.orbitYaw) * cosP * this.cameraDistance
      );
    }

    if (physics?.resolveGroundSurface) {
      physics.resolveGroundSurface(_desiredCamPos.x, _desiredCamPos.z, _desiredCamPos.y, 4.0, _groundInfo);
      if (_desiredCamPos.y < _groundInfo.y + 0.65) {
        _desiredCamPos.y = _groundInfo.y + 0.65;
      }
    }

    camera.position.lerp(_desiredCamPos, Math.min(1, safeDt * 12));
    camera.lookAt(_camTarget);
  }
}

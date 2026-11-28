/**
 * RAPSONYX Unified Input Manager
 * - PC Keyboard + Defensive Pointer Lock API (Promise & non-Promise + NotSupportedError fallback)
 * - Gamepad API with Scaled Radial Deadzone (0.15) & dual-rumble vibration
 * - Mobile Multi-Touch pointerId tracking for simultaneous Move + Camera + Skill Aim
 */

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.moveVector = { x: 0, z: 0 };
    this.touchMove = { x: 0, z: 0 };
    this.cameraDelta = { x: 0, y: 0 };
    this.zoomDelta = 0;

    this.pointerLocked = false;
    this.pointerLockSupported = Boolean(canvas && canvas.requestPointerLock);
    this.cameraDragPointerId = null;
    this.cameraLastPos = { x: 0, y: 0 };
    this.activeGamepadIndex = null;

    this._actionCallbacks = new Map();
    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      const code = e.code;
      this.keys.add(code);
      if (code === 'Space') this._triggerAction('jump_or_attack', e);
      if (code === 'KeyJ') this._triggerAction('basic_attack', e);
      if (code === 'KeyQ') this._triggerAction('skill_1', e);
      if (code === 'KeyW' && e.altKey) this._triggerAction('skill_2', e);
      if (code === 'KeyE') this._triggerAction('skill_2', e);
      if (code === 'KeyR') this._triggerAction('ultimate', e);
      if (code === 'KeyF') this._triggerAction('interact', e);
      if (code === 'KeyB') this._triggerAction('recall', e);
      if (code === 'KeyG') this._triggerAction('glider', e);
      if (code === 'KeyM') this._triggerAction('mount', e);
      if (code === 'Tab') {
        e.preventDefault();
        this._triggerAction('scoreboard_toggle', e);
      }
      if (code === 'KeyP') this._triggerAction('shop_toggle', e);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
    });

    document.addEventListener('pointerlockerror', () => {
      this.pointerLocked = false;
    });

    if (this.canvas) {
      this.canvas.addEventListener('pointerdown', (e) => {
        if (this.pointerLocked) {
          if (e.button === 0) this._triggerAction('basic_attack', e);
          return;
        }
        if (this.cameraDragPointerId === null) {
          this.cameraDragPointerId = e.pointerId;
          this.cameraLastPos.x = e.clientX;
          this.cameraLastPos.y = e.clientY;
        }
      });

      window.addEventListener('pointermove', (e) => {
        if (this.pointerLocked) {
          this.cameraDelta.x += e.movementX || 0;
          this.cameraDelta.y += e.movementY || 0;
          return;
        }
        if (e.pointerId === this.cameraDragPointerId) {
          this.cameraDelta.x += e.clientX - this.cameraLastPos.x;
          this.cameraDelta.y += e.clientY - this.cameraLastPos.y;
          this.cameraLastPos.x = e.clientX;
          this.cameraLastPos.y = e.clientY;
        }
      });

      const releasePointer = (e) => {
        if (e.pointerId === this.cameraDragPointerId) {
          this.cameraDragPointerId = null;
        }
      };
      window.addEventListener('pointerup', releasePointer);
      window.addEventListener('pointercancel', releasePointer);

      this.canvas.addEventListener(
        'wheel',
        (e) => {
          this.zoomDelta += e.deltaY * 0.01;
        },
        { passive: true }
      );
    }

    window.addEventListener('gamepadconnected', (e) => {
      this.activeGamepadIndex = e.gamepad.index;
    });
    window.addEventListener('gamepaddisconnected', (e) => {
      if (this.activeGamepadIndex === e.gamepad.index) {
        this.activeGamepadIndex = null;
      }
    });
  }

  async requestSafePointerLock() {
    if (!this.canvas || !this.canvas.requestPointerLock) return false;
    try {
      const maybePromise = this.canvas.requestPointerLock({ unadjustedMovement: true });
      if (maybePromise && typeof maybePromise.then === 'function') {
        await maybePromise;
      }
      return true;
    } catch (err) {
      if (err && err.name === 'NotSupportedError') {
        try {
          const fallback = this.canvas.requestPointerLock();
          if (fallback && typeof fallback.then === 'function') await fallback;
          return true;
        } catch (_) {}
      }
      return false;
    }
  }

  onAction(actionName, callback) {
    if (!this._actionCallbacks.has(actionName)) {
      this._actionCallbacks.set(actionName, new Set());
    }
    this._actionCallbacks.get(actionName).add(callback);
    return () => this._actionCallbacks.get(actionName)?.delete(callback);
  }

  _triggerAction(actionName, payload = null) {
    const set = this._actionCallbacks.get(actionName);
    if (!set) return;
    for (const cb of set) {
      try {
        cb(payload);
      } catch (_) {}
    }
  }

  setTouchMove(x, z) {
    this.touchMove.x = Math.max(-1, Math.min(1, x));
    this.touchMove.z = Math.max(-1, Math.min(1, z));
  }

  _applyScaledRadialDeadzone(x, y, deadzone = 0.15) {
    const mag = Math.hypot(x, y);
    if (mag < deadzone) return { x: 0, y: 0 };
    const norm = Math.min(1, (mag - deadzone) / (1 - deadzone));
    return { x: (x / mag) * norm, y: (y / mag) * norm };
  }

  pollGamepad(dt) {
    if (!navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    if (!pads) return null;
    let pad = null;
    for (const p of pads) {
      if (p && p.connected && p.mapping === 'standard') {
        pad = p;
        break;
      }
    }
    if (!pad) return null;

    const left = this._applyScaledRadialDeadzone(pad.axes[0] || 0, pad.axes[1] || 0, 0.15);
    const right = this._applyScaledRadialDeadzone(pad.axes[2] || 0, pad.axes[3] || 0, 0.15);
    this.cameraDelta.x += right.x * 360 * dt;
    this.cameraDelta.y += right.y * 240 * dt;

    if (pad.buttons[0]?.pressed) this._triggerAction('jump_or_attack', { pad });
    if (pad.buttons[2]?.pressed) this._triggerAction('skill_1', { pad });
    if (pad.buttons[3]?.pressed) this._triggerAction('skill_2', { pad });
    if (pad.buttons[1]?.pressed) this._triggerAction('ultimate', { pad });
    if (pad.buttons[5]?.pressed) this._triggerAction('basic_attack', { pad });
    return { pad, left, right };
  }

  triggerRumble(strong = 0.45, weak = 0.3, duration = 110) {
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    for (const pad of pads) {
      if (pad && pad.vibrationActuator && typeof pad.vibrationActuator.playEffect === 'function') {
        try {
          pad.vibrationActuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration,
            weakMagnitude: weak,
            strongMagnitude: strong
          });
        } catch (_) {}
      }
    }
  }

  sampleMovement(dt = 0.016) {
    let kx = 0;
    let kz = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) kx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) kx += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) kz -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) kz += 1;

    const gp = this.pollGamepad(dt);
    let gx = 0;
    let gz = 0;
    if (gp) {
      gx = gp.left.x;
      gz = gp.left.y;
    }

    let vx = kx + this.touchMove.x + gx;
    let vz = kz + this.touchMove.z + gz;
    const len = Math.hypot(vx, vz);
    if (len > 1) {
      vx /= len;
      vz /= len;
    }
    this.moveVector.x = vx;
    this.moveVector.z = vz;
    return this.moveVector;
  }

  consumeCameraDelta() {
    const out = { x: this.cameraDelta.x, y: this.cameraDelta.y, zoom: this.zoomDelta };
    this.cameraDelta.x = 0;
    this.cameraDelta.y = 0;
    this.zoomDelta = 0;
    return out;
  }

  isSprinting() {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
  }
}

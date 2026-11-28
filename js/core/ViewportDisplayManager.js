/**
 * RAPSONYX Viewport Display, Landscape Orientation & Auto-Fullscreen Manager
 * - 100% Landscape design: enforces auto-fullscreen + landscape orientation lock on mobile
 * - Real-time Portrait Guard pausing 3D rendering while portrait overlay is active
 * - 4-class responsive device classification & aspect-compensated Horizontal FOV
 */

export async function enterMobileLandscapeFullscreen() {
  const el = document.documentElement;
  try {
    if (!document.fullscreenElement && el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: 'hide' });
    } else if (!document.webkitFullscreenElement && el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
  } catch (_) {
    // Browser may restrict fullscreen outside user gesture
  }

  try {
    if (screen.orientation && typeof screen.orientation.lock === 'function') {
      await screen.orientation.lock('landscape');
    }
  } catch (_) {
    // Fallback for iOS Safari / desktop browsers
  }
}

export async function toggleFullscreenMode() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return false;
    }
    if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
      return false;
    }
    await enterMobileLandscapeFullscreen();
    return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  } catch (_) {
    return false;
  }
}

class ViewportDisplayManagerService {
  constructor() {
    this.deviceClass = 'laptop-standard';
    this.isPortrait = false;
    this.isTouchDevice = false;
    this.renderPaused = false;
    this.width = window.innerWidth || 1280;
    this.height = window.innerHeight || 720;
    this.aspect = this.width / Math.max(1, this.height);
    this._listeners = new Set();
    this._resizeObserver = null;
    this._portraitMedia = null;
    this._firstTouchHooked = false;
  }

  init({ onStateChange = null } = {}) {
    if (onStateChange) this._listeners.add(onStateChange);

    this.isTouchDevice =
      'ontouchstart' in window ||
      (navigator.maxTouchPoints || 0) > 0 ||
      window.matchMedia('(pointer: coarse)').matches;

    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => this.evaluateViewport());
      this._resizeObserver.observe(document.documentElement);
    }

    this._portraitMedia = window.matchMedia('(orientation: portrait)');
    if (this._portraitMedia.addEventListener) {
      this._portraitMedia.addEventListener('change', () => this.evaluateViewport());
    }
    window.addEventListener('resize', () => this.evaluateViewport(), { passive: true });
    window.addEventListener('orientationchange', () => this.evaluateViewport(), { passive: true });

    // Auto-fullscreen & landscape lock on first mobile touch gesture
    if (this.isTouchDevice && !this._firstTouchHooked) {
      this._firstTouchHooked = true;
      const onFirstGesture = () => {
        enterMobileLandscapeFullscreen();
      };
      window.addEventListener('pointerdown', onFirstGesture, { once: true, passive: true });
    }

    this.evaluateViewport();
    return this;
  }

  evaluateViewport() {
    this.width = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1280);
    this.height = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 720);
    this.aspect = this.width / this.height;

    const mqPortrait = this._portraitMedia ? this._portraitMedia.matches : false;
    this.isPortrait = mqPortrait || this.height > this.width;

    // Classify active viewport into 4 adaptive layout classes
    if (this.isTouchDevice && (this.height <= 540 || this.width <= 960)) {
      this.deviceClass = 'mobile-landscape';
    } else if (this.isTouchDevice && this.width <= 1366) {
      this.deviceClass = 'tablet-landscape';
    } else if (this.width >= 2100 || this.aspect >= 2.05) {
      this.deviceClass = 'desktop-wide-ultrawide';
    } else {
      this.deviceClass = 'laptop-standard';
    }

    const root = document.documentElement;
    root.dataset.deviceClass = this.deviceClass;
    root.dataset.orientation = this.isPortrait ? 'portrait' : 'landscape';
    root.dataset.touch = this.isTouchDevice ? 'true' : 'false';

    // Pause 3D rendering automatically when held in Portrait
    this.renderPaused = this.isPortrait;

    const guard = document.getElementById('portrait-guard-overlay');
    if (guard) {
      guard.classList.toggle('active', this.isPortrait);
      guard.setAttribute('aria-hidden', this.isPortrait ? 'false' : 'true');
    }

    const state = this.getState();
    for (const cb of this._listeners) {
      try {
        cb(state);
      } catch (_) {}
    }
  }

  /**
   * Computes vertical FOV adjusted so horizontal framing stays consistent across
   * 4:3 tablets, 16:9 laptops, and 20:9 phones / 21:9 ultrawide monitors.
   */
  getAdaptiveFov(baseVerticalFov = 54) {
    const refAspect = 16 / 9;
    const clampedAspect = Math.max(1.25, Math.min(2.4, this.aspect));
    if (clampedAspect < refAspect) {
      // Narrower screens (e.g. 4:3 / 16:10) need slightly wider vertical FOV to keep horizontal view
      const rad = (baseVerticalFov * Math.PI) / 180;
      const hFov = 2 * Math.atan(Math.tan(rad / 2) * refAspect);
      const newVFov = 2 * Math.atan(Math.tan(hFov / 2) / clampedAspect);
      return Math.min(68, (newVFov * 180) / Math.PI);
    }
    if (clampedAspect > 2.0) {
      return Math.max(46, baseVerticalFov - 3);
    }
    return baseVerticalFov;
  }

  subscribe(cb) {
    this._listeners.add(cb);
    return () => this._listeners.delete(cb);
  }

  getState() {
    return {
      width: this.width,
      height: this.height,
      aspect: this.aspect,
      isPortrait: this.isPortrait,
      isTouchDevice: this.isTouchDevice,
      deviceClass: this.deviceClass,
      renderPaused: this.renderPaused
    };
  }
}

export const ViewportDisplayManager = new ViewportDisplayManagerService();

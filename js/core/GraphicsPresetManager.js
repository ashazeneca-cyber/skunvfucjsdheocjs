/**
 * RAPSONYX Adaptive Graphics Preset Manager & Performance Watchdog
 * - 4-signal device profiling (GPU info, RAM/platform guard, DPR/viewport, <400ms 30-frame benchmark)
 * - 4 Tiers: LOW (Rendah), MEDIUM (Sedang), HIGH (Tinggi), ULTRA (Ultra) + CUSTOM
 * - Persists under localStorage key "rapsonyx_settings"
 * - Adaptive Watchdog: if avgFrameTime > 22ms (<45 FPS) for 4s, gracefully scales down DPR -> Bloom -> Foliage
 */

import * as THREE from 'three';
import { SETTINGS_STORAGE_KEY } from '../config/constants.js';

export const GRAPHICS_PRESETS = Object.freeze({
  LOW: {
    id: 'LOW',
    label: 'RENDAH',
    targetFps: 60,
    renderScale: 0.85,
    minScale: 0.70,
    shadows: 'blob',
    shadowMapSize: 0,
    shadowRadius: 0,
    bloom: false,
    outline: false,
    waterQuality: 'low',
    foliageDensity: 0.22,
    grassCount: 1000,
    flowerCount: 300,
    particleDensity: 0.30,
    maxTextureSize: 1024,
    footIK: false,
    renderDistanceTier: 'near',
    cameraFar: 750,
    sectorRing: 1,
    toneMapping: 'neutral',
    ibLMode: 'pmrem',
    useWebGPU: false
  },
  MEDIUM: {
    id: 'MEDIUM',
    label: 'SEDANG',
    targetFps: 60,
    renderScale: 1.0,
    minScale: 0.75,
    shadows: 'medium',
    shadowMapSize: 1024,
    shadowRadius: 32,
    bloom: false,
    outline: true,
    waterQuality: 'medium',
    foliageDensity: 0.50,
    grassCount: 4000,
    flowerCount: 1200,
    particleDensity: 0.60,
    maxTextureSize: 1024,
    footIK: true,
    renderDistanceTier: 'medium',
    cameraFar: 1600,
    sectorRing: 1,
    toneMapping: 'neutral',
    ibLMode: 'pmrem',
    useWebGPU: false
  },
  HIGH: {
    id: 'HIGH',
    label: 'TINGGI',
    targetFps: 60,
    renderScale: 1.25,
    minScale: 0.80,
    shadows: 'high',
    shadowMapSize: 2048,
    shadowRadius: 48,
    bloom: true,
    outline: true,
    waterQuality: 'high',
    foliageDensity: 0.85,
    grassCount: 14000,
    flowerCount: 4000,
    particleDensity: 0.85,
    maxTextureSize: 2048,
    footIK: true,
    renderDistanceTier: 'far',
    cameraFar: 3600,
    sectorRing: 2,
    toneMapping: 'neutral',
    ibLMode: 'hdr512',
    useWebGPU: false
  },
  ULTRA: {
    id: 'ULTRA',
    label: 'ULTRA',
    targetFps: 120,
    renderScale: 1.50,
    minScale: 0.90,
    shadows: 'high',
    shadowMapSize: 2048,
    shadowRadius: 64,
    bloom: true,
    outline: true,
    waterQuality: 'ultra',
    foliageDensity: 1.0,
    grassCount: 36000,
    flowerCount: 9000,
    particleDensity: 1.0,
    maxTextureSize: 4096,
    footIK: true,
    renderDistanceTier: 'ultra',
    cameraFar: 7500,
    sectorRing: 2,
    toneMapping: 'neutral',
    ibLMode: 'hdr1k',
    useWebGPU: true
  }
});

const DEFAULT_SETTINGS = Object.freeze({
  preset: 'MEDIUM',
  recommendedPreset: 'MEDIUM',
  detectedDeviceLabel: 'Perangkat Standar',
  fpsLimit: 60,
  renderScaleMode: 'auto',
  renderScaleValue: 1.0,
  renderDistanceTier: 'medium',
  shadowQuality: 'medium',
  bloom: false,
  outline: true,
  waterReflections: true,
  foliageDensity: 'medium',
  footIK: true,
  toneMapping: 'neutral',
  batterySaver: false,
  showTelemetry: true,
  atmospherePreset: 'rapsonyx_day',
  // Display & Controls
  cameraSensitivity: 1.0,
  analogType: 'floating',
  smartAimAssist: true,
  defaultCameraMode: 'action',
  targetPriority: 'lowest_hp',
  hudScale: 1.0,
  hudOpacity: 0.95,
  hudLayoutPreset: 'default',
  // Audio (ZERO voice-over sliders)
  audioMuted: false,
  masterVolume: 0.85,
  bgmVolume: 0.65,
  sfxVolume: 0.9,
  ambienceVolume: 0.7
});

class GraphicsPresetManagerService {
  constructor() {
    this.settings = this.loadSettings();
    this.deviceProfile = null;
    this.activeConfig = { ...GRAPHICS_PRESETS.MEDIUM };
    this.currentScaleFactor = 1.0;
    this.renderer = null;
    this._listeners = new Set();

    // Watchdog & Telemetry state
    this.frameTimes = [];
    this.watchdogWindowStart = 0;
    this.highFrameTimeWindows = 0;
    this.fps = 60;
    this.fps1PercentLow = 60;
    this.avgFrameMs = 16.6;
    this.pingMs = 0;
    this.currentSector = [5, 5];
    this.isTabHidden = false;
    this.lastFrameTime = performance.now();

    document.addEventListener('visibilitychange', () => {
      this.isTabHidden = document.hidden;
    });
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Strip any legacy invalid audio keys if present
        delete parsed.voiceVolume;
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (_) {}
    return { ...DEFAULT_SETTINGS };
  }

  saveSettings() {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (_) {}
    this.applyActiveConfig();
    this._emit();
  }

  async autoDetectDeviceProfile() {
    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua) || (navigator.maxTouchPoints || 0) > 0;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const memGB = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : null;

    // 1. Probe WebGL renderer string
    let gpuVendor = 'Unknown';
    let gpuRenderer = 'WebGL2 GPU';
    let gpuScore = 2;
    try {
      const probeCanvas = document.createElement('canvas');
      probeCanvas.width = 128;
      probeCanvas.height = 128;
      const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (gl) {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        if (dbg) {
          gpuVendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || gpuVendor;
          gpuRenderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || gpuRenderer;
        }
        const rLow = gpuRenderer.toLowerCase();
        if (/swiftshader|llvmpipe|software|adreno.*(50|51|53|610|612)|mali-g52|mali-g57|mali-t/i.test(rLow)) {
          gpuScore = 1;
        } else if (/rtx|gtx|radeon rx|apple m[1-9]|adreno.*(730|740|750|830)|immortalis/i.test(rLow)) {
          gpuScore = isMobile ? 3 : 4;
        } else if (/intel.*(uhd|hd graphics)|vega|adreno.*(64|65|66|68|71|72)|mali-g7|apple gpu/i.test(rLow)) {
          gpuScore = 2;
        }
      }
    } catch (_) {}

    // 2. Micro-Benchmark (<400ms, 30 lightweight offscreen frames)
    const benchMs = await this._runMicroBenchmark();
    if (benchMs > 260) gpuScore = Math.min(gpuScore, 1);
    else if (benchMs < 85 && !isMobile && gpuScore >= 3) gpuScore = 4;

    // 3. Apply RAM & Platform Guard
    let recommended = 'MEDIUM';
    let label = 'Laptop / Desktop Standar';
    if (isIOS) {
      recommended = 'MEDIUM';
      label = 'iOS / iPadOS (RAM Guard Aktif)';
    } else if (isMobile) {
      if ((memGB !== null && memGB <= 4) || gpuScore <= 1) {
        recommended = 'LOW';
        label = 'HP Entry / Hemat Daya';
      } else if (gpuScore >= 3 && (memGB === null || memGB >= 8)) {
        recommended = 'HIGH';
        label = 'HP Flagship';
      } else {
        recommended = 'MEDIUM';
        label = 'HP Menengah';
      }
    } else {
      if (gpuScore <= 1) {
        recommended = 'LOW';
        label = 'PC / Laptop GPU Ringan';
      } else if (gpuScore === 2) {
        recommended = 'MEDIUM';
        label = 'Laptop iGPU';
      } else if (gpuScore === 3) {
        recommended = 'HIGH';
        label = 'PC / Laptop Dedicated GPU';
      } else {
        recommended = 'ULTRA';
        label = 'PC High-End Dedicated GPU';
      }
    }

    const hasSavedBefore = Boolean(localStorage.getItem(SETTINGS_STORAGE_KEY));
    this.deviceProfile = {
      isIOS,
      isMobile,
      dpr,
      memGB,
      gpuVendor,
      gpuRenderer,
      benchMs: Math.round(benchMs),
      recommendedPreset: recommended,
      label
    };

    this.settings.recommendedPreset = recommended;
    this.settings.detectedDeviceLabel = label;

    if (!hasSavedBefore) {
      this.applyPreset(recommended, true);
    } else {
      this.applyActiveConfig();
    }
    return this.deviceProfile;
  }

  async _runMicroBenchmark() {
    const start = performance.now();
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return 150;
      for (let i = 0; i < 30; i++) {
        gl.clearColor((i % 10) * 0.1, 0.2, 0.4, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (performance.now() - start > 360) break;
      }
      gl.finish();
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    } catch (_) {}
    return performance.now() - start;
  }

  applyPreset(presetId, save = true) {
    const p = GRAPHICS_PRESETS[presetId] || GRAPHICS_PRESETS.MEDIUM;
    this.settings.preset = p.id;
    this.settings.fpsLimit = p.targetFps;
    this.settings.renderScaleMode = 'auto';
    this.settings.renderScaleValue = p.renderScale;
    this.settings.renderDistanceTier = p.renderDistanceTier;
    this.settings.shadowQuality = p.shadows;
    this.settings.bloom = p.bloom;
    this.settings.outline = p.outline;
    this.settings.waterReflections = p.waterQuality !== 'low';
    this.settings.foliageDensity = p.id === 'LOW' ? 'low' : p.id === 'MEDIUM' ? 'medium' : 'high';
    this.settings.footIK = p.footIK;
    this.settings.toneMapping = p.toneMapping;
    this.currentScaleFactor = p.renderScale;
    if (save) this.saveSettings();
    else this.applyActiveConfig();
  }

  updateSetting(key, value) {
    if (key === 'voiceVolume') return;
    this.settings[key] = value;
    if (
      [
        'fpsLimit',
        'renderScaleMode',
        'renderScaleValue',
        'renderDistanceTier',
        'shadowQuality',
        'bloom',
        'outline',
        'waterReflections',
        'foliageDensity',
        'footIK',
        'toneMapping',
        'batterySaver'
      ].includes(key)
    ) {
      this.settings.preset = 'CUSTOM';
    }
    this.saveSettings();
  }

  applyActiveConfig() {
    const base = GRAPHICS_PRESETS[this.settings.preset] || GRAPHICS_PRESETS[this.settings.recommendedPreset] || GRAPHICS_PRESETS.MEDIUM;
    const distMap = {
      near: { far: 750, ring: 1 },
      medium: { far: 1600, ring: 1 },
      far: { far: 3600, ring: 2 },
      ultra: { far: 7500, ring: 2 }
    };
    const dTier = distMap[this.settings.renderDistanceTier] || distMap.medium;
    const folMap = {
      low: { density: 0.22, grass: 1000, flower: 300, particles: 0.30 },
      medium: { density: 0.50, grass: 4000, flower: 1200, particles: 0.60 },
      high: { density: 0.90, grass: 18000, flower: 5000, particles: 0.90 }
    };
    const fol = folMap[this.settings.foliageDensity] || folMap.medium;
    const shadowMap = { blob: 0, low: 512, medium: 1024, high: 2048 };

    const nativeDpr = window.devicePixelRatio || 1;
    const targetScale =
      this.settings.renderScaleMode === 'auto'
        ? this.currentScaleFactor
        : Number(this.settings.renderScaleValue || 1.0);

    const cappedDpr = Math.max(0.6, Math.min(nativeDpr * targetScale, this.settings.batterySaver ? 1.0 : 2.0));

    this.activeConfig = {
      ...base,
      targetFps: this.settings.batterySaver ? Math.min(30, this.settings.fpsLimit) : this.settings.fpsLimit,
      renderScale: targetScale,
      effectiveDpr: cappedDpr,
      shadows: this.settings.shadowQuality,
      shadowMapSize: shadowMap[this.settings.shadowQuality] ?? 1024,
      bloom: this.settings.batterySaver ? false : Boolean(this.settings.bloom),
      outline: Boolean(this.settings.outline),
      waterQuality: this.settings.waterReflections ? base.waterQuality : 'low',
      foliageDensity: fol.density,
      grassCount: fol.grass,
      flowerCount: fol.flower,
      particleDensity: fol.particles,
      footIK: Boolean(this.settings.footIK),
      cameraFar: dTier.far,
      sectorRing: dTier.ring,
      toneMapping: this.settings.toneMapping || 'neutral'
    };

    if (this.renderer) {
      this.renderer.setPixelRatio(this.activeConfig.effectiveDpr);
      this.renderer.shadowMap.enabled = this.activeConfig.shadowMapSize > 0;
      this.renderer.toneMapping =
        this.activeConfig.toneMapping === 'cinematic' ? THREE.AgXToneMapping : THREE.NeutralToneMapping;
    }

    document.documentElement.style.setProperty('--hud-scale', String(this.settings.hudScale || 1.0));
    document.documentElement.style.setProperty('--hud-alpha', String(this.settings.hudOpacity || 0.95));
    this.syncGlassPerfMode();
  }

  syncGlassPerfMode() {
    if (typeof document === 'undefined' || !document.body) return;
    const isLow = this.activeConfig.id === 'LOW' || this.settings.preset === 'LOW' || Boolean(this.settings.batterySaver);
    document.body.classList.toggle('perf-lite-glass', isLow);
  }

  getFrameBudgetMs() {
    const fps = Math.max(24, Math.min(144, Number(this.activeConfig.targetFps || this.settings.fpsLimit || 60)));
    return 1000 / fps;
  }

  attachRenderer(renderer) {
    this.renderer = renderer;
    this.applyActiveConfig();
  }

  recordFrame(frameMs, nowMs = performance.now()) {
    this.frameTimes.push(frameMs);
    if (this.frameTimes.length > 120) this.frameTimes.shift();

    if (this.watchdogWindowStart === 0) this.watchdogWindowStart = nowMs;

    if (nowMs - this.watchdogWindowStart >= 2000 && this.frameTimes.length >= 24) {
      const sorted = [...this.frameTimes].sort((a, b) => a - b);
      const sum = sorted.reduce((acc, v) => acc + v, 0);
      this.avgFrameMs = sum / sorted.length;
      this.fps = Math.min(240, Math.round(1000 / Math.max(1, this.avgFrameMs)));
      const p99Ms = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99))];
      this.fps1PercentLow = Math.max(1, Math.round(1000 / Math.max(1, p99Ms)));

      // Adaptive Performance Watchdog: trigger if avgFrameTime > 22ms (<45 FPS) for 2 consecutive 2s windows (4s)
      if (this.settings.renderScaleMode === 'auto') {
        if (this.avgFrameMs > 22) {
          this.highFrameTimeWindows++;
          if (this.highFrameTimeWindows >= 2) {
            this._stepDownQuality();
            this.highFrameTimeWindows = 0;
          }
        } else {
          this.highFrameTimeWindows = 0;
          if (this.avgFrameMs < 13 && this.currentScaleFactor < (GRAPHICS_PRESETS[this.settings.preset]?.renderScale || 1.0)) {
            this.currentScaleFactor = Math.min(
              GRAPHICS_PRESETS[this.settings.preset]?.renderScale || 1.0,
              Math.round((this.currentScaleFactor + 0.05) * 100) / 100
            );
            this.applyActiveConfig();
          }
        }
      }
      this.watchdogWindowStart = nowMs;
      this._emitTelemetry();
    }
  }

  _stepDownQuality() {
    if (this.currentScaleFactor > 0.70) {
      this.currentScaleFactor = Math.max(0.70, Math.round((this.currentScaleFactor - 0.10) * 100) / 100);
      this.applyActiveConfig();
      return;
    }
    if (this.settings.bloom) {
      this.settings.bloom = false;
      this.applyActiveConfig();
      return;
    }
    if (this.settings.foliageDensity !== 'low') {
      this.settings.foliageDensity = 'low';
      this.applyActiveConfig();
    }
  }

  setCurrentSector(sectorLabel) {
    this.currentSector = Array.isArray(sectorLabel) ? sectorLabel : [sectorLabel];
  }

  getTelemetry() {
    const info = this.renderer?.info;
    return {
      fps: this.fps,
      low1Pct: this.fps1PercentLow,
      frameTimeMs: this.avgFrameMs.toFixed(1),
      frameMs: this.avgFrameMs.toFixed(1),
      preset: this.activeConfig.id || this.settings.preset || 'MEDIUM',
      renderScale: (this.currentScaleFactor || this.activeConfig.renderScale || 1.0).toFixed(2),
      dpr: this.activeConfig.effectiveDpr ? this.activeConfig.effectiveDpr.toFixed(2) : '1.00',
      drawCalls: info?.render?.calls || 0,
      calls: info?.render?.calls || 0,
      triangles: info?.render?.triangles || 0,
      textures: info?.memory?.textures || 0,
      geometries: info?.memory?.geometries || 0,
      sector: Array.isArray(this.currentSector)
        ? this.currentSector.map((v) => (typeof v === 'number' ? String(v).padStart(2, '0') : v)).join('_')
        : String(this.currentSector || ''),
      pingMs: this.pingMs
    };
  }

  subscribe(cb) {
    this._listeners.add(cb);
    return () => this._listeners.delete(cb);
  }

  _emit() {
    for (const cb of this._listeners) {
      try {
        cb(this.settings, this.activeConfig);
      } catch (_) {}
    }
  }

  _emitTelemetry() {
    const snap = this.getTelemetry();
    window.dispatchEvent(new CustomEvent('rapsonyx:telemetry', { detail: snap }));
  }
}

export const GraphicsPresetManager = new GraphicsPresetManagerService();

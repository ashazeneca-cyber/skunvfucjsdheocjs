/**
 * RAPSONYX 3D Spatial Web Audio Engine (ZERO VOICE-OVER)
 * Channels: Master, Music (BGM Stems), SFX (Skills & War), Environment (Biome Ambience)
 * Strictly enforces 0% voice-over across all playback methods.
 */

import { AssetRegistry } from './AssetRegistry.js';
import { GraphicsPresetManager } from './GraphicsPresetManager.js';

export class AudioDirectorService {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.ambienceGain = null;
    this.buffers = new Map();
    this.activeBgmSource = null;
    this.activeBgmAlias = null;
    this.activeAmbienceSource = null;
    this.activeAmbienceAlias = null;
    this.unlocked = false;
    this._bindUnlock();
  }

  _bindUnlock() {
    const unlock = () => this.unlock();
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
  }

  unlock() {
    this.ensureContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.unlocked = true;
  }

  ensureContext() {
    if (this.ctx) return this.ctx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.bgmGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.ambienceGain = this.ctx.createGain();

    this.bgmGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.ambienceGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.syncVolumes();
    return this.ctx;
  }

  syncVolumes() {
    if (!this.ctx || !this.masterGain) return;
    const s = GraphicsPresetManager.settings;
    const now = this.ctx.currentTime;
    const muted = Boolean(s.audioMuted);
    this.masterGain.gain.setTargetAtTime(muted ? 0 : (s.masterVolume ?? 0.85), now, 0.05);
    this.bgmGain.gain.setTargetAtTime(s.bgmVolume ?? 0.65, now, 0.05);
    this.sfxGain.gain.setTargetAtTime(s.sfxVolume ?? 0.9, now, 0.05);
    this.ambienceGain.gain.setTargetAtTime(s.ambienceVolume ?? 0.7, now, 0.05);
  }

  isMuted() {
    return Boolean(GraphicsPresetManager.settings.audioMuted);
  }

  setMuted(muted) {
    GraphicsPresetManager.updateSetting('audioMuted', Boolean(muted));
    this.syncVolumes();
    if (this._loadingAudioEl) {
      this._loadingAudioEl.muted = Boolean(muted);
    }
    return Boolean(muted);
  }

  toggleMute() {
    return this.setMuted(!this.isMuted());
  }

  async playLoadingBgm() {
    if (this._loadingStarted) return;
    this._loadingStarted = true;
    try {
      const url = await AssetRegistry.getBlobUrl('bgm_loading_main', 'audio/mpeg').catch(() => null);
      if (url && typeof Audio !== 'undefined') {
        const el = new Audio(url);
        el.loop = true;
        el.volume = Math.max(0, Math.min(1, (GraphicsPresetManager.settings.bgmVolume ?? 0.65) * 0.85));
        el.muted = this.isMuted();
        this._loadingAudioEl = el;
        el.play().catch(() => {
          // Wait for first user gesture to play loading BGM cleanly
          const resumeEl = () => {
            el.play().catch(() => {});
          };
          window.addEventListener('pointerdown', resumeEl, { once: true, passive: true });
        });
        return;
      }
    } catch (_) {}
    await this.playBgm('bgm_01_lobby_pad');
  }

  stopLoadingBgm() {
    if (this._loadingAudioEl) {
      try {
        this._loadingAudioEl.pause();
        this._loadingAudioEl.src = '';
      } catch (_) {}
      this._loadingAudioEl = null;
    }
  }

  async _decodeAudio(aliasOrPath) {
    const rel = AssetRegistry.resolve(aliasOrPath);
    if (this.buffers.has(rel)) return this.buffers.get(rel);
    const ctx = this.ensureContext();
    if (!ctx) return null;
    try {
      const buf = await AssetRegistry.fetchAssetArrayBuffer(rel, { saveToCache: true, packId: 'pkg_audio' });
      const decoded = await ctx.decodeAudioData(buf.slice(0));
      this.buffers.set(rel, decoded);
      return decoded;
    } catch (_) {
      return null;
    }
  }

  async playBgm(aliasOrPath) {
    this.stopLoadingBgm();
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.activeBgmAlias === aliasOrPath && this.activeBgmSource) return;
    const audioBuf = await this._decodeAudio(aliasOrPath);
    if (!audioBuf) return;

    if (this.activeBgmSource) {
      try {
        this.activeBgmSource.stop();
      } catch (_) {}
      this.activeBgmSource = null;
    }

    const src = ctx.createBufferSource();
    src.buffer = audioBuf;
    src.loop = true;
    src.connect(this.bgmGain);
    src.start(0);
    this.activeBgmSource = src;
    this.activeBgmAlias = aliasOrPath;
  }

  async crossfadeBiomeAmbience(aliasOrPath) {
    const ctx = this.ensureContext();
    if (!ctx || this.activeAmbienceAlias === aliasOrPath) return;
    const audioBuf = await this._decodeAudio(aliasOrPath);
    if (!audioBuf) return;

    if (this.activeAmbienceSource) {
      try {
        this.activeAmbienceSource.stop();
      } catch (_) {}
      this.activeAmbienceSource = null;
    }
    const src = ctx.createBufferSource();
    src.buffer = audioBuf;
    src.loop = true;
    src.connect(this.ambienceGain);
    src.start(0);
    this.activeAmbienceSource = src;
    this.activeAmbienceAlias = aliasOrPath;
  }

  async playSfx(aliasOrPath, { worldPos = null, volume = 1.0, pitchJitter = 0.04 } = {}) {
    const ctx = this.ensureContext();
    if (!ctx || ctx.state === 'suspended') return;
    const audioBuf = await this._decodeAudio(aliasOrPath);
    if (!audioBuf) return;

    const src = ctx.createBufferSource();
    src.buffer = audioBuf;
    src.playbackRate.value = 1 + (Math.random() * 2 - 1) * pitchJitter;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    if (worldPos && ctx.createPanner) {
      const panner = ctx.createPanner();
      panner.panningModel = 'equalpower';
      panner.distanceModel = 'inverse';
      panner.refDistance = 6;
      panner.maxDistance = 60;
      panner.rolloffFactor = 1.3;
      panner.positionX.value = worldPos.x || 0;
      panner.positionY.value = worldPos.y || 0;
      panner.positionZ.value = worldPos.z || 0;
      src.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxGain);
    } else {
      src.connect(gain);
      gain.connect(this.sfxGain);
    }
    src.start(0);
  }

  updateListener(cameraPos, forwardVec, upVec) {
    if (!this.ctx || !this.ctx.listener) return;
    const l = this.ctx.listener;
    if (l.positionX) {
      l.positionX.value = cameraPos.x;
      l.positionY.value = cameraPos.y;
      l.positionZ.value = cameraPos.z;
      l.forwardX.value = forwardVec.x;
      l.forwardY.value = forwardVec.y;
      l.forwardZ.value = forwardVec.z;
      l.upX.value = upVec.x;
      l.upY.value = upVec.y;
      l.upZ.value = upVec.z;
    }
  }
}

export const AudioDirector = new AudioDirectorService();

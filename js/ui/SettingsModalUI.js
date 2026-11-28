/**
 * RAPSONYX Settings Modal UI (Graphics, Controls & Display, Audio, Storage)
 * Strictly NO Voice-Over slider anywhere in Audio tab (0% voice-over).
 */

import { GRAPHICS_PRESETS, GraphicsPresetManager } from '../core/GraphicsPresetManager.js';
import { AudioDirector } from '../core/AudioDirector.js';
import { toggleFullscreenMode } from '../core/ViewportDisplayManager.js';
import { openModalDialog, closeModalDialog } from './DialogHelper.js';

export class SettingsModalUI {
  constructor({ onOpenDownloadManager, onGraphicsChanged }) {
    this.onOpenDownloadManager = onOpenDownloadManager;
    this.onGraphicsChanged = onGraphicsChanged;

    this.backdropEl = document.getElementById('settings-modal');
    this.closeBtn = document.getElementById('settings-close-btn');
    this.tabBtns = document.querySelectorAll('[data-settings-tab]');
    this.tabPanels = document.querySelectorAll('[data-settings-panel]');

    // Graphics controls
    this.presetSelect = document.getElementById('set-gfx-preset');
    this.autoDetectBtn = document.getElementById('set-gfx-autodetect');
    this.scaleSlider = document.getElementById('set-gfx-scale');
    this.scaleValueEl = document.getElementById('set-gfx-scale-val');
    this.distanceSelect = document.getElementById('set-gfx-distance');
    this.bloomChk = document.getElementById('set-gfx-bloom');
    this.outlineChk = document.getElementById('set-gfx-outline');
    this.watchdogChk = document.getElementById('set-gfx-watchdog');
    this.telemetryChk = document.getElementById('set-gfx-telemetry');

    // Controls & Display
    this.sensSlider = document.getElementById('set-cam-sens');
    this.hudOpacitySlider = document.getElementById('set-hud-opacity');
    this.fullscreenBtn = document.getElementById('set-toggle-fullscreen');

    // Audio controls (Master, BGM, SFX, Ambience only — 0% Voice-Over)
    this.masterVol = document.getElementById('set-aud-master');
    this.bgmVol = document.getElementById('set-aud-bgm');
    this.sfxVol = document.getElementById('set-aud-sfx');
    this.ambVol = document.getElementById('set-aud-amb');
    this.muteChk = document.getElementById('set-aud-mute');

    // Storage
    this.openDmBtn = document.getElementById('set-open-dm-btn');
  }

  init() {
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
    this.tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => this._switchTab(btn.dataset.settingsTab));
    });

    if (this.presetSelect) {
      this.presetSelect.addEventListener('change', () => {
        GraphicsPresetManager.applyPreset(this.presetSelect.value, true);
        this.syncFromState();
        if (this.onGraphicsChanged) this.onGraphicsChanged();
      });
    }

    if (this.autoDetectBtn) {
      this.autoDetectBtn.addEventListener('click', () => {
        this.autoDetectBtn.disabled = true;
        this.autoDetectBtn.textContent = 'Menguji GPU...';
        window.setTimeout(() => {
          GraphicsPresetManager.autoDetectDeviceProfile();
          this.syncFromState();
          this.autoDetectBtn.disabled = false;
          this.autoDetectBtn.textContent = 'Deteksi Otomatis Perangkat';
          if (this.onGraphicsChanged) this.onGraphicsChanged();
        }, 40);
      });
    }

    if (this.scaleSlider) {
      this.scaleSlider.addEventListener('input', () => {
        const v = Number(this.scaleSlider.value);
        GraphicsPresetManager.updateSetting('renderScaleMode', 'manual');
        GraphicsPresetManager.updateSetting('renderScaleValue', v);
        if (this.scaleValueEl) this.scaleValueEl.textContent = `${v.toFixed(2)}x`;
        if (this.onGraphicsChanged) this.onGraphicsChanged();
      });
    }

    if (this.distanceSelect) {
      this.distanceSelect.addEventListener('change', () => {
        GraphicsPresetManager.updateSetting('renderDistanceTier', this.distanceSelect.value);
        if (this.onGraphicsChanged) this.onGraphicsChanged();
      });
    }

    const bindChk = (el, key) => {
      if (!el) return;
      el.addEventListener('change', () => {
        GraphicsPresetManager.updateSetting(key, el.checked);
        if (this.onGraphicsChanged) this.onGraphicsChanged();
      });
    };
    bindChk(this.bloomChk, 'bloom');
    bindChk(this.outlineChk, 'outline');
    if (this.watchdogChk) {
      this.watchdogChk.addEventListener('change', () => {
        GraphicsPresetManager.updateSetting('renderScaleMode', this.watchdogChk.checked ? 'auto' : 'manual');
        if (this.onGraphicsChanged) this.onGraphicsChanged();
      });
    }
    bindChk(this.telemetryChk, 'showTelemetry');

    if (this.hudOpacitySlider) {
      this.hudOpacitySlider.addEventListener('input', () => {
        document.documentElement.style.setProperty('--hud-opacity', this.hudOpacitySlider.value);
      });
    }
    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', () => toggleFullscreenMode());
    }

    const bindVol = (el, key) => {
      if (!el) return;
      el.addEventListener('input', () => {
        GraphicsPresetManager.updateSetting(key, Number(el.value));
        AudioDirector.syncVolumes();
      });
    };
    bindVol(this.masterVol, 'masterVolume');
    bindVol(this.bgmVol, 'bgmVolume');
    bindVol(this.sfxVol, 'sfxVolume');
    bindVol(this.ambVol, 'ambienceVolume');
    if (this.muteChk) {
      this.muteChk.addEventListener('change', () => {
        GraphicsPresetManager.updateSetting('audioMuted', this.muteChk.checked);
        AudioDirector.syncVolumes();
      });
    }

    if (this.openDmBtn) {
      this.openDmBtn.addEventListener('click', () => {
        this.close();
        if (this.onOpenDownloadManager) this.onOpenDownloadManager();
      });
    }

    this.syncFromState();
  }

  _switchTab(tabId) {
    this.tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.settingsTab === tabId));
    this.tabPanels.forEach((p) => p.classList.toggle('hidden', p.dataset.settingsPanel !== tabId));
  }

  syncFromState() {
    const s = GraphicsPresetManager.settings;
    const active = GraphicsPresetManager.activeConfig;
    if (this.presetSelect) {
      this.presetSelect.value = GRAPHICS_PRESETS[s.preset] ? s.preset : active.id;
    }
    if (this.scaleSlider) {
      const sc = s.renderScaleMode === 'manual' ? (s.renderScaleValue || active.renderScale) : active.renderScale;
      this.scaleSlider.value = String(sc);
      if (this.scaleValueEl) this.scaleValueEl.textContent = `${Number(sc).toFixed(2)}x`;
    }
    if (this.distanceSelect) this.distanceSelect.value = s.renderDistanceTier || active.renderDistanceTier;
    if (this.bloomChk) this.bloomChk.checked = Boolean(active.bloom);
    if (this.outlineChk) this.outlineChk.checked = Boolean(active.outline);
    if (this.watchdogChk) this.watchdogChk.checked = s.renderScaleMode !== 'manual';
    if (this.telemetryChk) this.telemetryChk.checked = Boolean(s.showTelemetry);

    if (this.masterVol) this.masterVol.value = String(s.masterVolume ?? 0.85);
    if (this.bgmVol) this.bgmVol.value = String(s.bgmVolume ?? 0.65);
    if (this.sfxVol) this.sfxVol.value = String(s.sfxVolume ?? 0.9);
    if (this.ambVol) this.ambVol.value = String(s.ambienceVolume ?? 0.7);
    if (this.muteChk) this.muteChk.checked = Boolean(s.audioMuted);
  }

  open() {
    this.syncFromState();
    openModalDialog(this.backdropEl);
  }

  close() {
    closeModalDialog(this.backdropEl);
  }
}

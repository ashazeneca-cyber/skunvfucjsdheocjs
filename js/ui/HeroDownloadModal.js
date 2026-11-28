/**
 * RAPSONYX Hero Download Confirmation & Synchronized Circular Progress Ring Controller
 * - Displays portrait, role, team, exact MB breakdown & Unduh & Pakai CTA
 * - Runs sequential/batched download into rapsonyx-db with AbortController
 * - Syncs SVG circular progress ring on BOTH Lobby Pedestal HUD & Roster Card
 */

import { AssetRegistry } from '../core/AssetRegistry.js';
import { LocalAssetCache } from '../core/LocalAssetCache.js';
import { TEAM_CONFIG } from '../config/constants.js';
import { openModalDialog, closeModalDialog } from './DialogHelper.js';
import {
  getHeroById,
  getHeroEssentialFiles,
  getHeroFilesBreakdown,
  isHeroCoreCached
} from '../character/Roster42Directory.js';

const RING_CIRCUMFERENCE = 2 * Math.PI * 36; // r = 36

export class HeroDownloadModal {
  constructor() {
    this.backdropEl = document.getElementById('hero-download-modal');
    this.portraitEl = document.getElementById('hd-portrait');
    this.titleEl = document.getElementById('hd-hero-name');
    this.metaEl = document.getElementById('hd-hero-meta');
    this.breakdownEl = document.getElementById('hd-breakdown-grid');
    this.confirmBtn = document.getElementById('hd-confirm-btn');
    this.cancelBtn = document.getElementById('hd-cancel-btn');

    // Pedestal circular ring HUD
    this.pedestalRingHud = document.getElementById('pedestal-ring-hud');
    this.pedestalRingFg = document.getElementById('pedestal-ring-fg');
    this.pedestalRingPct = document.getElementById('pedestal-ring-pct');
    this.pedestalRingLabel = document.getElementById('pedestal-ring-label');
    this.pedestalAbortBtn = document.getElementById('pedestal-ring-abort');

    this.activeAbort = null;
    this.activeHeroId = null;
    this.onConfirmCallback = null;
    this.onCardProgress = null;
  }

  init() {
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => this.closeConfirm());
    }
    if (this.confirmBtn) {
      this.confirmBtn.addEventListener('click', () => {
        const heroId = this.activeHeroId;
        const cb = this.onConfirmCallback;
        this.closeConfirm();
        if (heroId && cb) cb(heroId);
      });
    }
    if (this.pedestalAbortBtn) {
      this.pedestalAbortBtn.addEventListener('click', () => this.abortActiveDownload());
    }
  }

  openConfirm(heroId, onConfirm) {
    const hero = getHeroById(heroId);
    const teamCfg = TEAM_CONFIG[hero.team] || TEAM_CONFIG.team_dream;
    const bd = getHeroFilesBreakdown(heroId);
    const fmt = (b) => `${(b / 1048576).toFixed(2)} MB`;

    this.activeHeroId = heroId;
    this.onConfirmCallback = onConfirm;

    if (this.portraitEl) this.portraitEl.src = AssetRegistry.toCdnUrl(hero.portraitPath);
    if (this.titleEl) this.titleEl.textContent = hero.name;
    if (this.metaEl) {
      this.metaEl.textContent = `${teamCfg.name} • ${hero.roleLane} • Status: Belum Diunduh`;
      this.metaEl.style.color = teamCfg.colorHex;
    }

    if (this.breakdownEl) {
      this.breakdownEl.innerHTML = `
        <div class="breakdown-pill"><span>Model 3D, Stand & Senjata</span><strong class="tabular-nums">${fmt(bd.modelBytes)}</strong></div>
        <div class="breakdown-pill"><span>VFX Skill & Proyektil 3D</span><strong class="tabular-nums">${fmt(bd.vfxBytes)}</strong></div>
        <div class="breakdown-pill"><span>Efek Suara Non-Voice</span><strong class="tabular-nums">${fmt(bd.sfxBytes)}</strong></div>
        <div class="breakdown-pill"><span>Ikon & Manifest Hero</span><strong class="tabular-nums">${fmt(bd.iconsBytes)}</strong></div>
      `;
    }

    if (this.confirmBtn) {
      this.confirmBtn.textContent = `UNDUH & PAKAI (${(bd.totalBytes / 1048576).toFixed(1)} MB)`;
    }
    openModalDialog(this.backdropEl);
  }

  closeConfirm() {
    closeModalDialog(this.backdropEl);
    this.onConfirmCallback = null;
  }

  abortActiveDownload() {
    if (this.activeAbort) {
      this.activeAbort.abort();
      this.activeAbort = null;
    }
    this.hidePedestalRing(0);
  }

  async downloadHeroPack(heroId, { onCardProgress = null } = {}) {
    if (isHeroCoreCached(heroId)) return true;

    this.abortActiveDownload();
    this.activeAbort = new AbortController();
    this.onCardProgress = onCardProgress;

    const files = getHeroEssentialFiles(heroId, { includeRiggedWeapon: false });
    const bd = getHeroFilesBreakdown(heroId);
    const totalBytes = Math.max(1, bd.totalBytes);
    let completed = 0;

    this._updateRings(heroId, 0, 'MENGUNDUH 0%', totalBytes);

    try {
      for (let i = 0; i < files.length; i++) {
        const path = files[i];
        if (LocalAssetCache.has(path)) {
          const m = LocalAssetCache.memoryIndex.get(path);
          completed += m?.sizeBytes || 12000;
          const pct = Math.min(99, (completed / totalBytes) * 100);
          this._updateRings(heroId, pct, `MENGUNDUH ${pct.toFixed(0)}%`, totalBytes);
          continue;
        }

        let lastFileBytes = 0;
        await AssetRegistry.fetchAssetArrayBuffer(path, {
          signal: this.activeAbort.signal,
          saveToCache: true,
          pinned: false,
          packId: `hero_${heroId}`,
          retries: 3,
          onProgress: (loaded) => {
            lastFileBytes = loaded;
            const pct = Math.min(99.5, ((completed + loaded) / totalBytes) * 100);
            this._updateRings(heroId, pct, `MENGUNDUH ${pct.toFixed(0)}%`, totalBytes);
          }
        });
        completed += lastFileBytes;
      }

      this._updateRings(heroId, 100, 'MEMUAT KARAKTER...', totalBytes);
      return true;
    } catch (err) {
      if (err?.name === 'AbortError') return false;
      this.setRingError(err?.message || 'Unduhan gagal');
      return false;
    } finally {
      this.activeAbort = null;
    }
  }

  _updateRings(heroId, percent, statusLabel) {
    if (this.pedestalRingHud) {
      this.pedestalRingHud.classList.remove('hidden', 'ring-fade-out');
    }
    if (this.pedestalRingFg) {
      this.pedestalRingFg.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
      this.pedestalRingFg.style.strokeDashoffset = `${RING_CIRCUMFERENCE * (1 - percent / 100)}`;
    }
    if (this.pedestalRingPct) {
      this.pedestalRingPct.textContent = `${Math.round(percent)}%`;
    }
    if (this.pedestalRingLabel) {
      this.pedestalRingLabel.textContent = statusLabel;
    }
    if (typeof this.onCardProgress === 'function') {
      this.onCardProgress(heroId, percent, statusLabel);
    }
  }

  setLoadingCharacterPhase(heroId) {
    this._updateRings(heroId, 100, 'MEMUAT KARAKTER...');
  }

  setRingError(msg) {
    if (this.pedestalRingLabel) this.pedestalRingLabel.textContent = msg;
  }

  hidePedestalRing(delayFadeMs = 250) {
    if (!this.pedestalRingHud) return;
    if (delayFadeMs > 0) {
      this.pedestalRingHud.classList.add('ring-fade-out');
      window.setTimeout(() => {
        this.pedestalRingHud.classList.add('hidden');
        this.pedestalRingHud.classList.remove('ring-fade-out');
      }, delayFadeMs);
    } else {
      this.pedestalRingHud.classList.add('hidden');
    }
    if (typeof this.onCardProgress === 'function') {
      this.onCardProgress(null, -1, '');
    }
  }
}

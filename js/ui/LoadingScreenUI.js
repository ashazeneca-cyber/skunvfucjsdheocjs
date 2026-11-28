/**
 * RAPSONYX Luminous Frost Loading Screen & Starter Gatekeeper
 * Uses Priority-0 bg_loading_main & bgm_loading_main from Cache/IDB while pulling Starter Pack via Dual-Route CDN
 */

import { AssetRegistry } from '../core/AssetRegistry.js';
import { AudioDirector } from '../core/AudioDirector.js';
import { PreEntryDownloader } from '../core/PreEntryDownloader.js';
import { SceneDirector } from '../core/SceneDirector.js';
import { enterMobileLandscapeFullscreen } from '../core/ViewportDisplayManager.js';

const TIPS = [
  { imgAlias: 'loading_tip_01', text: 'Koordinasi Ultimate tiga faksi di Colosseum membuka peluang Team Wipe beruntun.' },
  { imgAlias: 'loading_tip_02', text: 'Grand Ocean Bridge: hancurkan Kristal Depan (5.500 HP) untuk membuka Perisai Nexus!' },
  { imgAlias: 'loading_tip_03', text: 'Sky Sanctuary mempertemukan Dream, Love, dan Passion di antara kelopak sakura.' },
  { imgAlias: 'loading_tip_04', text: 'Imperial Terrarium menampilkan seluruh 42 karakter dengan ekspresi & interaksi sentuhan.' },
  { imgAlias: 'loading_tip_05', text: 'Dunia Terbuka 11.11 km terbagi menjadi 121 sektor dengan Mount & Glider langit.' },
  { imgAlias: 'loading_tip_06', text: 'Seluruh paket aset yang sudah terunduh tersimpan lokal di rapsonyx-db.' }
];

export class LoadingScreenUI {
  constructor(onEnterLobby) {
    this.onEnterLobby = onEnterLobby;
    this.rootEl = document.getElementById('pre-entry-screen');
    this.bgLayerEl = document.getElementById('pre-entry-bg-layer');
    this.rapsonyxSvgEl = document.getElementById('pre-entry-rapsonyx-svg');
    this.muteBtn = document.getElementById('btn-loading-mute');

    this.statusEl = document.getElementById('pre-entry-status-text');
    this.phaseEl = document.getElementById('pre-entry-phase-label');
    this.barFillEl = document.getElementById('pre-entry-progress-fill');
    this.enterBtn = document.getElementById('btn-enter-rapsonyx');
    this.retryBtn = document.getElementById('btn-retry-starter');
    this.tipImgEl = document.getElementById('pre-entry-tip-img');
    this.tipTextEl = document.getElementById('pre-entry-tip-text');
    this.tipIndex = 0;
    this.tipTimer = null;
  }

  async start(bootMedia = null) {
    if (!this.rootEl) return;
    SceneDirector.goTo('loading');

    if (this.rapsonyxSvgEl) {
      this.rapsonyxSvgEl.classList.add('active');
    }

    if (this.muteBtn) {
      this._syncMuteLabel();
      this.muteBtn.addEventListener('click', () => {
        AudioDirector.toggleMute();
        this._syncMuteLabel();
      });
    }

    if (this.enterBtn) {
      this.enterBtn.disabled = true;
      this.enterBtn.addEventListener('click', () => this._handleEnterClicked());
    }
    if (this.retryBtn) {
      this.retryBtn.addEventListener('click', () => this.startDownloadSequence());
    }

    // Resolve Priority-0 background + BGM in parallel so Gatekeeper starts immediately
    Promise.resolve(bootMedia?.priority2Promise || bootMedia)
      .then(async (resolved) => {
        if (this.bgLayerEl) {
          const bgUrl =
            resolved?.bgUrl ||
            (await AssetRegistry.getBlobUrl('bg_loading_main', 'image/webp').catch(() =>
              AssetRegistry.toCdnUrl('bg_loading_main')
            ));
          if (bgUrl) {
            this.bgLayerEl.style.backgroundImage = `url("${bgUrl}")`;
            this.bgLayerEl.classList.add('loaded');
          }
        }
        AudioDirector.playLoadingBgm().catch(() => {});
      })
      .catch(() => {});

    AssetRegistry.diagnoseCdnHealth()
      .catch(() => {})
      .then(() => {
        this._rotateTip();
        this.tipTimer = window.setInterval(() => this._rotateTip(), 4200);
      });

    await this.checkAndPrepareGate();
  }

  _syncMuteLabel() {
    if (!this.muteBtn) return;
    this.muteBtn.textContent = AudioDirector.isMuted() ? 'Suara: Bisu' : 'Suara: Nyala';
  }

  _rotateTip() {
    const t = TIPS[this.tipIndex % TIPS.length];
    this.tipIndex++;
    if (this.tipImgEl) {
      const url = AssetRegistry.toCdnUrl(t.imgAlias);
      this.tipImgEl.onerror = () => {
        this.tipImgEl.src = 'startup/logo%20samping.jpg';
      };
      this.tipImgEl.src = url;
    }
    if (this.tipTextEl) this.tipTextEl.textContent = t.text;
  }

  async checkAndPrepareGate() {
    const check = await PreEntryDownloader.checkStarterReady();
    if (check.ready) {
      this._markReadyUI(check.cachedBytes || check.totalBytes);
      return true;
    }
    await this.startDownloadSequence();
    return PreEntryDownloader.isReady;
  }

  async startDownloadSequence() {
    if (this.retryBtn) this.retryBtn.classList.add('hidden');
    if (this.enterBtn) {
      this.enterBtn.disabled = true;
      this.enterBtn.textContent = 'MENUNGGU ASET WAJIB...';
    }

    try {
      await PreEntryDownloader.downloadStarterPack((p) => {
        const dlMB = (p.downloadedBytes / 1048576).toFixed(1);
        const totMB = (p.totalBytes / 1048576).toFixed(1);
        const pct = p.percent.toFixed(0);
        const spd = (p.speedMbps || 0).toFixed(1);

        if (p.status === 'READY_LOCAL') {
          this._markReadyUI(p.totalBytes);
        } else {
          if (this.statusEl) {
            this.statusEl.textContent = `MENGUNDUH (${dlMB} MB / ${totMB} MB — ${spd} MB/s — ${pct}%)`;
          }
          if (this.phaseEl) {
            this.phaseEl.textContent = `${p.phaseLabel} • ${p.currentFile}`;
          }
          if (this.barFillEl) {
            this.barFillEl.style.width = `${p.percent.toFixed(2)}%`;
          }
        }
      });
    } catch (err) {
      if (this.statusEl) {
        this.statusEl.textContent = `KONEKSI TERPUTUS: ${err.message || 'Gagal mengunduh aset starter'}`;
      }
      if (this.phaseEl) {
        this.phaseEl.textContent = 'Klik Muat Ulang untuk melanjutkan unduhan yang tertunda.';
      }
      if (this.retryBtn) this.retryBtn.classList.remove('hidden');
    }
  }

  _markReadyUI(bytes) {
    const mb = (bytes / 1048576).toFixed(1);
    if (this.statusEl) {
      this.statusEl.textContent = `ASET SIAP (${mb} MB)`;
      this.statusEl.style.color = '#10b981';
    }
    if (this.phaseEl) {
      this.phaseEl.textContent = 'NAI Engine • Paket Awal Lengkap';
    }
    if (this.barFillEl) {
      this.barFillEl.style.width = '100%';
    }
    if (this.retryBtn) this.retryBtn.classList.add('hidden');
    if (this.enterBtn) {
      this.enterBtn.disabled = false;
      this.enterBtn.textContent = 'MASUK KE LOBBY RAPSONYX';
    }
  }

  async _handleEnterClicked() {
    if (!PreEntryDownloader.isReady) return;
    await enterMobileLandscapeFullscreen();
    if (this.tipTimer) {
      clearInterval(this.tipTimer);
      this.tipTimer = null;
    }
    AudioDirector.stopLoadingBgm();
    SceneDirector.goTo('lobby');
    if (typeof this.onEnterLobby === 'function') {
      this.onEnterLobby();
    }
  }
}

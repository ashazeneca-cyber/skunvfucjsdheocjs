/**
 * RAPSONYX Download Manager & Local Cache Inspector Modal
 * Manages 6 categorized RAPSONYX asset packs inside rapsonyx-db
 */

import { AssetRegistry } from '../core/AssetRegistry.js';
import { LocalAssetCache } from '../core/LocalAssetCache.js';
import { PreEntryDownloader } from '../core/PreEntryDownloader.js';
import { getTeamBatchSummary, getHeroEssentialFiles } from '../character/Roster42Directory.js';
import { openModalDialog, closeModalDialog } from './DialogHelper.js';

export class DownloadManagerModal {
  constructor(onCacheChanged = null) {
    this.onCacheChanged = onCacheChanged;
    this.backdropEl = document.getElementById('download-manager-modal');
    this.packListEl = document.getElementById('dm-pack-list');
    this.storageSummaryEl = document.getElementById('dm-storage-summary');
    this.closeBtn = document.getElementById('dm-close-btn');
    this.clearOptBtn = document.getElementById('dm-clear-optional-btn');

    this.activeTask = null;
    this.activeAbort = null;
    this.progressByPack = new Map();
  }

  init() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    if (this.clearOptBtn) {
      this.clearOptBtn.addEventListener('click', async () => {
        await LocalAssetCache.clearOptional();
        await this.render();
        if (this.onCacheChanged) this.onCacheChanged();
      });
    }
  }

  async open() {
    openModalDialog(this.backdropEl);
    await this.render();
  }

  close() {
    closeModalDialog(this.backdropEl);
  }

  _buildCategories() {
    const starterCount = PreEntryDownloader.getAllStarterKeys().length;
    const starterStatus = LocalAssetCache.getPackStatus(PreEntryDownloader.getAllStarterKeys());
    const dream = getTeamBatchSummary('team_dream');
    const love = getTeamBatchSummary('team_love');
    const passion = getTeamBatchSummary('team_passion');

    const arenaKeys = ['arena_ocean_bridge', 'arena_colosseum', 'arena_sky_sakura', 'arena_mist_duel', 'minimap_ocean_bridge', 'minimap_colosseum', 'minimap_sky_sakura'];
    const arenaStatus = LocalAssetCache.getPackStatus(arenaKeys.map((a) => AssetRegistry.resolve(a)));

    const owKeys = ['heightmap_rg16_2k', 'splatmap_4k', 'sky_islands_layout', 'sandbox_valley', 'glider_dream', 'mount_crystal_steed', 'horizon_arch_sky', 'horizon_cliffs'];
    const owStatus = LocalAssetCache.getPackStatus(owKeys.map((a) => AssetRegistry.resolve(a)));

    return [
      {
        id: 'pkg_starter',
        title: 'Starter Pack Wajib (Altar, Freya & Sistem Inti)',
        subtitle: `${starterStatus.cachedCount}/${starterCount} berkas terunduh`,
        totalBytes: PreEntryDownloader.getStarterTotalBytes(),
        complete: starterStatus.complete,
        locked: true,
        keys: PreEntryDownloader.getAllStarterKeys()
      },
      {
        id: 'pkg_team_dream',
        title: '13 Hero Team Dream',
        subtitle: `${dream.cachedHeroes}/${dream.totalHeroes} hero tersedia lokal`,
        totalBytes: dream.totalBytes,
        complete: dream.uncachedHeroes.length === 0,
        locked: false,
        heroes: dream.uncachedHeroes
      },
      {
        id: 'pkg_team_love',
        title: '15 Hero Team Love',
        subtitle: `${love.cachedHeroes}/${love.totalHeroes} hero tersedia lokal`,
        totalBytes: love.totalBytes,
        complete: love.uncachedHeroes.length === 0,
        locked: false,
        heroes: love.uncachedHeroes
      },
      {
        id: 'pkg_team_passion',
        title: '14 Hero Team Passion',
        subtitle: `${passion.cachedHeroes}/${passion.totalHeroes} hero tersedia lokal`,
        totalBytes: passion.totalBytes,
        complete: passion.uncachedHeroes.length === 0,
        locked: false,
        heroes: passion.uncachedHeroes
      },
      {
        id: 'pkg_arenas',
        title: 'Peta Arena Pertarungan (Ocean Bridge, Colosseum, Sky Sakura, Mist)',
        subtitle: `${arenaStatus.cachedCount}/${arenaStatus.totalCount} berkas arena tersimpan`,
        totalBytes: 45 * 1048576,
        complete: arenaStatus.complete,
        locked: false,
        keys: arenaKeys.map((a) => AssetRegistry.resolve(a))
      },
      {
        id: 'pkg_openworld',
        title: 'Dunia Terbuka 11.11 km & Sky Islands',
        subtitle: `${owStatus.cachedCount}/${owStatus.totalCount} berkas sektor & mobilitas`,
        totalBytes: 128 * 1048576,
        complete: owStatus.complete,
        locked: false,
        keys: owKeys.map((a) => AssetRegistry.resolve(a))
      }
    ];
  }

  async render() {
    const stats = await LocalAssetCache.getStats();
    let estStr = '';
    if (navigator.storage?.estimate) {
      try {
        const est = await navigator.storage.estimate();
        estStr = ` • Kapasitas Peramban: ${(est.usage / 1048576).toFixed(1)} MB / ${(est.quota / 1048576).toFixed(0)} MB`;
      } catch (_) {}
    }

    if (this.storageSummaryEl) {
      this.storageSummaryEl.textContent = `Cache RAPSONYX (rapsonyx-db): ${stats.totalCount} berkas (${(stats.totalBytes / 1048576).toFixed(1)} MB)${estStr}`;
    }

    if (!this.packListEl) return;
    const cats = this._buildCategories();
    this.packListEl.innerHTML = '';

    for (const c of cats) {
      const row = document.createElement('div');
      row.className = 'settings-row';
      const pct = this.progressByPack.get(c.id);
      const isBusy = this.activeTask === c.id;
      const mbStr = (c.totalBytes / 1048576).toFixed(1);

      row.innerHTML = `
        <div style="flex:1; min-width:0;">
          <div style="font-weight:700; font-size:0.9rem;">${c.title}</div>
          <div style="font-size:0.78rem; color:var(--text-muted);">${c.subtitle} • ~${mbStr} MB</div>
          ${isBusy && typeof pct === 'number' ? `<div style="font-size:0.75rem; color:var(--gold-bright);" class="tabular-nums">Mengunduh ${pct.toFixed(0)}%</div>` : ''}
        </div>
        <div style="display:flex; gap:8px;">
          ${c.complete
            ? `<span class="rap-btn" style="color:var(--ready-emerald); border-color:rgba(52,211,153,0.45); cursor:default;">TERUNDUH</span>`
            : isBusy
              ? `<button type="button" class="rap-btn rap-btn-danger" data-action="abort">BATAL</button>`
              : `<button type="button" class="rap-btn rap-btn-gold" data-action="download" data-id="${c.id}">UNDUH PAKET</button>`
          }
        </div>
      `;

      const dlBtn = row.querySelector('[data-action="download"]');
      if (dlBtn) {
        dlBtn.addEventListener('click', () => this._downloadCategory(c));
      }
      const abortBtn = row.querySelector('[data-action="abort"]');
      if (abortBtn) {
        abortBtn.addEventListener('click', () => {
          if (this.activeAbort) this.activeAbort.abort();
        });
      }

      this.packListEl.appendChild(row);
    }
  }

  async _downloadCategory(cat) {
    if (this.activeTask) return;
    this.activeTask = cat.id;
    this.activeAbort = new AbortController();
    this.progressByPack.set(cat.id, 0);
    await this.render();

    try {
      let allKeys = cat.keys ? [...cat.keys] : [];
      if (Array.isArray(cat.heroes)) {
        for (const h of cat.heroes) {
          allKeys = allKeys.concat(getHeroEssentialFiles(h.id));
        }
      }

      for (let i = 0; i < allKeys.length; i++) {
        const key = allKeys[i];
        if (!LocalAssetCache.has(key)) {
          await AssetRegistry.fetchAssetArrayBuffer(key, {
            signal: this.activeAbort.signal,
            saveToCache: true,
            pinned: false,
            packId: cat.id,
            retries: 3
          });
        }
        const pct = ((i + 1) / Math.max(1, allKeys.length)) * 100;
        this.progressByPack.set(cat.id, pct);
        if (i % 6 === 0 || i === allKeys.length - 1) await this.render();
      }
    } catch (_) {
      // Cancelled or partial error safely saved per-file
    } finally {
      this.activeTask = null;
      this.activeAbort = null;
      this.progressByPack.delete(cat.id);
      await this.render();
      if (this.onCacheChanged) this.onCacheChanged();
    }
  }
}

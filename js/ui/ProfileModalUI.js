/**
 * RAPSONYX Profile, Rank, Hero Bio (42 Members), 6-Slot Build Editor & Global Leaderboard Modal
 * - Renders inside native <dialog id="profile-modal" closedby="any">
 * - Reads static /data/heroes_42_bio.json, /data/items_spells_emblems.json, /data/ranks_achievements.json
 */

import { AssetRegistry } from '../core/AssetRegistry.js';
import { ProfileManager } from '../core/ProfileManager.js';
import { RankSystem } from '../combat/RankSystem.js';
import { GameStore } from '../core/GameStore.js';
import { NETWORK_CONFIG } from '../config/constants.js';
import { openModalDialog, closeModalDialog } from './DialogHelper.js';

export class ProfileModalUI {
  constructor({ onProfileUpdated = null } = {}) {
    this.onProfileUpdated = onProfileUpdated;
    this.dialogEl = document.getElementById('profile-modal');
    this.closeBtn = document.getElementById('profile-close-btn');
    this.tabBtns = document.querySelectorAll('[data-profile-tab]');
    this.bodyEl = document.getElementById('profile-modal-body');

    this.activeTab = 'profile';
    this.focusedHeroId = 'freya';
    this.selectedBuildSlot = 0;
    this.heroesBio = null;
    this.itemsData = null;
    this.ranksData = null;
  }

  init() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    this.tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.profileTab));
    });
  }

  async ensureDataLoaded() {
    const tasks = [];
    if (!this.heroesBio) {
      tasks.push(
        fetch(new URL('../../data/heroes_42_bio.json', import.meta.url))
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => {
            this.heroesBio = j?.heroes || [];
          })
          .catch(() => {
            this.heroesBio = [];
          })
      );
    }
    if (!this.itemsData) {
      tasks.push(
        fetch(new URL('../../data/items_spells_emblems.json', import.meta.url))
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => {
            this.itemsData = j || { items: [], spells: [], emblems: [] };
          })
          .catch(() => {
            this.itemsData = { items: [], spells: [], emblems: [] };
          })
      );
    }
    if (!this.ranksData) {
      tasks.push(RankSystem.loadData().then(() => { this.ranksData = true; }));
    }
    if (tasks.length) await Promise.all(tasks);
  }

  async open(tab = 'profile', heroId = null) {
    if (heroId) this.focusedHeroId = heroId;
    else this.focusedHeroId = GameStore.get('selectedHeroId') || 'freya';
    this.activeTab = tab;
    this._syncTabBtns();
    openModalDialog(this.dialogEl);
    if (this.activeTab === 'profile') {
      this._renderProfileTab();
    } else if (this.bodyEl) {
      this.bodyEl.innerHTML = '<div class="settings-row">Memuat ensiklopedia 42 Hero RAPSONYX...</div>';
    }
    await this.ensureDataLoaded();
    await this.renderActiveTab();
  }

  async openHeroBio(heroId) {
    await this.open('bio', heroId);
  }

  close() {
    closeModalDialog(this.dialogEl);
  }

  _syncTabBtns() {
    this.tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.profileTab === this.activeTab));
  }

  async switchTab(tabId) {
    this.activeTab = tabId || 'profile';
    this._syncTabBtns();
    await this.ensureDataLoaded();
    await this.renderActiveTab();
  }

  async renderActiveTab() {
    if (!this.bodyEl) return;
    if (this.activeTab === 'profile') return this._renderProfileTab();
    if (this.activeTab === 'bio') return this._renderBioTab();
    if (this.activeTab === 'build') return this._renderBuildTab();
    if (this.activeTab === 'achievements') return this._renderAchievementsTab();
    if (this.activeTab === 'leaderboard') return this._renderLeaderboardTab();
  }

  _renderProfileTab() {
    const s = ProfileManager.getSummary();
    const rankImg = AssetRegistry.toCdnUrl(s.rank.iconKey);
    const starImg = AssetRegistry.toCdnUrl('rank_star');
    const historyHtml = s.matchHistory.length
      ? s.matchHistory.slice(0, 6).map((m) => `
          <div class="settings-row" style="padding:7px 10px;">
            <div>
              <strong style="color:${m.won ? 'var(--ready-emerald)' : 'var(--danger-coral)'};">${m.won ? 'MENANG' : 'KALAH'}</strong>
              <span style="margin-left:6px;text-transform:capitalize;font-weight:700;">${m.heroId}</span>
              <span style="font-size:0.74rem;color:var(--text-muted);margin-left:6px;">${m.arenaId}</span>
            </div>
            <div class="tabular-nums" style="font-size:0.78rem;font-weight:700;">
              KDA ${m.kda} • ${m.starDelta >= 0 ? `+${m.starDelta}` : m.starDelta} Bintang ${m.isMvp ? '• MVP' : ''}
            </div>
          </div>
        `).join('')
      : '<div style="font-size:0.8rem;color:var(--text-muted);">Belum ada riwayat pertandingan tercatat.</div>';

    this.bodyEl.innerHTML = `
      <div class="settings-row">
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="${rankImg}" alt="${s.rank.displayLabel}" style="width:54px;height:54px;object-fit:contain;border-radius:12px;background:rgba(224,242,254,0.7);padding:4px;">
          <div>
            <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:800;color:var(--sky-primary);">${s.rank.displayLabel}</div>
            <div style="display:flex;align-items:center;gap:6px;font-size:0.82rem;font-weight:700;">
              <img src="${starImg}" alt="Bintang" style="width:16px;height:16px;">
              <span class="tabular-nums">${s.rank.totalStars} Total Bintang</span>
            </div>
          </div>
        </div>
        <div style="text-align:right;" class="tabular-nums">
          <div style="font-size:0.9rem;font-weight:800;">Winrate ${s.winrate}%</div>
          <div style="font-size:0.76rem;color:var(--text-muted);">${s.wins} Menang / ${s.matchesPlayed} Main • ${s.mvpCount} MVP</div>
        </div>
      </div>

      <div class="settings-row">
        <label for="prof-nick-input" style="font-weight:700;font-size:0.84rem;">Nama Komandan</label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input id="prof-nick-input" type="text" maxlength="18" class="frost-input" value="${s.nickname.replace(/"/g, '&quot;')}">
          <button id="prof-nick-save" type="button" class="rap-btn rap-btn-crystal">Simpan</button>
        </div>
      </div>

      <div style="font-weight:800;font-size:0.86rem;color:var(--sky-primary);">Riwayat Pertarungan Terbaru</div>
      <div style="display:flex;flex-direction:column;gap:6px;">${historyHtml}</div>
    `;

    document.getElementById('prof-nick-save')?.addEventListener('click', () => {
      const val = document.getElementById('prof-nick-input')?.value;
      ProfileManager.setNickname(val);
      this._renderProfileTab();
      this.onProfileUpdated?.();
    });
  }

  _renderBioTab() {
    const hero = (this.heroesBio || []).find((h) => h.id === this.focusedHeroId) || this.heroesBio?.[0];
    if (!hero) {
      this.bodyEl.innerHTML = '<div style="color:var(--text-muted);">Data biodata hero tidak tersedia.</div>';
      return;
    }

    const portrait = AssetRegistry.toCdnUrl(hero.portraitPath);
    const selectOpts = (this.heroesBio || [])
      .map((h) => `<option value="${h.id}" ${h.id === hero.id ? 'selected' : ''}>${h.name} (${h.teamLabel})</option>`)
      .join('');

    this.bodyEl.innerHTML = `
      <div class="settings-row">
        <strong style="color:var(--sky-primary);">Pilih Hero (42 Member)</strong>
        <select id="bio-hero-select" class="frost-select">${selectOpts}</select>
      </div>

      <div class="hero-confirm-grid">
        <img src="${portrait}" alt="${hero.fullName}" class="hero-confirm-portrait">
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div>
            <div style="font-family:var(--font-display);font-size:1.3rem;font-weight:800;color:var(--sky-primary);">${hero.fullName}</div>
            <div style="font-size:0.8rem;font-weight:700;color:${hero.teamColor};">${hero.teamLabel} • Gen ${hero.generation} • ${hero.roleLane}</div>
          </div>
          <blockquote style="margin:0;padding:8px 12px;border-left:3px solid var(--sky-bright);background:rgba(224,242,254,0.65);border-radius:8px;font-size:0.8rem;font-style:italic;">
            "${hero.jikoshoukai}"
          </blockquote>
          <p style="margin:0;font-size:0.8rem;line-height:1.45;color:var(--text-secondary);">${hero.bioSummary}</p>
          <div class="breakdown-grid">
            <div class="breakdown-pill"><span>Lahir</span><strong>${hero.birthPlace}, ${hero.birthDate}</strong></div>
            <div class="breakdown-pill"><span>Zodiak / Gol.</span><strong>${hero.zodiac} / ${hero.bloodType}</strong></div>
            <div class="breakdown-pill"><span>Tinggi / Fanbase</span><strong>${hero.heightCm} cm • ${hero.fanbase}</strong></div>
            <div class="breakdown-pill"><span>Status</span><strong>${hero.status}</strong></div>
          </div>
        </div>
      </div>

      <div style="font-weight:800;font-size:0.86rem;color:var(--sky-primary);">Senjata &amp; Kit Kemampuan (${hero.weaponName})</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
        <div class="breakdown-pill" style="flex-direction:column;gap:4px;"><strong>Pasif</strong><span style="font-size:0.74rem;color:var(--text-secondary);">${hero.skills.passive}</span></div>
        <div class="breakdown-pill" style="flex-direction:column;gap:4px;"><strong>Skill 1</strong><span style="font-size:0.74rem;color:var(--text-secondary);">${hero.skills.skill_1}</span></div>
        <div class="breakdown-pill" style="flex-direction:column;gap:4px;"><strong>Skill 2</strong><span style="font-size:0.74rem;color:var(--text-secondary);">${hero.skills.skill_2}</span></div>
        <div class="breakdown-pill" style="flex-direction:column;gap:4px;"><strong>Ultimate</strong><span style="font-size:0.74rem;color:var(--text-secondary);">${hero.skills.ultimate}</span></div>
      </div>
    `;

    document.getElementById('bio-hero-select')?.addEventListener('change', (e) => {
      this.focusedHeroId = e.target.value;
      this._renderBioTab();
    });
  }

  _renderBuildTab() {
    const heroId = this.focusedHeroId || GameStore.get('selectedHeroId') || 'freya';
    const items = this.itemsData?.items || [];
    const buildIds = ProfileManager.getHeroBuild(heroId);

    const resolveItem = (rawId) => {
      const clean = String(rawId).replace(/^item_/, '');
      return items.find((it) => it.id === clean || `item_${it.id}` === rawId) || items[0];
    };

    const slotsHtml = buildIds.map((id, idx) => {
      const it = resolveItem(id);
      const url = it ? AssetRegistry.toCdnUrl(it.iconKey) : '';
      return `
        <button type="button" class="build-slot-btn ${idx === this.selectedBuildSlot ? 'active-slot' : ''}" data-build-slot="${idx}">
          ${url ? `<img src="${url}" alt="${it.name}">` : ''}
          <span>Slot ${idx + 1}</span>
          <span style="font-size:0.62rem;color:var(--sky-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${it?.name || '-'}</span>
        </button>
      `;
    }).join('');

    const catalogHtml = items.map((it) => `
      <button type="button" class="shop-item-card" data-pick-item="item_${it.id}">
        <img src="${AssetRegistry.toCdnUrl(it.iconKey)}" alt="${it.name}" loading="lazy">
        <div style="flex:1;min-width:0;text-align:left;">
          <div style="font-size:0.78rem;font-weight:700;">${it.name}</div>
          <div style="font-size:0.68rem;color:var(--sky-primary);" class="tabular-nums">${it.price}G • ${it.category}</div>
          <div style="font-size:0.66rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${it.passive}</div>
        </div>
      </button>
    `).join('');

    this.bodyEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong style="color:var(--sky-primary);">Build 6 Slot Aktif (${heroId.toUpperCase()})</strong>
        <span style="font-size:0.75rem;color:var(--text-muted);">Klik slot lalu pilih item di bawah</span>
      </div>
      <div class="profile-build-slots">${slotsHtml}</div>
      <div style="font-weight:800;font-size:0.84rem;color:var(--sky-primary);margin-top:4px;">Ensiklopedia 30 Perlengkapan</div>
      <div class="shop-grid">${catalogHtml}</div>
    `;

    this.bodyEl.querySelectorAll('[data-build-slot]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedBuildSlot = Number(btn.dataset.buildSlot);
        this._renderBuildTab();
      });
    });

    this.bodyEl.querySelectorAll('[data-pick-item]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextBuild = ProfileManager.getHeroBuild(heroId);
        nextBuild[this.selectedBuildSlot] = btn.dataset.pickItem;
        ProfileManager.setHeroBuild(heroId, nextBuild);
        GameStore.setState({ activeBuild: nextBuild });
        this.selectedBuildSlot = (this.selectedBuildSlot + 1) % 6;
        this._renderBuildTab();
      });
    });
  }

  _renderAchievementsTab() {
    const profile = ProfileManager.getProfile();
    const list = RankSystem.achievements || [];
    this.bodyEl.innerHTML = list.map((ach) => {
      const val = profile.achievements?.[ach.id] || 0;
      const unlocked = val >= ach.target;
      const pct = Math.min(100, Math.round((val / Math.max(1, ach.target)) * 100));
      return `
        <div class="settings-row">
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${AssetRegistry.toCdnUrl(ach.iconKey)}" alt="${ach.title}" style="width:42px;height:42px;border-radius:10px;object-fit:contain;">
            <div>
              <div style="font-weight:800;font-size:0.88rem;color:${unlocked ? 'var(--ready-emerald)' : 'var(--text-primary)'};">${ach.title}</div>
              <div style="font-size:0.76rem;color:var(--text-secondary);">${ach.description}</div>
            </div>
          </div>
          <div style="text-align:right;" class="tabular-nums">
            <span class="filter-chip ${unlocked ? 'active' : ''}">${unlocked ? 'TERCAPAI' : `${val}/${ach.target} (${pct}%)`}</span>
          </div>
        </div>
      `;
    }).join('') || '<div style="color:var(--text-muted);">Tidak ada pencapaian tersedia.</div>';
  }

  async _renderLeaderboardTab() {
    this.bodyEl.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;">Memuat peringkat global RAPSONYX...</div>';
    try {
      const base = NETWORK_CONFIG.BACKEND_HTTP;
      const res = await fetch(`${base}/api/leaderboard`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rows = Array.isArray(data.leaderboard) ? data.leaderboard : [];
      this.bodyEl.innerHTML = rows.map((r, i) => `
        <div class="settings-row">
          <div style="display:flex;align-items:center;gap:10px;">
            <strong class="tabular-nums" style="width:24px;color:var(--sky-primary);">#${i + 1}</strong>
            <div>
              <div style="font-weight:800;font-size:0.88rem;">${r.nickname || 'Commander'}</div>
              <div style="font-size:0.74rem;color:var(--text-muted);">${r.rankTier || 'Senbatsu'} • ${r.wins || 0} Menang</div>
            </div>
          </div>
          <div class="tabular-nums" style="font-weight:800;color:var(--sky-primary);">${r.rankStars || 0} Bintang</div>
        </div>
      `).join('') || '<div style="color:var(--text-muted);">Peringkat masih kosong.</div>';
    } catch (_) {
      this.bodyEl.innerHTML = '<div style="color:var(--danger-coral);font-size:0.84rem;">Peringkat cloud sedang beristirahat. Selesaikan 1 pertandingan untuk Sinkronisasi!</div>';
    }
  }
}

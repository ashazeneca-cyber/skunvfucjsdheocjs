/**
 * RAPSONYX MOBA-Style Luminous Frost 3D Lobby Showcase UI
 * - Default Freya stage, tap-to-smile interaction, 360° turntable drag & wheel zoom
 * - Lobby skill preview buttons (Uji S1 / S2 / ULT)
 * - Profile/Rank chip, Bio/Encyclopedia, Build 6-Slot, Private Room 6-char code & Online Wake Status
 */

import { AssetRegistry } from '../core/AssetRegistry.js';
import { AudioDirector } from '../core/AudioDirector.js';
import { GameStore } from '../core/GameStore.js';
import { ProfileManager } from '../core/ProfileManager.js';
import { EventBus } from '../core/EventBus.js';
import { MAP_CATALOG, TEAM_CONFIG } from '../config/constants.js';
import {
  ROSTER_42,
  getHeroById,
  isHeroCoreCached
} from '../character/Roster42Directory.js';
import { BATTLE_SPELLS_8, EMBLEMS_6 } from '../combat/ItemsSpellsEmblems.js';
import { HeroDownloadModal } from './HeroDownloadModal.js';

export class LobbyShowcaseUI {
  constructor({
    onSelectHeroReady,
    onLaunchMatchOrWorld,
    onAtmosphereChanged,
    onOpenDownloadManager,
    onOpenSettings,
    onOpenProfile,
    onTurntableDrag,
    onTurntableZoom,
    onHeroTap,
    onTestSkill
  }) {
    this.onSelectHeroReady = onSelectHeroReady;
    this.onLaunchMatchOrWorld = onLaunchMatchOrWorld;
    this.onAtmosphereChanged = onAtmosphereChanged;
    this.onOpenDownloadManager = onOpenDownloadManager;
    this.onOpenSettings = onOpenSettings;
    this.onOpenProfile = onOpenProfile;
    this.onTurntableDrag = onTurntableDrag;
    this.onTurntableZoom = onTurntableZoom;
    this.onHeroTap = onHeroTap;
    this.onTestSkill = onTestSkill;

    this.rootEl = document.getElementById('lobby-ui');
    this.rosterGridEl = document.getElementById('lobby-roster-grid');
    this.searchInput = document.getElementById('lobby-hero-search');
    this.teamFilterBtns = document.querySelectorAll('[data-team-filter]');
    this.squadBtns = document.querySelectorAll('[data-squad-mode]');
    this.mapListEl = document.getElementById('lobby-map-list');
    this.atmoSelect = document.getElementById('lobby-atmo-select');
    this.spellSelect = document.getElementById('lobby-spell-select');
    this.emblemSelect = document.getElementById('lobby-emblem-select');
    this.roomCodeInput = document.getElementById('lobby-room-code');
    this.roomCreateBtn = document.getElementById('btn-room-create');
    this.launchBtn = document.getElementById('btn-launch-game');
    this.dmBtn = document.getElementById('btn-lobby-dm');
    this.settingsBtn = document.getElementById('btn-lobby-settings');
    this.profileBtn = document.getElementById('btn-lobby-profile');
    this.profileChipBtn = document.getElementById('lobby-profile-chip');
    this.muteBtn = document.getElementById('btn-lobby-mute');
    this.openBuildBtn = document.getElementById('btn-open-build');
    this.heroBioBtn = document.getElementById('btn-hero-bio');
    this.onlinePillEl = document.getElementById('lobby-online-pill');

    // Showcase plate elements
    this.plateNameEl = document.getElementById('showcase-hero-name');
    this.plateMetaEl = document.getElementById('showcase-hero-meta');
    this.plateWeaponEl = document.getElementById('showcase-hero-weapon');
    this.plateSkillsEl = document.getElementById('showcase-hero-skills');
    this.profileAvatarEl = document.getElementById('lobby-profile-avatar');
    this.profileNickEl = document.getElementById('lobby-profile-nick');
    this.rankIconEl = document.getElementById('lobby-rank-icon');
    this.rankNameEl = document.getElementById('lobby-rank-name');
    this.rankStarsEl = document.getElementById('lobby-rank-stars');
    this.dragSurfaceEl = document.getElementById('lobby-turntable-surface');

    this.heroDownloadModal = new HeroDownloadModal();
    this.selectedHeroId = 'freya';
    this.selectedMapId = 'arena_colosseum';
    this.selectedSquadMode = 'SOLO';
    this.selectedSpellId = ProfileManager.getProfile().selectedSpell || BATTLE_SPELLS_8[0].id;
    this.selectedEmblemId = ProfileManager.getProfile().selectedEmblem || EMBLEMS_6[5].id;
    this.activeTeamFilter = 'all';
    this.searchQuery = '';
    this.activeDownloadingHeroId = null;
    this.activeDownloadPct = 0;
  }

  init() {
    this.heroDownloadModal.init();

    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.searchQuery = this.searchInput.value.trim().toLowerCase();
        this.renderRoster();
      });
    }

    this.teamFilterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeTeamFilter = btn.dataset.teamFilter;
        this.teamFilterBtns.forEach((b) => b.classList.toggle('active', b === btn));
        this.renderRoster();
      });
    });

    this.squadBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedSquadMode = btn.dataset.squadMode;
        this.squadBtns.forEach((b) => b.classList.toggle('active', b === btn));
      });
    });

    if (this.atmoSelect) {
      this.atmoSelect.addEventListener('change', () => {
        this.onAtmosphereChanged?.(this.atmoSelect.value);
      });
    }

    if (this.spellSelect) {
      this.spellSelect.innerHTML = BATTLE_SPELLS_8.map((s) => `<option value="${s.id}">${s.name} (CD ${s.cooldown}s)</option>`).join('');
      this.spellSelect.value = this.selectedSpellId;
      this.spellSelect.addEventListener('change', () => {
        this.selectedSpellId = this.spellSelect.value;
        ProfileManager.setSpell(this.selectedSpellId);
      });
    }

    if (this.emblemSelect) {
      this.emblemSelect.innerHTML = EMBLEMS_6.map((e) => `<option value="${e.id}">${e.name}</option>`).join('');
      this.emblemSelect.value = this.selectedEmblemId;
      this.emblemSelect.addEventListener('change', () => {
        this.selectedEmblemId = this.emblemSelect.value;
        ProfileManager.setEmblem(this.selectedEmblemId);
      });
    }

    if (this.roomCreateBtn && this.roomCodeInput) {
      this.roomCreateBtn.addEventListener('click', () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        this.roomCodeInput.value = code;
      });
    }

    if (this.dmBtn) this.dmBtn.addEventListener('click', () => this.onOpenDownloadManager?.());
    if (this.settingsBtn) this.settingsBtn.addEventListener('click', () => this.onOpenSettings?.());
    if (this.profileBtn) this.profileBtn.addEventListener('click', () => this.onOpenProfile?.('profile'));
    if (this.profileChipBtn) this.profileChipBtn.addEventListener('click', () => this.onOpenProfile?.('profile'));
    if (this.openBuildBtn) this.openBuildBtn.addEventListener('click', () => this.onOpenProfile?.('build', this.selectedHeroId));
    if (this.heroBioBtn) this.heroBioBtn.addEventListener('click', () => this.onOpenProfile?.('bio', this.selectedHeroId));

    if (this.muteBtn) {
      this._syncMuteLabel();
      this.muteBtn.addEventListener('click', () => {
        AudioDirector.toggleMute();
        this._syncMuteLabel();
      });
    }

    document.getElementById('btn-test-s1')?.addEventListener('click', () => this.onTestSkill?.('s1'));
    document.getElementById('btn-test-s2')?.addEventListener('click', () => this.onTestSkill?.('s2'));
    document.getElementById('btn-test-ult')?.addEventListener('click', () => this.onTestSkill?.('ult'));

    if (this.launchBtn) {
      this.launchBtn.addEventListener('click', () => {
        const roomCode = (this.roomCodeInput?.value || '').trim().toUpperCase().slice(0, 6);
        this.onLaunchMatchOrWorld?.({
          heroId: this.selectedHeroId,
          mapId: this.selectedMapId,
          squadMode: this.selectedSquadMode,
          spellId: this.selectedSpellId,
          emblemId: this.selectedEmblemId,
          roomCode
        });
      });
    }

    // 360° Turntable Drag + Tap-to-Happy + Scroll Wheel Zoom
    if (this.dragSurfaceEl) {
      let dragging = false;
      let lastX = 0;
      let startX = 0;
      let movedDist = 0;

      this.dragSurfaceEl.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button, input, select')) return;
        dragging = true;
        lastX = e.clientX;
        startX = e.clientX;
        movedDist = 0;
      });
      window.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        movedDist += Math.abs(e.clientX - startX) > 2 ? Math.abs(dx) : 0;
        this.onTurntableDrag?.(dx);
      });
      window.addEventListener('pointerup', (e) => {
        if (!dragging) return;
        dragging = false;
        if (movedDist < 6 && !e.target.closest('button')) {
          this.onHeroTap?.();
        }
      });
      this.dragSurfaceEl.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.onTurntableZoom?.(e.deltaY);
      }, { passive: false });
    }

    EventBus.on('profile:updated', () => this.refreshProfileChip());

    this.refreshProfileChip();
    this.renderMaps();
    this.renderRoster();
    this.updateShowcasePlate(this.selectedHeroId);
  }

  _syncMuteLabel() {
    if (!this.muteBtn) return;
    this.muteBtn.textContent = AudioDirector.isMuted() ? 'Suara: Bisu' : 'Suara';
  }

  setOnlineStatus(text, isReady = true) {
    if (!this.onlinePillEl) return;
    this.onlinePillEl.textContent = text;
    this.onlinePillEl.style.color = isReady ? 'var(--ready-emerald)' : 'var(--text-muted)';
  }

  refreshProfileChip() {
    const s = ProfileManager.getSummary();
    const hero = getHeroById(s.avatarHeroId || this.selectedHeroId);
    if (this.profileNickEl) this.profileNickEl.textContent = s.nickname;
    if (this.profileAvatarEl) this.profileAvatarEl.src = AssetRegistry.toCdnUrl(hero.portraitPath);
    if (this.rankIconEl) this.rankIconEl.src = AssetRegistry.toCdnUrl(s.rank.iconKey);
    if (this.rankNameEl) this.rankNameEl.textContent = s.rank.displayLabel;
    if (this.rankStarsEl) this.rankStarsEl.textContent = `(${s.rank.totalStars} Bintang)`;
  }

  show() {
    this._syncMuteLabel();
    this.refreshProfileChip();
    this.renderRoster();
  }

  hide() {
    // Handled cleanly by SceneDirector
  }

  renderMaps() {
    if (!this.mapListEl) return;
    const displayMaps = [
      MAP_CATALOG.arena_colosseum,
      MAP_CATALOG.arena_ocean_bridge,
      MAP_CATALOG.arena_sky_sakura,
      MAP_CATALOG.arena_mist_duel,
      MAP_CATALOG.sandbox_open_world,
      MAP_CATALOG.sandbox_valley
    ];

    this.mapListEl.innerHTML = '';
    for (const m of displayMaps) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `map-option-btn${m.id === this.selectedMapId ? ' selected' : ''}`;
      const badgeText = m.mode === 'ARENA' ? `${m.teamCount} Faksi` : 'Jelajah';
      btn.innerHTML = `
        <img src="${AssetRegistry.toCdnUrl(m.cardAlias)}" alt="${m.name}" loading="lazy">
        <div style="flex:1; min-width:0;">
          <div style="font-size:0.78rem; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.name}</div>
          <div style="font-size:0.68rem; color:var(--text-muted);">${badgeText}</div>
        </div>
      `;
      btn.addEventListener('click', () => {
        this.selectedMapId = m.id;
        GameStore.setState({ selectedArenaId: m.id });
        this.renderMaps();
      });
      this.mapListEl.appendChild(btn);
    }
  }

  renderRoster() {
    if (!this.rosterGridEl) return;
    const filtered = ROSTER_42.filter((h) => {
      if (this.activeTeamFilter !== 'all' && h.team !== this.activeTeamFilter) return false;
      if (this.searchQuery && !h.name.toLowerCase().includes(this.searchQuery) && !h.roleLane.toLowerCase().includes(this.searchQuery)) {
        return false;
      }
      return true;
    });

    this.rosterGridEl.innerHTML = '';
    for (const hero of filtered) {
      const cached = isHeroCoreCached(hero.id);
      const isSelected = hero.id === this.selectedHeroId;
      const isDownloading = this.activeDownloadingHeroId === hero.id;
      const mbStr = (hero.bytes.total / 1048576).toFixed(1);

      const card = document.createElement('button');
      card.type = 'button';
      card.className = `hero-card${isSelected ? ' selected' : ''}`;
      card.innerHTML = `
        <img src="${AssetRegistry.toCdnUrl(hero.portraitPath)}" alt="${hero.name}" loading="lazy">
        <span class="hero-card-badge${cached ? ' cached' : ''}">${cached ? 'SIAP' : `${mbStr}MB`}</span>
        ${isDownloading ? `<div class="hero-card-ring-overlay tabular-nums">${Math.round(this.activeDownloadPct)}%</div>` : ''}
        <div class="hero-card-name">${hero.name}</div>
      `;
      card.addEventListener('click', () => this._handleHeroCardClicked(hero.id));
      this.rosterGridEl.appendChild(card);
    }
  }

  _handleHeroCardClicked(heroId) {
    if (isHeroCoreCached(heroId)) {
      this._activateHeroInLobby(heroId);
      return;
    }

    this.heroDownloadModal.openConfirm(heroId, async (confirmedId) => {
      this.activeDownloadingHeroId = confirmedId;
      this.activeDownloadPct = 0;
      this.renderRoster();

      const ok = await this.heroDownloadModal.downloadHeroPack(confirmedId, {
        onCardProgress: (hId, pct) => {
          this.activeDownloadingHeroId = hId;
          this.activeDownloadPct = pct;
          this.renderRoster();
        }
      });

      if (ok) {
        this.heroDownloadModal.setLoadingCharacterPhase(confirmedId);
        await this._activateHeroInLobby(confirmedId);
        this.heroDownloadModal.hidePedestalRing(250);
      } else {
        this.heroDownloadModal.hidePedestalRing(100);
      }
      this.activeDownloadingHeroId = null;
      this.renderRoster();
    });
  }

  async _activateHeroInLobby(heroId) {
    this.selectedHeroId = heroId;
    GameStore.setState({ selectedHeroId: heroId });
    ProfileManager.setAvatarHero(heroId);
    this.updateShowcasePlate(heroId);
    this.renderRoster();
    if (this.onSelectHeroReady) {
      await this.onSelectHeroReady(heroId);
    }
  }

  updateShowcasePlate(heroId) {
    const h = getHeroById(heroId);
    const teamCfg = TEAM_CONFIG[h.team] || TEAM_CONFIG.team_dream;
    if (this.plateNameEl) this.plateNameEl.textContent = h.name;
    if (this.plateMetaEl) {
      this.plateMetaEl.textContent = `${teamCfg.name} • ${h.roleLane}`;
      this.plateMetaEl.style.color = teamCfg.colorHex;
    }
    if (this.plateWeaponEl) this.plateWeaponEl.textContent = h.weaponName;
    if (this.plateSkillsEl) {
      const sk = ['passive', 'skill_1', 'skill_2', 'ultimate'];
      this.plateSkillsEl.innerHTML = sk.map((slot) => {
        const iconUrl = AssetRegistry.toCdnUrl(`assets/ui/skill_icons_672/skill_icons_672_states/ready_framed/${h.id}_${slot}.webp`);
        const title = (h.skills[slot] || slot).replace(/"/g, '&quot;');
        return `<img src="${iconUrl}" alt="${slot}" title="${title}" style="width:30px;height:30px;border-radius:7px;border:1.5px solid ${teamCfg.colorHex};object-fit:cover;">`;
      }).join('');
    }
  }
}

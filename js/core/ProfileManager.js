/**
 * RAPSONYX Player Profile & Progression Manager
 * Persists rank stars, match history, custom 6-slot hero builds, achievements & nickname in localStorage.
 */

import { PROFILE_STORAGE_KEY, NETWORK_CONFIG } from '../config/constants.js';
import { EventBus } from './EventBus.js';
import { RankSystem } from '../combat/RankSystem.js';

const DEFAULT_PROFILE = Object.freeze({
  playerId: '',
  nickname: 'Commander',
  avatarHeroId: 'freya',
  rankStars: 12, // Starts Rookie I / Rising Star boundary
  matchesPlayed: 0,
  wins: 0,
  kills: 0,
  deaths: 0,
  assists: 0,
  mvpCount: 0,
  shieldBreaks: 0,
  worldExploredCount: 0,
  selectedSpell: 'spell_flicker',
  selectedEmblem: 'emb_fighter',
  customBuilds: {},
  achievements: {
    first_blood: 0,
    shield_breaker: 0,
    mvp_crown: 0,
    savage_streak: 0,
    team_wipe_master: 0,
    world_explorer: 0
  },
  matchHistory: []
});

function genId() {
  return 'rpx_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

class ProfileManagerService {
  constructor() {
    this.profile = {
      ...DEFAULT_PROFILE,
      achievements: { ...DEFAULT_PROFILE.achievements },
      customBuilds: {},
      matchHistory: []
    };
    this.profile = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged = {
          ...DEFAULT_PROFILE,
          ...parsed,
          achievements: { ...DEFAULT_PROFILE.achievements, ...(parsed.achievements || {}) },
          customBuilds: { ...(parsed.customBuilds || {}) },
          matchHistory: Array.isArray(parsed.matchHistory) ? parsed.matchHistory.slice(0, 20) : []
        };
        if (!merged.playerId) merged.playerId = genId();
        return merged;
      }
    } catch (_) {}
    const fresh = {
      ...DEFAULT_PROFILE,
      playerId: genId(),
      achievements: { ...DEFAULT_PROFILE.achievements },
      customBuilds: {},
      matchHistory: []
    };
    this.profile = fresh;
    this._save(fresh);
    return fresh;
  }

  _save(profile = this.profile) {
    if (profile) this.profile = profile;
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(this.profile));
    } catch (_) {}
    EventBus.emit('profile:updated', this.getSummary());
  }

  getProfile() {
    return this.profile;
  }

  getSummary() {
    const p = this.profile || DEFAULT_PROFILE;
    const rank = RankSystem.resolveRank(p.rankStars);
    const winrate = p.matchesPlayed > 0
      ? Math.round((p.wins / p.matchesPlayed) * 100)
      : 0;
    return {
      ...p,
      rank,
      winrate
    };
  }

  setNickname(name) {
    const cleaned = String(name || '').trim().slice(0, 18) || 'Commander';
    this.profile.nickname = cleaned;
    this._save();
    return cleaned;
  }

  setAvatarHero(heroId) {
    if (!heroId) return;
    this.profile.avatarHeroId = heroId;
    this._save();
  }

  setSpell(spellId) {
    if (!spellId) return;
    this.profile.selectedSpell = spellId;
    this._save();
  }

  setEmblem(emblemId) {
    if (!emblemId) return;
    this.profile.selectedEmblem = emblemId;
    this._save();
  }

  getHeroBuild(heroId, fallbackBuild = null) {
    const saved = this.profile.customBuilds?.[heroId];
    if (Array.isArray(saved) && saved.length === 6) return [...saved];
    return fallbackBuild ? [...fallbackBuild] : [
      'item_rapsonyx_boots', 'item_starlight_blade', 'item_crimson_scythe', 'item_solar_halberd', 'item_valkyrie_aegis', 'item_phoenix_feather'
    ];
  }

  setHeroBuild(heroId, items) {
    if (!heroId || !Array.isArray(items)) return;
    this.profile.customBuilds[heroId] = items.slice(0, 6);
    this._save();
  }

  recordExplorerVisit() {
    this.profile.worldExploredCount = (this.profile.worldExploredCount || 0) + 1;
    this.profile.achievements.world_explorer = Math.max(this.profile.achievements.world_explorer || 0, 1);
    this._save();
  }

  recordMatchResult({
    won = false,
    heroId = 'freya',
    arenaId = 'arena_colosseum',
    kills = 0,
    deaths = 0,
    assists = 0,
    isMvp = false,
    firstBlood = false,
    shieldBreaks = 0,
    savage = false,
    teamWipe = false
  } = {}) {
    const prevStars = this.profile.rankStars || 0;
    const starDelta = RankSystem.computeStarDelta({ prevStars, won, isMvp });
    this.profile.rankStars = Math.max(0, prevStars + starDelta);
    this.profile.matchesPlayed += 1;
    if (won) this.profile.wins += 1;
    this.profile.kills += kills;
    this.profile.deaths += deaths;
    this.profile.assists += assists;
    if (isMvp) this.profile.mvpCount += 1;
    this.profile.shieldBreaks = (this.profile.shieldBreaks || 0) + (shieldBreaks || 0);

    if (firstBlood) this.profile.achievements.first_blood += 1;
    if (shieldBreaks > 0) this.profile.achievements.shield_breaker += shieldBreaks;
    if (isMvp) this.profile.achievements.mvp_crown += 1;
    if (savage) this.profile.achievements.savage_streak += 1;
    if (teamWipe) this.profile.achievements.team_wipe_master += 1;

    this.profile.matchHistory.unshift({
      ts: Date.now(),
      won,
      heroId,
      arenaId,
      kda: `${kills}/${deaths}/${assists}`,
      isMvp,
      starDelta
    });
    if (this.profile.matchHistory.length > 20) this.profile.matchHistory.length = 20;

    this._save();
    this.syncMatchToBackend({ heroId, arenaId, won, kills, deaths, assists, isMvp, starDelta }).catch(() => {});
    return { starDelta, rank: RankSystem.resolveRank(this.profile.rankStars) };
  }

  async syncMatchToBackend(payload) {
    const base = NETWORK_CONFIG.BACKEND_HTTP || NETWORK_CONFIG.BACKEND_URL;
    if (!base) return;
    await fetch(`${base}/api/match-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: this.profile.playerId,
        nickname: this.profile.nickname,
        rankStars: this.profile.rankStars,
        rankTier: RankSystem.resolveRank(this.profile.rankStars).tierName,
        wins: this.profile.wins,
        matchesPlayed: this.profile.matchesPlayed,
        mvpCount: this.profile.mvpCount,
        ...payload
      }),
      signal: AbortSignal.timeout(8000)
    });
  }
}

export const ProfileManager = new ProfileManagerService();

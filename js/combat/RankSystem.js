/**
 * RAPSONYX Rank & Progression System
 * Manages 9 Competitive Tiers (Trainee -> Rapsonyx Sovereign), divisions, stars & badges.
 */

const DEFAULT_TIERS = Object.freeze([
  { id: 'trainee', tierIndex: 1, name: 'Trainee', divisions: ['III', 'II', 'I'], starsPerDivision: 3, iconKey: 'rank_01_trainee', minStars: 0, accent: '#94a3b8' },
  { id: 'rookie', tierIndex: 2, name: 'Rookie', divisions: ['III', 'II', 'I'], starsPerDivision: 3, iconKey: 'rank_02_rookie', minStars: 9, accent: '#38bdf8' },
  { id: 'rising_star', tierIndex: 3, name: 'Rising Star', divisions: ['IV', 'III', 'II', 'I'], starsPerDivision: 4, iconKey: 'rank_03_rising_star', minStars: 18, accent: '#22d3ee' },
  { id: 'senbatsu', tierIndex: 4, name: 'Senbatsu', divisions: ['IV', 'III', 'II', 'I'], starsPerDivision: 4, iconKey: 'rank_04_senbatsu', minStars: 34, accent: '#0284c7' },
  { id: 'center', tierIndex: 5, name: 'Center', divisions: ['V', 'IV', 'III', 'II', 'I'], starsPerDivision: 5, iconKey: 'rank_05_center', minStars: 50, accent: '#2563eb' },
  { id: 'ace', tierIndex: 6, name: 'Ace', divisions: ['V', 'IV', 'III', 'II', 'I'], starsPerDivision: 5, iconKey: 'rank_06_ace', minStars: 75, accent: '#10b981' },
  { id: 'legend', tierIndex: 7, name: 'Legend', divisions: ['V', 'IV', 'III', 'II', 'I'], starsPerDivision: 5, iconKey: 'rank_07_legend', minStars: 100, accent: '#34d399' },
  { id: 'mythic', tierIndex: 8, name: 'Mythic', divisions: ['Honor'], starsPerDivision: 25, iconKey: 'rank_08_mythic', minStars: 125, accent: '#0ea5e9' },
  { id: 'sovereign', tierIndex: 9, name: 'Rapsonyx Sovereign', divisions: ['Immortal'], starsPerDivision: 9999, iconKey: 'rank_09_sovereign', minStars: 150, accent: '#06b6d4' }
]);

class RankSystemService {
  constructor() {
    this.tiers = [...DEFAULT_TIERS];
    this.achievements = [];
    this.statusGlossary = [];
    this._loaded = false;
  }

  async loadData() {
    if (this._loaded) return this.tiers;
    try {
      const res = await fetch(new URL('../../data/ranks_achievements.json', import.meta.url), { cache: 'no-cache' });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.tiers) && json.tiers.length) {
          this.tiers = json.tiers;
        }
        if (Array.isArray(json.achievements)) this.achievements = json.achievements;
        if (Array.isArray(json.statusGlossary)) this.statusGlossary = json.statusGlossary;
        this._loaded = true;
      }
    } catch (_) {}
    return this.tiers;
  }

  getTiers() {
    return this.tiers;
  }

  resolveRank(totalStars = 0) {
    const stars = Math.max(0, Math.floor(Number(totalStars) || 0));
    let activeTier = this.tiers[0];
    for (const t of this.tiers) {
      if (stars >= t.minStars) activeTier = t;
    }
    const offset = Math.max(0, stars - activeTier.minStars);
    const divs = activeTier.divisions || ['I'];
    const perDiv = Math.max(1, activeTier.starsPerDivision || 3);
    const divIdx = Math.min(divs.length - 1, Math.floor(offset / perDiv));
    const division = divs[divIdx];
    const starsInDivision = activeTier.id === 'mythic' || activeTier.id === 'sovereign'
      ? offset
      : (offset % perDiv) + 1;

    const displayLabel = activeTier.id === 'mythic' || activeTier.id === 'sovereign'
      ? `${activeTier.name} • ${offset} Bintang`
      : `${activeTier.name} ${division}`;

    return {
      tierId: activeTier.id,
      tierIndex: activeTier.tierIndex,
      tierName: activeTier.name,
      division,
      starsInDivision,
      starsPerDiv: perDiv,
      totalStars: stars,
      iconKey: activeTier.iconKey,
      starIconKey: 'rank_star',
      accent: activeTier.accent || '#38bdf8',
      displayLabel
    };
  }

  computeStarDelta({ prevStars = 0, won = false, isMvp = false } = {}) {
    if (won) {
      return isMvp ? 2 : 1;
    }
    if (prevStars < 9) return 0; // Demotion protection during Trainee tier
    return isMvp ? 0 : -1;
  }
}

export const RankSystem = new RankSystemService();

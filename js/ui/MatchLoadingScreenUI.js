/**
 * RAPSONYX Multi-Team VS Loading Screen (Supports 2-Team & 3-Team Tri-Faction Grid)
 */

import { AssetRegistry } from '../core/AssetRegistry.js';
import { MAP_CATALOG, TEAM_CONFIG } from '../config/constants.js';
import { getHeroById } from '../character/Roster42Directory.js';

export class MatchLoadingScreenUI {
  constructor() {
    this.rootEl = document.getElementById('vs-loading-screen');
    this.titleEl = document.getElementById('vs-map-title');
    this.gridEl = document.getElementById('vs-grid-container');
    this.statusEl = document.getElementById('vs-load-status');
    this.barFillEl = document.getElementById('vs-load-fill');
  }

  show({ mapId, combatants = [], playerTeam = 'team_dream' }) {
    if (!this.rootEl) return;
    const mapCfg = MAP_CATALOG[mapId] || MAP_CATALOG.arena_colosseum;
    this.rootEl.style.backgroundImage = `url("${AssetRegistry.toCdnUrl(mapCfg.bgVsAlias)}")`;
    if (this.titleEl) this.titleEl.textContent = mapCfg.name;
    if (this.barFillEl) this.barFillEl.style.width = '12%';
    if (this.statusEl) this.statusEl.textContent = 'MEMPERSIAPKAN ARENA RAPSONYX...';

    if (this.gridEl) {
      const grouped = new Map();
      const factions = mapCfg.factions || [playerTeam];
      for (const f of factions) grouped.set(f, []);
      for (const u of combatants) {
        if (!grouped.has(u.team)) grouped.set(u.team, []);
        grouped.get(u.team).push(u);
      }

      const vsBadgeUrl = AssetRegistry.toCdnUrl('emblem_vs_metallic');
      const colsHtml = [];
      let idx = 0;
      for (const [teamId, members] of grouped.entries()) {
        const cfg = TEAM_CONFIG[teamId] || TEAM_CONFIG.team_dream;
        const rows = members.map((u) => {
          const h = getHeroById(u.heroId);
          return `
            <div class="vs-hero-slot">
              <img src="${AssetRegistry.toCdnUrl(h.portraitPath)}" alt="${h.name}">
              <div>
                <div style="font-size:0.84rem;font-weight:700;">${h.name}${u.isPlayer ? ' (ANDA)' : ''}</div>
                <div style="font-size:0.7rem;color:var(--text-muted);">${h.archetype}</div>
              </div>
            </div>
          `;
        }).join('');

        colsHtml.push(`
          <div class="vs-faction-column" style="border-color:${cfg.colorHex};">
            <div style="font-family:var(--font-display);font-weight:700;color:${cfg.colorHex};font-size:0.95rem;">${cfg.name}</div>
            ${rows}
          </div>
        `);
        if (idx < grouped.size - 1) {
          colsHtml.push(`<img src="${vsBadgeUrl}" alt="VS" style="width:52px;height:52px;object-fit:contain;">`);
        }
        idx++;
      }
      this.gridEl.innerHTML = colsHtml.join('');
    }

    this.rootEl.classList.remove('hidden');
  }

  setProgress(pct, label = null) {
    if (this.barFillEl) this.barFillEl.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    if (label && this.statusEl) this.statusEl.textContent = label;
  }

  hide() {
    if (this.rootEl) this.rootEl.classList.add('hidden');
  }
}

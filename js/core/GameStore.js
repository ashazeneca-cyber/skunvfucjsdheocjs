/**
 * RAPSONYX Reactive Centralized Store
 * Single source of truth for current screen, hero, mode, arena, and UI state.
 */

import { EventBus } from './EventBus.js';

const INITIAL_STATE = {
  scene: 'splash', // 'splash' | 'loading' | 'lobby' | 'match_loading' | 'war' | 'sandbox'
  selectedHeroId: 'freya',
  selectedArenaId: 'arena_colosseum',
  selectedAtmosphere: 'rapsonyx_day',
  selectedSpellId: 'spell_flicker',
  selectedEmblemId: 'emb_fighter',
  activeBuild: [
    'item_rapsonyx_boots',
    'item_starlight_blade',
    'item_crimson_scythe',
    'item_solar_halberd',
    'item_valkyrie_aegis',
    'item_phoenix_feather'
  ],
  gameMode: 'war', // 'war' | 'sandbox' | 'practice'
  bootMediaReady: false,
  starterReady: false,
  lobbyReady: false,
  onlineConnected: false,
  onlinePlayersCount: 0,
  roomCode: '',
  audioMuted: false,
  fpsCap: 60,
  heroDataCache: null,
  encyclopediaDataCache: null,
  ranksDataCache: null
};

class GameStoreService {
  constructor() {
    this.state = { ...INITIAL_STATE };
    this._watchers = new Set();
  }

  get(key) {
    return key ? this.state[key] : { ...this.state };
  }

  setState(patch) {
    if (!patch || typeof patch !== 'object') return;
    const prev = { ...this.state };
    const changedKeys = [];
    for (const [k, v] of Object.entries(patch)) {
      if (this.state[k] !== v) {
        this.state[k] = v;
        changedKeys.push(k);
      }
    }
    if (!changedKeys.length) return;

    for (const fn of [...this._watchers]) {
      try {
        fn(this.state, prev, changedKeys);
      } catch (err) {
        console.warn('[GameStore watcher]', err?.message || err);
      }
    }
    EventBus.emit('store:changed', { state: this.state, prev, changedKeys });
    for (const k of changedKeys) {
      EventBus.emit(`store:${k}`, this.state[k]);
    }
  }

  subscribe(fn) {
    if (typeof fn !== 'function') return () => {};
    this._watchers.add(fn);
    return () => this._watchers.delete(fn);
  }
}

export const GameStore = new GameStoreService();

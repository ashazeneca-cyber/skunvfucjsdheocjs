/**
 * RAPSONYX Scene Director
 * Cleanly orchestrates transitions across Splash, Loading, Lobby, Match Loading, War & Sandbox.
 */

import { GameStore } from './GameStore.js';
import { EventBus } from './EventBus.js';

const SCREEN_IDS = Object.freeze({
  splash: 'splash-intro-screen',
  loading: 'pre-entry-screen',
  lobby: 'lobby-ui',
  match_loading: 'vs-loading-screen',
  war: 'ingame-hud',
  sandbox: 'ingame-hud'
});

class SceneDirectorService {
  constructor() {
    this.current = 'splash';
  }

  goTo(sceneName, detail = {}) {
    const prev = this.current;
    this.current = sceneName;
    GameStore.setState({ scene: sceneName });
    if (document.body) {
      document.body.dataset.scene = sceneName;
    }

    const targets = new Set(['splash-intro-screen', 'pre-entry-screen', 'lobby-ui', 'vs-loading-screen', 'ingame-hud']);
    const keepVisible = SCREEN_IDS[sceneName];

    for (const id of targets) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (id === keepVisible) {
        el.classList.remove('hidden', 'fade-out');
        el.removeAttribute('aria-hidden');
      } else {
        el.classList.add('hidden');
        el.setAttribute('aria-hidden', 'true');
      }
    }

    EventBus.emit('scene:changed', { from: prev, to: sceneName, detail });
  }
}

export const SceneDirector = new SceneDirectorService();

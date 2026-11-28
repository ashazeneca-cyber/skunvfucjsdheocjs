/**
 * RAPSONYX Stage-1 Black Splash & Priority-0 Boot Prefetcher
 * Sequence: Pitch Black (180ms) -> Maker Community Logo (1.2s) -> Smooth Crossfade over Luminous Frost
 * Concurrently downloads ONLY Priority-0 (bg_loading_main + bgm_loading_main) without blocking reveal
 */

import { PreEntryDownloader } from '../core/PreEntryDownloader.js';
import { SceneDirector } from '../core/SceneDirector.js';
import { GameStore } from '../core/GameStore.js';

export class SplashIntroUI {
  constructor() {
    this.rootEl = document.getElementById('splash-intro-screen');
  }

  async playAndPrefetch() {
    SceneDirector.goTo('splash');

    // Priority-0 runs concurrently without delaying Frost crossfade
    const priority2Promise = Promise.race([
      PreEntryDownloader.prefetchBootPriority2(),
      new Promise((resolve) => setTimeout(() => resolve({ ready: false, bgUrl: null }), 8000))
    ])
      .then((res) => {
        GameStore.setState({ bootMediaReady: Boolean(res?.ready) });
        return res;
      })
      .catch(() => ({ ready: false, bgUrl: null }));

    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tBlack = reduced ? 50 : 180;
    const tMaker = reduced ? 350 : 1200;
    const tFade = reduced ? 120 : 400;

    if (this.rootEl) {
      this.rootEl.dataset.stage = 'black';
      await new Promise((r) => setTimeout(r, tBlack));
      this.rootEl.dataset.stage = 'maker';
      await new Promise((r) => setTimeout(r, tMaker));

      // Reveal Luminous Frost panel underneath BEFORE fading black splash out (zero black void)
      const preEl = document.getElementById('pre-entry-screen');
      if (preEl) {
        preEl.classList.remove('hidden');
        preEl.removeAttribute('aria-hidden');
      }
      const svgEl = document.getElementById('pre-entry-rapsonyx-svg');
      if (svgEl) svgEl.classList.add('active');
      if (document.body) document.body.dataset.scene = 'loading';

      this.rootEl.classList.add('fade-out');
      await new Promise((r) => setTimeout(r, tFade));
    }

    SceneDirector.goTo('loading');
    return { priority2Promise };
  }
}

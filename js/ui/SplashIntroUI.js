/**
 * RAPSONYX Stage-1 Black Splash & Priority-0 Boot Prefetcher
 * Sequence: Pitch Black (240ms) -> Maker Community Logo (1.4s) -> Fade into Frost Loading Screen
 * Concurrently downloads ONLY Priority-0 (bg_loading_main + bgm_loading_main) into Cache/IDB
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

    // Priority-0: Only 2 files during black splash so loading screen appears with HD frost art & BGM
    const priority2Promise = Promise.race([
      PreEntryDownloader.prefetchBootPriority2(),
      new Promise((resolve) => setTimeout(() => resolve({ ready: false, bgUrl: null }), 4000))
    ]);

    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tBlack = reduced ? 60 : 240;
    const tMaker = reduced ? 450 : 1450;
    const tFade = reduced ? 160 : 420;

    if (this.rootEl) {
      this.rootEl.dataset.stage = 'black';
      await new Promise((r) => setTimeout(r, tBlack));
      this.rootEl.dataset.stage = 'maker';
      await new Promise((r) => setTimeout(r, tMaker));
      this.rootEl.classList.add('fade-out');
      await new Promise((r) => setTimeout(r, tFade));
    }

    const bootMedia = await priority2Promise;
    GameStore.setState({ bootMediaReady: Boolean(bootMedia?.ready) });
    SceneDirector.goTo('loading', { bgUrl: bootMedia?.bgUrl || null });
    return bootMedia;
  }
}

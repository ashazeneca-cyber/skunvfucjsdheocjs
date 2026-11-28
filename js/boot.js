/**
 * RAPSONYX Entry Bootstrap (NAI Engine)
 * Stage 1: Black Splash + Maker Community Logo + concurrent Priority-0 fetch (2 files)
 * Stage 2: Luminous Frost Loading Screen + Starter Gatekeeper (while Three.js lazy-preloads)
 */

import { SplashIntroUI } from './ui/SplashIntroUI.js';
import { LoadingScreenUI } from './ui/LoadingScreenUI.js';
import { RankSystem } from './combat/RankSystem.js';

window.__RAPSONYX_BOOT_MANAGED__ = true;

let engineModulePromise = null;
function getEngineModule() {
  if (!engineModulePromise) {
    engineModulePromise = import('./main.js');
  }
  return engineModulePromise;
}

async function startBoot() {
  if (window.__RAPSONYX_BOOT_STARTED__) return;
  window.__RAPSONYX_BOOT_STARTED__ = true;

  // Preload heavy 3D engine & rank tables concurrently while splash animates
  getEngineModule().catch(() => {});
  RankSystem.loadData().catch(() => {});

  const splash = new SplashIntroUI();
  const loadingScreen = new LoadingScreenUI(async () => {
    const mod = await getEngineModule();
    await mod.bootAndEnterLobby();
  });
  window.__RAPSONYX_LOADING__ = loadingScreen;

  try {
    const bootPayload = await splash.playAndPrefetch();
    await loadingScreen.start(bootPayload);
  } catch (err) {
    console.error('[RAPSONYX] Gatekeeper bootstrap error:', err);
    await loadingScreen.start(null).catch(() => {});
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', startBoot, { once: true });
} else {
  startBoot();
}

/**
 * RAPSONYX Main Engine Bootstrap & Fixed-Timestep 60Hz Orchestrator
 * Strictly pure RAPSONYX branding, zero voice-over, Pre-Entry Gatekeeper enforced.
 */

import * as THREE from 'three';
import { MAP_CATALOG, PHYSICS_CONSTANTS, TEAM_CONFIG } from './config/constants.js';
import { AssetRegistry } from './core/AssetRegistry.js';
import { ResourceDisposer } from './core/ResourceDisposer.js';
import { ViewportDisplayManager, toggleFullscreenMode } from './core/ViewportDisplayManager.js';
import { GraphicsPresetManager } from './core/GraphicsPresetManager.js';
import { InputManager } from './core/InputManager.js';
import { AudioDirector } from './core/AudioDirector.js';
import { SceneDirector } from './core/SceneDirector.js';
import { GameStore } from './core/GameStore.js';
import { ProfileManager } from './core/ProfileManager.js';
import { RankSystem } from './combat/RankSystem.js';
import { RapsonyxLighting } from './shaders/RapsonyxLighting.js';
import { PostProcessingPipeline } from './shaders/PostProcessingPipeline.js';
import { RapsonyxCharacterShader } from './shaders/RapsonyxCharacterShader.js';
import { WebGPU_TSL_Adapter } from './shaders/WebGPU_TSL_Adapter.js';
import { WorldModeManager } from './world/WorldModeManager.js';
import { getHeroById } from './character/Roster42Directory.js';
import { CharacterRigController } from './character/CharacterRigController.js';
import { FootIKSolver } from './character/FootIKSolver.js';
import { FacialAnimationDirector } from './character/FacialAnimationDirector.js';
import { WeaponGripSolver } from './character/WeaponGripSolver.js';
import { HeroChoreography } from './character/HeroChoreography.js';
import { LocomotionController } from './character/LocomotionController.js';
import { SkillVfxDirector } from './combat/SkillVfxDirector.js';
import { WarModeController } from './combat/WarModeController.js';
import { OnlineSyncClient } from './net/OnlineSyncClient.js';
import { SplashIntroUI } from './ui/SplashIntroUI.js';
import { LoadingScreenUI } from './ui/LoadingScreenUI.js';
import { DownloadManagerModal } from './ui/DownloadManagerModal.js';
import { SettingsModalUI } from './ui/SettingsModalUI.js';
import { ProfileModalUI } from './ui/ProfileModalUI.js';
import { LobbyShowcaseUI } from './ui/LobbyShowcaseUI.js';
import { MatchLoadingScreenUI } from './ui/MatchLoadingScreenUI.js';
import { InGameHudUI } from './ui/InGameHudUI.js';

class RapsonyxGameApp {
  constructor() {
    this.canvas = document.getElementById('rapsonyx-webgl-canvas');
    this.portraitOverlayEl = document.getElementById('portrait-guard-overlay');
    this.portraitEnterBtn = document.getElementById('btn-portrait-fullscreen');

    this.mode = 'GATE'; // 'GATE' | 'LOBBY' | 'PLAYING'
    this.activeHeroId = 'freya';
    this.activeMapId = 'lobby_terrarium';
    this.lobbyCamDist = 4.35;
    this.lastRenderStamp = 0;
    this.fixedAccumulator = 0;
    this.lastFrameTime = performance.now();
  }

  async boot({ skipGate = false } = {}) {
    // 0. Bind Pre-Entry Screen only when booted standalone
    let gateBootPromise = Promise.resolve();
    if (!skipGate) {
      const splash = new SplashIntroUI();
      this.loadingScreen = new LoadingScreenUI(() => this.enterLobby());
      gateBootPromise = splash.playAndPrefetch().then((bootMedia) => this.loadingScreen.start(bootMedia));
    }

    RankSystem.loadData().catch(() => {});
    WebGPU_TSL_Adapter.probeCapabilities()
      .then((caps) => GameStore.setState({ gpuCapabilities: caps }))
      .catch(() => {});

    // 1. Auto-detect GPU & device profile on first run
    try {
      if (!localStorage.getItem('rapsonyx_settings')) {
        await GraphicsPresetManager.autoDetectDeviceProfile();
      } else {
        GraphicsPresetManager.applyActiveConfig();
      }
    } catch (err) {
      console.warn('[RAPSONYX] Profile auto-detect fallback:', err);
      GraphicsPresetManager.applyActiveConfig();
    }

    // 2. Initialize Three.js WebGL2 Engine
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: GraphicsPresetManager.activeConfig.id !== 'LOW',
      powerPreference: 'high-performance',
      stencil: false
    });
    this.renderer.shadowMap.enabled = GraphicsPresetManager.activeConfig.shadows !== 'blob';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(56, window.innerWidth / Math.max(1, window.innerHeight), 0.25, 2500);
    this.camera.position.set(0, 1.85, 5.2);

    AssetRegistry.initLoaders(this.renderer);
    GraphicsPresetManager.attachRenderer(this.renderer);

    this.lighting = new RapsonyxLighting(this.scene, this.renderer);
    this.postfx = new PostProcessingPipeline(this.renderer, this.scene, this.camera);
    this.worldManager = new WorldModeManager(this.scene, this.camera, this.renderer, this.lighting);

    this.rigController = new CharacterRigController();
    this.footIK = new FootIKSolver();
    this.facial = new FacialAnimationDirector();
    this.weaponSolver = new WeaponGripSolver();
    this.choreography = new HeroChoreography(this.scene);
    this.locomotion = new LocomotionController(this.rigController, this.footIK, this.facial, this.weaponSolver);
    this.locomotion.attachCanvas(this.canvas);
    this.vfxDirector = new SkillVfxDirector(this.scene, this.renderer);
    this.warController = new WarModeController(this.scene, this.renderer, this.vfxDirector, this.lighting);
    this.netClient = new OnlineSyncClient();
    this.input = new InputManager(this.canvas);

    this.netClient.onRoomEvent = (evt) => {
      if (evt?.type === 'bot_backfill') {
        this.inGameHud?.showBanner('Rekan bot mengisi formasi arena!', 2.8);
      }
    };
    this.vfxDirector.onSkillCoordUpdate = (inst) => {
      if (this.mode === 'PLAYING' && this.netClient.connected) {
        this.netClient.sendSkillCoord(inst);
      }
    };

    // 3. Configure Responsive Viewport, Portrait Guard & Adaptive Graphics
    ViewportDisplayManager.init({
      onStateChange: (state) => {
        if (this.portraitOverlayEl) {
          this.portraitOverlayEl.classList.toggle('hidden', !state.isPortrait);
        }
        this._resizeRenderer();
      }
    });
    if (this.portraitEnterBtn) {
      this.portraitEnterBtn.addEventListener('click', () => toggleFullscreenMode());
    }
    this._resizeRenderer();

    // 4. Bind Combat & World Events
    this.warController.onEventBanner = (txt) => this.inGameHud?.showBanner(txt, 3.2);
    this.warController.onMatchFinish = (res) => {
      const rankResult = ProfileManager.recordMatchResult({
        won: Boolean(res.isVictory),
        ...(res.playerStats || {})
      });
      this.inGameHud?.showMatchResult({ ...res, rankResult });
    };

    // 5. Initialize UI Layer
    this.downloadManager = new DownloadManagerModal(() => this.lobbyUi?.renderRoster());
    this.downloadManager.init();

    this.settingsUi = new SettingsModalUI({
      onOpenDownloadManager: () => this.downloadManager.open(),
      onGraphicsChanged: () => this._applyGraphicsChanges()
    });
    this.settingsUi.init();

    this.profileUi = new ProfileModalUI({
      onProfileUpdated: () => this.lobbyUi?.refreshProfileChip()
    });
    this.profileUi.init();

    this.lobbyUi = new LobbyShowcaseUI({
      onSelectHeroReady: (heroId) => this.mountLobbyHero(heroId),
      onLaunchMatchOrWorld: (cfg) => this.launchGameplay(cfg),
      onAtmosphereChanged: (presetId) => this.lighting.applyPreset(presetId, GraphicsPresetManager.activeConfig),
      onOpenDownloadManager: () => this.downloadManager.open(),
      onOpenSettings: () => this.settingsUi.open(),
      onOpenProfile: (tab, heroId) => this.profileUi.open(tab, heroId),
      onTurntableDrag: (dx) => this.choreography.rotateTurntable(dx),
      onTurntableZoom: (deltaY) => {
        this.lobbyCamDist = THREE.MathUtils.clamp((this.lobbyCamDist || 4.35) + deltaY * 0.004, 2.6, 6.8);
      },
      onHeroTap: () => {
        this.choreography.triggerTapReaction(this.rigController, this.facial, this.vfxDirector);
        AudioDirector.playSfx('sfx_countdown_tick', { volume: 0.45 });
      },
      onTestSkill: (slot) => {
        const h = getHeroById(this.activeHeroId);
        const tc = TEAM_CONFIG[h.team] || TEAM_CONFIG.team_dream;
        this.choreography.playSkillPreview(slot, this.rigController, this.facial, this.vfxDirector, tc.colorHex);
      }
    });
    this.lobbyUi.init();

    this.vsUi = new MatchLoadingScreenUI();

    this.inGameHud = new InGameHudUI({
      onBasicAttack: (mode) => this._playerBasicAttack(mode),
      onSkillCast: (slot) => this._playerCastSkill(slot),
      onSpellCast: () => this._playerCastSpell(),
      onJump: () => this.locomotion.triggerJumpBuffer(this.worldManager.exploreMobility),
      onDash: () => this.locomotion.triggerDash(),
      onMountToggle: () => this.worldManager.exploreMobility.toggleMount(),
      onCameraToggle: () => {
        const mode = this.locomotion.toggleCameraMode();
        this.inGameHud?.showBanner(`Kamera: ${mode === 'tactical' ? 'Taktis MOBA' : 'Aksi Orbit'}`, 1.8);
      },
      onBuyItem: (itemId) => {
        const res = this.warController.buyItemForUnit(this.warController.playerUnit, itemId);
        if (res.ok && this.warController.playerUnit) {
          this.inGameHud.renderShop(this.warController.playerUnit.gold);
        }
        return res;
      },
      onReturnLobby: () => this.enterLobby(),
      onOpenSettings: () => this.settingsUi.open(),
      onJoystickInput: (x, z) => this.input.setTouchMove(x, z)
    });
    this.inGameHud.init();

    // Bind Keyboard/Gamepad Combat Actions
    this.input.onAction('attack', () => this._playerBasicAttack('auto'));
    this.input.onAction('skill1', () => this._playerCastSkill(1));
    this.input.onAction('skill2', () => this._playerCastSkill(2));
    this.input.onAction('skill3', () => this._playerCastSkill(3));
    this.input.onAction('spell', () => this._playerCastSpell());
    this.input.onAction('jump', () => {
      if (this.mode === 'PLAYING') this.locomotion.triggerJumpBuffer(this.worldManager.exploreMobility);
    });
    this.input.onAction('dash', () => {
      if (this.mode === 'PLAYING') this.locomotion.triggerDash();
    });
    this.input.onAction('mount', () => {
      if (this.mode === 'PLAYING') this.worldManager.exploreMobility.toggleMount();
    });

    // Global audio unlock on first pointer press
    window.addEventListener('pointerdown', () => AudioDirector.unlock(), { once: true });

    // 6. Await Strict Pre-Entry Gatekeeper completion
    await gateBootPromise;

    // Start frame loop
    this.lastFrameTime = performance.now();
    requestAnimationFrame((t) => this._frameLoop(t));
  }

  _resizeRenderer() {
    const w = window.innerWidth;
    const h = Math.max(1, window.innerHeight);
    const scale = GraphicsPresetManager.activeConfig.renderScale || 1.0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0) * scale;

    this.renderer.setPixelRatio(Math.max(0.65, dpr));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = ViewportDisplayManager.getAdaptiveFov(this.mode === 'LOBBY' ? 42 : 58);
    this.camera.updateProjectionMatrix();

    if (this.postfx) {
      this.postfx.configure({
        width: w * Math.max(0.65, dpr),
        height: h * Math.max(0.65, dpr),
        enableBloom: GraphicsPresetManager.activeConfig.bloom
      });
    }
  }

  _applyGraphicsChanges() {
    const cfg = GraphicsPresetManager.activeConfig;
    this.renderer.shadowMap.enabled = cfg.shadows !== 'blob';
    this.worldManager.renderDistance.applyTier(cfg.renderDistanceTier, this.renderer, this.lighting);
    this.footIK.enabled = Boolean(cfg.footIK);
    if (this.rigController.visualRoot) {
      RapsonyxCharacterShader.setOutlineVisible(this.rigController.visualRoot, cfg.outline);
    }
    this._resizeRenderer();
  }

  async enterLobby() {
    this.mode = 'LOBBY';
    window.__RAPSONYX_LOBBY_RENDERED__ = false;
    SceneDirector.goTo('lobby');
    this.netClient.disconnect();
    this.warController.dispose();
    this.vfxDirector.dispose();
    this.inGameHud.hide();
    this.vsUi.hide();

    this.lobbyUi.setOnlineStatus('Online: Menghubungi Server...', false);
    this.netClient.pingBackendHealth().then((health) => {
      if (health.ok) {
        this.lobbyUi.setOnlineStatus(`Online • ${health.latencyMs}ms`, true);
      } else {
        this.lobbyUi.setOnlineStatus('Mode Bot Lokal', false);
      }
    });

    this.activeMapId = 'lobby_terrarium';
    this.lobbyCamDist = 4.35;
    await this.worldManager.loadMap('lobby_terrarium');
    await this.mountLobbyHero(this.activeHeroId || 'freya');

    // Showcase framing
    this.camera.fov = ViewportDisplayManager.getAdaptiveFov(42);
    this.camera.updateProjectionMatrix();
    this.camera.position.set(0.15, 1.52, this.lobbyCamDist);
    this.camera.lookAt(0, 1.15, 0);

    try {
      await this.renderer.compileAsync(this.scene, this.camera);
    } catch (_) {}

    this.lobbyUi.show();
    window.__RAPSONYX_LOBBY_RENDERED__ = true;
  }

  async mountLobbyHero(heroId) {
    this.activeHeroId = heroId;
    const heroMeta = getHeroById(heroId);
    const teamCfg = TEAM_CONFIG[heroMeta.team] || TEAM_CONFIG.team_dream;

    // Dispose old Hero GPU buffers cleanly before mounting next
    this.weaponSolver.dispose();
    if (this.rigController.container.parent) {
      this.rigController.container.parent.remove(this.rigController.container);
    }
    this.rigController.dispose();

    const gltf = await AssetRegistry.loadGLTF(heroMeta.heroGlbPath, this.renderer, {
      cachePackId: heroId === 'freya' ? 'pkg_starter' : `hero_${heroId}`
    });

    this.rigController.mountFromGLTF(gltf, {
      teamColorHex: teamCfg.colorHex,
      enableOutline: GraphicsPresetManager.activeConfig.outline,
      enableFullCel: GraphicsPresetManager.activeConfig.id !== 'LOW'
    });

    await this.facial.initConfig();
    this.facial.attachHero(this.rigController.visualRoot);
    await this.weaponSolver.attachWeaponForHero(heroMeta, this.rigController, this.renderer);
    await this.choreography.mountStandForHero(heroMeta, this.rigController, this.renderer);

    try {
      await this.renderer.compileAsync(this.scene, this.camera);
    } catch (_) {}
  }

  async launchGameplay({ heroId, mapId, squadMode, spellId, emblemId, roomCode = '' }) {
    this.activeHeroId = heroId;
    this.activeMapId = mapId;
    const mapCfg = MAP_CATALOG[mapId] || MAP_CATALOG.arena_colosseum;

    this.lobbyUi.hide();
    SceneDirector.goTo('match_loading');
    this.choreography.dispose();

    // Prepare Hero + War Combatants preview before VS screen
    const playerMeta = getHeroById(heroId);
    this.vsUi.show({ mapId, playerTeam: playerMeta.team, combatants: [{ heroId, team: playerMeta.team, isPlayer: true }] });
    this.vsUi.setProgress(28, `Mengunduh peta ${mapCfg.name}...`);

    await this.worldManager.loadMap(mapId, (pct) => {
      this.vsUi.setProgress(28 + pct * 45, `Memuat arena ${mapCfg.name}...`);
    });

    this.vsUi.setProgress(78, 'Merakit rig karakter 67-tulang & Foot IK...');
    await this.mountHeroForGameplay(heroMeta);

    let activeSpellIcon = 'assets/ui/backdrops/ui_rapsodi/spells/spell_flicker.webp';
    if (mapCfg.mode === 'ARENA') {
      this.vsUi.setProgress(88, 'Menyiapkan Menara, Shield Barrier & Bot AI...');
      const pUnit = await this.warController.startMatch({
        mapId,
        playerHeroId: heroId,
        squadMode,
        selectedSpellId: spellId,
        selectedEmblemId: emblemId,
        physics: this.worldManager.physics
      });
      if (pUnit) {
        this.locomotion.teleportTo(pUnit.spawnPos.x, pUnit.spawnPos.z, this.worldManager.physics);
        activeSpellIcon = pUnit.spell.icon;
      }
      // Refresh VS cards with full multi-team bots
      this.vsUi.show({ mapId, playerTeam: playerMeta.team, combatants: this.warController.combatants });
      this.netClient.connect({ mapId, heroId, squadMode, roomCode }).catch(() => {});
    } else {
      ProfileManager.recordExplorerVisit();
      this.locomotion.teleportTo(0, 0, this.worldManager.physics);
    }

    this.vsUi.setProgress(100, 'SIAP TEMPUR!');
    this.mode = 'PLAYING';
    try {
      await this.renderer.compileAsync(this.scene, this.camera);
    } catch (_) {}

    window.setTimeout(() => {
      this.vsUi.hide();
      SceneDirector.goTo(mapCfg.mode === 'ARENA' ? 'war' : 'sandbox');
      this.inGameHud.show({ mapId, heroId, spellIcon: activeSpellIcon });
      this.inGameHud.showBanner(mapCfg.name, 3.0);
    }, 650);
  }

  async mountHeroForGameplay(heroMeta) {
    const teamCfg = TEAM_CONFIG[heroMeta.team] || TEAM_CONFIG.team_dream;
    this.weaponSolver.dispose();
    this.rigController.dispose();

    const gltf = await AssetRegistry.loadGLTF(heroMeta.heroGlbPath, this.renderer);
    this.rigController.mountFromGLTF(gltf, {
      teamColorHex: teamCfg.colorHex,
      enableOutline: GraphicsPresetManager.activeConfig.outline,
      enableFullCel: GraphicsPresetManager.activeConfig.id !== 'LOW'
    });
    this.facial.attachHero(this.rigController.visualRoot);
    await this.weaponSolver.attachWeaponForHero(heroMeta, this.rigController, this.renderer);
    this.scene.add(this.rigController.container);
  }

  _playerBasicAttack(mode = 'auto') {
    if (this.mode !== 'PLAYING') return;
    this.locomotion.triggerCombatSwing();
    if (this.warController.playerUnit) {
      this.warController.performBasicAttack(this.warController.playerUnit, null, mode);
    } else {
      this.vfxDirector.spawnRingBurst(this.locomotion.position, 0x5ce1ff, 2.4, 0.28);
    }
  }

  _playerCastSkill(slot) {
    if (this.mode !== 'PLAYING') return;
    this.locomotion.triggerCombatSwing();
    if (this.warController.playerUnit) {
      this.warController.castSkill(this.warController.playerUnit, slot);
    } else {
      this.vfxDirector.castHeroSkill3D({
        heroMeta: getHeroById(this.activeHeroId),
        slotIndex: slot,
        originPos: this.locomotion.position,
        forwardYaw: this.locomotion.facingYaw
      });
    }
  }

  _playerCastSpell() {
    if (this.mode !== 'PLAYING' || !this.warController.playerUnit) return;
    this.warController.castBattleSpell(this.warController.playerUnit, this.locomotion, this.worldManager.physics);
  }

  _frameLoop(now) {
    requestAnimationFrame((t) => this._frameLoop(t));

    // Pause 3D rendering gracefully while mobile screen is locked in Portrait guard
    if (ViewportDisplayManager.renderPaused || document.hidden) {
      this.lastFrameTime = now;
      return;
    }

    const budgetMs = GraphicsPresetManager.getFrameBudgetMs();
    if (budgetMs > 18 && this.lastRenderStamp && now - this.lastRenderStamp < budgetMs * 0.92) {
      return;
    }
    this.lastRenderStamp = now;

    const rawDt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    const frameMs = Math.max(0.1, rawDt * 1000);
    const dt = Math.min(PHYSICS_CONSTANTS.MAX_FRAME_DT, Math.max(0.001, rawDt));

    GraphicsPresetManager.recordFrame(frameMs, now);

    if (this.mode === 'LOBBY') {
      this.camera.position.z = THREE.MathUtils.lerp(
        this.camera.position.z,
        this.lobbyCamDist || 4.35,
        Math.min(1, dt * 8)
      );
      this.choreography.updateShowcase(dt, this.rigController, this.facial);
      this.weaponSolver.update(dt);
      this.worldManager.update(dt, null);
      this.vfxDirector.update(dt, this.camera, null);
    } else if (this.mode === 'PLAYING') {
      if (this.vfxDirector.consumeHitstop(dt)) {
        this.postfx.render();
        return;
      }

      // Fixed 60Hz deterministic simulation accumulator
      this.fixedAccumulator += dt;
      const moveVec = this.input.sampleMovement(dt);
      const isSprinting = this.input.isSprinting();
      const baseSpd = this.warController.playerUnit?.spd || 6.4;

      while (this.fixedAccumulator >= PHYSICS_CONSTANTS.FIXED_DT) {
        const fdt = PHYSICS_CONSTANTS.FIXED_DT;
        this.locomotion.stepPhysics(fdt, {
          inputMove: moveVec,
          isSprinting,
          baseMoveSpeed: baseSpd,
          physics: this.worldManager.physics,
          skyIslands: this.worldManager.skyIslands,
          exploreMobility: this.worldManager.exploreMobility
        });

        if (this.warController.playerUnit) {
          const pUnit = this.warController.playerUnit;
          pUnit.position.copy(this.locomotion.position);
          pUnit.facingYaw = this.locomotion.facingYaw;
          if (!pUnit.alive && this.rigController.container.visible) {
            this.rigController.container.visible = false;
          } else if (pUnit.alive && !this.rigController.container.visible) {
            this.rigController.container.visible = true;
            this.locomotion.position.copy(pUnit.spawnPos);
          }
          this.warController.update(fdt, this.worldManager.physics);
        }
        this.fixedAccumulator -= fdt;
      }

      const lookDelta = this.input.consumeCameraDelta();
      this.locomotion.updateCamera(this.camera, dt, lookDelta, this.worldManager.physics);
      this.worldManager.update(dt, this.locomotion.position, this.locomotion.facingYaw);

      const rightHandPos = this.rigController.getSocketWorldPosition('rightHand');
      const activeTeamHex = (TEAM_CONFIG[getHeroById(this.activeHeroId).team] || TEAM_CONFIG.team_dream).colorHex;
      this.vfxDirector.updateWeaponRibbon(rightHandPos, this.locomotion.combatSwingTimer > 0, activeTeamHex);
      this.vfxDirector.update(dt, this.camera, this.worldManager.physics);

      this.netClient.sendPlayerTransform(dt, this.locomotion.position, this.locomotion.facingYaw);
      AudioDirector.updateListener(
        this.camera.position,
        this.camera.getWorldDirection(new THREE.Vector3()),
        this.camera.up
      );

      this.inGameHud.update(dt, {
        warController: this.warController.playerUnit ? this.warController : null,
        playerUnit: this.warController.playerUnit,
        playerPos: this.locomotion.position,
        mapId: this.activeMapId
      });
    }

    this.postfx.render();
  }
}

export async function bootAndEnterLobby() {
  if (window.__RAPSONYX_APP__) {
    await window.__RAPSONYX_APP__.enterLobby();
    return window.__RAPSONYX_APP__;
  }
  const app = new RapsonyxGameApp();
  window.__RAPSONYX_APP__ = app;
  await app.boot({ skipGate: true });
  await app.enterLobby();
  return app;
}

if (!window.__RAPSONYX_BOOT_MANAGED__) {
  const startStandalone = () => {
    const app = new RapsonyxGameApp();
    window.__RAPSONYX_APP__ = app;
    app.boot().catch((err) => {
      console.error('[RAPSONYX] Boot error:', err);
    });
  };
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', startStandalone, { once: true });
  } else {
    startStandalone();
  }
}

/**
 * RAPSONYX Pre-Entry Gatekeeper & Priority-0 Boot Prefetcher
 * - Priority-0 (during black splash): downloads bg_loading_main + bgm_loading_main into Cache/IDB
 * - Starter Pack (concurrent queue = 3): blocks Lobby entry until essential Freya & Altar assets are cached
 * - Optional tip banners fail softly without blocking entry; 0% voice-over
 */

import { AssetRegistry } from './AssetRegistry.js';
import { LocalAssetCache } from './LocalAssetCache.js';

export const BOOT_PRIORITY_FILES = Object.freeze([
  { alias: 'bg_loading_main', mime: 'image/webp' },
  { alias: 'bgm_loading_main', mime: 'audio/mpeg' }
]);

export const STARTER_PHASES = Object.freeze([
  {
    id: 'phase_manifests',
    label: 'Fase 1: Manifest & Data Sistem RAPSONYX',
    files: [
      { alias: 'manifest_heroes', bytes: 10117 },
      { alias: 'manifest_stands', bytes: 44605 },
      { alias: 'manifest_skills', bytes: 66355 },
      { alias: 'manifest_gameplay', bytes: 1721 },
      { alias: 'assets/game_data/hero_systems/game_data_v5/heroes_42/freya.json', bytes: 4157 },
      { alias: 'sys_bot_war', bytes: 865 },
      { alias: 'sys_emblems', bytes: 869 },
      { alias: 'sys_gacha', bytes: 981 },
      { alias: 'oracle_items', bytes: 5120 },
      { alias: 'oracle_builds', bytes: 16384 },
      { alias: 'physics_heroes_42', bytes: 24576 },
      { alias: 'spatial_physics_7maps', bytes: 12288 }
    ]
  },
  {
    id: 'phase_lobby_altar',
    label: 'Fase 2: Altar Lobby & Shader Anime',
    files: [
      { alias: 'lobby_terrarium', bytes: 4120904 },
      { alias: 'stand_freya', bytes: 1509949 },
      { alias: 'skybox_twilight_512', bytes: 529459 },
      { alias: 'tex_cel_ramp', bytes: 175 },
      { alias: 'tex_face_sdf', bytes: 17910 },
      { alias: 'tex_hair_aniso', bytes: 119132 },
      { alias: 'tex_hero_palette', bytes: 270 },
      { alias: 'matcap_hair_angel', bytes: 91412 },
      { alias: 'tex_blob_shadow', bytes: 29614 },
      { alias: 'nav_v6_world', bytes: 443474 }
    ]
  },
  {
    id: 'phase_hero_freya',
    label: 'Fase 3: Hero Default — Freya (Valkyrie)',
    files: [
      { alias: 'hero_freya', bytes: 59978547 }
    ]
  },
  {
    id: 'phase_weapon_ai',
    label: 'Fase 4: Senjata Freya, AI Locomotion & Kalibrasi IK',
    files: [
      { alias: 'weapon_freya', bytes: 119183 },
      { alias: 'locomotion_brain_bin', bytes: 2139095 },
      { alias: 'neural_motion_bin', bytes: 2149581 },
      { alias: 'calib_foot_stands', bytes: 22702 },
      { alias: 'calib_weapon_grips', bytes: 27873 },
      { alias: 'calib_facial', bytes: 6103 }
    ]
  },
  {
    id: 'phase_vfx_sfx_ui',
    label: 'Fase 5: VFX/SFX Non-Voice & Core UI/BGM',
    files: [
      { alias: 'assets/skills_vfx_3d/skills_3d_vfx_168_glb/team_dream/freya/vfx3d_freya_s1_strike.glb', bytes: 23562 },
      { alias: 'assets/skills_vfx_3d/skills_3d_vfx_168_glb/team_dream/freya/vfx3d_freya_s2_tactical.glb', bytes: 41533 },
      { alias: 'assets/skills_vfx_3d/skills_3d_vfx_168_glb/team_dream/freya/vfx3d_freya_s3_aoe.glb', bytes: 120330 },
      { alias: 'assets/skills_vfx_3d/skills_3d_vfx_168_glb/team_dream/freya/vfx3d_freya_s4_ultimate.glb', bytes: 162816 },
      { alias: 'assets/skills_sfx/skills_sfx_168_ogg/team_dream/freya/sfx_freya_s1_strike.ogg', bytes: 31815 },
      { alias: 'assets/skills_sfx/skills_sfx_168_ogg/team_dream/freya/sfx_freya_s2_tactical.ogg', bytes: 32082 },
      { alias: 'assets/skills_sfx/skills_sfx_168_ogg/team_dream/freya/sfx_freya_s3_aoe.ogg', bytes: 35850 },
      { alias: 'assets/skills_sfx/skills_sfx_168_ogg/team_dream/freya/sfx_freya_s4_ultimate.ogg', bytes: 55921 },
      { alias: 'bgm_01_lobby_pad', bytes: 111728 },
      { alias: 'bgm_02_lobby_arpeggio', bytes: 128727 },
      { alias: 'assets/ui/portraits_42/portraits_42/freya_portrait.webp', bytes: 71874 },
      { alias: 'assets/ui/skill_icons_672/skill_icons_672_states/ready_framed/freya_passive.webp', bytes: 14000 },
      { alias: 'assets/ui/skill_icons_672/skill_icons_672_states/ready_framed/freya_skill_1.webp', bytes: 14000 },
      { alias: 'assets/ui/skill_icons_672/skill_icons_672_states/ready_framed/freya_skill_2.webp', bytes: 14000 },
      { alias: 'assets/ui/skill_icons_672/skill_icons_672_states/ready_framed/freya_ultimate.webp', bytes: 14000 },
      { alias: 'ui_crest_rapsonyx', bytes: 61911 },
      { alias: 'bar_frame_bg', bytes: 1372 },
      { alias: 'bar_hp_fill', bytes: 714 },
      { alias: 'bar_mana_fill', bytes: 692 },
      { alias: 'bar_shield_fill', bytes: 499 },
      { alias: 'bar_ult_charge', bytes: 678 },
      { alias: 'skill_frame_dream', bytes: 9513 },
      { alias: 'skill_frame_love', bytes: 9318 },
      { alias: 'skill_frame_passion', bytes: 9656 },
      { alias: 'loading_tip_01', bytes: 165939, optional: true },
      { alias: 'loading_tip_02', bytes: 195799, optional: true },
      { alias: 'loading_tip_03', bytes: 248483, optional: true },
      { alias: 'loading_tip_04', bytes: 239646, optional: true },
      { alias: 'loading_tip_05', bytes: 268861, optional: true },
      { alias: 'loading_tip_06', bytes: 96542, optional: true }
    ]
  }
]);

class PreEntryDownloaderService {
  constructor() {
    this.isDownloading = false;
    this.isReady = false;
    this.abortController = null;
    this.bootMediaReady = false;
  }

  getAllStarterItems() {
    const out = [];
    for (const phase of STARTER_PHASES) {
      for (const item of phase.files) {
        out.push({
          ...item,
          phaseId: phase.id,
          phaseLabel: phase.label,
          key: AssetRegistry.resolve(item.alias)
        });
      }
    }
    return out;
  }

  getAllStarterKeys() {
    return this.getAllStarterItems().map((i) => i.key);
  }

  getStarterTotalBytes() {
    return this.getAllStarterItems().reduce((acc, i) => acc + i.bytes, 0);
  }

  getRequiredStarterKeys() {
    return this.getAllStarterItems()
      .filter((i) => !i.optional)
      .map((i) => i.key);
  }

  async prefetchBootPriority2() {
    await LocalAssetCache.init();
    const results = await Promise.allSettled([
      AssetRegistry.fetchAssetArrayBuffer('bg_loading_main', { saveToCache: true, pinned: true, packId: 'boot_priority' }),
      AssetRegistry.fetchAssetArrayBuffer('bgm_loading_main', { saveToCache: true, pinned: true, packId: 'boot_priority' })
        .catch(() => AssetRegistry.fetchAssetArrayBuffer('bgm_01_lobby_pad', { saveToCache: true, pinned: true, packId: 'boot_priority' }))
    ]);
    const bgUrl = await AssetRegistry.getBlobUrl('bg_loading_main', 'image/webp').catch(() => null);
    this.bootMediaReady = results.some((r) => r.status === 'fulfilled');
    return { ready: this.bootMediaReady, bgUrl };
  }

  async checkStarterReady() {
    await LocalAssetCache.init();
    const requiredKeys = this.getRequiredStarterKeys();
    const status = LocalAssetCache.getPackStatus(requiredKeys);
    this.isReady = status.complete;
    return {
      ready: status.complete,
      ...status
    };
  }

  async downloadStarterPack(onProgress = null) {
    if (this.isDownloading) return false;
    this.isDownloading = true;
    this.abortController = new AbortController();

    const items = this.getAllStarterItems();
    const totalBytes = items.reduce((acc, i) => acc + i.bytes, 0);
    let completedBytes = 0;
    const perItemBytes = new Map();
    const startTs = performance.now();

    const emitProgress = (status, item) => {
      if (!onProgress) return;
      let activeBytes = completedBytes;
      for (const v of perItemBytes.values()) activeBytes += v;
      const clamped = Math.min(totalBytes, activeBytes);
      const elapsedS = Math.max(0.1, (performance.now() - startTs) / 1000);
      const speedMbps = (clamped / (1024 * 1024)) / elapsedS;
      const pct = Math.min(99, Math.round((clamped / Math.max(1, totalBytes)) * 100));
      onProgress({
        status,
        percent: pct,
        downloadedBytes: clamped,
        totalBytes,
        speedMbps: Number(speedMbps.toFixed(2)),
        phaseLabel: item.phaseLabel,
        currentFile: item.key.split('/').pop()
      });
    };

    try {
      await LocalAssetCache.init();
      const queue = [...items];
      const concurrency = 3;

      const worker = async () => {
        while (queue.length > 0) {
          const item = queue.shift();
          if (!item) break;

          if (LocalAssetCache.has(item.key)) {
            completedBytes += item.bytes;
            emitProgress('CACHE_HIT', item);
            continue;
          }

          perItemBytes.set(item.key, 0);
          emitProgress('DOWNLOADING', item);
          try {
            await AssetRegistry.fetchAssetArrayBuffer(item.key, {
              saveToCache: true,
              pinned: !item.optional,
              packId: 'starter_pack',
              signal: this.abortController.signal,
              onProgress: (rec) => {
                perItemBytes.set(item.key, Math.min(item.bytes, rec));
                emitProgress('DOWNLOADING', item);
              }
            });
            perItemBytes.delete(item.key);
            completedBytes += item.bytes;
          } catch (err) {
            perItemBytes.delete(item.key);
            if (!item.optional) throw err;
          }
        }
      };

      await Promise.all(Array.from({ length: concurrency }, () => worker()));

      const finalVerify = await this.checkStarterReady();
      this.isReady = finalVerify.ready;
      if (!this.isReady) {
        throw new Error('Verifikasi integritas Starter Pack belum lengkap.');
      }

      if (onProgress) {
        onProgress({
          status: 'READY_LOCAL',
          percent: 100,
          downloadedBytes: totalBytes,
          totalBytes,
          speedMbps: 0,
          phaseLabel: 'ASET SIAP',
          currentFile: 'Starter Pack RAPSONYX siap dimainkan'
        });
      }
      return true;
    } finally {
      this.isDownloading = false;
      this.abortController = null;
    }
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

export const PreEntryDownloader = new PreEntryDownloaderService();

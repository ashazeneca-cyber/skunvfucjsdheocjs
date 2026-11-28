/**
 * RAPSONYX Central Asset Registry
 * - Single source of truth for CDN_BASE_URL (/cdn) & HF Backend failover (/assets)
 * - Strict voice-over / offline model blacklist guard
 * - RAPSONYX_INTERNAL_PATHS aliasing map (only location allowed to hold legacy physical repo strings)
 * - Singleton DRACOLoader / KTX2Loader / GLTFLoader + LocalAssetCache integration
 */

import { LocalAssetCache } from './LocalAssetCache.js';
import { NETWORK_CONFIG } from '../config/constants.js';

export const CDN_BASE_URL = (window.__RAPSONYX_CDN__ || '/cdn').replace(/\/+$/, '');
const BACKEND_ORIGIN = (NETWORK_CONFIG.BACKEND_HTTP || 'https://ashazeneca-botanalistiktl.hf.space').replace(/\/+$/, '');
const toBackendUrl = (rel) => (rel.startsWith('assets/') ? `${BACKEND_ORIGIN}/${rel}` : `${BACKEND_ORIGIN}/cdn/${rel}`);

const FORBIDDEN_PATTERNS = [
  /^assets\/audio\/voices_real\//i,
  /^assets\/audio\/voices_cloned_504\//i,
  /^assets\/audio\/announcer\//i,
  /^assets\/audio\/sfx_hq_220\/audio_stereo_hq_v5\/hero_voicelines_42\//i,
  /\.npz$/i,
  /\.pt$/i,
  /_raw\.png$/i,
  /voice_refs_42/i,
  /suaramemberjeketi/i
];

// Physical repository path map (anti-404 aliasing)
const RAPSONYX_INTERNAL_PATHS = Object.freeze({
  // Boot Priority-0 (Splash -> Glass Loading)
  bg_loading_main: 'assets/ui/backdrops/skyboxes_and_banners/bg_loading_onyxpure.webp',
  bgm_loading_main: 'assets/audio/bgm_legacy/bgm_loading_onyxpure.mp3',

  // Manifests & Core Systems
  manifest_heroes: 'assets/heroes/heroes_42_web_manifest.json',
  manifest_stands: 'assets/stands/stands_42_anchor_manifest.json',
  manifest_skills: 'assets/skills_sfx/hero_4skills_vfx_sfx_manifest.json',
  manifest_gameplay: 'assets/gameplay/gameplay_pack_manifest.json',
  manifest_world_11km: 'assets/world_11km/cdn_manifest_onyxpure_11km.json',
  world_manifest_11km: 'assets/world_11km/05_sandbox/world_manifest_11km.json',
  sky_islands_layout: 'assets/world_11km/05_sandbox/sky_islands_layout.json',
  arenas_manifest: 'assets/world_11km/06_arenas/arenas_manifest.json',
  atlas_manifest: 'assets/world_11km/01_atlases/atlas_manifest.json',
  modular_registry: 'assets/world_11km/04_modular/assets_1500_registry.json',
  modular_catalog: 'assets/world_11km/04_modular/catalog_1536_specs.json',
  world_100km_landmarks: 'assets/world_100km/world_100km_landmarks.json',

  // AI Brain & Calibrations
  locomotion_brain_bin: 'assets/ai_brain/hero_controller/neural_locomotion_brain/p43_locomotion_brain_42.bin',
  locomotion_brain_meta: 'assets/ai_brain/hero_controller/neural_locomotion_brain/p43_locomotion_brain_meta.json',
  neural_motion_bin: 'assets/ai_brain/neural_motion/neural_ai_brain/neural_motion_brain_aaa_42heroes.bin',
  neural_motion_meta: 'assets/ai_brain/neural_motion/neural_ai_brain/neural_motion_brain_aaa_meta.json',
  calib_foot_stands: 'assets/ai_brain/hero_controller/calibrations_42_heroes/stand_foot_calibration_42.json',
  calib_weapon_grips: 'assets/ai_brain/hero_controller/calibrations_42_heroes/weapon_grip_sockets_42.json',
  calib_facial: 'assets/ai_brain/hero_controller/calibrations_42_heroes/random_facial_director.json',

  // Game Systems & Oracle Data
  sys_bot_war: 'assets/game_data/hero_systems/game_data_v5/systems/bot_ai_and_war_rules.json',
  sys_emblems: 'assets/game_data/hero_systems/game_data_v5/systems/emblems_6_trees.json',
  sys_gacha: 'assets/game_data/hero_systems/game_data_v5/systems/gacha_and_starlight_v5.json',
  oracle_items: 'assets/game_data/combat_oracle/combat_oracle_12m_v5/item_30_power_tierlist.json',
  oracle_builds: 'assets/game_data/combat_oracle/combat_oracle_12m_v5/meta_optimal_builds_42_heroes.json',
  oracle_spells: 'assets/game_data/combat_oracle/combat_oracle_12m_v5/battle_spell_8_analytics.json',
  oracle_sensitivity: 'assets/game_data/combat_oracle/combat_oracle_12m_v5/attribute_sensitivity_and_turret_dive.json',
  physics_heroes_42: 'assets/game_data/physics_ai/physics_v5_complete/hero_physics_42_complete.json',
  spatial_physics_7maps: 'assets/game_data/physics_ai/physics_v5_complete/spatial_physics_7maps.json',

  // Lobby & Map Aliases (physical paths isolated here to prevent 404)
  lobby_terrarium: 'assets/maps_extra/wukong_p36/maps_3d_wukong_glb/map_v6_lobby_imperial_terrarium.glb',
  sandbox_valley: 'assets/maps_extra/wukong_p36/maps_3d_wukong_glb/map_v6_wukong_valley_sandbox.glb',
  arena_ocean_bridge: 'assets/world_11km/06_arenas/grand_ocean_bridge.glb',
  arena_colosseum: 'assets/world_11km/06_arenas/grand_roman_colosseum.glb',
  arena_sky_sakura: 'assets/world_11km/06_arenas/sky_sakura_sanctuary.glb',
  arena_mist_duel: 'assets/world_11km/06_arenas/wukong_mist_duel.glb',
  arena_colosseum_v6: 'assets/maps_extra/wukong_p36/maps_3d_wukong_glb/map_v6_wukong_colosseum_rank.glb',
  arena_sakura_v6: 'assets/maps_extra/wukong_p36/maps_3d_wukong_glb/map_v6_wukong_sakura_sanctum_rank.glb',
  arena_bridge_v6: 'assets/maps_extra/wukong_p36/maps_3d_wukong_glb/map_v6_wukong_sky_bridge_rank.glb',
  nav_v6_world: 'assets/maps_extra/wukong_p36/maps_3d_wukong_glb/world_navigation_data_v6.json',
  nav_fast_colosseum: 'assets/maps_extra/world_nav_p11/baked_maps_final/nav_fast_colosseum.json',
  nav_fast_ocean_bridge: 'assets/maps_extra/world_nav_p11/baked_maps_final/nav_fast_ocean_bridge.json',
  nav_fast_sakura_ffa: 'assets/maps_extra/world_nav_p11/baked_maps_final/nav_fast_sakura_ffa.json',
  nav_sandbox_valley: 'assets/maps_extra/world_nav_p11/baked_maps_final/nav_sandbox_open_world.json',
  nav_sandbox_terrarium: 'assets/maps_extra/world_nav_p11/baked_maps_final/nav_sandbox_terrarium.json',

  // Minimaps
  minimap_world_z0: 'assets/world_11km/07_minimaps/world_11km_z0_4k.webp',
  minimap_world_preview: 'assets/world_11km/07_minimaps/world_11km_preview_1k.webp',
  minimap_ocean_bridge: 'assets/world_11km/07_minimaps/arenas/grand_ocean_bridge_minimap.webp',
  minimap_colosseum: 'assets/world_11km/07_minimaps/arenas/grand_roman_colosseum_minimap.webp',
  minimap_sky_sakura: 'assets/world_11km/07_minimaps/arenas/sky_sakura_sanctuary_minimap.webp',
  minimap_mist_duel: 'assets/world_11km/07_minimaps/arenas/wukong_mist_duel_minimap.webp',

  // Open-World 11km Core Height & Terrain Maps
  heightmap_rg16_2k: 'assets/world_11km/05_sandbox/heightmap_rg16_2k.png',
  splatmap_4k: 'assets/world_11km/05_sandbox/splatmap_4k_rgba.png',
  world_normal_4k: 'assets/world_11km/05_sandbox/world_normal_4k.png',
  world_ao_4k: 'assets/world_11km/05_sandbox/world_ao_4k.png',
  biome_id_4k: 'assets/world_11km/05_sandbox/biome_id_4k.png',

  // 100km Macro Horizon Packs
  horizon_arch_sky: 'assets/world_100km/packs/pack_arch_sky.glb',
  horizon_cliffs: 'assets/world_100km/packs/pack_cliffs.glb',
  horizon_foliage: 'assets/world_100km/packs/pack_foliage.glb',
  horizon_trees: 'assets/world_100km/packs/pack_trees.glb',

  // HDRIs & Shader Baked Maps
  skybox_twilight_512: 'assets/shaders/hdri_pbr/shaders_baked_gpu/hdri_ibl/skybox_twilight_terrarium_512.hdr',
  skybox_twilight_1k: 'assets/shaders/hdri_pbr/shaders_baked_gpu/hdri_ibl/skybox_twilight_terrarium_1k.hdr',
  skybox_day_512: 'assets/shaders/hdri_pbr/shaders_baked_gpu/hdri_ibl/skybox_day_celestial_512.hdr',
  skybox_day_1k: 'assets/shaders/hdri_pbr/shaders_baked_gpu/hdri_ibl/skybox_day_celestial_1k.hdr',
  skybox_sunset_512: 'assets/shaders/hdri_pbr/shaders_baked_gpu/hdri_ibl/skybox_arena_sunset_512.hdr',
  skybox_sunset_1k: 'assets/shaders/hdri_pbr/shaders_baked_gpu/hdri_ibl/skybox_arena_sunset_1k.hdr',
  ibl_astral_sakura_2k: 'assets/maps_extra/wukong_p36/hdr_ibls_2k/ibl_wukong_astral_sakura_2k.hdr',
  ibl_cloud_ocean_2k: 'assets/maps_extra/wukong_p36/hdr_ibls_2k/ibl_wukong_cloud_ocean_2k.hdr',
  ibl_golden_ruins_2k: 'assets/maps_extra/wukong_p36/hdr_ibls_2k/ibl_wukong_golden_ruins_2k.hdr',
  ibl_mist_valley_2k: 'assets/maps_extra/wukong_p36/hdr_ibls_2k/ibl_wukong_mist_valley_2k.hdr',
  tex_cel_ramp: 'assets/shaders/hdri_pbr/shaders_baked_gpu/tex_cel_ramp_3band_sss.png',
  tex_face_sdf: 'assets/shaders/hdri_pbr/shaders_baked_gpu/tex_face_sdf_anime.png',
  tex_hair_aniso: 'assets/shaders/hdri_pbr/shaders_baked_gpu/tex_hair_aniso_shift.png',
  tex_blob_shadow: 'assets/shaders/hdri_pbr/shaders_baked_gpu/tex_blob_shadow.png',
  tex_hero_palette: 'assets/shaders/tsl_matcaps/shaders_v5_aaa_complete/baked_maps/tex_hero42_cel_palette.png',
  matcap_hair_angel: 'assets/shaders/tsl_matcaps/shaders_v5_aaa_complete/baked_maps/matcap_hair_angel_ring.png',
  matcap_gold: 'assets/shaders/tsl_matcaps/shaders_v5_aaa_complete/baked_maps/matcap_champagne_gold.png',
  noise_caustics: 'assets/shaders/luts_aim/shaders_extra_pack/procedural_noise/noise_caustics_sharp.png',
  noise_water_foam: 'assets/shaders/luts_aim/shaders_extra_pack/procedural_noise/noise_water_foam_mask.png',
  normal_water_a: 'assets/shaders/luts_aim/shaders_extra_pack/procedural_noise/normal_water_ripples_a.png',
  normal_water_b: 'assets/shaders/luts_aim/shaders_extra_pack/procedural_noise/normal_water_ripples_b.png',
  noise_wind_grass: 'assets/shaders/luts_aim/shaders_extra_pack/procedural_noise/noise_wind_grass_wave.png',
  tex_grass_albedo_ao: 'assets/shaders/hdri_pbr/shaders_baked_gpu/pbr_maps/tex_grass_albedo_ao.png',
  tex_grass_normal: 'assets/shaders/hdri_pbr/shaders_baked_gpu/pbr_maps/tex_grass_albedo_normal.png',
  tex_dirt_albedo_ao: 'assets/shaders/hdri_pbr/shaders_baked_gpu/pbr_maps/tex_dirt_path_albedo_ao.png',
  tex_cliff_albedo_ao: 'assets/shaders/hdri_pbr/shaders_baked_gpu/pbr_maps/tex_cliff_rock_albedo_ao.png',
  tex_sand_albedo_ao: 'assets/shaders/hdri_pbr/shaders_baked_gpu/pbr_maps/tex_beach_sand_albedo_ao.png',
  pbr_valley_grass_albedo: 'assets/maps_extra/wukong_p36/pbr_2k_maps/wukong_valley_grass_albedo.jpg',
  pbr_moss_cliff_albedo: 'assets/maps_extra/wukong_p36/pbr_2k_maps/wukong_moss_cliff_albedo.jpg',
  pbr_temple_stone_albedo: 'assets/maps_extra/wukong_p36/pbr_2k_maps/wukong_temple_stone_albedo.jpg',

  // LUTs
  lut_01_anime_neutral_day: 'assets/shaders/luts_aim/shaders_extra_pack/luts_cube/lut_01_anime_neutral_day.cube',
  lut_02_twilight_terrarium: 'assets/shaders/luts_aim/shaders_extra_pack/luts_cube/lut_02_twilight_terrarium.cube',
  lut_03_arena_golden_sunset: 'assets/shaders/luts_aim/shaders_extra_pack/luts_cube/lut_03_arena_golden_sunset.cube',
  lut_04_sakura_pastel_bloom: 'assets/shaders/luts_aim/shaders_extra_pack/luts_cube/lut_04_sakura_pastel_bloom.cube',
  lut_05_sudden_death_crimson: 'assets/shaders/luts_aim/shaders_extra_pack/luts_cube/lut_05_sudden_death_crimson.cube',
  lut_06_death_monochrome: 'assets/shaders/luts_aim/shaders_extra_pack/luts_cube/lut_06_death_monochrome.cube',
  lut_07_hitstop_flash: 'assets/shaders/luts_aim/shaders_extra_pack/luts_cube/lut_07_hitstop_flash.cube',
  lut_08_ult_dream_cyan: 'assets/shaders/luts_aim/shaders_extra_pack/luts_cube/lut_08_ult_dream_cyan.cube',
  lut_09_ult_love_rose: 'assets/shaders/luts_aim/shaders_extra_pack/luts_cube/lut_09_ult_love_rose.cube',
  lut_10_ult_passion_solar: 'assets/shaders/luts_aim/shaders_extra_pack/luts_cube/lut_10_ult_passion_solar.cube',

  // Non-Voice Biome Ambience (6) & War SFX (8) & Dynamic BGM (10)
  amb_boss_tension: 'assets/gameplay/04_audio_war_sfx_biome_ambience/biome_ambience/amb_boss_tension.ogg',
  amb_dream_meadow: 'assets/gameplay/04_audio_war_sfx_biome_ambience/biome_ambience/amb_dream_meadow.ogg',
  amb_kingdom_town: 'assets/gameplay/04_audio_war_sfx_biome_ambience/biome_ambience/amb_kingdom_town.ogg',
  amb_river_water: 'assets/gameplay/04_audio_war_sfx_biome_ambience/biome_ambience/amb_river_water.ogg',
  amb_sakura_breeze: 'assets/gameplay/04_audio_war_sfx_biome_ambience/biome_ambience/amb_sakura_breeze.ogg',
  amb_rapsonyx_mist: 'assets/gameplay/04_audio_war_sfx_biome_ambience/biome_ambience/amb_wukong_mist.ogg',

  sfx_boss_roar: 'assets/gameplay/04_audio_war_sfx_biome_ambience/war_sfx/sfx_boss_roar.ogg',
  sfx_chest_open: 'assets/gameplay/04_audio_war_sfx_biome_ambience/war_sfx/sfx_chest_open.ogg',
  sfx_countdown_go: 'assets/gameplay/04_audio_war_sfx_biome_ambience/war_sfx/sfx_countdown_go.ogg',
  sfx_countdown_tick: 'assets/gameplay/04_audio_war_sfx_biome_ambience/war_sfx/sfx_countdown_tick.ogg',
  sfx_recall_complete: 'assets/gameplay/04_audio_war_sfx_biome_ambience/war_sfx/sfx_recall_complete.ogg',
  sfx_turret_aggro_warn: 'assets/gameplay/04_audio_war_sfx_biome_ambience/war_sfx/sfx_turret_aggro_warn.ogg',
  sfx_war_shield_break: 'assets/gameplay/04_audio_war_sfx_biome_ambience/war_sfx/sfx_war_shield_break.ogg',
  sfx_war_victory_fanfare: 'assets/gameplay/04_audio_war_sfx_biome_ambience/war_sfx/sfx_war_victory_fanfare.ogg',

  bgm_01_lobby_pad: 'assets/audio/sfx_hq_220/audio_stereo_hq_v5/bgm_dynamic_stems_10/bgm_01_lobby_pad.ogg',
  bgm_02_lobby_arpeggio: 'assets/audio/sfx_hq_220/audio_stereo_hq_v5/bgm_dynamic_stems_10/bgm_02_lobby_arpeggio.ogg',
  bgm_03_draft_tension: 'assets/audio/sfx_hq_220/audio_stereo_hq_v5/bgm_dynamic_stems_10/bgm_03_draft_tension.ogg',
  bgm_04_arena_base_pulse: 'assets/audio/sfx_hq_220/audio_stereo_hq_v5/bgm_dynamic_stems_10/bgm_04_arena_base_pulse.ogg',
  bgm_05_arena_teamfight_lead: 'assets/audio/sfx_hq_220/audio_stereo_hq_v5/bgm_dynamic_stems_10/bgm_05_arena_teamfight_lead.ogg',
  bgm_06_sudden_death_choir: 'assets/audio/sfx_hq_220/audio_stereo_hq_v5/bgm_dynamic_stems_10/bgm_06_sudden_death_choir.ogg',
  bgm_07_sandbox_meadow: 'assets/audio/sfx_hq_220/audio_stereo_hq_v5/bgm_dynamic_stems_10/bgm_07_sandbox_meadow.ogg',
  bgm_08_openworld_breeze: 'assets/audio/sfx_hq_220/audio_stereo_hq_v5/bgm_dynamic_stems_10/bgm_08_openworld_breeze.ogg',
  bgm_09_gacha_anticipation: 'assets/audio/sfx_hq_220/audio_stereo_hq_v5/bgm_dynamic_stems_10/bgm_09_gacha_anticipation.ogg',
  bgm_10_victory_fanfare: 'assets/audio/sfx_hq_220/audio_stereo_hq_v5/bgm_dynamic_stems_10/bgm_10_victory_fanfare.ogg',
  bgm_legacy_loading: 'assets/audio/bgm_legacy/bgm_loading_onyxpure.mp3',
  bgm_legacy_lobby: 'assets/audio/bgm_legacy/bgm_lobby_terrarium.mp3',
  bgm_legacy_sandbox: 'assets/audio/bgm_legacy/bgm_sandbox_explore.mp3',
  bgm_legacy_arena: 'assets/audio/bgm_legacy/bgm_arena_battle.mp3',

  // UI & Backdrops
  bg_loading_rapsonyx: 'assets/ui/backdrops/skyboxes_and_banners/bg_loading_onyxpure.webp',
  bg_sandbox_open_world: 'assets/ui/backdrops/skyboxes_and_banners/bg_sandbox_open_world.webp',
  bg_sandbox_terrarium: 'assets/ui/backdrops/skyboxes_and_banners/bg_sandbox_terrarium.webp',
  bg_vs_colosseum: 'assets/ui/backdrops/skyboxes_and_banners/bg_vs_colosseum.webp',
  bg_vs_ocean_bridge: 'assets/ui/backdrops/skyboxes_and_banners/bg_vs_ocean_bridge.webp',
  bg_vs_sky_sakura: 'assets/ui/backdrops/skyboxes_and_banners/bg_vs_sky_sakura.webp',
  bg_gacha_summon: 'assets/ui/skyboxes_banners/bg_gacha_summon.webp',
  ui_crest_rapsonyx: 'assets/ui/backdrops/ui_rapsodi/crests/ui_crest_onyxpure.webp',
  rank_01_trainee: 'assets/ui/ui_mega_pack/ranks/rank_01_trainee.webp',
  rank_02_rookie: 'assets/ui/ui_mega_pack/ranks/rank_02_rookie.webp',
  rank_03_rising_star: 'assets/ui/ui_mega_pack/ranks/rank_03_rising_star.webp',
  rank_04_senbatsu: 'assets/ui/ui_mega_pack/ranks/rank_04_senbatsu.webp',
  rank_05_center: 'assets/ui/ui_mega_pack/ranks/rank_05_center.webp',
  rank_06_ace: 'assets/ui/ui_mega_pack/ranks/rank_06_ace.webp',
  rank_07_legend: 'assets/ui/ui_mega_pack/ranks/rank_07_legend.webp',
  rank_08_mythic: 'assets/ui/ui_mega_pack/ranks/rank_08_mythic.webp',
  rank_09_sovereign: 'assets/ui/ui_mega_pack/ranks/rank_09_onyx_sovereign.webp',
  rank_star: 'assets/ui/ui_mega_pack/ranks/rank_star.webp',

  // 30 Items
  item_astral_orb: 'assets/ui/items_decals/ui_rapsodi/items/item_astral_orb.webp',
  item_celestial_greaves: 'assets/ui/items_decals/ui_rapsodi/items/item_celestial_greaves.webp',
  item_crimson_scythe: 'assets/ui/items_decals/ui_rapsodi/items/item_crimson_scythe.webp',
  item_crystal_pendant: 'assets/ui/items_decals/ui_rapsodi/items/item_crystal_pendant.webp',
  item_eclipse_cloak: 'assets/ui/items_decals/ui_rapsodi/items/item_eclipse_cloak.webp',
  item_eclipse_grimoire: 'assets/ui/items_decals/ui_rapsodi/items/item_eclipse_grimoire.webp',
  item_frost_trident: 'assets/ui/items_decals/ui_rapsodi/items/item_frost_trident.webp',
  item_golden_hourglass: 'assets/ui/items_decals/ui_rapsodi/items/item_golden_hourglass.webp',
  item_gravity_hammer: 'assets/ui/items_decals/ui_rapsodi/items/item_gravity_hammer.webp',
  item_harmony_lyre: 'assets/ui/items_decals/ui_rapsodi/items/item_harmony_lyre.webp',
  item_lotus_chalice: 'assets/ui/items_decals/ui_rapsodi/items/item_lotus_chalice.webp',
  item_moonlight_tiara: 'assets/ui/items_decals/ui_rapsodi/items/item_moonlight_tiara.webp',
  item_obsidian_plate: 'assets/ui/items_decals/ui_rapsodi/items/item_obsidian_plate.webp',
  item_sovereign_boots: 'assets/ui/items_decals/ui_rapsodi/items/item_onyx_boots.webp',
  item_rapsonyx_boots: 'assets/ui/items_decals/ui_rapsodi/items/item_onyx_boots.webp',
  item_sovereign_ring: 'assets/ui/items_decals/ui_rapsodi/items/item_onyx_ring.webp',
  item_rapsonyx_ring: 'assets/ui/items_decals/ui_rapsodi/items/item_onyx_ring.webp',
  item_phantom_dagger: 'assets/ui/items_decals/ui_rapsodi/items/item_phantom_dagger.webp',
  item_phoenix_feather: 'assets/ui/items_decals/ui_rapsodi/items/item_phoenix_feather.webp',
  item_prism_bow: 'assets/ui/items_decals/ui_rapsodi/items/item_prism_bow.webp',
  item_radiant_cuirass: 'assets/ui/items_decals/ui_rapsodi/items/item_radiant_cuirass.webp',
  item_rapsodi_wand: 'assets/ui/items_decals/ui_rapsodi/items/item_rapsodi_wand.webp',
  item_rose_rapier: 'assets/ui/items_decals/ui_rapsodi/items/item_rose_rapier.webp',
  item_sakura_lantern: 'assets/ui/items_decals/ui_rapsodi/items/item_sakura_lantern.webp',
  item_seraph_wings: 'assets/ui/items_decals/ui_rapsodi/items/item_seraph_wings.webp',
  item_solar_halberd: 'assets/ui/items_decals/ui_rapsodi/items/item_solar_halberd.webp',
  item_sovereign_crown: 'assets/ui/items_decals/ui_rapsodi/items/item_sovereign_crown.webp',
  item_starlight_blade: 'assets/ui/items_decals/ui_rapsodi/items/item_starlight_blade.webp',
  item_thunder_belt: 'assets/ui/items_decals/ui_rapsodi/items/item_thunder_belt.webp',
  item_valkyrie_aegis: 'assets/ui/items_decals/ui_rapsodi/items/item_valkyrie_aegis.webp',
  item_velvet_gauntlet: 'assets/ui/items_decals/ui_rapsodi/items/item_velvet_gauntlet.webp',
  item_windtalker_fan: 'assets/ui/items_decals/ui_rapsodi/items/item_windtalker_fan.webp',

  // 8 Spells
  spell_aegis: 'assets/ui/backdrops/ui_rapsodi/spells/spell_aegis.webp',
  spell_execute: 'assets/ui/backdrops/ui_rapsodi/spells/spell_execute.webp',
  spell_flicker: 'assets/ui/backdrops/ui_rapsodi/spells/spell_flicker.webp',
  spell_inspire: 'assets/ui/backdrops/ui_rapsodi/spells/spell_inspire.webp',
  spell_purify: 'assets/ui/backdrops/ui_rapsodi/spells/spell_purify.webp',
  spell_retribution: 'assets/ui/backdrops/ui_rapsodi/spells/spell_retribution.webp',
  spell_revitalize: 'assets/ui/backdrops/ui_rapsodi/spells/spell_revitalize.webp',
  spell_sprint: 'assets/ui/backdrops/ui_rapsodi/spells/spell_sprint.webp',

  // 8 Status Icons
  status_armor_shred: 'assets/ui/backdrops/ui_rapsodi/status_icons/status_armor_shred.webp',
  status_burn: 'assets/ui/backdrops/ui_rapsodi/status_icons/status_burn.webp',
  status_heal: 'assets/ui/backdrops/ui_rapsodi/status_icons/status_heal.webp',
  status_invulnerable: 'assets/ui/backdrops/ui_rapsodi/status_icons/status_invulnerable.webp',
  status_shield: 'assets/ui/backdrops/ui_rapsodi/status_icons/status_shield.webp',
  status_slow: 'assets/ui/backdrops/ui_rapsodi/status_icons/status_slow.webp',
  status_stun: 'assets/ui/backdrops/ui_rapsodi/status_icons/status_stun.webp',
  status_suppress: 'assets/ui/backdrops/ui_rapsodi/status_icons/status_suppress.webp',

  // 8 Combat Badges
  badge_defeat: 'assets/ui/backdrops/ui_rapsodi/combat_badges/badge_defeat.webp',
  badge_first_blood: 'assets/ui/backdrops/ui_rapsodi/combat_badges/badge_first_blood.webp',
  badge_mvp: 'assets/ui/backdrops/ui_rapsodi/combat_badges/badge_mvp.webp',
  badge_savage: 'assets/ui/backdrops/ui_rapsodi/combat_badges/badge_savage.webp',
  badge_shield_break: 'assets/ui/backdrops/ui_rapsodi/combat_badges/badge_shield_break.webp',
  badge_team_wipe: 'assets/ui/backdrops/ui_rapsodi/combat_badges/badge_team_wipe.webp',
  badge_victory: 'assets/ui/backdrops/ui_rapsodi/combat_badges/badge_victory.webp',
  emblem_vs_metallic: 'assets/ui/backdrops/ui_rapsodi/combat_badges/emblem_vs_metallic.webp',

  // Starlight Chests
  chest_uncommon: 'assets/ui/backdrops/ui_rapsodi/starlight_chests/chest_uncommon.webp',
  chest_rare: 'assets/ui/backdrops/ui_rapsodi/starlight_chests/chest_rare.webp',
  chest_myth: 'assets/ui/backdrops/ui_rapsodi/starlight_chests/chest_myth.webp',
  chest_legend: 'assets/ui/backdrops/ui_rapsodi/starlight_chests/chest_legend.webp',
  chest_omega: 'assets/ui/backdrops/ui_rapsodi/starlight_chests/chest_omega.webp',
  chest_omega_spesial: 'assets/ui/backdrops/ui_rapsodi/starlight_chests/chest_omega_spesial.webp',
  starlight_crown_pass: 'assets/ui/backdrops/ui_rapsodi/starlight_chests/starlight_crown_pass.webp',

  // Team Crests & Cards
  crest_team_dream: 'assets/ui/backdrops/ui_rapsodi/crests/crest_team_dream.webp',
  crest_team_love: 'assets/ui/backdrops/ui_rapsodi/crests/crest_team_love.webp',
  crest_team_passion: 'assets/ui/backdrops/ui_rapsodi/crests/crest_team_passion.webp',
  card_lobby_terrarium: 'assets/ui/skyboxes_banners/card_lobby_terrarium.webp',
  card_open_sandbox: 'assets/ui/skyboxes_banners/card_open_sandbox.webp',
  card_arena_colosseum: 'assets/ui/skyboxes_banners/card_arena_colosseum.webp',
  card_arena_ocean_bridge: 'assets/ui/skyboxes_banners/card_arena_ocean_bridge.webp',
  card_arena_sky_sakura: 'assets/ui/skyboxes_banners/card_arena_sky_sakura.webp',

  // HUD Controls & Bars
  bar_frame_bg: 'assets/ui/ui_assets/bar_frame_bg.webp',
  bar_hp_fill: 'assets/ui/ui_assets/bar_hp_fill.webp',
  bar_mana_fill: 'assets/ui/ui_assets/bar_mana_fill.webp',
  bar_shield_fill: 'assets/ui/ui_assets/bar_shield_fill.webp',
  bar_ult_charge: 'assets/ui/ui_assets/bar_ult_charge.webp',
  bar_enemy_hp_fill: 'assets/ui/ui_assets/bar_enemy_hp_fill.webp',
  skill_frame_dream: 'assets/ui/ui_assets/skill_frame_dream.webp',
  skill_frame_love: 'assets/ui/ui_assets/skill_frame_love.webp',
  skill_frame_passion: 'assets/ui/ui_assets/skill_frame_passion.webp',
  ui_minimap_frame: 'assets/ui/ui_assets/ui_minimap_frame.webp',
  ui_skill_ring_gold: 'assets/ui/ui_assets/ui_skill_ring_gold.webp',
  analog_ring_gold: 'assets/ui/combat_markers/analog_ring_gold.webp',
  btn_cancel_x: 'assets/ui/backdrops/ui_rapsodi/buttons/btn_cancel_x.webp',
  btn_target_minion: 'assets/ui/combat_markers/btn_target_minion.webp',
  btn_target_turret: 'assets/ui/combat_markers/btn_target_turret.webp',
  btn_regen_heal: 'assets/ui/combat_markers/btn_regen_heal.webp',
  btn_recall: 'assets/ui/backdrops/ui_rapsodi/buttons/btn_recall.webp',
  btn_jump: 'assets/ui/backdrops/ui_rapsodi/buttons/btn_jump.webp',
  btn_dash: 'assets/ui/backdrops/ui_rapsodi/buttons/btn_dash.webp',
  btn_lock_hero: 'assets/ui/backdrops/ui_rapsodi/buttons/btn_lock_hero.webp',
  loading_tip_01: 'assets/ui/items_decals/skyboxes_and_banners/loading_tips/loading_tip_01_team_wipe.webp',
  loading_tip_02: 'assets/ui/items_decals/skyboxes_and_banners/loading_tips/loading_tip_02_ocean_war.webp',
  loading_tip_03: 'assets/ui/items_decals/skyboxes_and_banners/loading_tips/loading_tip_03_sakura_ffa.webp',
  loading_tip_04: 'assets/ui/items_decals/skyboxes_and_banners/loading_tips/loading_tip_04_terrarium.webp',
  loading_tip_05: 'assets/ui/items_decals/skyboxes_and_banners/loading_tips/loading_tip_05_open_world.webp',
  loading_tip_06: 'assets/ui/items_decals/skyboxes_and_banners/loading_tips/loading_tip_06_sovereign.webp',

  // Default Freya Starter Alias
  hero_freya: 'assets/heroes/team_dream/freya_web_opt.glb',
  stand_freya: 'assets/stands/stands_42_custom_glb/team_dream/stand3d_freya_royal_caramel_cam.glb',
  weapon_freya: 'assets/weapons_anim/weapons_42_animated_glb/team_dream/weapon_anim_freya_staff.glb',

  // Gameplay Core Structures & Units
  boss_crystal_golem: 'assets/gameplay/01_units_bosses_npc_rigged/boss_crystal_golem_rigged.glb',
  boss_dragon: 'assets/gameplay/01_units_bosses_npc_rigged/boss_dragon_rigged.glb',
  boss_phoenix: 'assets/gameplay/01_units_bosses_npc_rigged/boss_phoenix_rigged.glb',
  minion_melee: 'assets/gameplay/01_units_bosses_npc_rigged/minion_melee_rigged.glb',
  minion_ranged: 'assets/gameplay/01_units_bosses_npc_rigged/minion_ranged_rigged.glb',
  minion_siege: 'assets/gameplay/01_units_bosses_npc_rigged/minion_siege_cannon_rigged.glb',
  npc_quest_keeper: 'assets/gameplay/01_units_bosses_npc_rigged/npc_quest_keeper_rigged.glb',
  npc_village_merchant: 'assets/gameplay/01_units_bosses_npc_rigged/npc_village_merchant_rigged.glb',
  glider_dream: 'assets/gameplay/02_explore_mobility_interactive/glider_dream_starlight.glb',
  glider_sakura: 'assets/gameplay/02_explore_mobility_interactive/glider_sakura_wings.glb',
  mount_crystal_steed: 'assets/gameplay/02_explore_mobility_interactive/mount_crystal_steed_rigged.glb',
  treasure_chest: 'assets/gameplay/02_explore_mobility_interactive/treasure_chest_animated.glb',
  slime_dream: 'assets/gameplay/02_explore_mobility_interactive/slime_dream_anim.glb',
  slime_love: 'assets/gameplay/02_explore_mobility_interactive/slime_love_anim.glb',
  slime_passion: 'assets/gameplay/02_explore_mobility_interactive/slime_passion_anim.glb',
  butterfly_crystal: 'assets/gameplay/02_explore_mobility_interactive/butterfly_crystal_anim.glb',
  fairy_seelie: 'assets/gameplay/02_explore_mobility_interactive/fairy_seelie_anim.glb',
  war_shield_dome: 'assets/gameplay/03_war_structures_and_decals/war_energy_shield_dome.glb',
  turret_rubble: 'assets/gameplay/03_war_structures_and_decals/turret_destroyed_rubble.glb',
  nexus_rubble: 'assets/gameplay/03_war_structures_and_decals/nexus_destroyed_rubble.glb',
  particle_variants_f32: 'assets/vfx/particles/mega_particles_10k/variants_10k/particle_variants_10000.f32',
  particle_variants_json: 'assets/vfx/particles/mega_particles_10k/variants_10k/particle_variants_manifest.json'
});

function isHeavyWorldChunk(relPath) {
  return (
    relPath.startsWith('assets/world_11km/04_modular/') ||
    relPath.startsWith('assets/world_11km/05_sandbox/sectors_stitched/') ||
    relPath.startsWith('assets/world_11km/05_sandbox/nav_sectors/') ||
    relPath.startsWith('assets/world_11km/07_minimaps/tiles/')
  );
}

class AssetRegistryService {
  constructor() {
    this.dracoLoader = null;
    this.ktx2Loader = null;
    this.gltfLoader = null;
    this.objectUrls = new Map();
    this._healthPromise = null;
    this._preferBackendRoute = false;
  }

  resolve(aliasOrPath) {
    if (!aliasOrPath) return '';
    const mapped = RAPSONYX_INTERNAL_PATHS[aliasOrPath] || aliasOrPath;
    const normalized = mapped.replace(/^\/+/, '').replace(/^cdn\//, '');
    this.assertAllowedPath(normalized);
    return normalized;
  }

  assertAllowedPath(relPath) {
    if (!relPath || relPath.includes('..')) {
      throw new Error(`INVALID_RAPSONYX_PATH: ${relPath}`);
    }
    for (const rule of FORBIDDEN_PATTERNS) {
      if (rule.test(relPath)) {
        throw new Error(`BLOCKED_BY_RAPSONYX_BLACKLIST: ${relPath}`);
      }
    }
  }

  toCdnUrl(aliasOrPath) {
    const rel = this.resolve(aliasOrPath);
    if (isHeavyWorldChunk(rel) || this._preferBackendRoute) {
      return toBackendUrl(rel);
    }
    return `${CDN_BASE_URL}/${rel}`;
  }

  resolveFetchUrls(aliasOrPath) {
    const rel = this.resolve(aliasOrPath);
    const primaryCdn = `${CDN_BASE_URL}/${rel}`;
    const hfProxy = toBackendUrl(rel);
    if (isHeavyWorldChunk(rel) || this._preferBackendRoute) {
      return [hfProxy, primaryCdn];
    }
    return [primaryCdn, hfProxy];
  }

  async diagnoseCdnHealth() {
    if (this._healthPromise) return this._healthPromise;
    this._healthPromise = (async () => {
      try {
        const res = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const j = await res.json();
            if (j && j.secretConfigured) {
              this._preferBackendRoute = false;
              return { mode: 'cf-primary', details: j };
            }
          }
        }
      } catch (_) {}
      // Opened directly from non-CF host or local static preview -> prefer HF backend route
      this._preferBackendRoute = true;
      return { mode: 'hf-failover', details: { backendOrigin: BACKEND_ORIGIN } };
    })();
    return this._healthPromise;
  }

  async initLoaders(renderer = null) {
    if (this.gltfLoader) return this.gltfLoader;
    const [{ GLTFLoader }, { DRACOLoader }, { KTX2Loader }] = await Promise.all([
      import('three/addons/loaders/GLTFLoader.js'),
      import('three/addons/loaders/DRACOLoader.js'),
      import('three/addons/loaders/KTX2Loader.js')
    ]);

    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.172.0/examples/jsm/libs/draco/gltf/');
    this.dracoLoader.setDecoderConfig({ type: 'js' });
    this.dracoLoader.preload();

    this.ktx2Loader = new KTX2Loader();
    this.ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.172.0/examples/jsm/libs/basis/');
    if (renderer) {
      try {
        this.ktx2Loader.detectSupport(renderer);
      } catch (_) {}
    }

    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    this.gltfLoader.setKTX2Loader(this.ktx2Loader);
    return this.gltfLoader;
  }

  async _readWithStreamProgress(res, onProgress) {
    if (!res.body || !onProgress) {
      return res.arrayBuffer();
    }
    const contentLen = Number(res.headers.get('content-length') || 0);
    const reader = res.body.getReader();
    const chunks = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      onProgress(received, contentLen);
    }
    const out = new Uint8Array(received);
    let offset = 0;
    for (const c of chunks) {
      out.set(c, offset);
      offset += c.byteLength;
    }
    return out.buffer;
  }

  async fetchAssetArrayBuffer(aliasOrPath, options = {}) {
    const rel = this.resolve(aliasOrPath);
    const {
      saveToCache = true,
      pinned = false,
      packId = 'misc',
      onProgress = null,
      signal = null
    } = options;

    await LocalAssetCache.init();
    const cached = await LocalAssetCache.get(rel);
    if (cached) {
      if (onProgress) onProgress(cached.byteLength, cached.byteLength);
      return cached;
    }

    await this.diagnoseCdnHealth();
    const urls = this.resolveFetchUrls(rel);
    let lastError = null;

    for (const url of urls) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const ctrl = new AbortController();
        const abortFromCaller = () => ctrl.abort(signal?.reason);
        if (signal) {
          if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
          signal.addEventListener('abort', abortFromCaller, { once: true });
        }
        let idleTimer = setTimeout(() => ctrl.abort(new Error(`Timeout waiting for ${url}`)), 30000);
        const resetIdle = () => {
          clearTimeout(idleTimer);
          idleTimer = setTimeout(() => ctrl.abort(new Error(`Stream stalled on ${url}`)), 30000);
        };

        try {
          const res = await fetch(url, { signal: ctrl.signal });
          resetIdle();
          const ct = (res.headers.get('content-type') || '').toLowerCase();

          if (!res.ok) {
            clearTimeout(idleTimer);
            lastError = new Error(`HTTP ${res.status} on ${url}`);
            if (res.status === 404 || res.status === 401 || res.status === 403 || res.status === 429 || res.status >= 500) {
              break; // Switch immediately to backup route
            }
            continue;
          }

          // Guard against HTML SPA fallback responses disguised as HTTP 200
          if (ct.includes('text/html')) {
            clearTimeout(idleTimer);
            lastError = new Error(`HTML_FALLBACK_REJECTED on ${url}`);
            break;
          }

          const buffer = await this._readWithStreamProgress(res, (rec, tot) => {
            resetIdle();
            if (onProgress) onProgress(rec, tot);
          });
          clearTimeout(idleTimer);

          if (!buffer || buffer.byteLength === 0) {
            lastError = new Error(`EMPTY_BUFFER on ${url}`);
            break;
          }

          if (saveToCache) {
            await LocalAssetCache.set(rel, buffer, {
              pinned,
              packId,
              contentType: ct || 'application/octet-stream',
              etag: res.headers.get('etag') || ''
            });
          }
          return buffer;
        } catch (err) {
          clearTimeout(idleTimer);
          if (err?.name === 'AbortError' && signal?.aborted) throw err;
          lastError = err;
          await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
        } finally {
          clearTimeout(idleTimer);
          if (signal) signal.removeEventListener('abort', abortFromCaller);
        }
      }
    }

    throw lastError || new Error(`Gagal mengunduh aset ${rel}`);
  }

  async fetchAssetJson(aliasOrPath, options = {}) {
    const buf = await this.fetchAssetArrayBuffer(aliasOrPath, options);
    const text = new TextDecoder('utf-8').decode(buf);
    return JSON.parse(text);
  }

  async getBlobUrl(aliasOrPath, mimeType = '') {
    const rel = this.resolve(aliasOrPath);
    if (this.objectUrls.has(rel)) {
      return this.objectUrls.get(rel);
    }
    await LocalAssetCache.init();
    const cached = await LocalAssetCache.get(rel);
    if (cached) {
      const url = URL.createObjectURL(new Blob([cached], mimeType ? { type: mimeType } : undefined));
      this.objectUrls.set(rel, url);
      return url;
    }
    // Fetch & persist so authenticated origins never hit unauthed tags
    const buf = await this.fetchAssetArrayBuffer(rel, { saveToCache: true, packId: 'ui_cache' });
    const url = URL.createObjectURL(new Blob([buf], mimeType ? { type: mimeType } : undefined));
    this.objectUrls.set(rel, url);
    return url;
  }

  async loadGLTF(aliasOrPath, renderer = null, options = {}) {
    const loader = await this.initLoaders(renderer);
    const rel = this.resolve(aliasOrPath);
    const buf = await this.fetchAssetArrayBuffer(rel, {
      saveToCache: true,
      ...options
    });
    return new Promise((resolve, reject) => {
      loader.parse(buf, `${CDN_BASE_URL}/`, resolve, reject);
    });
  }

  async loadTexture(aliasOrPath, { colorSpace = null, flipY = true } = {}) {
    const THREE = await import('three');
    const rel = this.resolve(aliasOrPath);
    const url = await this.getBlobUrl(rel);
    return new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(
        url,
        (tex) => {
          tex.colorSpace = colorSpace || THREE.SRGBColorSpace;
          tex.flipY = flipY;
          tex.needsUpdate = true;
          resolve(tex);
        },
        undefined,
        reject
      );
    });
  }
}

export const AssetRegistry = new AssetRegistryService();

/**
 * RAPSONYX Central Engine Constants
 * 100% pure RAPSONYX naming and calibrated WCAG AA/AAA tokens.
 */

export const RAPSONYX_VERSION = 'RAPSONYX_LIVE_CDN_V1';
export const SETTINGS_STORAGE_KEY = 'rapsonyx_settings';
export const PROFILE_STORAGE_KEY = 'rapsonyx_player_profile';

export const TEAM_CONFIG = Object.freeze({
  team_dream: {
    id: 'team_dream',
    name: 'Team Dream',
    symbol: 'Star',
    colorHex: '#5ce1ff',
    colorInt: 0x5ce1ff,
    glowRgba: 'rgba(92, 225, 255, 0.38)',
    crestAlias: 'crest_team_dream',
    frameAlias: 'skill_frame_dream',
    portraitFrameAlias: 'portrait_frame_dream'
  },
  team_love: {
    id: 'team_love',
    name: 'Team Love',
    symbol: 'Heart',
    colorHex: '#ff6bb5',
    colorInt: 0xff6bb5,
    glowRgba: 'rgba(255, 107, 181, 0.38)',
    crestAlias: 'crest_team_love',
    frameAlias: 'skill_frame_love',
    portraitFrameAlias: 'portrait_frame_love'
  },
  team_passion: {
    id: 'team_passion',
    name: 'Team Passion',
    symbol: 'Flame',
    colorHex: '#ffb347',
    colorInt: 0xffb347,
    glowRgba: 'rgba(255, 179, 71, 0.38)',
    crestAlias: 'crest_team_passion',
    frameAlias: 'skill_frame_passion',
    portraitFrameAlias: 'portrait_frame_passion'
  }
});

export const ATMOSPHERE_PRESETS = Object.freeze({
  rapsonyx_morning: {
    id: 'rapsonyx_morning',
    label: 'Fajar Cerah',
    sunColor: 0xffdfb8,
    sunIntensity: 1.48,
    sunElevationDeg: 28,
    sunAzimuthDeg: 65,
    hemiSky: 0x9cd4ff,
    hemiGround: 0x2d3b2c,
    hemiIntensity: 0.48,
    ambientIntensity: 0.08,
    fogColor: 0xaad5f7,
    fogDensity: 0.00072,
    lutAlias: 'lut_01_anime_neutral_day'
  },
  rapsonyx_day: {
    id: 'rapsonyx_day',
    label: 'Siang Seimbang',
    sunColor: 0xfff0d6,
    sunIntensity: 1.62,
    sunElevationDeg: 42,
    sunAzimuthDeg: 38,
    hemiSky: 0x7cb8eb,
    hemiGround: 0x222e24,
    hemiIntensity: 0.45,
    ambientIntensity: 0.08,
    fogColor: 0x95c8f0,
    fogDensity: 0.00058,
    lutAlias: 'lut_01_anime_neutral_day'
  },
  rapsonyx_mist: {
    id: 'rapsonyx_mist',
    label: 'Kabut Mist',
    sunColor: 0xe6efff,
    sunIntensity: 1.38,
    sunElevationDeg: 34,
    sunAzimuthDeg: 25,
    hemiSky: 0x8ea9c4,
    hemiGround: 0x1e2629,
    hemiIntensity: 0.44,
    ambientIntensity: 0.09,
    fogColor: 0x7a92ab,
    fogDensity: 0.00145,
    lutAlias: 'lut_02_twilight_terrarium'
  },
  rapsonyx_sunset: {
    id: 'rapsonyx_sunset',
    label: 'Senja Emas',
    sunColor: 0xffa65c,
    sunIntensity: 1.56,
    sunElevationDeg: 19,
    sunAzimuthDeg: 112,
    hemiSky: 0xffb38a,
    hemiGround: 0x2a1f2d,
    hemiIntensity: 0.46,
    ambientIntensity: 0.08,
    fogColor: 0xd98a6c,
    fogDensity: 0.0009,
    lutAlias: 'lut_03_arena_golden_sunset'
  },
  rapsonyx_night: {
    id: 'rapsonyx_night',
    label: 'Malam Bulan',
    sunColor: 0x9ac4ff,
    sunIntensity: 1.15,
    sunElevationDeg: 40,
    sunAzimuthDeg: 160,
    hemiSky: 0x3b5888,
    hemiGround: 0x121824,
    hemiIntensity: 0.42,
    ambientIntensity: 0.1,
    fogColor: 0x1a2742,
    fogDensity: 0.00095,
    lutAlias: 'lut_02_twilight_terrarium'
  }
});

export const MAP_CATALOG = Object.freeze({
  lobby_terrarium: {
    id: 'lobby_terrarium',
    name: 'RAPSONYX Imperial Terrarium',
    mode: 'LOBBY',
    teamCount: 0,
    modelAlias: 'lobby_terrarium',
    navAlias: 'nav_v6_world',
    iblAlias: 'skybox_twilight_512',
    atmosphere: 'rapsonyx_mist',
    cardAlias: 'card_lobby_terrarium',
    bgVsAlias: 'bg_sandbox_terrarium',
    packageId: 'pkg_starter'
  },
  sandbox_open_world: {
    id: 'sandbox_open_world',
    name: 'RAPSONYX Open-World 11,11 km',
    mode: 'SANDBOX',
    teamCount: 0,
    modelAlias: 'world_manifest_11km',
    navAlias: 'world_manifest_11km',
    iblAlias: 'skybox_day_512',
    atmosphere: 'rapsonyx_day',
    cardAlias: 'card_open_sandbox',
    bgVsAlias: 'bg_sandbox_open_world',
    packageId: 'pkg_openworld'
  },
  sandbox_valley: {
    id: 'sandbox_valley',
    name: 'RAPSONYX Celestial Valley',
    mode: 'SANDBOX_VALLEY',
    teamCount: 0,
    modelAlias: 'sandbox_valley',
    navAlias: 'nav_sandbox_valley',
    iblAlias: 'skybox_day_512',
    atmosphere: 'rapsonyx_day',
    cardAlias: 'card_open_sandbox',
    bgVsAlias: 'bg_sandbox_open_world',
    packageId: 'pkg_openworld'
  },
  arena_ocean_bridge: {
    id: 'arena_ocean_bridge',
    name: 'RAPSONYX Grand Ocean Bridge',
    mode: 'ARENA',
    teamCount: 2,
    factions: ['team_dream', 'team_passion'],
    width: 600,
    depth: 88,
    modelAlias: 'arena_ocean_bridge',
    fallbackModelAlias: 'arena_bridge_v6',
    navAlias: 'nav_fast_ocean_bridge',
    minimapAlias: 'minimap_ocean_bridge',
    iblAlias: 'skybox_sunset_512',
    atmosphere: 'rapsonyx_sunset',
    cardAlias: 'card_arena_ocean_bridge',
    bgVsAlias: 'bg_vs_ocean_bridge',
    packageId: 'pkg_arena_ocean',
    objectives: {
      team_dream: { turret: { x: -102, z: 0 }, base: { x: -242, z: 0 }, spawn: { x: -268, z: 0 } },
      team_passion: { turret: { x: 102, z: 0 }, base: { x: 242, z: 0 }, spawn: { x: 268, z: 0 } }
    }
  },
  arena_colosseum: {
    id: 'arena_colosseum',
    name: 'RAPSONYX Grand Colosseum',
    mode: 'ARENA',
    teamCount: 3,
    factions: ['team_dream', 'team_love', 'team_passion'],
    radius: 220,
    modelAlias: 'arena_colosseum',
    fallbackModelAlias: 'arena_colosseum_v6',
    navAlias: 'nav_fast_colosseum',
    minimapAlias: 'minimap_colosseum',
    iblAlias: 'skybox_sunset_512',
    atmosphere: 'rapsonyx_sunset',
    cardAlias: 'card_arena_colosseum',
    bgVsAlias: 'bg_vs_colosseum',
    packageId: 'pkg_arena_colosseum',
    objectives: {
      team_dream:   { angleDeg: 0,   turretR: 114, baseR: 176, spawnR: 196 },
      team_love:    { angleDeg: 120, turretR: 114, baseR: 176, spawnR: 196 },
      team_passion: { angleDeg: 240, turretR: 114, baseR: 176, spawnR: 196 }
    }
  },
  arena_sky_sakura: {
    id: 'arena_sky_sakura',
    name: 'RAPSONYX Sky Sanctuary',
    mode: 'ARENA',
    teamCount: 3,
    factions: ['team_dream', 'team_love', 'team_passion'],
    radius: 200,
    modelAlias: 'arena_sky_sakura',
    fallbackModelAlias: 'arena_sakura_v6',
    navAlias: 'nav_fast_sakura_ffa',
    minimapAlias: 'minimap_sky_sakura',
    iblAlias: 'skybox_twilight_512',
    atmosphere: 'rapsonyx_morning',
    cardAlias: 'card_arena_sky_sakura',
    bgVsAlias: 'bg_vs_sky_sakura',
    packageId: 'pkg_arena_sakura',
    objectives: {
      team_dream:   { angleDeg: 0,   turretR: 92, baseR: 148, spawnR: 168 },
      team_love:    { angleDeg: 120, turretR: 92, baseR: 148, spawnR: 168 },
      team_passion: { angleDeg: 240, turretR: 92, baseR: 148, spawnR: 168 }
    }
  },
  arena_mist_duel: {
    id: 'arena_mist_duel',
    name: 'RAPSONYX Mist Duel',
    mode: 'ARENA',
    teamCount: 2,
    factions: ['team_dream', 'team_passion'],
    radius: 140,
    modelAlias: 'arena_mist_duel',
    fallbackModelAlias: 'arena_mist_duel',
    navAlias: 'spatial_physics_7maps',
    minimapAlias: 'minimap_mist_duel',
    iblAlias: 'skybox_twilight_512',
    atmosphere: 'rapsonyx_mist',
    cardAlias: 'card_arena_colosseum',
    bgVsAlias: 'bg_vs_colosseum',
    packageId: 'pkg_arena_mist',
    objectives: {
      team_dream:   { turret: { x: -58, z: 0 }, base: { x: -108, z: 0 }, spawn: { x: -120, z: 0 } },
      team_passion: { turret: { x: 58, z: 0 },  base: { x: 108, z: 0 },  spawn: { x: 120, z: 0 } }
    }
  }
});

export const PHYSICS_CONSTANTS = Object.freeze({
  FIXED_DT: 1 / 60,
  MAX_FRAME_DT: 0.05,
  HERO_TARGET_HEIGHT: 1.85,
  GRAVITY: -22.0,
  GLIDER_GRAVITY: -3.2,
  GLIDER_MAX_FALL: -2.6,
  MAX_FALL_SPEED: -48.0,
  JUMP_VELOCITY: 8.4,
  COYOTE_TIME_S: 0.12,
  JUMP_BUFFER_S: 0.14,
  MAX_WALK_SLOPE_DEG: 35.0,
  SLIDE_SLOPE_DEG: 36.0,
  CLIFF_WALL_DEG: 52.0,
  WATER_LEVEL_Y: 0.0,
  FLOATING_ORIGIN_THRESHOLD: 1000.0,
  WORLD_SIZE_11KM: 11110.0,
  SECTOR_COUNT_AXIS: 11
});

export const WORLD_COORDS = Object.freeze({
  WORLD_HALF_EXTENT: 5555.0,
  TERRARIUM_SPAWN: { x: 0, y: 1.2, z: 6.5 },
  SANDBOX_SPAWN: { x: 0, y: 8.0, z: 12.0 },
  WAR_ORDER_SPAWN: { x: -46, y: 1.0, z: 0 },
  WAR_CHAOS_SPAWN: { x: 46, y: 1.0, z: 0 }
});

export const EXP_CURVE_L1_TO_L15 = Object.freeze([
  280, 423, 574, 731, 896, 1067, 1246, 1431, 1624, 1823, 2030, 2243, 2464, 2691
]);

export const RANK_TIERS = Object.freeze([
  { id: 'rank_01', name: 'Trainee', iconAlias: 'rank_01_trainee', starsPerDiv: 3 },
  { id: 'rank_02', name: 'Rookie', iconAlias: 'rank_02_rookie', starsPerDiv: 3 },
  { id: 'rank_03', name: 'Rising Star', iconAlias: 'rank_03_rising_star', starsPerDiv: 4 },
  { id: 'rank_04', name: 'Senbatsu', iconAlias: 'rank_04_senbatsu', starsPerDiv: 4 },
  { id: 'rank_05', name: 'Center', iconAlias: 'rank_05_center', starsPerDiv: 5 },
  { id: 'rank_06', name: 'Ace', iconAlias: 'rank_06_ace', starsPerDiv: 5 },
  { id: 'rank_07', name: 'Legend', iconAlias: 'rank_07_legend', starsPerDiv: 5 },
  { id: 'rank_08', name: 'Mythic', iconAlias: 'rank_08_mythic', starsPerDiv: 25 },
  { id: 'rank_09', name: 'Rapsonyx Sovereign', iconAlias: 'rank_09_sovereign', starsPerDiv: 9999 }
]);

export const NETWORK_CONFIG = Object.freeze({
  BACKEND_HTTP: (window.__RAPSONYX_BACKEND_HTTP__ || 'https://ashazeneca-botanalistiktl.hf.space').replace(/\/+$/, ''),
  BACKEND_WS: (window.__RAPSONYX_BACKEND_WS__ || 'wss://ashazeneca-botanalistiktl.hf.space').replace(/\/+$/, ''),
  BACKEND_URL: (window.__RAPSONYX_BACKEND_HTTP__ || 'https://ashazeneca-botanalistiktl.hf.space').replace(/\/+$/, ''),
  HEARTBEAT_INTERVAL_MS: 25000,
  INTERPOLATION_DELAY_MS: 100,
  TICK_HZ: 20,
  RECONNECT_BACKOFF_MS: [1000, 2000, 4000]
});

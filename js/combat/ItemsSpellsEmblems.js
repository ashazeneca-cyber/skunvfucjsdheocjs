/**
 * RAPSONYX 30 Shop Items, 8 Battle Spells, 6 Emblems & Gacha Starlight Catalog
 * Exact icon filenames aligned 1:1 with assets/ui/items_decals/ui_rapsodi/items & spells
 */

export const SHOP_ITEMS_30 = Object.freeze([
  // Physical (1-8)
  { id: 'item_starlight_blade', name: 'Starlight Blade', category: 'Physical', price: 2150, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_starlight_blade.webp', stats: { atk: 75, crit: 0.15, spdPct: 0.06 }, passive: 'Critical strike memberi +8% Move Speed selama 1.5 detik.' },
  { id: 'item_crimson_scythe', name: 'Crimson Scythe', category: 'Physical', price: 2050, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_crimson_scythe.webp', stats: { atk: 68, lifesteal: 0.22 }, passive: 'Basic attack memulihkan HP dan menurunkan healing musuh 40%.' },
  { id: 'item_phantom_dagger', name: 'Phantom Dagger', category: 'Physical', price: 1980, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_phantom_dagger.webp', stats: { atk: 58, flatPhysPen: 18, cdr: 0.10 }, passive: 'Ambush pertama memberi bonus 140% Physical DMG.' },
  { id: 'item_prism_bow', name: 'Prism Longbow', category: 'Physical', price: 2220, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_prism_bow.webp', stats: { atk: 65, atkSpd: 0.32, pctPhysPen: 0.28 }, passive: 'Serangan jarak jauh menembus +28% Armor.' },
  { id: 'item_rose_rapier', name: 'Rose Duet Rapier', category: 'Physical', price: 2100, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_rose_rapier.webp', stats: { atk: 62, atkSpd: 0.25, crit: 0.20, critDamageBonus: 0.35 }, passive: 'Meningkatkan Crit Damage sebesar +35%.' },
  { id: 'item_solar_halberd', name: 'Solar Halberd', category: 'Physical', price: 2180, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_solar_halberd.webp', stats: { atk: 70, hp: 350, pctPhysPen: 0.18 }, passive: 'Damage meningkat hingga +18% terhadap target ber-HP lebih tinggi.' },
  { id: 'item_gravity_hammer', name: 'Gravity Warhammer', category: 'Physical', price: 2340, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_gravity_hammer.webp', stats: { atk: 95, hp: 300 }, passive: 'Menghancurkan HP target <40% dengan +22% ekstra damage.' },
  { id: 'item_windtalker_fan', name: 'Windtalker Fan', category: 'Physical', price: 1890, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_windtalker_fan.webp', stats: { atkSpd: 0.38, crit: 0.15, spdPct: 0.08 }, passive: 'Setiap 3 serangan memicu badai angin AoE ke 3 musuh.' },

  // Magic (9-16)
  { id: 'item_eclipse_grimoire', name: 'Eclipse Grimoire', category: 'Magic', price: 2120, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_eclipse_grimoire.webp', stats: { mag: 95, cdr: 0.20, mana: 350 }, passive: 'Regenerasi 15% Max Mana saat assist/eliminasi.' },
  { id: 'item_rapsodi_wand', name: 'Rapsodi Scepter', category: 'Magic', price: 2240, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_rapsodi_wand.webp', stats: { mag: 115, hp: 250 }, passive: 'Memberikan +25% bonus Total Magic Power pada seluruh skill.' },
  { id: 'item_astral_orb', name: 'Astral Void Orb', category: 'Magic', price: 2080, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_astral_orb.webp', stats: { mag: 82, flatMagPen: 16, pctMagPen: 0.30 }, passive: 'Skill magis menembus +30% Magic Defense lawan.' },
  { id: 'item_frost_trident', name: 'Frostbite Trident', category: 'Magic', price: 1960, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_frost_trident.webp', stats: { mag: 75, hp: 350, spdPct: 0.05 }, passive: 'Skill memberikan efek Slow 25% selama 1.8 detik.' },
  { id: 'item_lotus_chalice', name: 'Lotus Chalice', category: 'Magic', price: 2040, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_lotus_chalice.webp', stats: { mag: 72, spellVamp: 0.20, cdr: 0.10 }, passive: 'Skill mengonversi 20% magic damage menjadi pemulihan HP.' },
  { id: 'item_sakura_lantern', name: 'Sakura Spirit Lantern', category: 'Magic', price: 2160, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_sakura_lantern.webp', stats: { mag: 88, hp: 420 }, passive: 'Membakar musuh sebesar 4% Max HP magis per detik.' },
  { id: 'item_golden_hourglass', name: 'Golden Hourglass', category: 'Magic', price: 1990, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_golden_hourglass.webp', stats: { mag: 70, def: 28, cdr: 0.12 }, passive: 'Aktif: Beku kebal (Invulnerable) 2 detik setiap 70 detik.' },
  { id: 'item_harmony_lyre', name: 'Harmony Lyre', category: 'Magic', price: 1860, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_harmony_lyre.webp', stats: { mag: 62, cdr: 0.15, healPower: 0.25 }, passive: 'Skill healing & shield ke sekutu bertambah kuat +25%.' },

  // Defense & Sustainment (17-24)
  { id: 'item_obsidian_plate', name: 'Obsidian Plate', category: 'Defense', price: 2080, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_obsidian_plate.webp', stats: { hp: 920, def: 58 }, passive: 'Memantulkan 22% Physical Damage ke penyerang terdekat.' },
  { id: 'item_eclipse_cloak', name: 'Eclipse Aegis Cloak', category: 'Defense', price: 2140, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_eclipse_cloak.webp', stats: { hp: 850, mdef: 62 }, passive: 'Meredam 20% Magic Burst tiap 10 detik dan memberi shield.' },
  { id: 'item_valkyrie_aegis', name: 'Valkyrie Aegis', category: 'Defense', price: 2190, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_valkyrie_aegis.webp', stats: { hp: 1100, def: 42, tenacity: 0.20 }, passive: 'Mendapat Shield saat HP turun di bawah 30%.' },
  { id: 'item_radiant_cuirass', name: 'Radiant Cuirass', category: 'Defense', price: 2020, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_radiant_cuirass.webp', stats: { hp: 800, def: 48, cdr: 0.10 }, passive: 'Mengurangi Attack Speed penyerang sebesar 25%.' },
  { id: 'item_thunder_belt', name: 'Thunder Vanguard Belt', category: 'Defense', price: 1940, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_thunder_belt.webp', stats: { hp: 780, def: 32, mdef: 32, cdr: 0.10 }, passive: 'Basic attack setelah skill memicu True Damage AoE & Slow.' },
  { id: 'item_phoenix_feather', name: 'Phoenix Rebirth', category: 'Defense', price: 2320, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_phoenix_feather.webp', stats: { hp: 750, def: 35 }, passive: 'Bangkit kembali 2 detik setelah gugur dengan 40% HP & Shield.' },
  { id: 'item_crystal_pendant', name: 'Crystal Guardian Pendant', category: 'Defense', price: 1920, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_crystal_pendant.webp', stats: { hp: 980, mdef: 40 }, passive: 'Regenerasi 2.2% Max HP per detik saat di luar pertarungan.' },
  { id: 'item_velvet_gauntlet', name: 'Velvet Brawler Gauntlet', category: 'Defense', price: 2050, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_velvet_gauntlet.webp', stats: { hp: 680, atk: 38, def: 28 }, passive: 'Menyerap 15% damage yang diterima menjadi Shield counter.' },

  // Mobility, Boots & Sovereign Crown (25-30)
  { id: 'item_rapsonyx_boots', name: 'Rapsonyx Swift Boots', category: 'Boots', price: 780, icon: 'item_rapsonyx_boots', stats: { spdPct: 0.14, def: 18 }, passive: 'Mengurangi durasi Crowd Control lawan sebesar 22%.' },
  { id: 'item_celestial_greaves', name: 'Celestial Arcane Greaves', category: 'Boots', price: 820, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_celestial_greaves.webp', stats: { spdPct: 0.14, atkSpd: 0.16, flatMagPen: 10 }, passive: 'Kecepatan rotasi meningkat cepat di luar combat.' },
  { id: 'item_seraph_wings', name: 'Seraph Stride Wings', category: 'Boots', price: 850, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_seraph_wings.webp', stats: { spdPct: 0.18, cdr: 0.10 }, passive: 'Bonus +10% Move Speed untuk tim Roamer saat roaming.' },
  { id: 'item_rapsonyx_ring', name: 'Rapsonyx Dominion Ring', category: 'Hybrid', price: 2180, icon: 'item_rapsonyx_ring', stats: { atk: 45, mag: 55, cdr: 0.12, lifesteal: 0.12, spellVamp: 0.12 }, passive: 'Omnivamp seimbang untuk serangan fisik maupun magis.' },
  { id: 'item_moonlight_tiara', name: 'Moonlight Senbatsu Tiara', category: 'Hybrid', price: 2260, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_moonlight_tiara.webp', stats: { mag: 75, hp: 480, cdr: 0.15 }, passive: 'Ultimate memperoleh 18% Shield tambahan saat diaktifkan.' },
  { id: 'item_sovereign_crown', name: 'Sovereign Rapsonyx Crown', category: 'Hybrid', price: 2850, icon: 'assets/ui/items_decals/ui_rapsodi/items/item_sovereign_crown.webp', stats: { atk: 70, mag: 85, hp: 500, crit: 0.18, cdr: 0.15 }, passive: 'Mahkota Agung RAPSONYX: semua damage hero naik +15% pada Sudden Death.' }
]);

export const BATTLE_SPELLS_8 = Object.freeze([
  { id: 'spell_flicker', name: 'Flicker', cooldown: 65, icon: 'assets/ui/backdrops/ui_rapsodi/spells/spell_flicker.webp', desc: 'Teleport jarak pendek seketika ke arah pandang (9m) & +15% Def 1 detik.' },
  { id: 'spell_execute', name: 'Execute', cooldown: 55, icon: 'assets/ui/backdrops/ui_rapsodi/spells/spell_execute.webp', desc: 'Menimbulkan True Damage besar + ekstra 14% HP hilang musuh; reset 40% CD jika kill.' },
  { id: 'spell_purify', name: 'Purify', cooldown: 60, icon: 'assets/ui/backdrops/ui_rapsodi/spells/spell_purify.webp', desc: 'Menghapus semua Crowd Control (kecuali Suppress) & kebal CC 1.5 detik.' },
  { id: 'spell_aegis', name: 'Aegis', cooldown: 58, icon: 'assets/ui/backdrops/ui_rapsodi/spells/spell_aegis.webp', desc: 'Memberikan Shield kuat (420 + 60×Lv) ke diri sendiri & sekutu terdekat.' },
  { id: 'spell_inspire', name: 'Inspire', cooldown: 50, icon: 'assets/ui/backdrops/ui_rapsodi/spells/spell_inspire.webp', desc: 'Attack Speed +55% & Lifesteal +20% selama 5 detik.' },
  { id: 'spell_revitalize', name: 'Revitalize', cooldown: 62, icon: 'assets/ui/backdrops/ui_rapsodi/spells/spell_revitalize.webp', desc: 'Memanggil lingkaran pemulihan tim +35% Max HP selama 4 detik.' },
  { id: 'spell_sprint', name: 'Sprint', cooldown: 48, icon: 'assets/ui/backdrops/ui_rapsodi/spells/spell_sprint.webp', desc: 'Move Speed +42% dan kebal efek Slow selama 5 detik.' },
  { id: 'spell_retribution', name: 'Retribution', cooldown: 32, icon: 'assets/ui/backdrops/ui_rapsodi/spells/spell_retribution.webp', desc: 'True Damage instan 750+Lv×60 ke Boss/Minion untuk mencuri objektif.' }
]);

export const EMBLEMS_6 = Object.freeze([
  { id: 'emb_fighter', name: 'Valkyrie Fighter', bonus: { hp: 240, atk: 18, spellVamp: 0.06, def: 10 } },
  { id: 'emb_assassin', name: 'Shadow Assassin', bonus: { atk: 22, flatPhysPen: 12, spdPct: 0.05, crit: 0.06 } },
  { id: 'emb_mage', name: 'Celestial Mage', bonus: { mag: 28, flatMagPen: 12, cdr: 0.08, mana: 180 } },
  { id: 'emb_marksman', name: 'Starlight Marksman', bonus: { atk: 20, atkSpd: 0.14, crit: 0.08, lifesteal: 0.05 } },
  { id: 'emb_support', name: 'Sanctuary Roamer', bonus: { hp: 260, cdr: 0.10, healPower: 0.12, spdPct: 0.06 } },
  { id: 'emb_rapsonyx', name: 'Rapsonyx Sovereign', bonus: { hp: 200, atk: 16, mag: 20, tenacity: 0.12, cdr: 0.06 } }
]);

export function getRecommendedBuildForArchetype(archetype) {
  switch (archetype) {
    case 'Mage':
      return ['item_celestial_greaves', 'item_eclipse_grimoire', 'item_rapsodi_wand', 'item_astral_orb', 'item_golden_hourglass', 'item_sakura_lantern'];
    case 'Marksman':
      return ['item_rapsonyx_boots', 'item_windtalker_fan', 'item_rose_rapier', 'item_prism_bow', 'item_crimson_scythe', 'item_sovereign_crown'];
    case 'Assassin':
      return ['item_rapsonyx_boots', 'item_phantom_dagger', 'item_starlight_blade', 'item_gravity_hammer', 'item_solar_halberd', 'item_phoenix_feather'];
    case 'Healer':
      return ['item_seraph_wings', 'item_harmony_lyre', 'item_eclipse_grimoire', 'item_valkyrie_aegis', 'item_moonlight_tiara', 'item_crystal_pendant'];
    default:
      return ['item_rapsonyx_boots', 'item_solar_halberd', 'item_thunder_belt', 'item_velvet_gauntlet', 'item_eclipse_cloak', 'item_phoenix_feather'];
  }
}

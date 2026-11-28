/**
 * RAPSONYX 42-Hero Roster Directory & Exact CDN Asset Breakdown
 * Zero voice-over assets; purely visual, audio SFX/BGM, shaders, rigs & gameplay packs.
 */

import { LocalAssetCache } from '../core/LocalAssetCache.js';

export const ROSTER_42 = Object.freeze(
[
  {
    "id": "marsha",
    "name": "Marsha",
    "team": "team_dream",
    "roleLane": "Mage / Mid Lane (Lunar Burst Mage)",
    "weaponName": "Lunar Prism Scepter (Tongkat Prisma Bulan Sabit)",
    "weaponType": "starblade",
    "standPath": "assets/stands/stands_42_custom_glb/team_dream/stand3d_marsha_pizza_guitar_star.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_dream/weapon_anim_marsha_starblade.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/marsha_weapon.glb",
    "heroGlbPath": "assets/heroes/team_dream/marsha_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/marsha.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/marsha_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/marsha_chibi.webp",
    "bytes": {
      "model": 41288304,
      "vfx": 862547,
      "sfx": 222392,
      "icons": 193926,
      "riggedWeapon": 12268339,
      "total": 42567169
    },
    "skills": {
      "passive": "Anticipation of Luna: Terinspirasi perannya sebagai Luna di film pendek Magic Hour dan jikoshoukai \"selalu dinanti-nantikan\", setiap skill Marsha yang mengenai musuh menumpuk Lunar Slice hingga 4 lapis; pada tumpukan penuh, serangan berikutnya memicu ledakan bulan purnama ber-damage magis besar.",
      "skill_1": "Crescent Pizza Arc: Mengayunkan tongkat untuk melontarkan proyektil cahaya bulan sabit melengkung yang membelah barisan minion dan memantul ke satu target terdekat dengan efek kilau visual bergaya anime biru-perak.",
      "skill_2": "Stargaze Blink: Meluncur cepat mundur atau menyamping dalam lintasan cahaya bintang sambil meninggalkan segmen prisma bulan yang memperlambat (Slow) musuh yang mengejar.",
      "ultimate": "Eclipse of the Dream Center: Mengangkat tongkat ke langit malam untuk memanggil gerhana bulan raksasa di area war selama 4 detik yang menghujani lawan dengan 6 sinar laser bulan beruntun, menceraiberaikan formasi musuh dan menghabisi backline."
    },
    "archetype": "Mage",
    "stats": {
      "hp": 2520,
      "mana": 720,
      "atk": 68,
      "mag": 152,
      "def": 18,
      "mdef": 28,
      "spd": 5.99,
      "atkRange": 8.2,
      "crit": 0.08
    },
    "isDefault": false
  },
  {
    "id": "freya",
    "name": "Freya",
    "team": "team_dream",
    "roleLane": "Fighter / EXP Lane (Agile Valkyrie Bruiser)",
    "weaponName": "Valkyrie Twin Skyblades (Sepasang Pedang Langit berukir motif emas-cyan)",
    "weaponType": "staff",
    "standPath": "assets/stands/stands_42_custom_glb/team_dream/stand3d_freya_royal_caramel_cam.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_dream/weapon_anim_freya_staff.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/freya_weapon.glb",
    "heroGlbPath": "assets/heroes/team_dream/freya_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/freya.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/freya_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/freya_chibi.webp",
    "bytes": {
      "model": 61720002,
      "vfx": 883331,
      "sfx": 222382,
      "icons": 201422,
      "riggedWeapon": 29559357,
      "total": 63027137
    },
    "skills": {
      "passive": "Caramel Cholerics: Menggabungkan jikoshoukai gadis koleris penuh imajinasi dan latar darah bangsawan yang tangguh, setiap kombo serangan berturut-turut menambah 20% Attack Speed dan Movement Speed, sekaligus memulihkan sebagian kecil HP tiap serangan ke-4.",
      "skill_1": "Skyfall Strike: Melompat tinggi ke udara lalu menghunjam tanah dengan kedua pedang, memicu ledakan gelombang angin cyan yang mementalkan musuh (Knockup) di area pendaratan.",
      "skill_2": "Vortex Guard: Memutar kedua pedangnya membentuk perisai pusaran angin selama 1,5 detik yang memantulkan 30% damage proyektil musuh lalu mengakhiri putaran dengan tebasan penyapu.",
      "ultimate": "Captain's Valkyrie Ascendance: Merepresentasikan tanggung jawabnya sebagai Kapten JKT48, sayap malaikat langit bercahaya cyan-karamel membentang di punggung Freya selama 10 detik—mengubah seluruh tebasannya menjadi badai kilat area luas sekaligus memberi aura +15% Movement Speed dan perisai keberanian kepada sekutu di sekitarnya."
    },
    "archetype": "Fighter",
    "stats": {
      "hp": 3195,
      "mana": 460,
      "atk": 134,
      "mag": 20,
      "def": 32,
      "mdef": 24,
      "spd": 6.35,
      "atkRange": 2.75,
      "crit": 0.12
    },
    "isDefault": true
  },
  {
    "id": "greesel",
    "name": "Greesel",
    "team": "team_dream",
    "roleLane": "Marksman / Gold Lane (Firefly Vision Carry)",
    "weaponName": "Nocturne Firefly Dual Pistols (Sepasang Pistol Cahaya Kunang-Kunang)",
    "weaponType": "daggers",
    "standPath": "assets/stands/stands_42_custom_glb/team_dream/stand3d_greesel_firefly_guitar.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_dream/weapon_anim_greesel_daggers.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/greesel_weapon.glb",
    "heroGlbPath": "assets/heroes/team_dream/greesel_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/greesel.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/greesel_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/greesel_chibi.webp",
    "bytes": {
      "model": 35728650,
      "vfx": 788388,
      "sfx": 221983,
      "icons": 212964,
      "riggedWeapon": 27126661,
      "total": 36951985
    },
    "skills": {
      "passive": "Firefly Gaze: Terinspirasi jikoshoukai kunang-kunang di malam hari, setiap 3 tembakan meninggalkan pendar kunang-kunang pada musuh yang membuka vision mereka selama 3 detik meski bersembunyi di semak.",
      "skill_1": "Straightforward Shot: Menembakkan peluru cahaya berkecepatan tinggi secara lurus dan tegas (straightforward) yang menembus target pertama dan menghasilkan Critical Damage tambahan jika target sudah memiliki pendar kunang-kunang.",
      "skill_2": "Midnight Flutter: Melakukan dash menyamping sambil menebarkan kawanan kunang-kunang di posisi awal yang meledak ringan dan membutakan (Blind singkat) penyerang jarak dekat.",
      "ultimate": "Constellation Barrage: Melompat mundur ke udara lalu melepaskan rentetan 12 tembakan kunang-kunang ke area kerucut depan; setiap tembakan yang mengenai hero lawan memangkas cooldown Midnight Flutter untuk kiting berkelanjutan di teamfight."
    },
    "archetype": "Marksman",
    "stats": {
      "hp": 2550,
      "mana": 500,
      "atk": 138,
      "mag": 18,
      "def": 17,
      "mdef": 18,
      "spd": 6.31,
      "atkRange": 9.4,
      "crit": 0.2
    },
    "isDefault": false
  },
  {
    "id": "ella",
    "name": "Ella",
    "team": "team_dream",
    "roleLane": "Mage / Mid Lane (Chrono-Sky Stance Mage)",
    "weaponName": "Horizon Astrolabe (Astrolab Pengatur Fajar, Siang, dan Malam)",
    "weaponType": "staff",
    "standPath": "assets/stands/stands_42_custom_glb/team_dream/stand3d_ella_daycycle_ukulele.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_dream/weapon_anim_ella_staff.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/ella_weapon.glb",
    "heroGlbPath": "assets/heroes/team_dream/ella_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/ella.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/ella_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/ella_chibi.webp",
    "bytes": {
      "model": 36353382,
      "vfx": 943963,
      "sfx": 220693,
      "icons": 206612,
      "riggedWeapon": 36511416,
      "total": 37724650
    },
    "skills": {
      "passive": "Every Hour With You: Mengadaptasi jikoshoukai \"Ohayo! Konnichiwa! Oyasumi!\", setiap penggunaan skill memutar siklus langit Ella melalui tiga fase: Ohayo (+Movement Speed), Konnichiwa (+Magic Penetration), dan Oyasumi (memberi efek Drowsy/Slow).",
      "skill_1": "Skyward Pulse: Menembakkan bola cahaya langit yang berubah efek sesuai fase aktif—gelombang angin cepat saat Ohayo, ledakan surya tajam saat Konnichiwa, atau kabut tidur bulan saat Oyasumi.",
      "skill_2": "Fantasy Horizon: Menggambar garis cakrawala berkilau di tanah (terinspirasi hobi menggambar dan film fantasi) yang memunculkan pilar cahaya langit setelah jeda 0,8 detik untuk memberi Root pada lawan yang terjebak.",
      "ultimate": "Blue Sky Unison: Membentangkan kubah langit biru fantasi di area war; semua fase Ohayo–Konnichiwa–Oyasumi aktif bersamaan selama 5 detik sehingga musuh di dalamnya terkena Slow berat, hujan cahaya terus-menerus, dan Sleep pada detik terakhir."
    },
    "archetype": "Mage",
    "stats": {
      "hp": 2655,
      "mana": 720,
      "atk": 68,
      "mag": 152,
      "def": 18,
      "mdef": 28,
      "spd": 5.99,
      "atkRange": 8.2,
      "crit": 0.08
    },
    "isDefault": false
  },
  {
    "id": "gita",
    "name": "Gita",
    "team": "team_dream",
    "roleLane": "Assassin / Jungler (Stealth Illusion Assassin)",
    "weaponName": "Silent Crescent Daggers (Belati Kembar Bayangan Bulan)",
    "weaponType": "starblade",
    "standPath": "assets/stands/stands_42_custom_glb/team_dream/stand3d_gita_cat_loki_crescent.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_dream/weapon_anim_gita_starblade.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/gita_weapon.glb",
    "heroGlbPath": "assets/heroes/team_dream/gita_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/gita.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/gita_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/gita_chibi.webp",
    "bytes": {
      "model": 51431977,
      "vfx": 836282,
      "sfx": 222015,
      "icons": 206674,
      "riggedWeapon": 11062477,
      "total": 52696948
    },
    "skills": {
      "passive": "Silent Observer: Mencerminkan pembawaan pendiam, tegas, dan jikoshoukai \"Diam bukan berarti tak memperhatikanmu\", jika Gita diam di semak atau tidak menyerang selama 2 detik, ia memasuki kamuflase parsial dan menandai hero musuh terdekat untuk menerima +25% Burst Damage pada serangan pembuka.",
      "skill_1": "Loki's Mirage: Terinspirasi karakter favoritnya, Loki, Gita melesat cepat ke arah target sambil meninggalkan klon bayangan tenang di tempat asal; jika musuh menyerang klon, klon meledak menimbulkan kabut beku Slow.",
      "skill_2": "Precision Formation: Mengayunkan belati dalam gerakan menyilang tajam penuh disiplin (mengadaptasi pengalaman paskibra dan latar keluarga purnawirawan TNI) dua kali berturut-turut, mereset animasi Basic Attack dan menembus Armor.",
      "ultimate": "Moonless Execution: Menghilang sepenuhnya dari pandangan lawan selama 2 detik lalu muncul tepat di belakang target bertanda Silent Observer, menebas dalam lintasan bulan sabit gelap dengan Execute Damage berdasarkan HP musuh yang hilang."
    },
    "archetype": "Assassin",
    "stats": {
      "hp": 2860,
      "mana": 440,
      "atk": 148,
      "mag": 30,
      "def": 21,
      "mdef": 19,
      "spd": 6.95,
      "atkRange": 2.65,
      "crit": 0.22
    },
    "isDefault": false
  },
  {
    "id": "olla",
    "name": "Olla",
    "team": "team_dream",
    "roleLane": "Fighter / EXP Lane (Mecha-Sky Tinkerer)",
    "weaponName": "Aero-Wrench Hammer (Kunci Pas Palu Bertenaga Turbin Langit)",
    "weaponType": "halberd",
    "standPath": "assets/stands/stands_42_custom_glb/team_dream/stand3d_olla_mechanic_gears_mic.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_dream/weapon_anim_olla_halberd.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/olla_weapon.glb",
    "heroGlbPath": "assets/heroes/team_dream/olla_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/olla.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/olla_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/olla_chibi.webp",
    "bytes": {
      "model": 35929589,
      "vfx": 943953,
      "sfx": 279265,
      "icons": 208516,
      "riggedWeapon": 20384317,
      "total": 37361323
    },
    "skills": {
      "passive": "Mechanic Girl's Overhaul: Sesuai julukan ikonik \"Mechanic Girl\" dan ketertarikannya pada dunia otomotif, setiap kali skill Olla mengenai musuh, baut dan roda gigi melayang mengitari tubuhnya, menambah Physical Defense dan Attack Range sementara.",
      "skill_1": "Turbo Wrench Slam: Menghantamkan kunci pas turbin raksasa ke depan dengan ayunan melengkung, memukul mundur (Knockback) lawan dan meretakkan pertahanan fisik mereka sebesar 15%.",
      "skill_2": "Sky-Drone Pitstop: Melempar drone mekanik terbang yang menembaki musuh terdekat dengan percikan listrik cyan selama 5 detik; Olla dapat menekan ulang skill untuk menarik dirinya menuju drone dengan kabel derek.",
      "ultimate": "Wartak Nitro Overdrive: Merujuk pada konten populer miliknya, Wartak, Olla merakit eksoskeleton turbin langit di punggungnya selama 8 detik, memicu ledakan tawa ceria yang memecah Crowd Control, lalu meluncur kencang menabrak garis depan lawan sambil menghamburkan ledakan piston mekanik di tiap pijakan."
    },
    "archetype": "Fighter",
    "stats": {
      "hp": 3150,
      "mana": 460,
      "atk": 134,
      "mag": 20,
      "def": 32,
      "mdef": 24,
      "spd": 6.41,
      "atkRange": 2.75,
      "crit": 0.12
    },
    "isDefault": false
  },
  {
    "id": "oline",
    "name": "Oline",
    "team": "team_dream",
    "roleLane": "Assassin / Jungler (High-Speed Ballet Assassin)",
    "weaponName": "Starlight Ribbon Blades (Pedang Pita Balet Bercahaya Bintang)",
    "weaponType": "daggers",
    "standPath": "assets/stands/stands_42_custom_glb/team_dream/stand3d_oline_ballet_turbo_easel.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_dream/weapon_anim_oline_daggers.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/oline_weapon.glb",
    "heroGlbPath": "assets/heroes/team_dream/oline_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/oline.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/oline_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/oline_chibi.webp",
    "bytes": {
      "model": 44603299,
      "vfx": 858369,
      "sfx": 214660,
      "icons": 202262,
      "riggedWeapon": 17637048,
      "total": 45878590
    },
    "skills": {
      "passive": "Full Tank Gas-Oline: Mengadaptasi jikoshoukai \"Gas, gas, gas-Oline!\", setiap langkah dan dash mengisi meteran Full Gas hingga 100%; saat penuh, skill berikutnya melesat 30% lebih cepat dan meninggalkan sapuan kuas langit berbintang bergaya Van Gogh yang memberi damage susulan.",
      "skill_1": "Pirouette Dash: Berputar luwes ala tarian balet sambil meluncur menembus lawan, menggoreskan tebasan pita tajam; jika mengenai hero lawan, cooldown berkurang 50% untuk manuver beruntun.",
      "skill_2": "Starry Rain Step: Memutar pita cahaya di udara memanggil rintik hujan bintang (terinspirasi kesukaannya pada hujan berdurasi lama) yang memperlambat musuh dan memungkinkannya melompati dinding tipis arena.",
      "ultimate": "Grand Swan Finale: Melesat dalam rangkaian 5 putaran balet super cepat yang melukis pola bintang raksasa di arena war; setiap simpul bintang meledak serentak setelah putaran berakhir untuk menghabisi carry lawan di tengah pola."
    },
    "archetype": "Assassin",
    "stats": {
      "hp": 2725,
      "mana": 440,
      "atk": 148,
      "mag": 30,
      "def": 21,
      "mdef": 19,
      "spd": 6.89,
      "atkRange": 2.65,
      "crit": 0.22
    },
    "isDefault": false
  },
  {
    "id": "eli",
    "name": "Eli",
    "team": "team_dream",
    "roleLane": "Healer / Roamer (Twilight Vocal Enchanter)",
    "weaponName": "Twilight Sky Chime Staff (Tongkat Lonceng Lembayung Senja)",
    "weaponType": "grimoire",
    "standPath": "assets/stands/stands_42_custom_glb/team_dream/stand3d_eli_twilight_cat_arch.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_dream/weapon_anim_eli_grimoire.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/eli_weapon.glb",
    "heroGlbPath": "assets/heroes/team_dream/eli_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/eli.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/eli_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/eli_chibi.webp",
    "bytes": {
      "model": 47251333,
      "vfx": 859800,
      "sfx": 454062,
      "icons": 208405,
      "riggedWeapon": 20017316,
      "total": 48773600
    },
    "skills": {
      "passive": "Warmth of Dusk: Terinspirasi jikoshoukai lembayung senja penghangat suasana dan kemampuan vokalnya yang menonjol, setiap skill penyembuhan Eli menyisakan aura hangat selama 3 detik yang meningkatkan Energy/Mana Regen dan ketahanan Slow sekutu.",
      "skill_1": "Senja Resonance: Mengayunkan tongkat memancarkan gelombang nada emas-cyan ke arah sekutu; memulihkan HP di sepanjang jalur gelombang sekaligus memberi Magic Damage ringan bila menyentuh lawan.",
      "skill_2": "Cabin Crew Gale: Mengenang kisahnya yang sempat masuk akademi pramugari, Eli mengirim embusan angin lembut yang membersihkan satu efek Slow atau Root pada sekutu target dan mendorong mundur assassin musuh yang terlalu dekat.",
      "ultimate": "Lembayung Sanctuary: Menyanyikan nada tinggi solo yang mewarnai seluruh area teamfight menjadi langit lembayung senja selama 4,5 detik—memulihkan HP seluruh tim secara masif tiap detik sambil mempercepat rotasi gerak sekutu hingga 25%."
    },
    "archetype": "Healer",
    "stats": {
      "hp": 3030,
      "mana": 680,
      "atk": 74,
      "mag": 124,
      "def": 26,
      "mdef": 30,
      "spd": 6.2,
      "atkRange": 6.8,
      "crit": 0.08
    },
    "isDefault": false
  },
  {
    "id": "delynn",
    "name": "Delynn",
    "team": "team_dream",
    "roleLane": "Healer / Roamer (Global Tether Support)",
    "weaponName": "Pyong-Pyong Lunar Drone (Drone Pendamping Bulan Sabit)",
    "weaponType": "chakram",
    "standPath": "assets/stands/stands_42_custom_glb/team_dream/stand3d_delynn_bunny_python_game.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_dream/weapon_anim_delynn_chakram.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/delynn_weapon.glb",
    "heroGlbPath": "assets/heroes/team_dream/delynn_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/delynn.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/delynn_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/delynn_chibi.webp",
    "bytes": {
      "model": 36594278,
      "vfx": 923004,
      "sfx": 283361,
      "icons": 205427,
      "riggedWeapon": 29485957,
      "total": 38006070
    },
    "skills": {
      "passive": "Scam Charm: Terinspirasi julukan kocak \"member scam\" dan kegemarannya menulis pantun, setiap kali Delynn memberi Shield kepada sekutu, muncul kilau pengecoh yang mengurangi 15% damage serangan pertama musuh yang mengarah ke sekutu tersebut.",
      "skill_1": "Pyong-Pyong Hop: Melompat lincah ke arah target (\"Pyong! Pyong!\") sambil memancarkan gelombang penyembuh berbentuk bulan sabit di titik pendaratan yang memulihkan HP sekutu dan memberi Shield tipis.",
      "skill_2": "Nightwing Batarang: Mengadaptasi ketertarikannya pada Batman, ia melempar bumerang bulan sabit mekanik yang melengkung kembali ke tangannya; musuh yang terkena saat lemparan balik terkena efek Stun 1 detik.",
      "ultimate": "Angel's Global Link: Terinspirasi dari hero yang biasa dimainkannya di arena MOBA, Angela, Delynn mengunci satu sekutu di mana pun di peta dan meluncur cepat menjadi perisai cahaya bulan raksasa di sekeliling sekutu tersebut selama 6 detik, memungkinkan Delynn terus menyembuhkan dan menembakkan bumerang dari posisi sekutu untuk membalikkan duel maupun war."
    },
    "archetype": "Healer",
    "stats": {
      "hp": 3075,
      "mana": 680,
      "atk": 74,
      "mag": 124,
      "def": 26,
      "mdef": 30,
      "spd": 6.26,
      "atkRange": 6.8,
      "crit": 0.08
    },
    "isDefault": false
  },
  {
    "id": "nachia",
    "name": "Nachia",
    "team": "team_dream",
    "roleLane": "Fighter / EXP Lane (Acrobatic Cloud Tank-Fighter)",
    "weaponName": "Cloud-Bamboo Bo Staff (Tongkat Bambu Awan Bercahaya Cyan)",
    "weaponType": "chakram",
    "standPath": "assets/stands/stands_42_custom_glb/team_dream/stand3d_nachia_panda_bali_gate.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_dream/weapon_anim_nachia_chakram.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/nachia_weapon.glb",
    "heroGlbPath": "assets/heroes/team_dream/nachia_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/nachia.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/nachia_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/nachia_chibi.webp",
    "bytes": {
      "model": 62970501,
      "vfx": 836506,
      "sfx": 214077,
      "icons": 217711,
      "riggedWeapon": 36259758,
      "total": 64238795
    },
    "skills": {
      "passive": "Cheerful Panda Resilience: Mengadaptasi jikoshoukai \"Si panda unyu yang selalu ceria\", setiap kali Nachia menerima efek Crowd Control, ia langsung memperoleh lapisan perisai awan tebal dan meningkatkan damage serangan tongkat berikutnya.",
      "skill_1": "Cloud Roll: Berguling kencang ke depan berbalut kabut awan putih-cyan, menabrak dan mementalkan (Knockback) musuh di jalurnya sambil memantul ringan saat membentur dinding.",
      "skill_2": "Bamboo Spin Parry: Memutar tongkat bambu di depan tubuh dengan cepat selama 1,2 detik untuk mengurangi 45% damage dari depan, lalu menghantamkannya ke tanah memicu gelombang kejut kecil.",
      "ultimate": "Happy Stage Dome: Berbekal latar belakang aktris cilik yang ekspresif, Nachia menancapkan tongkat bambu ke tanah menciptakan arena awan melingkar selama 4 detik; setiap musuh yang menyentuh tepi awan terpental kembali ke tengah panggung untuk dikunci oleh damage dealer tim."
    },
    "archetype": "Fighter",
    "stats": {
      "hp": 3330,
      "mana": 460,
      "atk": 134,
      "mag": 20,
      "def": 32,
      "mdef": 24,
      "spd": 6.29,
      "atkRange": 2.75,
      "crit": 0.12
    },
    "isDefault": false
  },
  {
    "id": "lyn",
    "name": "Lyn",
    "team": "team_dream",
    "roleLane": "Mage / Mid Lane (Lunar Tide Controller)",
    "weaponName": "Moonlit Tide Harp (Harpa Pasang Surut Cahaya Bulan)",
    "weaponType": "halberd",
    "standPath": "assets/stands/stands_42_custom_glb/team_dream/stand3d_lyn_ocean_wave_golf.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_dream/weapon_anim_lyn_halberd.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/lyn_weapon.glb",
    "heroGlbPath": "assets/heroes/team_dream/lyn_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/lyn.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/lyn_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/lyn_chibi.webp",
    "bytes": {
      "model": 37047102,
      "vfx": 793395,
      "sfx": 214682,
      "icons": 213391,
      "riggedWeapon": 23718789,
      "total": 38268570
    },
    "skills": {
      "passive": "Calm Before the Sweep: Memadukan jikoshoukai \"ombak laut yang tenang\" dengan gravitasi bulan Team Dream, setiap 6 detik tanpa mengeluarkan skill, senar harpa Lyn terisi penuh sehingga skill berikutnya memiliki jangkauan 20% lebih luas dan Knockback lebih kuat.",
      "skill_1": "Crescent Ripple: Memetik harpa mengirim riak air bercahaya perak-biru yang melaju tenang lalu mendadak membesar di ujung lintasan, menarik musuh sedikit ke pusat riak.",
      "skill_2": "Yoga Balance Wave: Terinspirasi hobi yoga dan latar belakang keluarga musisi-desainer, Lyn menciptakan lingkaran air tenang di bawah kakinya yang memulihkan sedikit mana sambil mendorong menjauh musuh jarak dekat dengan gelombang melingkar.",
      "ultimate": "Sudden Moon-Tsunami: Memetik seluruh senar harpa sekaligus untuk memanggil dinding ombak pasang cahaya bulan raksasa yang menyapu lurus selebar lane—mendorong seluruh tim lawan, memutus channeling skill, dan memberikan Magic Damage masif."
    },
    "archetype": "Mage",
    "stats": {
      "hp": 2520,
      "mana": 720,
      "atk": 68,
      "mag": 152,
      "def": 18,
      "mdef": 28,
      "spd": 6.05,
      "atkRange": 8.2,
      "crit": 0.08
    },
    "isDefault": false
  },
  {
    "id": "nala",
    "name": "Nala",
    "team": "team_dream",
    "roleLane": "Assassin / Jungler (Silat Ambush Striker)",
    "weaponName": "Celestial Lion Gauntlets (Sarung Tangan Cakar Singa Langit)",
    "weaponType": "starblade",
    "standPath": "assets/stands/stands_42_custom_glb/team_dream/stand3d_nala_lion_silat_mask.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_dream/weapon_anim_nala_starblade.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/nala_weapon.glb",
    "heroGlbPath": "assets/heroes/team_dream/nala_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/nala.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/nala_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/nala_chibi.webp",
    "bytes": {
      "model": 36165795,
      "vfx": 943942,
      "sfx": 223150,
      "icons": 232458,
      "riggedWeapon": 133840241,
      "total": 37565345
    },
    "skills": {
      "passive": "Lioness Silat Stance: Berakar pada prestasinya sebagai juara pencak silat kategori fight dan jikoshoukai singa pemberani, setiap pergantian antara skill dan Basic Attack memicu jurus sapuan kaki cepat yang menambah Physical Penetration hingga 3 lapis.",
      "skill_1": "Roar Pounce: Melakukan lompatan menerkam dengan kuda-kuda silat cepat; jika mengenai musuh dari sisi samping atau belakang, memicu auman singa cahaya cyan yang memberi Slow 40%.",
      "skill_2": "Pantomime Wall: Mengadaptasi bakat uniknya dalam seni pantomim, Nala menggerakkan kedua telapak tangannya di udara untuk membentuk \"dinding tak terlihat\" bercahaya tipis selama 2,5 detik yang menghentikan dash lawan; musuh yang menabrak dinding ini langsung terkena Stun 1 detik.",
      "ultimate": "Sovereign Silat Flurry: Mengunci satu target utama dan melepaskan rangkaian 5 jurus pukulan serta tendangan pencak silat berkecepatan kilat berbalut aura kepala singa langit, diakhiri bantingan keras yang memecah formasi musuh di sekitarnya."
    },
    "archetype": "Assassin",
    "stats": {
      "hp": 2725,
      "mana": 440,
      "atk": 148,
      "mag": 30,
      "def": 21,
      "mdef": 19,
      "spd": 7.01,
      "atkRange": 2.65,
      "crit": 0.22
    },
    "isDefault": false
  },
  {
    "id": "chelsea",
    "name": "Chelsea",
    "team": "team_dream",
    "roleLane": "Marksman / Gold Lane (Starlight Sniper Carry)",
    "weaponName": "Shooting Star Electric Guitar-Rifle (Gitar Listrik Penembak Bintang Jatuh)",
    "weaponType": "bow",
    "standPath": "assets/stands/stands_42_custom_glb/team_dream/stand3d_chelsea_shootingstar_sydney.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_dream/weapon_anim_chelsea_bow.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/chelsea_weapon.glb",
    "heroGlbPath": "assets/heroes/team_dream/chelsea_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/chelsea.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/chelsea_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/chelsea_chibi.webp",
    "bytes": {
      "model": 41288745,
      "vfx": 862534,
      "sfx": 222434,
      "icons": 201124,
      "riggedWeapon": 18360566,
      "total": 42574837
    },
    "skills": {
      "passive": "Starry Night Riff: Terinspirasi kemahirannya bermain gitar listrik dan jikoshoukai \"shooting star in the starry night sky\", setiap 4 tembakan dasar berubah menjadi proyektil bintang jatuh yang melesat menembus seluruh musuh dalam satu garis lurus.",
      "skill_1": "Meteor Chord: Memetik senar dengan hentakan keras untuk meluncurkan tembakan sinar bintang jarak sangat jauh yang menyala terang saat membentur hero musuh pertama.",
      "skill_2": "Power Slide Backstep: Meluncur mundur sambil memetik Power Chord bergetar; gelombang suara gitar mendorong mundur musuh jarak dekat sekaligus memberi Attack Speed tambahan selama 3 detik.",
      "ultimate": "Shooting Star Encore: Mengangkat gitar listrik dan memainkan solo singkat selama 2 detik, menjatuhkan hujan 8 meteor bintang jatuh berpendar cyan-putih di area target luas—menghancurkan objektif maupun memaksa lawan bubar dari posisi bertahan."
    },
    "archetype": "Marksman",
    "stats": {
      "hp": 2550,
      "mana": 500,
      "atk": 138,
      "mag": 18,
      "def": 17,
      "mdef": 18,
      "spd": 6.19,
      "atkRange": 9.4,
      "crit": 0.2
    },
    "isDefault": false
  },
  {
    "id": "fiony",
    "name": "Fiony",
    "team": "team_love",
    "roleLane": "Healer / Roamer (Symphonic Sanctuary Healer)",
    "weaponName": "Heartstring Conductor Baton (Tongkat Dirigen Simfoni Hati)",
    "weaponType": "staff",
    "standPath": "assets/stands/stands_42_custom_glb/team_love/stand3d_fiony_symphony_torii_art.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_love/weapon_anim_fiony_staff.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/fiony_weapon.glb",
    "heroGlbPath": "assets/heroes/team_love/fiony_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/fiony.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/fiony_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/fiony_chibi.webp",
    "bytes": {
      "model": 54262046,
      "vfx": 919439,
      "sfx": 219719,
      "icons": 200487,
      "riggedWeapon": 48611983,
      "total": 55601691
    },
    "skills": {
      "passive": "Calming Symphony: Mengangkat jikoshoukai \"simfoni yang menenangkan hati\" dan jiwa ilustrasinya sebagai mahasiswi DKV, setiap kali Fiony menggunakan skill, notasi musik magenta melayang ke sekutu dengan HP terendah untuk memberi pemulihan HP otomatis.",
      "skill_1": "Illustrated Crescendo: Mengayunkan tongkat melukis busur partitur bercahaya di udara; sekutu yang dilewati busur menerima Heal instan dan bonus Attack/Magic Power, sementara lawan terkena Slow.",
      "skill_2": "Harmony Barrier: Menggambar bingkai hati bercahaya di sekitar satu sekutu target, menyerap damage besar dan menghapus efek Silence atau Stun yang sedang aktif.",
      "ultimate": "Grand Symphony of Love: Memimpin orkestra cahaya magenta di area war selama 4 detik—melantunkan simfoni agung yang memulihkan HP seluruh tim secara deras sekaligus menjaga HP sekutu di dalam lingkaran agar tidak bisa turun di bawah 1 selama 1,5 detik pertama guna menggagalkan burst lawan."
    },
    "archetype": "Healer",
    "stats": {
      "hp": 3075,
      "mana": 680,
      "atk": 74,
      "mag": 124,
      "def": 26,
      "mdef": 30,
      "spd": 6.2,
      "atkRange": 6.8,
      "crit": 0.08
    },
    "isDefault": false
  },
  {
    "id": "michie",
    "name": "Michie",
    "team": "team_love",
    "roleLane": "Marksman / Gold Lane (Infinite-Scaling Hyper Carry)",
    "weaponName": "Infinity Heart Bow (Busur Kristal Cinta Tanpa Batas)",
    "weaponType": "bow",
    "standPath": "assets/stands/stands_42_custom_glb/team_love/stand3d_michie_infinity_crown_ball.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_love/weapon_anim_michie_bow.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/michie_weapon.glb",
    "heroGlbPath": "assets/heroes/team_love/michie_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/michie.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/michie_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/michie_chibi.webp",
    "bytes": {
      "model": 44963789,
      "vfx": 922911,
      "sfx": 221848,
      "icons": 212440,
      "riggedWeapon": 9133097,
      "total": 46320988
    },
    "skills": {
      "passive": "Till Infinity and Beyond: Sesuai jikoshoukai \"Always your number one, till infinity and beyond\" dan statusnya sebagai global center, setiap kill, assist, atau 5 serangan beruntun pada hero musuh memberi 1 Infinity Stack permanen yang menambah +2 Physical Attack dan sedikit memperluas jarak tembak.",
      "skill_1": "Number One Arrow: Menarik tali busur untuk menembakkan anak panah kristal magenta berkecepatan ekstrem yang menembus barisan depan dan memicu Critical Damage penuh pada target pertama.",
      "skill_2": "Marathon Stride: Mengadaptasi ketertarikannya pada olahraga lari maraton, Michie melesat lincah sambil mendapat +35% Movement Speed dan kekebalan Slow selama 2 detik untuk menjaga jarak aman.",
      "ultimate": "Heartbreak Comet: Melepaskan panah hati raksasa melintasi arena yang meledak menjadi pecahan bintang magenta saat mengenai hero lawan—memberikan damage masif yang meningkat eksponensial mengikuti jumlah Infinity Stack yang terkumpul."
    },
    "archetype": "Marksman",
    "stats": {
      "hp": 2640,
      "mana": 500,
      "atk": 138,
      "mag": 18,
      "def": 17,
      "mdef": 18,
      "spd": 6.31,
      "atkRange": 9.4,
      "crit": 0.2
    },
    "isDefault": false
  },
  {
    "id": "trisha",
    "name": "Trisha",
    "team": "team_love",
    "roleLane": "Mage / Mid Lane (Painter Summoner Mage)",
    "weaponName": "Dreamweaver Paintbrush (Kuas Lukis Raksasa Berujung Kristal Magenta)",
    "weaponType": "staff",
    "standPath": "assets/stands/stands_42_custom_glb/team_love/stand3d_trisha_dream_painter_123.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_love/weapon_anim_trisha_staff.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/trisha_weapon.glb",
    "heroGlbPath": "assets/heroes/team_love/trisha_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/trisha.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/trisha_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/trisha_chibi.webp",
    "bytes": {
      "model": 60165897,
      "vfx": 813978,
      "sfx": 222668,
      "icons": 204567,
      "riggedWeapon": 28154266,
      "total": 61407110
    },
    "skills": {
      "passive": "One, Two, Three...sha!: Mengambil langsung ritme jikoshoukai \"Pelukis yang hadir di mimpi-mimpi indahmu. One, two, three...sha!\", setiap 3 sapuan skill yang mengenai target meledakkan noda cat mimpi menjadi Magic Damage tambahan dan Slow area.",
      "skill_1": "Palette Splash: Mengayunkan kuas raksasa menyemburkan tiga goresan cat magenta-pastel berbentuk kipas yang meninggalkan jejak warna di tanah selama 3 detik.",
      "skill_2": "Malamute Spirit Sketch: Terinspirasi kecintaannya pada hewan peliharaan (7 kucing dan 1 anjing Alaskan Malamute) serta hobi melukis, Trisha melukis roh anjing Malamute bercahaya pink yang berlari mengejar hero musuh terdekat lalu menguncinya (Root 1,2 detik).",
      "ultimate": "Museum of Sweet Dreams: Terinspirasi kebiasaannya mengunjungi museum mencari inspirasi gambar, ia menggelar kanvas mural raksasa di arena war selama 4,5 detik; musuh di atas lukisan kehilangan sebagian Magic Defense dan tertarik (Charm singkat) menatap pusat mural sebelum seluruh warna meledak bersamaan."
    },
    "archetype": "Mage",
    "stats": {
      "hp": 2520,
      "mana": 720,
      "atk": 68,
      "mag": 152,
      "def": 18,
      "mdef": 28,
      "spd": 5.99,
      "atkRange": 8.2,
      "crit": 0.08
    },
    "isDefault": false
  },
  {
    "id": "fritzy",
    "name": "Fritzy",
    "team": "team_love",
    "roleLane": "Mage / Mid Lane (Mentalist Illusionist Mage)",
    "weaponName": "Arcane Heart Tarot Deck (Dek Kartu Sihir Hati & Topi Pesulap)",
    "weaponType": "grimoire",
    "standPath": "assets/stands/stands_42_custom_glb/team_love/stand3d_fritzy_magic_hat_cards.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_love/weapon_anim_fritzy_grimoire.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/fritzy_weapon.glb",
    "heroGlbPath": "assets/heroes/team_love/fritzy_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/fritzy.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/fritzy_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/fritzy_chibi.webp",
    "bytes": {
      "model": 74641438,
      "vfx": 813701,
      "sfx": 221982,
      "icons": 223755,
      "riggedWeapon": 48465183,
      "total": 75900876
    },
    "skills": {
      "passive": "Sleight of Hand: Berangkat dari kiprahnya sebagai pesulap finalis Indonesia's Got Talent dan peserta America's Got Talent: Fantasy League, setiap penggunaan 2 skill mengubah kartu berikutnya menjadi Ace of Hearts dengan efek Pierce dan pengurangan cooldown singkat.",
      "skill_1": "Abracadabra Cards: Melempar 3 kartu sulap tajam berpola hati ke depan yang dapat memantul antar musuh atau dinding dengan kilatan percikan magis.",
      "skill_2": "Vanishing Top Hat: Melempar topi pesulap ke lokasi target; dalam 3 detik, Fritzy dapat menekan ulang skill untuk berteleportasi seketika keluar dari topi sambil meninggalkan boneka kelinci ilusi yang meledak di posisi lamanya.",
      "ultimate": "Grand Mentalist: Mengangkat keahlian sulap mentalist-nya, Fritzy memancarkan gelombang hipnosis cinta berbentuk hati besar di area teamfight; hero musuh yang terkena kehilangan kendali selama 1,8 detik dan berjalan terpikat ke arah Fritzy sementara pertahanan mereka terbuka lebar."
    },
    "archetype": "Mage",
    "stats": {
      "hp": 2565,
      "mana": 720,
      "atk": 68,
      "mag": 152,
      "def": 18,
      "mdef": 28,
      "spd": 6.05,
      "atkRange": 8.2,
      "crit": 0.08
    },
    "isDefault": false
  },
  {
    "id": "lia",
    "name": "Lia",
    "team": "team_love",
    "roleLane": "Assassin / Jungler (Butterfly Ganker Assassin)",
    "weaponName": "Papillon Twin Fans (Sepasang Kipas Bilah Kupu-Kupu Magenta)",
    "weaponType": "chakram",
    "standPath": "assets/stands/stands_42_custom_glb/team_love/stand3d_lia_butterfly_wings_mic.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_love/weapon_anim_lia_chakram.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/lia_weapon.glb",
    "heroGlbPath": "assets/heroes/team_love/lia_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/lia.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/lia_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/lia_chibi.webp",
    "bytes": {
      "model": 65924281,
      "vfx": 826061,
      "sfx": 214394,
      "icons": 229069,
      "riggedWeapon": 20961034,
      "total": 67193805
    },
    "skills": {
      "passive": "Social Butterfly: Mengadaptasi jikoshoukai \"Si social butterfly yang energik dan periang\", setiap kali berada dekat hero lain (sekutu maupun musuh), Lia memperoleh tambahan Movement Speed progresif sehingga sangat cepat melakukan rotasi dan ganking.",
      "skill_1": "Flutter Slash: Melesat zig-zag dua tahap menebas dengan kedua kipas bilah sambil menebarkan serbuk kilau magenta yang menempel pada musuh.",
      "skill_2": "Cheerful Kick-Off: Mengadaptasi hobi lari dan antusiasmenya pada sepak bola, Lia melompat mundur sambil melontarkan tendangan bola energi kupu-kupu yang meledakkan seluruh serbuk kilau di tubuh lawan.",
      "ultimate": "Swarm of Papillons: Berubah menjadi pusaran kupu-kupu cahaya magenta yang Untargetable selama 2 detik, berpindah cepat menyayat hingga 4 hero musuh di area war sebelum mendarat dengan ledakan kelopak bercahaya."
    },
    "archetype": "Assassin",
    "stats": {
      "hp": 2770,
      "mana": 440,
      "atk": 148,
      "mag": 30,
      "def": 21,
      "mdef": 19,
      "spd": 7.01,
      "atkRange": 2.65,
      "crit": 0.22
    },
    "isDefault": false
  },
  {
    "id": "gracie",
    "name": "Gracie",
    "team": "team_love",
    "roleLane": "Assassin / Jungler (Sweet-to-Spicy Hopper Assassin)",
    "weaponName": "Cotton-Candy Kunai (Kunai Gulali Berinti Api Pedas)",
    "weaponType": "chakram",
    "standPath": "assets/stands/stands_42_custom_glb/team_love/stand3d_gracie_cottoncandy_bunny.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_love/weapon_anim_gracie_chakram.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/gracie_weapon.glb",
    "heroGlbPath": "assets/heroes/team_love/gracie_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/gracie.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/gracie_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/gracie_chibi.webp",
    "bytes": {
      "model": 45639312,
      "vfx": 788091,
      "sfx": 221685,
      "icons": 207464,
      "riggedWeapon": 25354568,
      "total": 46856552
    },
    "skills": {
      "passive": "Sweet Exterior, Spicy Bite: Memadukan jikoshoukai \"manis seperti gulali, imut seperti kelinci\" dengan kegemarannya pada makanan pedas, serangan pertama Gracie pada musuh melapisi mereka dengan gulali lengket (Slow), lalu serangan ke-3 meledakkan sensasi \"pedas\" berupa Burst Damage ekstra.",
      "skill_1": "Bunny Vault: Melompat cepat melintasi rintangan tipis bak kelinci lincah dan langsung melempar 2 kunai gulali ke target terdekat.",
      "skill_2": "Sugar-Spice Snare: Meletakkan gumpalan gulali merah muda di tanah; musuh yang melewatinya terjerat sejenak dan menerima damage pedas beruntun.",
      "ultimate": "Cie-Cie-Cie Rampage: Menerjang ke arah hero musuh dengan tiga lompatan beruntun super cepat; setiap lompatan memicu ledakan gulali-pedas di area pendaratan, membuat Gracie sangat mematikan saat mengejar carry lawan yang kabur."
    },
    "archetype": "Assassin",
    "stats": {
      "hp": 2815,
      "mana": 440,
      "atk": 148,
      "mag": 30,
      "def": 21,
      "mdef": 19,
      "spd": 6.89,
      "atkRange": 2.65,
      "crit": 0.22
    },
    "isDefault": false
  },
  {
    "id": "lana",
    "name": "Lana",
    "team": "team_love",
    "roleLane": "Mage / Mid Lane (Glamour Moon-Charm Mage)",
    "weaponName": "Moonlight Compact Scepter (Tongkat Cermin Rias Cahaya Bulan)",
    "weaponType": "staff",
    "standPath": "assets/stands/stands_42_custom_glb/team_love/stand3d_lana_moon_magic_mirror.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_love/weapon_anim_lana_staff.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/lana_weapon.glb",
    "heroGlbPath": "assets/heroes/team_love/lana_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/lana.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/lana_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/lana_chibi.webp",
    "bytes": {
      "model": 54845870,
      "vfx": 859097,
      "sfx": 221348,
      "icons": 213002,
      "riggedWeapon": 12027167,
      "total": 56139317
    },
    "skills": {
      "passive": "Lunar Glamour: Menggabungkan jikoshoukai \"Dengan kekuatan bulan, aku akan menyihirmu dengan pesonaku\" dengan hobi makeup serta kreativitas padu-padan warnanya, setiap skill yang mengenai musuh menyematkan palet warna pesona yang mengurangi Magic Resistance target sebesar 6% (tumpuk hingga 4 kali).",
      "skill_1": "Charming Prism Beam: Menembakkan sinar pesona merah muda berkilau lurus ke depan; musuh di ujung jangkauan sinar terkena efek Charm selama 1 detik.",
      "skill_2": "Vanity Mirror: Memunculkan cermin rias mengambang di udara selama 4 detik; jika Charming Prism Beam ditembakkan menembus cermin ini, sinar membelah menjadi dua berkas lebih lebar dengan jangkauan diperpanjang.",
      "ultimate": "Set Sail, Crimson Moon: Mengenang lagu persembahan fanbase-nya (\"Set Sail Lana!\") dan kekuatan bulannya, Lana memanggil purnama merah muda raksasa di atas arena war yang menyapu gelombang pesona—melambatkan seluruh lawan dan meledakkan semua tumpukan Lunar Glamour sekaligus."
    },
    "archetype": "Mage",
    "stats": {
      "hp": 2700,
      "mana": 720,
      "atk": 68,
      "mag": 152,
      "def": 18,
      "mdef": 28,
      "spd": 6.05,
      "atkRange": 8.2,
      "crit": 0.08
    },
    "isDefault": false
  },
  {
    "id": "indah",
    "name": "Indah",
    "team": "team_love",
    "roleLane": "Marksman / Gold Lane (Silent Calligraphy Marksman)",
    "weaponName": "Calligraphy Feather Crossbow (Busur Pena Bulu Kristal)",
    "weaponType": "grimoire",
    "standPath": "assets/stands/stands_42_custom_glb/team_love/stand3d_indah_poetry_book_quill.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_love/weapon_anim_indah_grimoire.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/indah_weapon.glb",
    "heroGlbPath": "assets/heroes/team_love/indah_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/indah.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/indah_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/indah_chibi.webp",
    "bytes": {
      "model": 45004410,
      "vfx": 826369,
      "sfx": 220447,
      "icons": 202936,
      "riggedWeapon": 30754734,
      "total": 46254162
    },
    "skills": {
      "passive": "Stories Through Writing: Berangkat dari jikoshoukai \"Tak banyak bicara, bercerita melalui tulisan\" dan pembawaannya yang tenang, setiap serangan dasar menorehkan 1 tanda tinta cahaya pada musuh; pada tumpukan ke-4, tanda membentuk satu kalimat utuh yang meledak memberi True Damage dan efek Silence 0,8 detik.",
      "skill_1": "Ink Bolt: Menembakkan anak panah pena tajam berkecepatan tinggi yang langsung memberi 2 tanda tinta sekaligus bila mengenai musuh di jarak maksimal.",
      "skill_2": "Graceful Margin: Melangkah mundur anggun sambil menggoreskan garis tinta bercahaya di tanah; musuh yang melintasi garis mengalami Slow berat sehingga Indah aman menembak dari jarak jauh.",
      "ultimate": "Chapter of the Undergirls Center: Mengenang pencapaiannya sebagai Center Undergirls Sousenkyo 2024, Indah membentangkan gulungan cahaya raksasa yang meluncur lurus jarak jauh, menembus seluruh lawan, langsung memenuhi 4 tanda tinta pada setiap target, dan membungkam mage musuh di tengah war."
    },
    "archetype": "Marksman",
    "stats": {
      "hp": 2460,
      "mana": 500,
      "atk": 138,
      "mag": 18,
      "def": 17,
      "mdef": 18,
      "spd": 6.31,
      "atkRange": 9.4,
      "crit": 0.2
    },
    "isDefault": false
  },
  {
    "id": "lily",
    "name": "Lily",
    "team": "team_love",
    "roleLane": "Marksman / Gold Lane (Jump-Shot Alchemist Marksman)",
    "weaponName": "Alchemi-Shot Blaster (Senapan Pelontar Ramuan Cinta)",
    "weaponType": "cannon",
    "standPath": "assets/stands/stands_42_custom_glb/team_love/stand3d_lily_dino_chem_plush.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_love/weapon_anim_lily_cannon.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/lily_weapon.glb",
    "heroGlbPath": "assets/heroes/team_love/lily_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/lily.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/lily_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/lily_chibi.webp",
    "bytes": {
      "model": 40413522,
      "vfx": 862494,
      "sfx": 277084,
      "icons": 204616,
      "riggedWeapon": 21160264,
      "total": 41757716
    },
    "skills": {
      "passive": "Chemical Reaction: Terinspirasi mata pelajaran favoritnya (Kimia) dan jikoshoukai \"Papipapipum!\", setiap 3 tembakan melapisi target dengan katalis kimia; jika target terkena skill, terjadi reaksi letupan kecil (Papipapipum!) ke musuh di sekitarnya.",
      "skill_1": "Free-Fire Jump Shot: Mengadaptasi hobinya menirukan gerakan jump shot khas Free Fire, Lily melompat vertikal sambil menembakkan dua peluru presisi dari udara yang dijamin menghasilkan Critical Hit dan dapat melewati dinding pendek.",
      "skill_2": "Brachiosaurus Flask: Terinspirasi kecintaannya pada dinosaurus Brachiosaurus, ia melempar tabung kimia raksasa melambung tinggi yang pecah membentuk genangan buih magenta penurun Armor.",
      "ultimate": "Papipapipum Overcharge: Mengisi senapan dengan ramuan cinta bertekanan tinggi lalu menembakkan ledakan meriam beruntun 3 kali ke arah target—memicu reaksi kimia berantai yang merontokkan barisan tank lawan."
    },
    "archetype": "Marksman",
    "stats": {
      "hp": 2505,
      "mana": 500,
      "atk": 138,
      "mag": 18,
      "def": 17,
      "mdef": 18,
      "spd": 6.19,
      "atkRange": 9.4,
      "crit": 0.2
    },
    "isDefault": false
  },
  {
    "id": "nayla",
    "name": "Nayla",
    "team": "team_love",
    "roleLane": "Assassin / Jungler (Pop-Rap Duelist Assassin)",
    "weaponName": "Katakana Dual Blades (Pedang Kembar Bertulis Aksara Katakana)",
    "weaponType": "cannon",
    "standPath": "assets/stands/stands_42_custom_glb/team_love/stand3d_nayla_naylaland_torii_pop.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_love/weapon_anim_nayla_cannon.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/nayla_weapon.glb",
    "heroGlbPath": "assets/heroes/team_love/nayla_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/nayla.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/nayla_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/nayla_chibi.webp",
    "bytes": {
      "model": 50548571,
      "vfx": 768840,
      "sfx": 221615,
      "icons": 211704,
      "riggedWeapon": 26623345,
      "total": 51750730
    },
    "skills": {
      "passive": "Katakana Flow: Terinspirasi dari kerja kerasnya menyalin setiap lirik lagu ke aksara katakana serta kegemarannya pada musik rap, setiap rangkaian skill yang dilepaskan berirama dalam jeda kurang dari 1,5 detik meningkatkan Attack Speed dan Burst Damage secara beruntun.",
      "skill_1": "Moshi-Moshi Dash: Melesat cepat ke depan memotong ruang dengan goresan aksara katakana menyala magenta; jika menembus hero lawan, Nayla dapat meluncur kedua kalinya ke arah berbeda.",
      "skill_2": "Spicy Rap Cadence: Mengadaptasi kesukaannya pada makanan pedas dan ritme rap, Nayla melepaskan 3 tebasan kilat berirama cepat ke depan yang melukai dan meninggalkan tanda hati berkobar pada target.",
      "ultimate": "Welcome to Naylalaland: Bakkyun!: Mengangkat jikoshoukai \"Welcome Naylalaland! Bakkyun!\", Nayla membidik satu target bertanda, menghilang sekejap lalu muncul di titik buta lawan sambil membidikkan jari \"Bakkyun!\"—melepaskan tembakan energi hati jarak dekat ber-damage eksekusi luar biasa."
    },
    "archetype": "Assassin",
    "stats": {
      "hp": 2770,
      "mana": 440,
      "atk": 148,
      "mag": 30,
      "def": 21,
      "mdef": 19,
      "spd": 6.95,
      "atkRange": 2.65,
      "crit": 0.22
    },
    "isDefault": false
  },
  {
    "id": "alya",
    "name": "Alya",
    "team": "team_love",
    "roleLane": "Fighter / EXP Lane (Taekwondo Rainbow Brawler)",
    "weaponName": "Prism Greaves (Pelindung Kaki Bela Diri Pelangi)",
    "weaponType": "bow",
    "standPath": "assets/stands/stands_42_custom_glb/team_love/stand3d_alya_rainbow_moto_arch.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_love/weapon_anim_alya_bow.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/alya_weapon.glb",
    "heroGlbPath": "assets/heroes/team_love/alya_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/alya.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/alya_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/alya_chibi.webp",
    "bytes": {
      "model": 60363336,
      "vfx": 840960,
      "sfx": 214537,
      "icons": 203458,
      "riggedWeapon": 16347300,
      "total": 61622291
    },
    "skills": {
      "passive": "Tomboy Endurance: Berakar dari didikan masa kecilnya berlatih taekwondo, kegemaran naik motor, dan jiwa pecinta alam, setiap kali HP Alya turun di bawah 50%, ia mendapat tambahan Physical Lifesteal dan ketahanan Crowd Control sebesar 25%.",
      "skill_1": "Taekwondo Crescent Kick: Melancarkan kombo 2 tendangan memutar dan 1 tendangan sabit tinggi yang menghempaskan musuh ke udara (Knockup singkat) berbalut kilatan cahaya pelangi.",
      "skill_2": "Full-Throttle Ride: Meluncur cepat ke depan layaknya manuver motor membelah lintasan, meninggalkan jejak cahaya pelangi yang memberi tambahan Movement Speed bagi sekutu yang mengejar di belakangnya.",
      "ultimate": "Rainbow After the Rain: Mengangkat jikoshoukai \"Jika hatimu sedang menangis, Aku akan datang sebagai pelangi\", Alya melompat tinggi lalu menghujamkan tendangan tumit ke tengah war—menciptakan lengkungan pelangi raksasa yang memukul mundur musuh sekaligus memberi perisai hangat kepada seluruh rekan setim di bawah lengkungan tersebut."
    },
    "archetype": "Fighter",
    "stats": {
      "hp": 3285,
      "mana": 460,
      "atk": 134,
      "mag": 20,
      "def": 32,
      "mdef": 24,
      "spd": 6.41,
      "atkRange": 2.75,
      "crit": 0.12
    },
    "isDefault": false
  },
  {
    "id": "elin",
    "name": "Elin",
    "team": "team_love",
    "roleLane": "Healer / Roamer (Miracle Lavender Healer)",
    "weaponName": "Lavender Cotton-Candy Censer (Pedupaan Bunga Lavender & Awan Kapas)",
    "weaponType": "staff",
    "standPath": "assets/stands/stands_42_custom_glb/team_love/stand3d_elin_lavender_library.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_love/weapon_anim_elin_staff.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/elin_weapon.glb",
    "heroGlbPath": "assets/heroes/team_love/elin_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/elin.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/elin_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/elin_chibi.webp",
    "bytes": {
      "model": 45123328,
      "vfx": 788327,
      "sfx": 220417,
      "icons": 220261,
      "riggedWeapon": 45571113,
      "total": 46352333
    },
    "skills": {
      "passive": "Miracle Healer: Terinspirasi dari kisah pribadinya sebagai \"penyembuh\" bagi sang mama yang sempat sakit lupus saat mengandung dirinya, setiap kali Elin menyembuhkan sekutu yang HP-nya di bawah 35%, efek Heal meningkat sebesar 40%.",
      "skill_1": "Cotton-Candy Mist: Menghembuskan awan kapas lembut berwarna ungu-magenta ke area target; sekutu di dalam awan memulihkan HP secara berkelanjutan sambil memperoleh pengurangan damage masuk.",
      "skill_2": "Lavender Lullaby: Menebarkan kelopak bunga lavender menenangkan yang memperlambat gerakan musuh dan menurunkan Attack Speed marksman lawan selama 2,5 detik.",
      "ultimate": "Bloom of Pure Healing: Membuka kelopak lavender raksasa di sekitar dirinya, memancarkan gelombang pemurnian lembut yang langsung membersihkan seluruh debuff dan efek Crowd Control rekan setim di radius luas sambil memulihkan HP mereka secara drastis."
    },
    "archetype": "Healer",
    "stats": {
      "hp": 3120,
      "mana": 680,
      "atk": 74,
      "mag": 124,
      "def": 26,
      "mdef": 30,
      "spd": 6.14,
      "atkRange": 6.8,
      "crit": 0.08
    },
    "isDefault": false
  },
  {
    "id": "cynthia",
    "name": "Cynthia",
    "team": "team_love",
    "roleLane": "Fighter / EXP Lane (Interior Architect Bruiser)",
    "weaponName": "Prism Drafting Gauntlets (Sarung Tangan Arsitek Kristal)",
    "weaponType": "cannon",
    "standPath": "assets/stands/stands_42_custom_glb/team_love/stand3d_cynthia_pop_bubbles_interior.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_love/weapon_anim_cynthia_cannon.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/cynthia_weapon.glb",
    "heroGlbPath": "assets/heroes/team_love/cynthia_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/cynthia.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/cynthia_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/cynthia_chibi.webp",
    "bytes": {
      "model": 53644308,
      "vfx": 766424,
      "sfx": 214549,
      "icons": 195891,
      "riggedWeapon": 9206497,
      "total": 54821172
    },
    "skills": {
      "passive": "POP! POP! Momentum: Mengambil energi jikoshoukai \"Semangatku terus menerus meluap. POP! POP!\" dan predikatnya sebagai idol all-rounder, setiap serangan ke-3 meledakkan gelembung energi \"POP!\" ber-damage area di sekitar target dan memberi Cynthia Shield tipis.",
      "skill_1": "Interior Partition: Terinspirasi studinya di desain interior dan kemenangannya di sayembara desain kamar Muklas lewat rancangan partisi ruang, Cynthia mendirikan dinding partisi kristal magenta di depan target yang memblokir jalur kabur; jika musuh terdorong menghantam partisi, mereka terkena Stun 1,2 detik.",
      "skill_2": "All-Rounder Dash: Meluncur agresif sambil melancarkan pukulan ganda penuh tenaga—mendorong lawan mundur untuk memicu tabrakan ke arah Interior Partition.",
      "ultimate": "Grand Theater Blueprint: Merancang sketsa teater pertunjukan kesenian berskala penuh (terinspirasi tugas akhir desain teaternya) di arena war selama 4 detik; lantai ruangan memancarkan ledakan beruntun \"POP! POP! POP!\" yang melukai lawan sambil memperkuat Armor seluruh rekan di dalam ruangan."
    },
    "archetype": "Fighter",
    "stats": {
      "hp": 3150,
      "mana": 460,
      "atk": 134,
      "mag": 20,
      "def": 32,
      "mdef": 24,
      "spd": 6.35,
      "atkRange": 2.75,
      "crit": 0.12
    },
    "isDefault": false
  },
  {
    "id": "anindya",
    "name": "Anindya",
    "team": "team_love",
    "roleLane": "Healer / Roamer (Tactical Nectar Support)",
    "weaponName": "Golden Mango Nectar Bell (Lonceng Nektar Mangga Keemasan)",
    "weaponType": "chakram",
    "standPath": "assets/stands/stands_42_custom_glb/team_love/stand3d_anindya_mango_chef_crown.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_love/weapon_anim_anindya_chakram.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/anindya_weapon.glb",
    "heroGlbPath": "assets/heroes/team_love/anindya_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/anindya.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/anindya_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/anindya_chibi.webp",
    "bytes": {
      "model": 47665715,
      "vfx": 943932,
      "sfx": 223683,
      "icons": 223090,
      "riggedWeapon": 35714499,
      "total": 49056420
    },
    "skills": {
      "passive": "Disciplined Efficiency: Terinspirasi reputasinya yang disiplin datang lebih awal saat latihan serta pendidikannya di jurusan Manajemen yang terstruktur, Anindya mengurangi cooldown skill dasar sekutu terdekat sebesar 10% setiap kali ia memulihkan HP mereka.",
      "skill_1": "Sweet Mango Nectar: Mengangkat jikoshoukai \"Si mungil hadir semanis mangga\", Anindya melempar bola nektar manis beraroma emas-pink yang memantul hingga ke 3 sekutu berdekatan, menyembuhkan HP sekaligus menambah Movement Speed.",
      "skill_2": "Tiny Evade Chime: Berkat perawakan mungilnya yang lincah, Anindya melakukan hop cepat sambil membunyikan lonceng nyaring yang memberi efek Knockback kecil kepada musuh yang berusaha menerkamnya.",
      "ultimate": "Teamwork Rally: Memimpin koordinasi tim dengan dentingan lonceng meriah berbalut cahaya mangga-magenta selama 5 detik—memberikan Heal berkala, Shield serentak, serta tambahan +20% Attack Speed bagi seluruh tim untuk menguasai objektif besar maupun teamfight."
    },
    "archetype": "Healer",
    "stats": {
      "hp": 2985,
      "mana": 680,
      "atk": 74,
      "mag": 124,
      "def": 26,
      "mdef": 30,
      "spd": 6.26,
      "atkRange": 6.8,
      "crit": 0.08
    },
    "isDefault": false
  },
  {
    "id": "cathy",
    "name": "Cathy",
    "team": "team_love",
    "roleLane": "Fighter / EXP Lane (Fairy-Knight Duelist)",
    "weaponName": "Tring! Fairy-Lord Rapier (Pedang Anggar Peri Bercahaya Ungu-Pink)",
    "weaponType": "staff",
    "standPath": "assets/stands/stands_42_custom_glb/team_love/stand3d_cathy_fairy_wings_wand.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_love/weapon_anim_cathy_staff.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/cathy_weapon.glb",
    "heroGlbPath": "assets/heroes/team_love/cathy_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/cathy.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/cathy_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/cathy_chibi.webp",
    "bytes": {
      "model": 48079463,
      "vfx": 840826,
      "sfx": 221552,
      "icons": 194518,
      "riggedWeapon": 15256781,
      "total": 49336359
    },
    "skills": {
      "passive": "Lord Cathy's Mischief: Memadukan julukan \"Lord Cathy\" karena sifat usilnya yang suka \"menyerang\" member lain dengan jikoshoukai \"Tring! Si peri cantik jelita\", setiap kali Cathy menyerang hero musuh lebih dulu, ia mencuri sedikit Movement Speed mereka dan memunculkan percikan debu peri.",
      "skill_1": "Tring! Lunge: Melesat cepat ke depan dengan tusukan pedang anggar bertenaga sambil memicu kilatan bunyi \"Tring!\" yang mematahkan perisai (Shield Break) lawan.",
      "skill_2": "Fairy Dust Taunt: Mengibaskan sayap peri berkilau di depan wajah lawan, memprovokasi (Taunt 1 detik) musuh terdekat agar menyerangnya sementara Cathy mendapat 30% Damage Reduction.",
      "ultimate": "Reign of Lord Cathy: Sayap peri bercahaya pink, ungu, dan biru (warna favorit Cathy) membesar anggun selama 7 detik; setiap serangan rapier melepaskan 3 tusukan energi peri beruntun dengan True Damage tambahan, mengubah Cathy menjadi penguasa duel 1v1 di EXP Lane."
    },
    "archetype": "Fighter",
    "stats": {
      "hp": 3240,
      "mana": 460,
      "atk": 134,
      "mag": 20,
      "def": 32,
      "mdef": 24,
      "spd": 6.29,
      "atkRange": 2.75,
      "crit": 0.12
    },
    "isDefault": false
  },
  {
    "id": "christy",
    "name": "Christy",
    "team": "team_passion",
    "roleLane": "Marksman / Gold Lane (Global Snipe Carry)",
    "weaponName": "Blazing Sun Crossbow (Busur Silang Surya Membara)",
    "weaponType": "cannon",
    "standPath": "assets/stands/stands_42_custom_glb/team_passion/stand3d_christy_passion_flame_crown.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_passion/weapon_anim_christy_cannon.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/christy_weapon.glb",
    "heroGlbPath": "assets/heroes/team_passion/christy_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/christy.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/christy_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/christy_chibi.webp",
    "bytes": {
      "model": 64820655,
      "vfx": 771821,
      "sfx": 451953,
      "icons": 206960,
      "riggedWeapon": 19954401,
      "total": 66251389
    },
    "skills": {
      "passive": "Ignited Bolts: Selaras dengan posisinya sebagai Center Team Passion dan hobi bermain gim, setiap serangan ke-3 membakar Armor lawan dan mengurangi pertahanan fisik target sebesar 15% selama 3 detik.",
      "skill_1": "Rapid Volley: Menembakkan 5 anak panah api berturut-turut ke arah depan dengan kecepatan tinggi, menghasilkan rentetan percikan bara amber yang menghanguskan barisan depan.",
      "skill_2": "Inferno Trap: Meletakkan jebakan api tak terlihat di semak jungle atau jalur rotasi; musuh yang menginjaknya langsung terkena Stun 1 detik dan efek bakar berkelanjutan, sekaligus melindungi rekan setim sesuai jikoshoukai-nya yang peduli.",
      "ultimate": "Supernova Barrage: Mengisi penuh tenaga busur silangnya lalu menembakkan proyektil komet api raksasa yang menembus seluruh peta (Global Snipe)—merontokkan HP musuh yang sedang sekarat dari jarak tak terbatas."
    },
    "archetype": "Marksman",
    "stats": {
      "hp": 2595,
      "mana": 500,
      "atk": 138,
      "mag": 18,
      "def": 17,
      "mdef": 18,
      "spd": 6.25,
      "atkRange": 9.4,
      "crit": 0.2
    },
    "isDefault": false
  },
  {
    "id": "muthe",
    "name": "Muthe",
    "team": "team_passion",
    "roleLane": "Assassin / Jungler (Flame-Thread Dancer Assassin)",
    "weaponName": "Crimson Flame Needles & Spools (Jarum & Benang Rajut Api)",
    "weaponType": "daggers",
    "standPath": "assets/stands/stands_42_custom_glb/team_passion/stand3d_muthe_fashion_spool_flame.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_passion/weapon_anim_muthe_daggers.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/muthe_weapon.glb",
    "heroGlbPath": "assets/heroes/team_passion/muthe_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/muthe.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/muthe_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/muthe_chibi.webp",
    "bytes": {
      "model": 63268312,
      "vfx": 771801,
      "sfx": 453182,
      "icons": 201686,
      "riggedWeapon": 7990149,
      "total": 64694981
    },
    "skills": {
      "passive": "Tailor's Agility: Memadukan kelincahan menarinya dengan bakat menjahit serta cita-citanya menjadi perancang busana, setiap skill yang mengenai lawan menambatkan benang api pada mereka; saat Muthe bergerak mengitari target, benang mengencang dan memberi Burn Damage.",
      "skill_1": "Needle Dash: Meluncur secepat kilat menembus target sambil menusukkan jarum berapi, meninggalkan sulaman benang bara yang menghubungkan posisi awal dan akhir Muthe.",
      "skill_2": "Seam Pull: Menarik seluruh benang api yang terpasang di arena—menghela musuh yang terikat saling mendekat satu sama lain dan menimbulkan ledakan percikan kain terbakar.",
      "ultimate": "Mu-Mu-Mu-The Tapestry: Menari berputar super cepat mengelilingi area war, merajut jaring bintang dari benang api amber menyala yang memerangkap musuh selama 2 detik sebelum seluruh jahitan api meledak serentak."
    },
    "archetype": "Assassin",
    "stats": {
      "hp": 2860,
      "mana": 440,
      "atk": 148,
      "mag": 30,
      "def": 21,
      "mdef": 19,
      "spd": 7.01,
      "atkRange": 2.65,
      "crit": 0.22
    },
    "isDefault": false
  },
  {
    "id": "jessi",
    "name": "Jessi",
    "team": "team_passion",
    "roleLane": "Fighter / EXP Lane (Dancing Queen Energy Bruiser)",
    "weaponName": "Ignite Rhythm Tonfas (Sepasang Tonfa Api Ritmis)",
    "weaponType": "chakram",
    "standPath": "assets/stands/stands_42_custom_glb/team_passion/stand3d_jessi_dancing_queen_eq.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_passion/weapon_anim_jessi_chakram.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/jessi_weapon.glb",
    "heroGlbPath": "assets/heroes/team_passion/jessi_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/jessi.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/jessi_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/jessi_chibi.webp",
    "bytes": {
      "model": 61839606,
      "vfx": 832502,
      "sfx": 284878,
      "icons": 209079,
      "riggedWeapon": 13862175,
      "total": 63166065
    },
    "skills": {
      "passive": "Source of Energy: Terinspirasi gelar \"Dancing Queen JKT48\" yang diraihnya serta jikoshoukai \"sumber energimu\", setiap detik berada dalam pertarungan mengisi Energy Bar hingga 100% yang mengubah serangannya menjadi Flame Punches dengan Lifesteal tinggi.",
      "skill_1": "Rhythm Combo: Melancarkan 3 hentakan tonfa api berturut-turut dengan tempo cepat; pukulan ke-3 menyapu lantai memicu kilatan bara yang menggeser posisi musuh.",
      "skill_2": "Breakdance Flare: Melakukan gerakan breakdance memutar bertumpu satu tangan di tanah, menyemburkan lingkaran api amber yang melukai seluruh musuh di sekitar sekaligus memberi Shield.",
      "ultimate": "Dancing Queen Overdrive: Menghantamkan kedua tonfa ke tanah mengubah zona teamfight menjadi lantai dansa membara selama 6 detik—musuh terus terbakar setiap kali bergerak, sementara Jessi dan sekutu di dalam zona mendapat +25% Attack Speed dan energi tak terbatas."
    },
    "archetype": "Fighter",
    "stats": {
      "hp": 3150,
      "mana": 460,
      "atk": 134,
      "mag": 20,
      "def": 32,
      "mdef": 24,
      "spd": 6.29,
      "atkRange": 2.75,
      "crit": 0.12
    },
    "isDefault": false
  },
  {
    "id": "kathrina",
    "name": "Kathrina",
    "team": "team_passion",
    "roleLane": "Marksman / Gold Lane (Precision Storm-Fire Marksman)",
    "weaponName": "Katrina Solar-Storm Rifle (Senapan Sniper Badai Api)",
    "weaponType": "halberd",
    "standPath": "assets/stands/stands_42_custom_glb/team_passion/stand3d_kathrina_storm_star_esports.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_passion/weapon_anim_kathrina_halberd.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/kathrina_weapon.glb",
    "heroGlbPath": "assets/heroes/team_passion/kathrina_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/kathrina.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/kathrina_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/kathrina_chibi.webp",
    "bytes": {
      "model": 56242955,
      "vfx": 862618,
      "sfx": 273642,
      "icons": 202013,
      "riggedWeapon": 23351788,
      "total": 57581228
    },
    "skills": {
      "passive": "Never Miss a Chance: Berangkat dari jikoshoukai \"Never miss a chance to be a star!\" serta kiprahnya sebagai anggota tim esports Valkyrie48 yang menggemari gim PC, tembakan Kathrina pada hero musuh yang sedang bergerak cepat atau dash menghasilkan +20% Critical Chance tambahan.",
      "skill_1": "Katrina Vortex Bullet: Terinspirasi asal namanya dari Badai Katrina, ia menembakkan peluru berputar yang meledak menjadi pusaran angin api kecil—menarik musuh sedikit ke tengah sambil membakar mereka.",
      "skill_2": "Valkyrie Reposition: Melakukan gulingan taktis cepat ke samping sambil langsung mengisi peluru bara panas untuk tembakan dasar berikutnya yang berjarak lebih jauh.",
      "ultimate": "Starlock Precision: Mengaktifkan mode bidik presisi selama 4 detik untuk melepaskan 3 tembakan sinar bintang api jarak ultra-jauh; setiap tembakan menembus pertahanan dan memicu ledakan kilau emas saat berhasil mengeliminasi target."
    },
    "archetype": "Marksman",
    "stats": {
      "hp": 2505,
      "mana": 500,
      "atk": 138,
      "mag": 18,
      "def": 17,
      "mdef": 18,
      "spd": 6.25,
      "atkRange": 9.4,
      "crit": 0.2
    },
    "isDefault": false
  },
  {
    "id": "oniel",
    "name": "Oniel",
    "team": "team_passion",
    "roleLane": "Mage / Mid Lane (Riddle-Flame Trickster Mage)",
    "weaponName": "Ember Riddle Ukulele (Ukulele Bara Teka-Teki)",
    "weaponType": "grimoire",
    "standPath": "assets/stands/stands_42_custom_glb/team_passion/stand3d_oniel_puzzle_guitar_spot.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_passion/weapon_anim_oniel_grimoire.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/oniel_weapon.glb",
    "heroGlbPath": "assets/heroes/team_passion/oniel_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/oniel.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/oniel_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/oniel_chibi.webp",
    "bytes": {
      "model": 69670451,
      "vfx": 814244,
      "sfx": 220735,
      "icons": 200744,
      "riggedWeapon": 21170749,
      "total": 70906174
    },
    "skills": {
      "passive": "Enigma Spark: Mengadaptasi jikoshoukai \"Seperti teka-teki, kalian akan selalu penasaran denganku\" dan kemahirannya bermain ukulele, setiap kali skill Oniel mengenai musuh, muncul tanda tanya menyala di atas kepala lawan; tanda tanya ke-3 meledak memicu efek kejutan Micro-Stun.",
      "skill_1": "Mystery Flame Box: Melempar kotak teka-teki bara ke area target yang meledak dalam 1 detik dengan efek api tinggi, menyisakan genangan bara yang memperlambat gerakan.",
      "skill_2": "Dad-Joke Shockwave: Mengangkat persona humorisnya yang populer lewat jokes bapak-bapak dan The Slap Show, Oniel memetik ukulele melontarkan gelombang bunyi kocak yang membuat musuh terpaku kebingungan (Confuse/Taunt 1,2 detik) sehingga menghentikan serangan mereka.",
      "ultimate": "Labyrinth of Embers: Memetik nada puncak ukulele untuk memunculkan 4 dinding teka-teki api melingkari area war; hanya satu celah yang merupakan jalan keluar asli, sementara musuh yang menerobos dinding palsu langsung terkena ledakan bara masif."
    },
    "archetype": "Mage",
    "stats": {
      "hp": 2610,
      "mana": 720,
      "atk": 68,
      "mag": 152,
      "def": 18,
      "mdef": 28,
      "spd": 6.11,
      "atkRange": 8.2,
      "crit": 0.08
    },
    "isDefault": false
  },
  {
    "id": "lulu",
    "name": "Lulu",
    "team": "team_passion",
    "roleLane": "Healer / Roamer (Starfire Vocal Healer)",
    "weaponName": "Starfire Lyre (Lira Api Bintang Keemasan)",
    "weaponType": "halberd",
    "standPath": "assets/stands/stands_42_custom_glb/team_passion/stand3d_lulu_moon_star_goldmic.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_passion/weapon_anim_lulu_halberd.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/lulu_weapon.glb",
    "heroGlbPath": "assets/heroes/team_passion/lulu_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/lulu.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/lulu_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/lulu_chibi.webp",
    "bytes": {
      "model": 48246140,
      "vfx": 859270,
      "sfx": 220651,
      "icons": 217691,
      "riggedWeapon": 13096714,
      "total": 49543752
    },
    "skills": {
      "passive": "Bright as the Stars: Memadukan jikoshoukai \"Terang seperti bulan, bersinar seperti bintang\" dengan pencapaian vokalnya menembus babak 8 besar AKB48 Group Singing Competition, nyanyian Lulu memancarkan cahaya hangat yang menambah Healing Received sekutu di sekitarnya sebesar 15%.",
      "skill_1": "Warm Melody Wave: Memetik lira memancarkan gelombang nada api keemasan yang mengalir menyembuhkan sekutu di jalur depan sekaligus memulihkan efek Burn atau Poison.",
      "skill_2": "Sweet Mochi Lantern: Terinspirasi hobi memasak dan kegemarannya pada roti serta mochi manis, Lulu menyalakan lentera bintang hangat di lokasi target yang membuka vision semak dan memulihkan HP sekutu yang melewatinya.",
      "ultimate": "Encore of Eight Stars: Melantunkan nada puncak selama 3,5 detik; delapan bintang api melayang mengitari Lulu, menyembuhkan HP seluruh tim secara masif di tiap ketukan sambil memukul mundur musuh yang mencoba menerjang ke pusat nyanyian."
    },
    "archetype": "Healer",
    "stats": {
      "hp": 3075,
      "mana": 680,
      "atk": 74,
      "mag": 124,
      "def": 26,
      "mdef": 30,
      "spd": 6.14,
      "atkRange": 6.8,
      "crit": 0.08
    },
    "isDefault": false
  },
  {
    "id": "kimmy",
    "name": "Kimmy",
    "team": "team_passion",
    "roleLane": "Assassin / Jungler (Gymnastic Pyro-Acrobat Assassin)",
    "weaponName": "Pyro-Ribbon Chakrams (Sepasang Cakram Pita Gimnastik Api)",
    "weaponType": "cannon",
    "standPath": "assets/stands/stands_42_custom_glb/team_passion/stand3d_kimmy_hamster_wheel_y2k.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_passion/weapon_anim_kimmy_cannon.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/kimmy_weapon.glb",
    "heroGlbPath": "assets/heroes/team_passion/kimmy_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/kimmy.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/kimmy_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/kimmy_chibi.webp",
    "bytes": {
      "model": 65258526,
      "vfx": 832084,
      "sfx": 282953,
      "icons": 200735,
      "riggedWeapon": 13233029,
      "total": 66574298
    },
    "skills": {
      "passive": "Baby Hamster Sprint: Mengadaptasi jikoshoukai \"Baby hamster yang lincah\" serta pengalamannya di cheerleader dan gymnastics, Kimmy memperoleh tambahan Movement Speed yang terus meningkat saat berlari melintasi jungle dan dapat melakukan salto melewati rintangan rendah.",
      "skill_1": "Cartwheel Double-Throw: Melakukan gerakan cartwheel cepat ke depan sambil melempar dua cakram api berputar yang melukai saat pergi maupun saat kembali seperti bumerang.",
      "skill_2": "Mimit & Memet Dash: Mengenang dua hamster peliharaannya, Kimmy melesat lincah dalam dua loncatan beruntun berbalut dua percikan api kecil yang mengejar musuh terdekat.",
      "ultimate": "Fierce Gymnastics Finale: Menyalurkan kecintaannya pada lagu dan koreografi fierce bertenaga penuh, Kimmy berputar akrobatik secepat kilat mengelilingi satu target utama 4 kali sambil menebas dengan pita api, diakhiri ledakan cincin bara yang melempar musuh di sekitarnya."
    },
    "archetype": "Assassin",
    "stats": {
      "hp": 2860,
      "mana": 440,
      "atk": 148,
      "mag": 30,
      "def": 21,
      "mdef": 19,
      "spd": 6.95,
      "atkRange": 2.65,
      "crit": 0.22
    },
    "isDefault": false
  },
  {
    "id": "erine",
    "name": "Erine",
    "team": "team_passion",
    "roleLane": "Mage / Mid Lane (Checkmate Tactical Mage)",
    "weaponName": "Checkmate Flame Chessboard (Papan Catur Bara Mengambang)",
    "weaponType": "starblade",
    "standPath": "assets/stands/stands_42_custom_glb/team_passion/stand3d_erine_chess_checkmate.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_passion/weapon_anim_erine_starblade.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/erine_weapon.glb",
    "heroGlbPath": "assets/heroes/team_passion/erine_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/erine.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/erine_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/erine_chibi.webp",
    "bytes": {
      "model": 51423519,
      "vfx": 878122,
      "sfx": 222403,
      "icons": 200293,
      "riggedWeapon": 19881001,
      "total": 52724337
    },
    "skills": {
      "passive": "Fiery Temper: Mengangkat persona unik \"Angry Girl\" yang ekspresif di balik paras manisnya serta kemahirannya bermain piano, semakin rendah HP Erine atau semakin sering ia terkena damage, bara apinya kian menyala—menambah Magic Power hingga +25%.",
      "skill_1": "Flame Knight & Rook: Memanggil bidak catur api di arena: ketukan pertama menurunkan Rook yang meluncur lurus membakar jalur, sedangkan ketukan kedua menurunkan Knight yang melompat dalam pola huruf \"L\" dan memberi Stun di titik mendarat.",
      "skill_2": "Piano Flare Arpeggio: Menekan tuts bara melayang di udara yang memunculkan 4 ledakan api berurutan menyamping untuk membersihkan wave atau memaksa musuh masuk ke jebakan bidak catur.",
      "ultimate": "Grand Checkmate: Sesuai jikoshoukai \"Hadir dengan seribu kejutan, Checkmate!\", Erine memproyeksikan papan catur api raksasa di bawah kaki lawan yang memperlambat gerakan hingga 60% sebelum bidak Ratu Api kolosal jatuh menghujam pusat papan dan menghanguskan target yang terjebak."
    },
    "archetype": "Mage",
    "stats": {
      "hp": 2520,
      "mana": 720,
      "atk": 68,
      "mag": 152,
      "def": 18,
      "mdef": 28,
      "spd": 6.11,
      "atkRange": 8.2,
      "crit": 0.08
    },
    "isDefault": false
  },
  {
    "id": "aralie",
    "name": "Aralie",
    "team": "team_passion",
    "roleLane": "Healer / Roamer (Empathic Flame-Lotus Healer)",
    "weaponName": "Ember-Bead Lotus Lantern (Lentera Bunga Teratai Api Berhias Manik)",
    "weaponType": "staff",
    "standPath": "assets/stands/stands_42_custom_glb/team_passion/stand3d_aralie_bloom_flower_beads.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_passion/weapon_anim_aralie_staff.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/aralie_weapon.glb",
    "heroGlbPath": "assets/heroes/team_passion/aralie_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/aralie.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/aralie_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/aralie_chibi.webp",
    "bytes": {
      "model": 70970563,
      "vfx": 826060,
      "sfx": 452630,
      "icons": 211118,
      "riggedWeapon": 33072087,
      "total": 72460371
    },
    "skills": {
      "passive": "Lingering Bloom: Mengadaptasi jikoshoukai \"Seperti bunga yang mekar, aku akan membuat kamu terbayang-bayang\" dan kepribadiannya yang dewasa serta penyayang, setiap skill Aralie menyisakan kelopak api lembut yang terus memulihkan sedikit HP sekutu sekaligus menurunkan 10% damage musuh yang \"terbayang-bayang\".",
      "skill_1": "Empathy Link: Berakar dari minatnya pada bidang Psikologi dan pengalaman kepemimpinan sebagai mantan Wakil Ketua OSIS, Aralie menautkan benang manik cahaya hangat ke satu sekutu, menyembuhkan HP mereka dan mengalihkan 20% damage yang diterima sekutu tersebut menjadi Shield sementara.",
      "skill_2": "Beaded Petal Wave: Menebarkan gelombang kelopak bunga api dan manik bercahaya (terinspirasi hobi kerajinan manik-maniknya) ke depan yang melambatkan pengejar sekaligus mempercepat langkah rekan setim.",
      "ultimate": "Garden of Warmth: Memekarkan bunga teratai api raksasa di tengah teamfight selama 5 detik; kelopak menyala lembut memulihkan HP seluruh anggota tim secara deras dan mempercepat cooldown skill mereka agar tim tetap bugar di fase lanjutan war."
    },
    "archetype": "Healer",
    "stats": {
      "hp": 2985,
      "mana": 680,
      "atk": 74,
      "mag": 124,
      "def": 26,
      "mdef": 30,
      "spd": 6.14,
      "atkRange": 6.8,
      "crit": 0.08
    },
    "isDefault": false
  },
  {
    "id": "danella",
    "name": "Danella",
    "team": "team_passion",
    "roleLane": "Fighter / EXP Lane (Twin-Flame Pull Initiator)",
    "weaponName": "Inferno Whip-Blades (Cambuk Pedang Api Kembar)",
    "weaponType": "daggers",
    "standPath": "assets/stands/stands_42_custom_glb/team_passion/stand3d_danella_toktok_door_dance.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_passion/weapon_anim_danella_daggers.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/danella_weapon.glb",
    "heroGlbPath": "assets/heroes/team_passion/danella_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/danella.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/danella_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/danella_chibi.webp",
    "bytes": {
      "model": 64647680,
      "vfx": 916756,
      "sfx": 222987,
      "icons": 217794,
      "riggedWeapon": 36857446,
      "total": 66005217
    },
    "skills": {
      "passive": "Twin Synchronization: Mengangkat statusnya sebagai saudara kembar pertama di JKT48 bersama Daisy dan kekuatan tarinya yang penuh tenaga, bertarung berdekatan dengan rekan setim memberi tambahan Attack Speed dan Physical Defense (meningkat lebih tinggi saat bermain satu tim dengan Daisy).",
      "skill_1": "Knock-Knock Pull: Mengadaptasi jikoshoukai \"Tok-tok! Si penari yang akan menarikmu ke duniaku!\", Danella mencambukkan bilah api ke depan dua kali (\"Tok-tok!\"); cambukan kedua mengait dan menarik hero musuh langsung ke hadapannya.",
      "skill_2": "Chronicles Power Spin: Mengenang prestasinya menjuarai DBL Dance Competition bersama Chronicles Dance, Danella berputar cepat dengan kedua cambuk api membentuk badai bara yang merusak Armor lawan di sekelilingnya.",
      "ultimate": "Welcome to My World: Menancapkan cambuk api ke tanah menciptakan lingkaran panggung bara menyala selama 4 detik yang memerangkap musuh di dalam \"dunianya\"—musuh tidak bisa dash keluar lingkaran sementara serangan Danella memicu ledakan api di setiap ayunan."
    },
    "archetype": "Fighter",
    "stats": {
      "hp": 3240,
      "mana": 460,
      "atk": 134,
      "mag": 20,
      "def": 32,
      "mdef": 24,
      "spd": 6.35,
      "atkRange": 2.75,
      "crit": 0.12
    },
    "isDefault": false
  },
  {
    "id": "levi",
    "name": "Levi",
    "team": "team_passion",
    "roleLane": "Fighter / EXP Lane (Cyber-Titan Robotic Fighter)",
    "weaponName": "Pyro-Mecha Titan Gauntlets (Lengan Robotik Titan Bertenaga Thermal)",
    "weaponType": "halberd",
    "standPath": "assets/stands/stands_42_custom_glb/team_passion/stand3d_levi_titan_robotic_rock.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_passion/weapon_anim_levi_halberd.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/levi_weapon.glb",
    "heroGlbPath": "assets/heroes/team_passion/levi_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/levi.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/levi_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/levi_chibi.webp",
    "bytes": {
      "model": 54050446,
      "vfx": 771759,
      "sfx": 280903,
      "icons": 208986,
      "riggedWeapon": 14585692,
      "total": 55312094
    },
    "skills": {
      "passive": "Robotic Engineering: Menggabungkan pengalamannya menembus final lomba robotik tingkat nasional, hobi merakit Lego, serta kegemarannya pada coding, setiap 4 serangan menghasilkan komponen robotik otomatis yang memperkuat Shield mekanis Levi.",
      "skill_1": "Lego Mini-Bot: Melempar robot mini rakitan bertenaga api yang berlari mencari hero musuh terdekat lalu meledak menimbulkan Burn dan menurunkan Movement Speed.",
      "skill_2": "Override Code Smash: Menginput kode gangguan di udara lalu menghantamkan sarung tangan thermal ke tanah, memicu gelombang data api berbentuk kotak digital yang memecah Shield lawan dan memberi Stun singkat.",
      "ultimate": "Titan Protocol: Mengangkat julukan \"Titan\" karena postur tingginya (170 cm) serta latar kepemimpinannya sebagai mantan Ketua OSIS, Levi mengaktifkan baju zirah robotik raksasa membara selama 8 detik—memperbesar ukuran tubuh, menjadi kebal Crowd Control, dan membuat setiap langkah hentakannya mengguncang barisan musuh di arena war."
    },
    "archetype": "Fighter",
    "stats": {
      "hp": 3285,
      "mana": 460,
      "atk": 134,
      "mag": 20,
      "def": 32,
      "mdef": 24,
      "spd": 6.41,
      "atkRange": 2.75,
      "crit": 0.12
    },
    "isDefault": false
  },
  {
    "id": "raisha",
    "name": "Raisha",
    "team": "team_passion",
    "roleLane": "Marksman / Gold Lane (Shuttle-Smash Marksman)",
    "weaponName": "Sakura-Flame Racket & Shuttle (Raket Api & Kok Kelopak Sakura)",
    "weaponType": "starblade",
    "standPath": "assets/stands/stands_42_custom_glb/team_passion/stand3d_raisha_sakura_pharma_flame.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_passion/weapon_anim_raisha_starblade.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/raisha_weapon.glb",
    "heroGlbPath": "assets/heroes/team_passion/raisha_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/raisha.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/raisha_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/raisha_chibi.webp",
    "bytes": {
      "model": 76954716,
      "vfx": 821279,
      "sfx": 451389,
      "icons": 190606,
      "riggedWeapon": 38063309,
      "total": 78417990
    },
    "skills": {
      "passive": "Pride of Sakura: Memadukan jikoshoukai \"Kalau sakura itu kembang, Aku itu kembanggaanmu!\" dengan hobi olahraga bulu tangkisnya, setiap 3 pukulan raket menembakkan kok kelopak sakura berapi yang melengkung melewati minion terdepan dan memercikkan bara saat mendarat.",
      "skill_1": "Blazing Drive Shot: Mengayunkan raket dalam pukulan drive mendatar super cepat; kok api melesat lurus menembus target dan meningkatkan Attack Speed Raisha jika mengenai hero lawan.",
      "skill_2": "Drop-Shot Footwork: Melangkah gesit ala footwork bulu tangkis ke arah samping atau belakang sambil menjatuhkan kok api lembut (drop-shot) di posisi lama yang meledak memperlambat pengejar.",
      "ultimate": "Jumping Smash: Sakura Flare: Melompat tinggi ke udara lalu melancarkan Jumping Smash bertenaga penuh ke area target—menghujamkan kok api sakura raksasa berdaya ledak kritikal masif yang meluluhlantakkan kelompok musuh sekaligus."
    },
    "archetype": "Marksman",
    "stats": {
      "hp": 2640,
      "mana": 500,
      "atk": 138,
      "mag": 18,
      "def": 17,
      "mdef": 18,
      "spd": 6.19,
      "atkRange": 9.4,
      "crit": 0.2
    },
    "isDefault": false
  },
  {
    "id": "daisy",
    "name": "Daisy",
    "team": "team_passion",
    "roleLane": "Healer / Roamer (Refreshing Solar-Daisy Healer)",
    "weaponName": "Sun-Daisy Parasol (Payung Bunga Daisy Bercahaya Amber)",
    "weaponType": "bow",
    "standPath": "assets/stands/stands_42_custom_glb/team_passion/stand3d_daisy_daisy_coffee_chess.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_passion/weapon_anim_daisy_bow.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/daisy_weapon.glb",
    "heroGlbPath": "assets/heroes/team_passion/daisy_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/daisy.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/daisy_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/daisy_chibi.webp",
    "bytes": {
      "model": 53203560,
      "vfx": 944026,
      "sfx": 221602,
      "icons": 194825,
      "riggedWeapon": 14470349,
      "total": 54564013
    },
    "skills": {
      "passive": "Refreshing Fragrance: Mengangkat jikoshoukai bunga daisy pemancar kesegaran dan kebahagiaan, setiap kali Daisy menggunakan skill, kelopak bunga daisy hangat melayang di udara dan memberi pemulihan HP perlahan serta tambahan +10% Movement Speed bagi sekutu yang menyentuhnya.",
      "skill_1": "Parasol Ward: Membuka payung bunga daisy ke arah depan selama 2 detik untuk memblokir proyektil musuh sekaligus memancarkan kabut hangat yang menyembuhkan sekutu di belakang payung.",
      "skill_2": "One-on-One Warmth: Terinspirasi kepribadiannya yang sangat ramah saat fokus berinteraksi dengan satu orang serta ikatan kembarnya bersama Danella, Daisy menyematkan cincin kelopak emas pada satu sekutu target—memberikan Heal instan besar dan tambahan Attack Speed (efek perisai ekstra aktif bila diberikan kepada Fighter garis depan seperti Danella).",
      "ultimate": "Grand Daisy Bloom: Memutar dan melambungkan payungnya memekarkan bunga daisy surya raksasa di tengah teamfight selama 4 detik—menyegarkan kembali tim dengan Heal area masif sekaligus memangkas 20% cooldown skill dasar seluruh rekan di dalam kelopak."
    },
    "archetype": "Healer",
    "stats": {
      "hp": 2940,
      "mana": 680,
      "atk": 74,
      "mag": 124,
      "def": 26,
      "mdef": 30,
      "spd": 6.2,
      "atkRange": 6.8,
      "crit": 0.08
    },
    "isDefault": false
  },
  {
    "id": "ribka",
    "name": "Ribka",
    "team": "team_passion",
    "roleLane": "Assassin / Jungler (Mirror-Geometry Assassin)",
    "weaponName": "Crimson Cello-Blade & Mirror Shards (Busur Cello Bilah Api & Pecahan Cermin)",
    "weaponType": "grimoire",
    "standPath": "assets/stands/stands_42_custom_glb/team_passion/stand3d_ribka_magic_mirror_cello.glb",
    "weaponAnimPath": "assets/weapons_anim/weapons_42_animated_glb/team_passion/weapon_anim_ribka_grimoire.glb",
    "weaponRiggedPath": "assets/weapons_rigged/weapons_42_rigged_glb/ribka_weapon.glb",
    "heroGlbPath": "assets/heroes/team_passion/ribka_web_opt.glb",
    "heroJsonPath": "assets/game_data/hero_systems/game_data_v5/heroes_42/ribka.json",
    "portraitPath": "assets/ui/portraits_42/portraits_42/ribka_portrait.webp",
    "chibiPath": "assets/ui/chibi_42/chibi_42_members/ribka_chibi.webp",
    "bytes": {
      "model": 55099331,
      "vfx": 814296,
      "sfx": 221727,
      "icons": 230278,
      "riggedWeapon": 50656707,
      "total": 56365632
    },
    "skills": {
      "passive": "Calculated Angle: Memadukan kecintaannya pada Matematika (pernah mewakili sekolah di lomba matematika) dengan keahliannya memainkan alat musik cello, setiap serangan yang memantul dari cerminnya menghitung sudut kritis dan menghasilkan +30% Bonus Damage menembus Armor.",
      "skill_1": "Mirror on the Wall: Mengadaptasi jikoshoukai \"Mirror mirror on the wall, who's the sweetest in here? It's me, Ribka!\", ia meletakkan hingga 2 pecahan cermin api di posisi strategis arena selama 8 detik; cermin ini memantulkan skill serangannya ke sudut baru yang tak terduga.",
      "skill_2": "Cello Flame Bow: Menggesekkan busur cello bilah api untuk menembakkan gelombang tebasan suara membara; jika menyentuh Mirror on the Wall, gelombang memantul otomatis mengincar hero musuh terdekat.",
      "ultimate": "Shattered Reflection: Berpindah posisi seketika (Blink Swap) dengan cermin terjauh yang telah ia letakkan lalu menghancurkan seluruh cermin di arena secara bersamaan—menciptakan hujan pecahan kaca berapi di sekitar target dan mengeksekusi lawan dari titik buta."
    },
    "archetype": "Assassin",
    "stats": {
      "hp": 2725,
      "mana": 440,
      "atk": 148,
      "mag": 30,
      "def": 21,
      "mdef": 19,
      "spd": 7.01,
      "atkRange": 2.65,
      "crit": 0.22
    },
    "isDefault": false
  }
]);

const HERO_MAP = new Map(ROSTER_42.map((h) => [h.id, h]));

export function getHeroById(heroId) {
  return HERO_MAP.get(heroId) || HERO_MAP.get('freya') || ROSTER_42[0];
}

export function getDefaultHero() {
  return HERO_MAP.get('freya') || ROSTER_42[0];
}

export function getHeroesByTeam(teamId) {
  if (!teamId || teamId === 'all') return ROSTER_42;
  return ROSTER_42.filter((h) => h.team === teamId);
}

export function getHeroEssentialFiles(heroId, { includeRiggedWeapon = false } = {}) {
  const h = getHeroById(heroId);
  const t = h.team;
  const s = h.id;
  const projTypes = [
    '01_bullet', '02_magic_orb', '03_multi_barrage', '04_melee_slash',
    '05_dash_trail', '06_magic_circle_cast', '07_beam_laser', '08_shield_barrier',
    '09_aoe_eruption', '10_passive_aura', '11_ult_signature', '12_ult_mega_explosion'
  ];
  const files = [
    h.heroGlbPath,
    h.standPath,
    h.weaponAnimPath,
    h.heroJsonPath,
    h.portraitPath,
    h.chibiPath,
    `assets/skills_vfx_3d/skills_3d_vfx_168_glb/${t}/${s}/vfx3d_${s}_s1_strike.glb`,
    `assets/skills_vfx_3d/skills_3d_vfx_168_glb/${t}/${s}/vfx3d_${s}_s2_tactical.glb`,
    `assets/skills_vfx_3d/skills_3d_vfx_168_glb/${t}/${s}/vfx3d_${s}_s3_aoe.glb`,
    `assets/skills_vfx_3d/skills_3d_vfx_168_glb/${t}/${s}/vfx3d_${s}_s4_ultimate.glb`,
    `assets/skills_sfx/skills_sfx_168_ogg/${t}/${s}/sfx_${s}_s1_strike.ogg`,
    `assets/skills_sfx/skills_sfx_168_ogg/${t}/${s}/sfx_${s}_s2_tactical.ogg`,
    `assets/skills_sfx/skills_sfx_168_ogg/${t}/${s}/sfx_${s}_s3_aoe.ogg`,
    `assets/skills_sfx/skills_sfx_168_ogg/${t}/${s}/sfx_${s}_s4_ultimate.ogg`,
    `assets/audio/sfx_hq_220/audio_stereo_hq_v5/hero_sfx_stereo_168/${s}/${s}_passive_hq.ogg`,
    `assets/audio/sfx_hq_220/audio_stereo_hq_v5/hero_sfx_stereo_168/${s}/${s}_skill_1_hq.ogg`,
    `assets/audio/sfx_hq_220/audio_stereo_hq_v5/hero_sfx_stereo_168/${s}/${s}_skill_2_hq.ogg`,
    `assets/audio/sfx_hq_220/audio_stereo_hq_v5/hero_sfx_stereo_168/${s}/${s}_ultimate_hq.ogg`
  ];
  for (const pt of projTypes) {
    files.push(`assets/vfx/projectiles_3d/hero_skills_504_3d_glb/${t}/${s}/${s}_${pt}_3d.glb`);
  }
  for (const st of ['ready_framed', 'awakened_glow', 'cooldown_dark', 'silenced_locked']) {
    for (const sk of ['passive', 'skill_1', 'skill_2', 'ultimate']) {
      files.push(`assets/ui/skill_icons_672/skill_icons_672_states/${st}/${s}_${sk}.webp`);
    }
  }
  if (includeRiggedWeapon && h.weaponRiggedPath) {
    files.push(h.weaponRiggedPath);
  }
  return files.filter(Boolean);
}

export function isHeroCoreCached(heroId) {
  const h = getHeroById(heroId);
  return (
    LocalAssetCache.has(h.heroGlbPath) &&
    LocalAssetCache.has(h.standPath) &&
    LocalAssetCache.has(h.weaponAnimPath)
  );
}

export function getHeroCacheStatus(heroId) {
  const files = getHeroEssentialFiles(heroId);
  const status = LocalAssetCache.getPackStatus(files);
  const coreReady = isHeroCoreCached(heroId);
  return {
    ...status,
    coreReady,
    fullyCached: status.complete || coreReady
  };
}

export function getHeroFilesBreakdown(heroId) {
  const h = getHeroById(heroId);
  const b = h.bytes;
  return {
    modelBytes: b.model,
    vfxBytes: b.vfx,
    sfxBytes: b.sfx,
    iconsBytes: b.icons,
    riggedWeaponBytes: b.riggedWeapon,
    totalBytes: b.total
  };
}

export function getTeamBatchSummary(teamId) {
  const list = getHeroesByTeam(teamId);
  let totalBytes = 0;
  let cachedHeroes = 0;
  const uncachedHeroes = [];
  for (const h of list) {
    totalBytes += h.bytes.total;
    if (isHeroCoreCached(h.id)) cachedHeroes++;
    else uncachedHeroes.push(h);
  }
  return { teamId, totalHeroes: list.length, cachedHeroes, uncachedHeroes, totalBytes };
}

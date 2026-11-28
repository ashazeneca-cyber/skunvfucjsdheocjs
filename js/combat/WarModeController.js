/**
 * RAPSONYX Authoritative Client-Side War Mode & MOBA Arena State Controller
 * Supports:
 * - 2-Team War (Grand Ocean Bridge, Mist Duel) & 3-Team Tri-Faction War (Colosseum, Sky Sanctuary - Team Passion Always Spawned!)
 * - 2-Stage Shield Lock (Base Protected by war_shield_dome while Turret stands)
 * - Turret Aggro Escalation (Up to 2.4x consecutive hero damage + warning beam)
 * - Compound Respawn (+12%/min), Sudden Death at 240s, MVP Scoring, Killstreaks & Gold/EXP Progression
 */

import * as THREE from 'three';
import { MAP_CATALOG, TEAM_CONFIG } from '../config/constants.js';
import { AssetRegistry } from '../core/AssetRegistry.js';
import { AudioDirector } from '../core/AudioDirector.js';
import { ResourceDisposer } from '../core/ResourceDisposer.js';
import { getHeroById, getHeroesByTeam } from '../character/Roster42Directory.js';
import { RapsonyxCombatMath } from './RapsonyxCombatMath.js';
import { SHOP_ITEMS_30, BATTLE_SPELLS_8, EMBLEMS_6 } from './ItemsSpellsEmblems.js';
import { MinionBossAI } from './MinionBossAI.js';
import { VFXAndShieldShaders } from '../shaders/VFXAndShieldShaders.js';

export class WarModeController {
  constructor(scene, renderer, vfxDirector, lighting) {
    this.scene = scene;
    this.renderer = renderer;
    this.vfx = vfxDirector;
    this.lighting = lighting;

    this.warGroup = new THREE.Group();
    this.warGroup.name = 'RAPSONYX_WAR_ACTORS';
    this.minionAi = new MinionBossAI(scene, renderer, vfxDirector);

    this.mapCfg = null;
    this.activeFactions = [];
    this.structures = [];
    this.combatants = [];
    this.playerUnit = null;
    this.lockedTargetId = null;

    this.matchTimeSec = 0;
    this.suddenDeathTriggered = false;
    this.firstBloodAwarded = false;
    this.playerFirstBlood = false;
    this.playerShieldBreaks = 0;
    this.playerSavage = false;
    this.playerTeamWipe = false;
    this.matchEnded = false;
    this.winningTeam = null;

    this.killFeed = [];
    this.onEventBanner = null;
    this.onMatchFinish = null;
  }

  async startMatch({
    mapId = 'arena_colosseum',
    playerHeroId = 'freya',
    squadMode = 'SOLO', // SOLO | DUO | SQUAD | PRACTICE
    selectedSpellId = 'spell_flicker',
    selectedEmblemId = 'emb_rapsonyx',
    physics = null
  }) {
    this.dispose();
    if (!this.warGroup.parent) this.scene.add(this.warGroup);

    this.mapCfg = MAP_CATALOG[mapId] || MAP_CATALOG.arena_colosseum;
    this.activeFactions = [...(this.mapCfg.factions || ['team_dream', 'team_passion'])];
    this.matchTimeSec = 0;
    this.suddenDeathTriggered = false;
    this.firstBloodAwarded = false;
    this.playerFirstBlood = false;
    this.playerShieldBreaks = 0;
    this.playerSavage = false;
    this.playerTeamWipe = false;
    this.matchEnded = false;
    this.winningTeam = null;
    this.killFeed = [];
    this.lockedTargetId = null;

    const playerMeta = getHeroById(playerHeroId);
    // Guarantee player's faction exists cleanly inside activeFactions
    if (!this.activeFactions.includes(playerMeta.team)) {
      this.activeFactions[0] = playerMeta.team;
    }

    const heroesPerFaction = squadMode === 'SQUAD' ? 4 : squadMode === 'DUO' ? 2 : 1;

    // 1. Spawn Turrets & Nexus Bases (with 2-Stage Shield Dome)
    await this._spawnStructuresForFactions(physics);

    // 2. Spawn Combatant Heroes (Player + Bots / Allies across all activeFactions incl. team_passion)
    for (let f = 0; f < this.activeFactions.length; f++) {
      const faction = this.activeFactions[f];
      const spawnPt = this._getFactionPoint(faction, 'spawn', physics);
      const rosterPool = getHeroesByTeam(faction);

      for (let slot = 0; slot < heroesPerFaction; slot++) {
        const isPlayer = f === this.activeFactions.indexOf(playerMeta.team) && slot === 0;
        const heroMeta = isPlayer
          ? playerMeta
          : rosterPool.find((h) => h.id !== playerMeta.id && !this.combatants.some((u) => u.heroId === h.id)) || rosterPool[slot % rosterPool.length];

        const angle = (slot / Math.max(1, heroesPerFaction)) * Math.PI * 2;
        const sx = spawnPt.x + (slot === 0 ? 0 : Math.cos(angle) * 3.5);
        const sz = spawnPt.z + (slot === 0 ? 0 : Math.sin(angle) * 3.5);
        const unit = this._createHeroUnit(heroMeta, {
          isPlayer,
          team: faction,
          spawnPos: new THREE.Vector3(sx, spawnPt.y, sz),
          spellId: isPlayer ? selectedSpellId : 'spell_execute',
          emblemId: isPlayer ? selectedEmblemId : 'emb_rapsonyx'
        });

        this.combatants.push(unit);
        if (isPlayer) this.playerUnit = unit;
        else this._mountBotMesh(unit, faction);
      }
    }

    // 3. Configure Minions & Arena Center Boss (Dragon/Phoenix/Crystal Golem)
    this.minionAi.configure({
      factions: this.activeFactions,
      getFactionPointFn: (fac, kind) => this._getFactionPoint(fac, kind, physics),
      physics
    });

    if (this.mapCfg.id !== 'arena_ocean_bridge') {
      await this.minionAi.spawnCenterBoss(new THREE.Vector3(0, physics ? physics.getHeightAt(0, 0) : 0, 0));
    }

    AudioDirector.playSfx('sfx_countdown_go', { volume: 0.9 });
    return this.playerUnit;
  }

  _getFactionPoint(faction, kind, physics) {
    const obj = this.mapCfg?.objectives?.[faction];
    let x = 0;
    let z = 0;
    if (obj) {
      if (obj[kind]) {
        x = obj[kind].x;
        z = obj[kind].z;
      } else if (typeof obj.angleDeg === 'number') {
        const rad = THREE.MathUtils.degToRad(obj.angleDeg);
        const r = obj[`${kind}R`] ?? 110;
        x = Math.cos(rad) * r;
        z = Math.sin(rad) * r;
      }
    }
    const y = physics ? physics.getHeightAt(x, z, 20) : 0;
    return new THREE.Vector3(x, y, z);
  }

  async _spawnStructuresForFactions(physics) {
    let shieldTemplate = null;
    try {
      const gltf = await AssetRegistry.loadGLTF('war_shield_dome', this.renderer);
      shieldTemplate = gltf.scene;
    } catch (_) {
      shieldTemplate = null;
    }

    for (let i = 0; i < this.activeFactions.length; i++) {
      const faction = this.activeFactions[i];
      const teamCfg = TEAM_CONFIG[faction] || TEAM_CONFIG.team_dream;

      // Outer Turret
      const tPos = this._getFactionPoint(faction, 'turret', physics);
      const tNode = new THREE.Group();
      tNode.position.copy(tPos);
      const tBody = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 1.6, 5.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x293245, roughness: 0.45, metalness: 0.4 })
      );
      tBody.position.y = 2.6;
      const tCrystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.95, 0),
        new THREE.MeshStandardMaterial({ color: teamCfg.colorInt, emissive: teamCfg.colorInt, emissiveIntensity: 1.45 })
      );
      tCrystal.position.y = 6.1;
      tNode.add(tBody, tCrystal);
      this.warGroup.add(tNode);

      const turret = {
        id: `turret_${faction}`,
        kind: 'turret',
        name: `Kristal Depan ${teamCfg.name}`,
        team: faction,
        position: tPos.clone(),
        hp: 5500,
        maxHp: 5500,
        def: 45,
        mdef: 45,
        range: 14.5,
        attackCooldown: 0,
        aggroTargetId: null,
        aggroStacks: 0,
        alive: true,
        invulnerable: false,
        node: tNode,
        shieldMesh: null
      };

      // War Base / Nexus protected by 2-Stage Shield Lock (8500 HP)
      const bPos = this._getFactionPoint(faction, 'base', physics);
      const bNode = new THREE.Group();
      bNode.position.copy(bPos);
      const bPedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(2.8, 3.4, 1.4, 12),
        new THREE.MeshStandardMaterial({ color: 0x1b2232, roughness: 0.38, metalness: 0.55 })
      );
      bPedestal.position.y = 0.7;
      const bCore = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.85, 1),
        new THREE.MeshStandardMaterial({ color: teamCfg.colorInt, emissive: teamCfg.colorInt, emissiveIntensity: 1.8 })
      );
      bCore.position.y = 3.8;
      bNode.add(bPedestal, bCore);

      // 2-Stage Fresnel Hex Shield Dome visual
      let shieldMesh = null;
      if (shieldTemplate) {
        shieldMesh = shieldTemplate.clone();
        shieldMesh.scale.setScalar(3.2);
      } else {
        shieldMesh = new THREE.Mesh(
          new THREE.SphereGeometry(5.6, 28, 20),
          VFXAndShieldShaders.createShieldDomeMaterial(teamCfg.colorHex, true)
        );
      }
      shieldMesh.position.y = 2.8;
      bNode.add(shieldMesh);
      this.warGroup.add(bNode);

      const base = {
        id: `base_${faction}`,
        kind: 'base',
        name: `Nexus ${teamCfg.name}`,
        team: faction,
        position: bPos.clone(),
        hp: 8500,
        maxHp: 8500,
        def: 55,
        mdef: 55,
        range: 16.0,
        attackCooldown: 0,
        aggroTargetId: null,
        aggroStacks: 0,
        alive: true,
        invulnerable: true, // Locked until Outer Turret is destroyed!
        guardTurretId: turret.id,
        node: bNode,
        shieldMesh
      };

      this.structures.push(turret, base);
    }
  }

  _createHeroUnit(heroMeta, { isPlayer, team, spawnPos, spellId, emblemId }) {
    const emb = EMBLEMS_6.find((e) => e.id === emblemId) || EMBLEMS_6[5];
    const spell = BATTLE_SPELLS_8.find((s) => s.id === spellId) || BATTLE_SPELLS_8[0];
    const b = heroMeta.stats;

    return {
      id: `${team}_${heroMeta.id}_${isPlayer ? 'player' : 'bot'}`,
      heroId: heroMeta.id,
      heroMeta,
      name: heroMeta.name,
      isPlayer,
      team,
      alive: true,
      respawnTimer: 0,
      spawnPos: spawnPos.clone(),
      position: spawnPos.clone(),
      facingYaw: 0,
      level: 1,
      exp: 0,
      gold: 650,
      kills: 0,
      deaths: 0,
      assists: 0,
      streak: 0,

      // Combat attributes
      baseMaxHp: b.hp + (emb.bonus.hp || 0),
      maxHp: b.hp + (emb.bonus.hp || 0),
      hp: b.hp + (emb.bonus.hp || 0),
      maxMana: b.mana + (emb.bonus.mana || 0),
      mana: b.mana + (emb.bonus.mana || 0),
      atk: b.atk + (emb.bonus.atk || 0),
      mag: b.mag + (emb.bonus.mag || 0),
      def: b.def + (emb.bonus.def || 0),
      mdef: b.mdef,
      spd: b.spd * (1 + (emb.bonus.spdPct || 0)),
      atkRange: b.atkRange,
      crit: b.crit + (emb.bonus.crit || 0),
      atkSpd: 1.0 + (emb.bonus.atkSpd || 0),
      cdr: emb.bonus.cdr || 0,
      lifesteal: emb.bonus.lifesteal || 0,
      spellVamp: emb.bonus.spellVamp || 0,
      flatPhysPen: emb.bonus.flatPhysPen || 0,
      flatMagPen: emb.bonus.flatMagPen || 0,
      pctPhysPen: 0,
      pctMagPen: 0,
      tenacity: emb.bonus.tenacity || 0,
      healPower: emb.bonus.healPower || 0,
      damageReduction: 0,

      // Runtime states
      shields: [],
      ccs: [],
      invulnerable: false,
      ccImmune: false,
      items: [],
      skillCooldowns: [0, 0, 0, 0],
      skillMaxCooldowns: [0, 6.5, 9.0, 28.0],
      spell,
      spellCooldown: 0,
      basicAtkCooldown: 0,
      recallTimer: 0,
      node: null,
      lastDamagerId: null,
      lastDamagerAt: 0
    };
  }

  _mountBotMesh(unit, faction) {
    const teamCfg = TEAM_CONFIG[faction] || TEAM_CONFIG.team_dream;
    const g = new THREE.Group();
    g.position.copy(unit.position);
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.36, 1.05, 6, 10),
      new THREE.MeshStandardMaterial({ color: teamCfg.colorInt, roughness: 0.45, metalness: 0.15 })
    );
    body.position.y = 0.9;
    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    visor.position.set(0, 1.56, 0.18);
    g.add(body, visor);
    this.warGroup.add(g);
    unit.node = g;
  }

  recalculateUnitStats(unit) {
    const lvScale = 1 + (unit.level - 1) * 0.085;
    const base = unit.heroMeta.stats;
    let maxHp = Math.round(base.hp * lvScale);
    let maxMana = Math.round(base.mana * lvScale);
    let atk = Math.round(base.atk * lvScale);
    let mag = Math.round(base.mag * lvScale);
    let def = Math.round(base.def + (unit.level - 1) * 2.5);
    let mdef = Math.round(base.mdef + (unit.level - 1) * 2.0);
    let spdPct = 0;
    let crit = base.crit;
    let atkSpd = 1.0;
    let cdr = 0;
    let lifesteal = 0;
    let spellVamp = 0;
    let flatPhysPen = 0;
    let pctPhysPen = 0;
    let flatMagPen = 0;
    let pctMagPen = 0;

    for (const item of unit.items) {
      const s = item.stats || {};
      maxHp += s.hp || 0;
      maxMana += s.mana || 0;
      atk += s.atk || 0;
      mag += s.mag || 0;
      def += s.def || 0;
      mdef += s.mdef || 0;
      spdPct += s.spdPct || 0;
      crit += s.crit || 0;
      atkSpd += s.atkSpd || 0;
      cdr += s.cdr || 0;
      lifesteal += s.lifesteal || 0;
      spellVamp += s.spellVamp || 0;
      flatPhysPen += s.flatPhysPen || 0;
      pctPhysPen += s.pctPhysPen || 0;
      flatMagPen += s.flatMagPen || 0;
      pctMagPen += s.pctMagPen || 0;
    }

    const hpPct = unit.hp / Math.max(1, unit.maxHp);
    unit.maxHp = maxHp;
    unit.hp = Math.min(maxHp, Math.max(1, Math.round(maxHp * hpPct)));
    unit.maxMana = maxMana;
    unit.atk = atk;
    unit.mag = mag;
    unit.def = def;
    unit.mdef = mdef;
    unit.spd = base.spd * (1 + spdPct);
    unit.crit = Math.min(0.85, crit);
    unit.atkSpd = Math.min(2.8, atkSpd);
    unit.cdr = Math.min(0.45, cdr);
    unit.lifesteal = lifesteal;
    unit.spellVamp = spellVamp;
    unit.flatPhysPen = flatPhysPen;
    unit.pctPhysPen = Math.min(0.65, pctPhysPen);
    unit.flatMagPen = flatMagPen;
    unit.pctMagPen = Math.min(0.65, pctMagPen);
  }

  buyItemForUnit(unit, itemId) {
    if (!unit || unit.items.length >= 6) return { ok: false, reason: 'Slot item penuh (6/6).' };
    const item = SHOP_ITEMS_30.find((it) => it.id === itemId);
    if (!item) return { ok: false, reason: 'Item tidak ditemukan.' };
    if (unit.gold < item.price) return { ok: false, reason: 'Gold tidak cukup.' };

    unit.gold -= item.price;
    unit.items.push(item);
    this.recalculateUnitStats(unit);
    return { ok: true, item };
  }

  findBestTarget(attacker, mode = 'auto') {
    const maxR = attacker.atkRange + 4.5;
    if (this.lockedTargetId && attacker.isPlayer && mode === 'hero') {
      const locked = this.combatants.find((u) => u.id === this.lockedTargetId && u.alive && u.team !== attacker.team);
      if (locked && locked.position.distanceTo(attacker.position) <= maxR + 2) return locked;
    }

    if (mode === 'turret') {
      const s = this.structures.find((st) => st.alive && !st.invulnerable && st.team !== attacker.team && st.position.distanceTo(attacker.position) <= maxR + 3);
      if (s) return s;
    }
    if (mode === 'minion') {
      const m = this.minionAi.minions.find((mn) => mn.alive && mn.team !== attacker.team && mn.position.distanceTo(attacker.position) <= maxR + 2);
      if (m) return m;
    }

    // Priority default: closest hostile hero -> boss -> minion -> vulnerable structure
    let best = null;
    let bestD = maxR;
    for (const h of this.combatants) {
      if (!h.alive || h.team === attacker.team) continue;
      const d = h.position.distanceTo(attacker.position);
      if (d < bestD) { best = h; bestD = d; }
    }
    if (best) return best;

    const b = this.minionAi.boss;
    if (b && b.alive && b.position.distanceTo(attacker.position) <= maxR + 3) return b;

    for (const mn of this.minionAi.minions) {
      if (!mn.alive || mn.team === attacker.team) continue;
      const d = mn.position.distanceTo(attacker.position);
      if (d < bestD) { best = mn; bestD = d; }
    }
    if (best) return best;

    for (const st of this.structures) {
      if (!st.alive || st.invulnerable || st.team === attacker.team) continue;
      const d = st.position.distanceTo(attacker.position);
      if (d < bestD + 3) { best = st; bestD = d; }
    }
    return best;
  }

  performBasicAttack(attacker, targetOverride = null, mode = 'auto') {
    if (!attacker?.alive || attacker.basicAtkCooldown > 0) return false;
    const target = targetOverride || this.findBestTarget(attacker, mode);
    if (!target) return false;

    attacker.basicAtkCooldown = Math.max(0.28, 0.88 / attacker.atkSpd);
    const isRanged = attacker.atkRange >= 4.5;
    const isMagAtk = attacker.heroMeta.archetype === 'Mage';
    const raw = isMagAtk ? attacker.atk * 0.5 + attacker.mag * 0.45 : attacker.atk;

    this.vfx.spawnBasicAttackProjectile({
      originPos: attacker.position,
      targetPos: target.position,
      casterTeam: attacker.team,
      isRanged,
      onHit: () => {
        if (!target.alive) return;
        this.applyDamageToTarget(attacker, target, raw, isMagAtk ? 'magic' : 'physical', !isMagAtk);
      }
    });
    return true;
  }

  castSkill(caster, slotIndex, targetPos = null) {
    if (!caster?.alive || slotIndex < 1 || slotIndex > 3) return false;
    if (caster.skillCooldowns[slotIndex] > 0) return false;
    const manaCosts = [0, 50, 70, 120];
    if (caster.mana < manaCosts[slotIndex]) return false;

    const cc = RapsonyxCombatMath.getHighestActiveCC(caster);
    if (cc && (cc.type === 'STUN' || cc.type === 'SUPPRESS' || cc.type === 'SILENCE')) return false;

    caster.mana -= manaCosts[slotIndex];
    const baseCd = caster.skillMaxCooldowns[slotIndex];
    caster.skillCooldowns[slotIndex] = baseCd * (1 - (caster.cdr || 0));

    const arch = caster.heroMeta.archetype;
    const isMagic = arch === 'Mage' || arch === 'Healer';
    const baseDmg = slotIndex === 1 ? 210 : slotIndex === 2 ? 280 : 540;
    const scale = isMagic ? caster.mag * (slotIndex === 3 ? 1.45 : 0.92) : caster.atk * (slotIndex === 3 ? 1.65 : 1.1);
    const raw = baseDmg + scale;
    const radius = slotIndex === 3 ? 7.2 : 4.8;

    const targetCenter = targetPos || new THREE.Vector3(
      caster.position.x + Math.sin(caster.facingYaw) * (slotIndex === 1 ? 4.5 : 2.5),
      caster.position.y,
      caster.position.z + Math.cos(caster.facingYaw) * (slotIndex === 1 ? 4.5 : 2.5)
    );

    this.vfx.castHeroSkill3D({
      heroMeta: caster.heroMeta,
      slotIndex,
      originPos: caster.position,
      forwardYaw: caster.facingYaw,
      targetPos: targetCenter
    });

    // Self Shield / Heal for Healer or Fighter Tactical Slot 2
    if (arch === 'Healer' && slotIndex === 2) {
      const healVal = Math.round(280 + caster.mag * 0.8);
      caster.hp = Math.min(caster.maxHp, caster.hp + healVal);
      RapsonyxCombatMath.applyShield(caster, 260 + caster.mag * 0.65, 3500, 's2');
      this.vfx.spawnFloatingNumber(caster.position, healVal, { isHeal: true });
    }

    // Continuous per-millisecond swept-segment & live zone collision tracker
    const dirVec = new THREE.Vector3(Math.sin(caster.facingYaw), 0, Math.cos(caster.facingYaw));
    const trackMode = slotIndex === 1 ? 'line' : slotIndex === 2 ? 'caster_anchor' : 'ground_zone';
    const teamCfg = TEAM_CONFIG[caster.team] || TEAM_CONFIG.team_dream;

    this.vfx.spawnTrackedSkillInstance({
      mode: trackMode,
      origin: trackMode === 'ground_zone' ? targetCenter : caster.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
      targetPos: targetCenter,
      direction: dirVec,
      casterUnit: caster,
      speed: slotIndex === 1 ? 22 : 10,
      radius: slotIndex === 3 ? 6.5 : 3.2,
      duration: slotIndex === 3 ? 1.1 : slotIndex === 1 ? 0.55 : 0.65,
      colorHex: teamCfg.colorHex,
      syncOnline: Boolean(caster.isPlayer),
      onSweepHit: (inst) => {
        const hitR = inst.radius;
        const rSq = hitR * hitR;
        const pool = [...this.combatants, ...this.minionAi.minions, ...(this.minionAi.boss?.alive ? [this.minionAi.boss] : [])];
        for (let i = 0; i < pool.length; i++) {
          const enemy = pool[i];
          if (!enemy.alive || enemy.team === caster.team || inst.hitIds.has(enemy.id)) continue;
          const distSq = RapsonyxCombatMath.distPointToSegmentSqXZ(
            enemy.position.x,
            enemy.position.z,
            inst.prevPos.x,
            inst.prevPos.z,
            inst.currPos.x,
            inst.currPos.z
          );
          if (distSq <= rSq) {
            inst.hitIds.add(enemy.id);
            this.applyDamageToTarget(caster, enemy, raw, isMagic ? 'magic' : 'physical', false, true);
            if (slotIndex === 3) RapsonyxCombatMath.applyCrowdControl(enemy, 'STUN', 1.1);
            else if (slotIndex === 2) RapsonyxCombatMath.applyCrowdControl(enemy, 'SLOW', 1.5, 0.35);
          }
        }
      }
    });
    return true;
  }

  castBattleSpell(caster, locomotion = null, physics = null) {
    if (!caster?.alive || caster.spellCooldown > 0) return false;
    const id = caster.spell.id;
    caster.spellCooldown = caster.spell.cooldown;

    if (id === 'spell_flicker') {
      const fx = caster.position.x + Math.sin(caster.facingYaw) * 8.5;
      const fz = caster.position.z + Math.cos(caster.facingYaw) * 8.5;
      caster.position.x = fx;
      caster.position.z = fz;
      if (physics) physics.resolveMovement(caster.position, 0.42, caster.position.y);
      if (locomotion) locomotion.position.copy(caster.position);
      this.vfx.spawnRingBurst(caster.position, 0x5ce1ff, 3.2, 0.35);
    } else if (id === 'spell_aegis') {
      RapsonyxCombatMath.applyShield(caster, 420 + caster.level * 60, 4000, 'aegis');
      this.vfx.spawnRingBurst(caster.position, 0xfbbf24, 3.8, 0.45);
    } else if (id === 'spell_purify') {
      RapsonyxCombatMath.cleanseCrowdControl(caster);
      caster.ccImmune = true;
      setTimeout(() => { caster.ccImmune = false; }, 1500);
    } else if (id === 'spell_revitalize') {
      caster.hp = Math.min(caster.maxHp, caster.hp + Math.round(caster.maxHp * 0.35));
      this.vfx.spawnRingBurst(caster.position, 0x4ade80, 5.2, 0.65);
    } else if (id === 'spell_execute') {
      const target = this.findBestTarget(caster, 'hero');
      if (target) {
        const missingHp = target.maxHp - target.hp;
        this.applyDamageToTarget(caster, target, 240 + caster.level * 30 + missingHp * 0.14, 'true', false, false);
      }
    } else if (id === 'spell_retribution') {
      const target = this.minionAi.boss?.alive ? this.minionAi.boss : this.findBestTarget(caster, 'minion');
      if (target) {
        this.applyDamageToTarget(caster, target, 750 + caster.level * 60, 'true', false, false);
      }
    } else if (id === 'spell_sprint') {
      caster.spd *= 1.38;
      setTimeout(() => this.recalculateUnitStats(caster), 4500);
    } else if (id === 'spell_inspire') {
      caster.atkSpd = Math.min(2.8, caster.atkSpd + 0.55);
      caster.lifesteal += 0.18;
      setTimeout(() => this.recalculateUnitStats(caster), 4500);
    }
    return true;
  }

  applyDamageToTarget(attacker, target, rawDamage, dmgType = 'physical', canCrit = false, isAoE = false) {
    if (!target || !target.alive) return;
    if (target.invulnerable) {
      if (target.kind === 'base' && attacker.isPlayer && this.onEventBanner) {
        this.onEventBanner('Nexus Kebal! Hancurkan Menara Pelindung terlebih dahulu.');
      }
      return;
    }

    const res = RapsonyxCombatMath.calculateDamage({
      rawDamage,
      damageType: dmgType,
      attacker,
      defender: target,
      canCrit,
      critChance: attacker.crit || 0,
      isAoE
    });

    target.hp = Math.max(0, target.hp - res.hpDamage);
    if (this.vfx && (res.hpDamage > 0 || res.shieldAbsorbed > 0)) {
      this.vfx.spawnHitFlash(
        target.position,
        res.isCrit,
        res.hpDamage || res.shieldAbsorbed,
        dmgType
      );
    }
    if (res.healAmount > 0 && attacker.alive) {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + res.healAmount);
    }
    if (attacker.id) {
      target.lastDamagerId = attacker.id;
      target.lastDamagerAt = this.matchTimeSec;
    }

    if (target.hp <= 0 && target.alive) {
      this._handleUnitDeath(target, attacker);
    }
  }

  _handleUnitDeath(victim, killer) {
    victim.alive = false;
    if (victim.kind === 'turret') {
      AudioDirector.playSfx('sfx_war_shield_break', { volume: 0.9 });
      if (victim.node) victim.node.scale.y = 0.25;
      // Unlock 2-Stage Shield Lock on associated Nexus Base!
      const base = this.structures.find((s) => s.guardTurretId === victim.id);
      if (base) {
        base.invulnerable = false;
        if (base.shieldMesh) base.shieldMesh.visible = false;
        if (killer?.isPlayer) this.playerShieldBreaks += 1;
        if (this.onEventBanner) this.onEventBanner(`PERISAI ${TEAM_CONFIG[base.team]?.name?.toUpperCase()} HANCUR!`);
      }
      if (killer?.heroMeta) killer.gold += 350;
      return;
    }

    if (victim.kind === 'base') {
      if (victim.node) victim.node.scale.setScalar(0.35);
      this._evaluateVictoryCondition();
      return;
    }

    if (victim.kind === 'boss') {
      this.minionAi.onBossSlain(killer, this.combatants);
      return;
    }

    if (victim.kind === 'minion') {
      if (victim.node) victim.node.visible = false;
      if (killer?.heroMeta) {
        killer.gold += 55;
        this._grantExp(killer, 95);
      }
      return;
    }

    // Hero Eliminated
    victim.deaths += 1;
    victim.streak = 0;
    victim.respawnTimer = RapsonyxCombatMath.computeCompoundRespawnSeconds(6, this.matchTimeSec);

    if (killer?.heroMeta && killer.team !== victim.team) {
      killer.kills += 1;
      killer.streak += 1;
      killer.gold += 260;
      this._grantExp(killer, 220);

      let banner = `${killer.name} mengeliminasi ${victim.name}`;
      if (!this.firstBloodAwarded) {
        this.firstBloodAwarded = true;
        if (killer.isPlayer) this.playerFirstBlood = true;
        banner = `FIRST BLOOD! ${banner}`;
      } else if (killer.streak === 2) banner = `DOUBLE KILL! ${killer.name}`;
      else if (killer.streak === 3) banner = `TRIPLE KILL! ${killer.name}`;
      else if (killer.streak === 4) banner = `QUADRA KILL! ${killer.name}`;
      else if (killer.streak >= 5) {
        if (killer.isPlayer) this.playerSavage = true;
        banner = `SAVAGE! ${killer.name}`;
      }
      const enemiesAlive = this.combatants.some((u) => u.alive && u.team === victim.team);
      if (!enemiesAlive && killer.isPlayer) this.playerTeamWipe = true;

      this.killFeed.unshift({ text: banner, team: killer.team, t: this.matchTimeSec });
      if (this.killFeed.length > 5) this.killFeed.pop();
      if (this.onEventBanner) this.onEventBanner(banner);
    }

    // In 1v1 Mist Duel, first to 3 kills wins cleanly if nexus isn't broken yet
    if (this.mapCfg.id === 'arena_mist_duel' && killer?.kills >= 3) {
      this._finishMatch(killer.team);
    }
  }

  _grantExp(heroUnit, amount) {
    if (heroUnit.level >= 15) return;
    heroUnit.exp += amount;
    let needed = RapsonyxCombatMath.getExpRequiredForNextLevel(heroUnit.level);
    while (heroUnit.level < 15 && heroUnit.exp >= needed) {
      heroUnit.exp -= needed;
      heroUnit.level += 1;
      this.recalculateUnitStats(heroUnit);
      heroUnit.hp = Math.min(heroUnit.maxHp, heroUnit.hp + 260);
      needed = RapsonyxCombatMath.getExpRequiredForNextLevel(heroUnit.level);
    }
  }

  _evaluateVictoryCondition() {
    const survivingFactions = this.structures
      .filter((s) => s.kind === 'base' && s.alive)
      .map((s) => s.team);
    if (survivingFactions.length === 1) {
      this._finishMatch(survivingFactions[0]);
    }
  }

  _finishMatch(winningTeam) {
    if (this.matchEnded) return;
    this.matchEnded = true;
    this.winningTeam = winningTeam;
    AudioDirector.playSfx('sfx_war_victory_fanfare', { volume: 0.95 });
    AudioDirector.playBgm('bgm_10_victory_fanfare');
    if (typeof this.onMatchFinish === 'function') {
      const sb = this.getScoreboard();
      const sorted = [...sb].sort((a, b) => b.mvpScore - a.mvpScore);
      const isMvp = sorted[0]?.isPlayer || false;
      this.onMatchFinish({
        winningTeam,
        isVictory: winningTeam === this.playerUnit?.team,
        durationSec: Math.round(this.matchTimeSec),
        scoreboard: sb,
        isMvp,
        playerStats: {
          heroId: this.playerUnit?.heroId || 'freya',
          arenaId: this.mapCfg?.id || 'arena_colosseum',
          kills: this.playerUnit?.kills || 0,
          deaths: this.playerUnit?.deaths || 0,
          assists: this.playerUnit?.assists || 0,
          isMvp,
          firstBlood: this.playerFirstBlood,
          shieldBreaks: this.playerShieldBreaks,
          savage: this.playerSavage,
          teamWipe: this.playerTeamWipe
        }
      });
    }
  }

  update(dt, physics = null) {
    if (this.matchEnded) return;
    this.matchTimeSec += dt;

    // Trigger Sudden Death at 240s
    if (!this.suddenDeathTriggered && this.matchTimeSec >= 240) {
      this.suddenDeathTriggered = true;
      AudioDirector.playBgm('bgm_06_sudden_death_choir');
      if (this.onEventBanner) this.onEventBanner('SUDDEN DEATH AKTIF! Fountain Dimatikan!');
    }

    // Update cooldowns, passive gold/sec & respawn
    for (let i = 0; i < this.combatants.length; i++) {
      const u = this.combatants[i];
      if (u.alive) {
        u.gold += dt * 4.2;
        u.mana = Math.min(u.maxMana, u.mana + dt * 12);
        if (!this.suddenDeathTriggered && u.position.distanceTo(u.spawnPos) < 9) {
          u.hp = Math.min(u.maxHp, u.hp + dt * 240);
          u.mana = Math.min(u.maxMana, u.mana + dt * 95);
        }
        for (let s = 1; s <= 3; s++) {
          if (u.skillCooldowns[s] > 0) u.skillCooldowns[s] = Math.max(0, u.skillCooldowns[s] - dt);
        }
        if (u.spellCooldown > 0) u.spellCooldown = Math.max(0, u.spellCooldown - dt);
        if (u.basicAtkCooldown > 0) u.basicAtkCooldown = Math.max(0, u.basicAtkCooldown - dt);
      } else {
        u.respawnTimer -= dt;
        if (u.respawnTimer <= 0) {
          u.alive = true;
          u.hp = u.maxHp;
          u.mana = u.maxMana;
          u.position.copy(u.spawnPos);
          if (u.node) u.node.position.copy(u.position);
        }
      }
    }

    // Structure Turret/Base Defense & Aggro Escalation
    for (let i = 0; i < this.structures.length; i++) {
      const st = this.structures[i];
      if (!st.alive) continue;
      if (st.shieldMesh && st.shieldMesh.visible) {
        st.shieldMesh.rotation.y += dt * 0.45;
        if (st.shieldMesh.material?.uniforms?.uTime) {
          st.shieldMesh.material.uniforms.uTime.value = this.matchTimeSec;
        }
      }
      st.attackCooldown = Math.max(0, st.attackCooldown - dt);
      if (st.attackCooldown > 0) continue;

      // Target minions first unless enemy hero hits friendly hero nearby; scale consecutive hero hits
      let target = this.minionAi.minions.find((m) => m.alive && m.team !== st.team && m.position.distanceTo(st.position) <= st.range);
      if (!target) {
        target = this.combatants.find((h) => h.alive && h.team !== st.team && h.position.distanceTo(st.position) <= st.range);
      }

      if (target) {
        st.attackCooldown = 1.15;
        if (target.heroMeta) {
          st.aggroStacks = target.id === st.aggroTargetId ? Math.min(4, st.aggroStacks + 1) : 1;
          st.aggroTargetId = target.id;
          if (target.isPlayer) AudioDirector.playSfx('sfx_turret_aggro_warn', { volume: 0.65 });
        } else {
          st.aggroStacks = 0;
        }
        const scale = 1 + st.aggroStacks * 0.35;
        this.vfx.spawnBasicAttackProjectile({
          originPos: st.position.clone().add(new THREE.Vector3(0, 4.5, 0)),
          targetPos: target.position,
          casterTeam: st.team,
          isRanged: true,
          speed: 32,
          onHit: () => this.applyDamageToTarget(st, target, 290 * scale, 'physical', false)
        });
      } else {
        st.aggroStacks = 0;
        st.aggroTargetId = null;
      }
    }

    // Step Minion Waves, Center Boss & Bot Heroes
    this.minionAi.update(dt, {
      combatants: this.combatants,
      structures: this.structures,
      physics,
      warController: this
    });
  }

  getScoreboard() {
    return this.combatants.map((u) => ({
      id: u.id,
      heroId: u.heroId,
      name: u.name,
      team: u.team,
      isPlayer: u.isPlayer,
      level: u.level,
      kills: u.kills,
      deaths: u.deaths,
      assists: u.assists,
      gold: Math.round(u.gold),
      mvpScore: Math.round(u.kills * 3 + u.assists * 1.5 - u.deaths * 1.2 + u.gold * 0.002)
    }));
  }

  dispose() {
    this.minionAi.dispose();
    for (const s of this.structures) {
      if (s.node && s.node.parent) {
        this.warGroup.remove(s.node);
        ResourceDisposer.disposeObject3D(s.node);
      }
    }
    this.structures = [];
    for (const u of this.combatants) {
      if (u.node && u.node.parent) {
        this.warGroup.remove(u.node);
        ResourceDisposer.disposeObject3D(u.node);
      }
    }
    this.combatants = [];
    this.playerUnit = null;
    if (this.warGroup.parent) {
      this.scene.remove(this.warGroup);
    }
  }
}

/**
 * RAPSONYX Authoritative Combat Math & CC Hierarchy Engine
 * - Deterministic defense curve: 120 / (120 + max(-60, EffDEF))
 * - FIFO Timed Shield Absorption + Lifesteal + Anti-Heal + True Damage + Crit
 * - Crowd Control Hierarchy: SUPPRESS > STUN > SILENCE > ROOT > SLOW
 */

import { EXP_CURVE_L1_TO_L15 } from '../config/constants.js';

export const CC_PRIORITY = Object.freeze({
  SUPPRESS: 5,
  AIRBORNE: 4,
  STUN: 4,
  SILENCE: 3,
  ROOT: 2,
  SLOW: 1
});

export class RapsonyxCombatMath {
  static computeEffectiveDefense(baseDef, flatPen = 0, pctPen = 0, shred = 0) {
    const afterShred = Math.max(-60, baseDef - shred);
    const afterPct = afterShred > 0 ? afterShred * Math.max(0, 1 - pctPen) : afterShred;
    return Math.max(-60, afterPct - flatPen);
  }

  static computeMitigationMultiplier(effDef) {
    const denom = 120 + Math.max(-60, effDef);
    return 120 / denom;
  }

  static calculateDamage({
    rawDamage = 100,
    damageType = 'physical', // 'physical' | 'magic' | 'true'
    attacker = {},
    defender = {},
    canCrit = false,
    critChance = 0,
    critMultiplier = 1.75,
    isAoE = false
  }) {
    if (defender.invulnerable) {
      return { finalDamage: 0, hpDamage: 0, shieldAbsorbed: 0, isCrit: false, healAmount: 0 };
    }

    let dmg = Math.max(0, rawDamage);
    let isCrit = false;

    if (canCrit && Math.random() < Math.min(0.95, critChance)) {
      isCrit = true;
      dmg *= attacker.critDamageBonus ? critMultiplier + attacker.critDamageBonus : critMultiplier;
    }

    let mitigated = dmg;
    if (damageType === 'physical') {
      const effDef = RapsonyxCombatMath.computeEffectiveDefense(
        defender.def ?? 25,
        attacker.flatPhysPen ?? 0,
        attacker.pctPhysPen ?? 0,
        defender.physShred ?? 0
      );
      mitigated = dmg * RapsonyxCombatMath.computeMitigationMultiplier(effDef);
    } else if (damageType === 'magic') {
      const effMdef = RapsonyxCombatMath.computeEffectiveDefense(
        defender.mdef ?? 22,
        attacker.flatMagPen ?? 0,
        attacker.pctMagPen ?? 0,
        defender.magShred ?? 0
      );
      mitigated = dmg * RapsonyxCombatMath.computeMitigationMultiplier(effMdef);
    }

    // Damage reduction modifiers (e.g. Warrior Aegis buff or Turret 2-stage guard)
    const dmgReduce = Math.min(0.85, defender.damageReduction || 0);
    const finalDamage = Math.max(1, Math.round(mitigated * (1 - dmgReduce)));

    // FIFO Shield absorption
    let remaining = finalDamage;
    let shieldAbsorbed = 0;
    if (Array.isArray(defender.shields)) {
      for (let i = 0; i < defender.shields.length && remaining > 0; i++) {
        const s = defender.shields[i];
        if (s.amount <= 0) continue;
        const absorb = Math.min(s.amount, remaining);
        s.amount -= absorb;
        remaining -= absorb;
        shieldAbsorbed += absorb;
      }
      defender.shields = defender.shields.filter((s) => s.amount > 0 && s.expiresAt > performance.now());
    }

    const hpDamage = Math.max(0, remaining);

    // Lifesteal / Spell Vamp calculation (50% ratio on AoE skills)
    let healAmount = 0;
    if (hpDamage > 0) {
      const drainRate = damageType === 'physical' ? (attacker.lifesteal || 0) : (attacker.spellVamp || 0);
      const aoeScale = isAoE ? 0.5 : 1.0;
      const antiHeal = attacker.antiHealFactor ? 1 - attacker.antiHealFactor : 1.0;
      healAmount = Math.round(hpDamage * drainRate * aoeScale * antiHeal);
    }

    return { finalDamage, hpDamage, shieldAbsorbed, isCrit, healAmount };
  }

  static applyShield(unit, amount, durationMs = 3000, sourceId = 'skill') {
    if (!unit.shields) unit.shields = [];
    unit.shields.push({
      id: sourceId,
      amount: Math.max(0, Math.round(amount)),
      expiresAt: performance.now() + durationMs
    });
  }

  static getTotalShield(unit, nowMs = performance.now()) {
    if (!Array.isArray(unit.shields) || unit.shields.length === 0) return 0;
    let total = 0;
    for (let i = 0; i < unit.shields.length; i++) {
      if (unit.shields[i].expiresAt > nowMs) total += unit.shields[i].amount;
    }
    return Math.round(total);
  }

  static applyCrowdControl(unit, type, durationSec, magnitude = 0.3) {
    if (unit.ccImmune || unit.invulnerable) return false;
    const tenacity = Math.min(0.5, unit.tenacity || 0);
    const actualDur = type === 'SUPPRESS' ? durationSec : durationSec * (1 - tenacity);
    if (!unit.ccs) unit.ccs = [];
    unit.ccs.push({
      type,
      priority: CC_PRIORITY[type] || 1,
      magnitude,
      expiresAt: performance.now() + actualDur * 1000
    });
    return true;
  }

  static cleanseCrowdControl(unit) {
    if (!Array.isArray(unit.ccs)) return;
    // SUPPRESS cannot be cleansed except by Ultimate cleanse; standard Purify clears STUN/SILENCE/ROOT/SLOW
    unit.ccs = unit.ccs.filter((c) => c.type === 'SUPPRESS');
  }

  static getHighestActiveCC(unit, nowMs = performance.now()) {
    if (!Array.isArray(unit.ccs)) return null;
    unit.ccs = unit.ccs.filter((c) => c.expiresAt > nowMs);
    let top = null;
    for (let i = 0; i < unit.ccs.length; i++) {
      if (!top || unit.ccs[i].priority > top.priority) top = unit.ccs[i];
    }
    return top;
  }

  static getExpRequiredForNextLevel(level) {
    if (level >= 15) return Infinity;
    return EXP_CURVE_L1_TO_L15[Math.max(0, Math.min(13, level - 1))];
  }

  static computeCompoundRespawnSeconds(baseSeconds, elapsedMatchSeconds) {
    // Compound scaling (+12%/min) kicks in after minute 3
    const overtimeMinutes = Math.max(0, elapsedMatchSeconds / 60 - 3);
    return Math.min(68, Math.round(baseSeconds * Math.pow(1.12, overtimeMinutes)));
  }

  /**
   * Squared distance from point (px, pz) to swept XZ segment (ax, az) -> (bx, bz).
   * Used for continuous per-millisecond swept-segment collision without tunneling.
   */
  static distPointToSegmentSqXZ(px, pz, ax, az, bx, bz) {
    const abx = bx - ax;
    const abz = bz - az;
    const apx = px - ax;
    const apz = pz - az;
    const lenSq = abx * abx + abz * abz;
    if (lenSq < 1e-6) {
      return apx * apx + apz * apz;
    }
    const t = Math.max(0, Math.min(1, (apx * abx + apz * abz) / lenSq));
    const cx = ax + abx * t;
    const cz = az + abz * t;
    const dx = px - cx;
    const dz = pz - cz;
    return dx * dx + dz * dz;
  }
}

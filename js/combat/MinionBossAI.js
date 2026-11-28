/**
 * RAPSONYX Minion Wave Spawner, Jungle Bosses & Bot Hero AI
 * - Spawns Minion Melee, Ranged, Siege every 26s per active faction
 * - Spawns Boss Crystal Golem / Dragon / Phoenix with AoE slam warning & team buff rewards
 * - Drives ally/enemy AI bots with kiting, retreat, auto-shop & skill casting
 */

import * as THREE from 'three';
import { AssetRegistry } from '../core/AssetRegistry.js';
import { AudioDirector } from '../core/AudioDirector.js';
import { ResourceDisposer } from '../core/ResourceDisposer.js';
import { TEAM_CONFIG } from '../config/constants.js';
import { getRecommendedBuildForArchetype } from './ItemsSpellsEmblems.js';

export class MinionBossAI {
  constructor(scene, renderer, vfxDirector) {
    this.scene = scene;
    this.renderer = renderer;
    this.vfx = vfxDirector;

    this.aiGroup = new THREE.Group();
    this.aiGroup.name = 'RAPSONYX_AI_MINIONS_BOSS';

    this.factions = [];
    this.getFactionPoint = null;
    this.minions = [];
    this.boss = null;
    this.waveTimer = 2.0; // First wave marches quickly at 2s
    this.minionSeq = 0;
  }

  configure({ factions, getFactionPointFn }) {
    this.dispose();
    if (!this.aiGroup.parent) this.scene.add(this.aiGroup);
    this.factions = [...factions];
    this.getFactionPoint = getFactionPointFn;
    this.waveTimer = 2.0;
  }

  async spawnCenterBoss(pos) {
    const bossAliases = ['boss_dragon', 'boss_phoenix', 'boss_crystal_golem'];
    const alias = bossAliases[Math.floor(Math.random() * bossAliases.length)];
    let node = null;
    try {
      const gltf = await AssetRegistry.loadGLTF(alias, this.renderer);
      node = gltf.scene.clone();
      node.scale.setScalar(1.55);
    } catch (_) {
      node = new THREE.Mesh(
        new THREE.DodecahedronGeometry(2.4, 0),
        new THREE.MeshStandardMaterial({ color: 0xf7b955, emissive: 0xb45309, emissiveIntensity: 0.65 })
      );
      node.position.y = 2.4;
    }

    node.position.copy(pos);
    this.aiGroup.add(node);

    this.boss = {
      id: 'boss_sovereign',
      kind: 'boss',
      name: 'Penjaga Sovereign',
      team: 'neutral',
      position: pos.clone(),
      hp: 6200,
      maxHp: 6200,
      def: 42,
      mdef: 38,
      alive: true,
      atkCooldown: 0,
      slamCooldown: 8.0,
      node
    };
    AudioDirector.playSfx('sfx_boss_roar', { worldPos: pos, volume: 0.72 });
  }

  onBossSlain(killer, combatants) {
    if (this.boss?.node) this.boss.node.visible = false;
    if (!killer?.team) return;
    for (const u of combatants) {
      if (u.team === killer.team) {
        u.gold += 300;
        u.atk += 28;
        u.mag += 36;
        u.hp = Math.min(u.maxHp, u.hp + 500);
      }
    }
  }

  _spawnWave() {
    if (!this.getFactionPoint || this.factions.length < 2) return;
    const types = [
      { kind: 'melee', hp: 520, atk: 38, range: 2.2 },
      { kind: 'melee', hp: 520, atk: 38, range: 2.2 },
      { kind: 'ranged', hp: 380, atk: 46, range: 7.5 },
      { kind: 'siege', hp: 920, atk: 68, range: 8.5 }
    ];

    for (const faction of this.factions) {
      const origin = this.getFactionPoint(faction, 'turret');
      const color = (TEAM_CONFIG[faction] || TEAM_CONFIG.team_dream).colorInt;
      for (let i = 0; i < types.length; i++) {
        const spec = types[i];
        const mPos = origin.clone();
        mPos.x += (i - 1.5) * 2.1;
        mPos.z += (i % 2 === 0 ? 1.5 : -1.5);

        const mesh = new THREE.Mesh(
          new THREE.ConeGeometry(spec.kind === 'siege' ? 0.55 : 0.36, spec.kind === 'siege' ? 1.2 : 0.9, 6),
          new THREE.MeshStandardMaterial({ color, roughness: 0.55 })
        );
        mesh.position.set(mPos.x, mPos.y + 0.5, mPos.z);
        this.aiGroup.add(mesh);

        this.minions.push({
          id: `mn_${this.minionSeq++}`,
          kind: 'minion',
          subType: spec.kind,
          team: faction,
          position: mPos,
          hp: spec.hp,
          maxHp: spec.hp,
          def: 12,
          mdef: 10,
          atk: spec.atk,
          atkRange: spec.range,
          atkCooldown: 0,
          alive: true,
          node: mesh
        });
      }
    }
  }

  update(dt, { combatants, structures, physics, warController }) {
    this.waveTimer -= dt;
    if (this.waveTimer <= 0) {
      this.waveTimer = 26.0;
      this._spawnWave();
    }

    // Cull dead minions periodically
    for (let i = this.minions.length - 1; i >= 0; i--) {
      const mn = this.minions[i];
      if (!mn.alive) {
        if (mn.node && mn.node.parent) {
          this.aiGroup.remove(mn.node);
          ResourceDisposer.disposeObject3D(mn.node);
        }
        this.minions.splice(i, 1);
        continue;
      }

      mn.atkCooldown = Math.max(0, mn.atkCooldown - dt);
      // Acquire target: enemy minion -> enemy turret/base -> enemy hero -> march to center/enemy base
      let target = this.minions.find((o) => o.alive && o.team !== mn.team && o.position.distanceTo(mn.position) <= mn.atkRange + 6);
      if (!target) {
        target = structures.find((s) => s.alive && !s.invulnerable && s.team !== mn.team && s.position.distanceTo(mn.position) <= mn.atkRange + 10);
      }
      if (!target) {
        target = combatants.find((h) => h.alive && h.team !== mn.team && h.position.distanceTo(mn.position) <= mn.atkRange + 5);
      }

      if (target) {
        const dist = target.position.distanceTo(mn.position);
        if (dist > mn.atkRange) {
          const dir = target.position.clone().sub(mn.position).setY(0).normalize();
          mn.position.addScaledVector(dir, 4.2 * dt);
        } else if (mn.atkCooldown <= 0) {
          mn.atkCooldown = 1.25;
          warController.applyDamageToTarget(mn, target, mn.atk, 'physical', false);
        }
      } else {
        // March toward center then hostile structure
        const marchPt = new THREE.Vector3(0, 0, 0);
        if (mn.position.length() < 12) {
          const enemyBase = structures.find((s) => s.alive && s.team !== mn.team);
          if (enemyBase) marchPt.copy(enemyBase.position);
        }
        const dir = marchPt.sub(mn.position).setY(0);
        if (dir.lengthSq() > 0.2) {
          dir.normalize();
          mn.position.addScaledVector(dir, 4.4 * dt);
        }
      }

      if (physics) {
        mn.position.y = physics.getHeightAt(mn.position.x, mn.position.z, mn.position.y);
      }
      if (mn.node) mn.node.position.set(mn.position.x, mn.position.y + 0.5, mn.position.z);
    }

    // Step AI Hero Bots (all non-player combatants)
    for (let i = 0; i < combatants.length; i++) {
      const bot = combatants[i];
      if (bot.isPlayer || !bot.alive) continue;

      // Auto-purchase optimal build items when gold >= 1200
      if (bot.items.length < 6 && bot.gold >= 2200) {
        const plan = getRecommendedBuildForArchetype(bot.heroMeta.archetype);
        const nextItemId = plan[bot.items.length];
        if (nextItemId) warController.buyItemForUnit(bot, nextItemId);
      }

      // Retreat if HP < 24%
      if (bot.hp < bot.maxHp * 0.24) {
        const toSpawn = bot.spawnPos.clone().sub(bot.position).setY(0);
        if (toSpawn.length() > 3) {
          toSpawn.normalize();
          bot.position.addScaledVector(toSpawn, bot.spd * dt);
        }
      } else {
        const target = warController.findBestTarget(bot, 'auto');
        if (target) {
          const dist = target.position.distanceTo(bot.position);
          const dir = target.position.clone().sub(bot.position).setY(0);
          if (dir.lengthSq() > 1e-4) {
            dir.normalize();
            bot.facingYaw = Math.atan2(dir.x, dir.z);
          }

          if (dist > bot.atkRange * 0.88) {
            bot.position.addScaledVector(dir, bot.spd * dt);
          } else {
            // Try casting skills then basic attack
            if (bot.skillCooldowns[3] <= 0 && target.heroMeta) {
              warController.castSkill(bot, 3, target.position);
            } else if (bot.skillCooldowns[1] <= 0) {
              warController.castSkill(bot, 1, target.position);
            } else {
              warController.performBasicAttack(bot, target, 'auto');
            }
          }
        } else {
          // Advance toward center arena engagement zone
          const centerOffset = new THREE.Vector3(Math.sin(i * 2.1) * 14, 0, Math.cos(i * 2.1) * 14);
          const toCenter = centerOffset.sub(bot.position).setY(0);
          if (toCenter.length() > 4) {
            toCenter.normalize();
            bot.facingYaw = Math.atan2(toCenter.x, toCenter.z);
            bot.position.addScaledVector(toCenter, bot.spd * 0.9 * dt);
          }
        }
      }

      if (physics) {
        physics.resolveMovement(bot.position, 0.42, bot.position.y);
        bot.position.y = physics.getHeightAt(bot.position.x, bot.position.z, bot.position.y);
      }
      if (bot.node) {
        bot.node.position.copy(bot.position);
        bot.node.rotation.y = bot.facingYaw;
      }
    }

    // Center Boss Defense AI
    if (this.boss && this.boss.alive) {
      this.boss.atkCooldown = Math.max(0, this.boss.atkCooldown - dt);
      this.boss.slamCooldown = Math.max(0, this.boss.slamCooldown - dt);
      const nearest = combatants.find((h) => h.alive && h.position.distanceTo(this.boss.position) <= 11);
      if (nearest && this.boss.atkCooldown <= 0) {
        this.boss.atkCooldown = 1.65;
        warController.applyDamageToTarget(this.boss, nearest, 185, 'physical', false);
        if (this.boss.slamCooldown <= 0) {
          this.boss.slamCooldown = 8.5;
          this.vfx.spawnRingBurst(this.boss.position, 0xff5a5a, 7.5, 0.55);
          for (const h of combatants) {
            if (h.alive && h.position.distanceTo(this.boss.position) <= 7.5) {
              warController.applyDamageToTarget(this.boss, h, 310, 'magic', false, true);
            }
          }
        }
      }
    }
  }

  dispose() {
    for (const mn of this.minions) {
      if (mn.node && mn.node.parent) {
        this.aiGroup.remove(mn.node);
        ResourceDisposer.disposeObject3D(mn.node);
      }
    }
    this.minions = [];
    if (this.boss?.node && this.boss.node.parent) {
      this.aiGroup.remove(this.boss.node);
      ResourceDisposer.disposeObject3D(this.boss.node);
    }
    this.boss = null;
    if (this.aiGroup.parent) {
      this.scene.remove(this.aiGroup);
    }
  }
}

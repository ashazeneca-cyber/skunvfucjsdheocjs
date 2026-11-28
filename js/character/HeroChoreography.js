/**
 * RAPSONYX Lobby Stand Snap & Hero Signature Choreography
 * - Loads custom stand3d_* pedestal per hero using stand_foot_calibration_42.json
 * - Snaps hero cleanly atop pedestal deck so feet touch stand top flush (no sinking/floating)
 * - Runs subtle 8-phase idle showcase & turntable rotation
 */

import * as THREE from 'three';
import { AssetRegistry } from '../core/AssetRegistry.js';
import { ResourceDisposer } from '../core/ResourceDisposer.js';
import { TEAM_CONFIG } from '../config/constants.js';
import { RapsonyxWorldShader } from '../shaders/RapsonyxWorldShader.js';

export class HeroChoreography {
  constructor(scene) {
    this.scene = scene;
    this.showcaseRoot = new THREE.Group();
    this.showcaseRoot.name = 'RAPSONYX_LOBBY_SHOWCASE';
    this.standNode = null;
    this.ringMesh = null;
    this.standCalib = null;
    this.pedestalTopY = 0.25;
    this.elapsed = 0;
    this.turnAngle = 0;
    this.isDraggingTurn = false;
  }

  async loadCalibrations() {
    if (this.standCalib) return this.standCalib;
    try {
      this.standCalib = await AssetRegistry.fetchAssetJson('calib_foot_stands', { cachePackId: 'pkg_starter' });
    } catch (_) {
      this.standCalib = {};
    }
    return this.standCalib;
  }

  async mountStandForHero(heroMeta, rigController, renderer) {
    await this.loadCalibrations();
    this.disposeStand();

    if (!this.showcaseRoot.parent) {
      this.scene.add(this.showcaseRoot);
    }

    const teamCfg = TEAM_CONFIG[heroMeta.team] || TEAM_CONFIG.team_dream;
    let standScene = null;
    try {
      const gltf = await AssetRegistry.loadGLTF(heroMeta.standPath, renderer, {
        cachePackId: heroMeta.id === 'freya' ? 'pkg_starter' : `hero_${heroMeta.id}`
      });
      standScene = gltf.scene;
    } catch (_) {
      standScene = null;
    }

    if (standScene) {
      RapsonyxWorldShader.normalizeWorldMaterials(standScene, false);
      standScene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(standScene);
      const size = new THREE.Vector3();
      box.getSize(size);
      // Normalize stand diameter cleanly around ~2.8m
      const horiz = Math.max(0.5, size.x, size.z);
      const scale = 2.8 / horiz;
      standScene.scale.multiplyScalar(scale);
      standScene.updateMatrixWorld(true);
      const box2 = new THREE.Box3().setFromObject(standScene);
      standScene.position.y -= box2.min.y;
      standScene.updateMatrixWorld(true);
      const box3 = new THREE.Box3().setFromObject(standScene);

      const calibEntry = this.standCalib?.[heroMeta.id] || this.standCalib?.stands?.[heroMeta.id] || {};
      this.pedestalTopY = calibEntry.topY ?? Math.min(0.65, box3.max.y * 0.48);

      standScene.traverse((o) => {
        if (o.isMesh) {
          o.receiveShadow = true;
          o.castShadow = false;
        }
      });
      this.standNode = standScene;
      this.showcaseRoot.add(standScene);
    } else {
      const fallbackStand = new THREE.Mesh(
        new THREE.CylinderGeometry(1.35, 1.55, 0.24, 32),
        new THREE.MeshStandardMaterial({ color: 0x1e2538, roughness: 0.35, metalness: 0.45 })
      );
      fallbackStand.position.y = 0.12;
      fallbackStand.receiveShadow = true;
      this.pedestalTopY = 0.24;
      this.standNode = fallbackStand;
      this.showcaseRoot.add(fallbackStand);
    }

    // Illuminated faction aura ring around pedestal base
    const ringGeo = new THREE.RingGeometry(1.36, 1.48, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: teamCfg.colorInt,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide
    });
    this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.ringMesh.position.y = 0.03;
    this.showcaseRoot.add(this.ringMesh);

    if (rigController) {
      rigController.container.position.set(0, this.pedestalTopY + 0.18, 0);
      rigController.container.rotation.y = this.turnAngle;
      if (rigController.container.parent !== this.showcaseRoot) {
        this.showcaseRoot.add(rigController.container);
      }
      this.entranceTimer = 0.65;
      this.fidgetCooldown = 7.5;
      this.fidgetActiveTimer = 0;
    }
  }

  rotateTurntable(deltaX) {
    this.turnAngle += deltaX * 0.01;
  }

  triggerTapReaction(rigController, facialDirector, vfxDirector = null) {
    if (rigController) {
      rigController.triggerUpperBodyAction('HAPPY_INTERACT', 1.35);
    }
    if (facialDirector) {
      facialDirector.triggerTapReaction();
    }
    if (vfxDirector && rigController) {
      vfxDirector.spawnSkillCastEffect(rigController.container.position, '#38bdf8', 'HAPPY');
    }
  }

  playSkillPreview(slot, rigController, facialDirector, vfxDirector = null, teamColorHex = '#38bdf8') {
    const map = { s1: 'SKILL_1', s2: 'SKILL_2', ult: 'ULTIMATE' };
    const actionType = map[slot] || 'SKILL_1';
    if (rigController) {
      rigController.triggerUpperBodyAction(actionType, slot === 'ult' ? 1.15 : 0.72);
    }
    if (facialDirector) {
      facialDirector.setExpression('focused', 1.5);
    }
    if (vfxDirector && rigController) {
      const origin = rigController.container.position.clone().add(new THREE.Vector3(0, 1.05, 0));
      const fwd = new THREE.Vector3(Math.sin(this.turnAngle), 0, Math.cos(this.turnAngle));
      if (slot === 'ult') {
        vfxDirector.spawnTrackedSkillInstance({
          origin,
          direction: fwd,
          mode: 'ground_zone',
          radius: 3.4,
          duration: 1.4,
          colorHex: teamColorHex
        });
      } else {
        vfxDirector.spawnTrackedSkillInstance({
          origin,
          direction: fwd,
          mode: 'line',
          speed: 9.5,
          duration: 0.75,
          radius: 0.75,
          colorHex: teamColorHex
        });
      }
    }
  }

  updateShowcase(dt, rigController, facialDirector) {
    this.elapsed += dt;
    if (!rigController) return;

    let dropY = 0;
    if (this.entranceTimer > 0) {
      this.entranceTimer = Math.max(0, this.entranceTimer - dt);
      dropY = Math.pow(this.entranceTimer / 0.65, 2) * 0.22;
    }

    this.fidgetCooldown -= dt;
    if (this.fidgetCooldown <= 0) {
      this.fidgetActiveTimer = 2.6;
      this.fidgetCooldown = 8.0 + Math.random() * 5.0;
    }
    const isFidget = this.fidgetActiveTimer > 0;
    if (this.fidgetActiveTimer > 0) this.fidgetActiveTimer = Math.max(0, this.fidgetActiveTimer - dt);

    rigController.container.position.set(0, this.pedestalTopY + dropY, 0);
    rigController.container.rotation.y = THREE.MathUtils.lerp(rigController.container.rotation.y, this.turnAngle, Math.min(1, dt * 10));

    if (this.ringMesh) {
      const pulse = 1 + Math.sin(this.elapsed * 2.2) * 0.03;
      this.ringMesh.scale.set(pulse, 1, pulse);
    }

    rigController.updateAnimation(dt, 0, false, false, false, { isFidget });
    if (facialDirector) {
      facialDirector.update(rigController, dt, { enableLookAt: true, enableRandomMoods: true });
    }
  }

  disposeStand() {
    if (this.standNode) {
      this.showcaseRoot.remove(this.standNode);
      ResourceDisposer.disposeObject3D(this.standNode);
      this.standNode = null;
    }
    if (this.ringMesh) {
      this.showcaseRoot.remove(this.ringMesh);
      ResourceDisposer.disposeObject3D(this.ringMesh);
      this.ringMesh = null;
    }
  }

  dispose() {
    this.disposeStand();
    if (this.showcaseRoot.parent) {
      this.scene.remove(this.showcaseRoot);
    }
  }
}

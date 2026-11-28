/**
 * RAPSONYX Post-Processing Pipeline
 * - Selective HDR Bloom (HalfFloatType MSAA target, threshold = 1.06, strength = 0.36, radius = 0.55)
 * - Direct renderer fallback when Bloom is off (LOW / MEDIUM / Battery Saver)
 * - OutputPass tone-mapping finalization
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export class PostProcessingPipeline {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.composer = null;
    this.renderPass = null;
    this.bloomPass = null;
    this.outputPass = null;
    this.enabled = false;
  }

  configure({ width = 1280, height = 720, enableBloom = false } = {}) {
    this.enabled = Boolean(enableBloom);
    if (!this.enabled) {
      this.dispose();
      return;
    }

    if (!this.composer) {
      const rt = new THREE.WebGLRenderTarget(width, height, {
        type: THREE.HalfFloatType,
        samples: 4
      });
      this.composer = new EffectComposer(this.renderer, rt);
      this.renderPass = new RenderPass(this.scene, this.camera);
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.36,
        0.55,
        1.06
      );
      this.outputPass = new OutputPass();

      this.composer.addPass(this.renderPass);
      this.composer.addPass(this.bloomPass);
      this.composer.addPass(this.outputPass);
    } else {
      this.resize(width, height);
    }
  }

  setSceneAndCamera(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    if (this.renderPass) {
      this.renderPass.scene = scene;
      this.renderPass.camera = camera;
    }
  }

  resize(width, height) {
    if (this.composer) {
      this.composer.setSize(width, height);
    }
    if (this.bloomPass) {
      this.bloomPass.setSize(width, height);
    }
  }

  render() {
    if (this.enabled && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    if (this.composer) {
      try {
        this.composer.renderTarget1?.dispose();
        this.composer.renderTarget2?.dispose();
        this.bloomPass?.dispose?.();
      } catch (_) {}
      this.composer = null;
      this.renderPass = null;
      this.bloomPass = null;
      this.outputPass = null;
    }
  }
}

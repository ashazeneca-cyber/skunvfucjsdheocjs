/**
 * RAPSONYX Strict GPU & Memory Resource Disposer
 * Protects mobile & iOS Safari tab memory ceiling (~300 MB) when switching heroes or worlds.
 */

const TEXTURE_KEYS = [
  'map',
  'alphaMap',
  'aoMap',
  'bumpMap',
  'displacementMap',
  'emissiveMap',
  'envMap',
  'lightMap',
  'metalnessMap',
  'normalMap',
  'roughnessMap',
  'specularMap'
];

export class ResourceDisposer {
  static disposeTexture(tex) {
    if (!tex) return;
    try {
      if (tex.source && tex.source.data && typeof tex.source.data.close === 'function') {
        tex.source.data.close();
      }
    } catch (_) {}
    try {
      tex.dispose();
    } catch (_) {}
  }

  static disposeMaterial(mat) {
    if (!mat) return;
    if (Array.isArray(mat)) {
      for (const m of mat) ResourceDisposer.disposeMaterial(m);
      return;
    }
    for (const key of TEXTURE_KEYS) {
      if (mat[key]) {
        ResourceDisposer.disposeTexture(mat[key]);
        mat[key] = null;
      }
    }
    if (mat.uniforms) {
      for (const u of Object.values(mat.uniforms)) {
        if (u && u.value && u.value.isTexture) {
          ResourceDisposer.disposeTexture(u.value);
          u.value = null;
        }
      }
    }
    try {
      mat.dispose();
    } catch (_) {}
  }

  static disposeObject3D(root) {
    if (!root) return;
    root.traverse((obj) => {
      if (obj.geometry && typeof obj.geometry.dispose === 'function') {
        obj.geometry.dispose();
      }
      if (obj.material) {
        ResourceDisposer.disposeMaterial(obj.material);
      }
      if (obj.skeleton && typeof obj.skeleton.dispose === 'function') {
        obj.skeleton.dispose();
      }
    });
    if (root.parent) {
      root.parent.remove(root);
    }
  }

  static disposeHero(heroContainer, mixer = null) {
    if (mixer) {
      try {
        mixer.stopAllAction();
        if (heroContainer) mixer.uncacheRoot(heroContainer);
      } catch (_) {}
    }
    if (heroContainer) {
      ResourceDisposer.disposeObject3D(heroContainer);
    }
  }

  static disposeSceneTree(scene, renderer = null, composer = null) {
    if (scene) {
      const children = [...scene.children];
      for (const child of children) {
        ResourceDisposer.disposeObject3D(child);
      }
      if (scene.environment && scene.environment.isTexture) {
        ResourceDisposer.disposeTexture(scene.environment);
        scene.environment = null;
      }
      if (scene.background && scene.background.isTexture) {
        ResourceDisposer.disposeTexture(scene.background);
        scene.background = null;
      }
    }
    if (composer) {
      try {
        if (composer.renderTarget1) composer.renderTarget1.dispose();
        if (composer.renderTarget2) composer.renderTarget2.dispose();
      } catch (_) {}
    }
    if (renderer && renderer.renderLists) {
      try {
        renderer.renderLists.dispose();
      } catch (_) {}
    }
  }
}

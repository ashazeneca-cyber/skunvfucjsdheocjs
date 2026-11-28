/**
 * RAPSONYX Dual-Layer Persistent Local Cache
 * IndexedDB: rapsonyx-db (object stores: blobs, meta)
 * Cache Storage API: rapsonyx-cache
 */

import { RAPSONYX_VERSION } from '../config/constants.js';

export const DB_NAME = 'rapsonyx-db';
export const DB_VERSION = 1;
export const CACHE_API_NAME = 'rapsonyx-cache';

class LocalAssetCacheService {
  constructor() {
    this.db = null;
    this.cacheStorage = null;
    this.memoryIndex = new Map();
    this.memoryBlobs = new Map();
    this._initPromise = null;
  }

  async init() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = (async () => {
      if (typeof indexedDB !== 'undefined') {
        this.db = await new Promise((resolve) => {
          const req = indexedDB.open(DB_NAME, DB_VERSION);
          req.onupgradeneeded = (ev) => {
            const db = ev.target.result;
            if (!db.objectStoreNames.contains('blobs')) {
              const store = db.createObjectStore('blobs', { keyPath: 'key' });
              store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
              store.createIndex('pinned', 'pinned', { unique: false });
              store.createIndex('packId', 'packId', { unique: false });
            }
            if (!db.objectStoreNames.contains('meta')) {
              db.createObjectStore('meta', { keyPath: 'key' });
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        });
      }

      if (typeof caches !== 'undefined') {
        try {
          this.cacheStorage = await caches.open(CACHE_API_NAME);
        } catch (_) {
          this.cacheStorage = null;
        }
      }

      await this._rebuildMemoryIndex();
      await this._checkManifestVersion();
      return true;
    })();
    return this._initPromise;
  }

  async _checkManifestVersion() {
    if (!this.db) return;
    const ver = await this.getMeta('manifestVersion');
    if (!ver) {
      await this.setMeta('manifestVersion', RAPSONYX_VERSION);
    } else if (ver !== RAPSONYX_VERSION) {
      await this.setMeta('manifestVersion', RAPSONYX_VERSION);
    }
  }

  async _rebuildMemoryIndex() {
    this.memoryIndex.clear();
    if (!this.db) return;
    await new Promise((resolve) => {
      const tx = this.db.transaction('blobs', 'readonly');
      const store = tx.objectStore('blobs');
      const req = store.openCursor();
      req.onsuccess = (ev) => {
        const cursor = ev.target.result;
        if (!cursor) {
          resolve();
          return;
        }
        const rec = cursor.value;
        this.memoryIndex.set(rec.key, {
          key: rec.key,
          sizeBytes: rec.sizeBytes || 0,
          pinned: Boolean(rec.pinned),
          packId: rec.packId || 'misc',
          contentType: rec.contentType || 'application/octet-stream',
          lastAccessed: rec.lastAccessed || 0
        });
        cursor.continue();
      };
      req.onerror = () => resolve();
    });
  }

  async getMeta(key) {
    if (!this.db) return null;
    return new Promise((resolve) => {
      const tx = this.db.transaction('meta', 'readonly');
      const req = tx.objectStore('meta').get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => resolve(null);
    });
  }

  async setMeta(key, value) {
    if (!this.db) return false;
    return new Promise((resolve) => {
      const tx = this.db.transaction('meta', 'readwrite');
      tx.objectStore('meta').put({ key, value, updatedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  has(key) {
    return this.memoryIndex.has(key);
  }

  hasAll(keys) {
    if (!Array.isArray(keys) || keys.length === 0) return false;
    for (const k of keys) {
      if (!this.memoryIndex.has(k)) return false;
    }
    return true;
  }

  getPackStatus(keys) {
    if (!Array.isArray(keys) || keys.length === 0) {
      return { complete: true, cachedCount: 0, totalCount: 0, cachedBytes: 0 };
    }
    let cachedCount = 0;
    let cachedBytes = 0;
    for (const k of keys) {
      const meta = this.memoryIndex.get(k);
      if (meta) {
        cachedCount++;
        cachedBytes += meta.sizeBytes || 0;
      }
    }
    return {
      complete: cachedCount === keys.length,
      cachedCount,
      totalCount: keys.length,
      cachedBytes
    };
  }

  async get(key) {
    await this.init();
    if (this.memoryBlobs.has(key)) {
      return this.memoryBlobs.get(key);
    }
    if (!this.db) {
      if (this.cacheStorage) {
        try {
          const res = await this.cacheStorage.match(`/cdn/${key}`);
          if (res) return res.arrayBuffer();
        } catch (_) {}
      }
      return null;
    }

    const record = await new Promise((resolve) => {
      try {
        const tx = this.db.transaction('blobs', 'readonly');
        const req = tx.objectStore('blobs').get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });

    if (record && record.blob) {
      const now = Date.now();
      const meta = this.memoryIndex.get(key);
      if (meta) meta.lastAccessed = now;
      try {
        const tx = this.db.transaction('blobs', 'readwrite');
        tx.objectStore('blobs').put({ ...record, lastAccessed: now });
      } catch (_) {}
      return record.blob;
    }

    if (this.cacheStorage) {
      try {
        const res = await this.cacheStorage.match(`/cdn/${key}`);
        if (res) return res.arrayBuffer();
      } catch (_) {}
    }
    return null;
  }

  async set(key, arrayBuffer, options = {}) {
    await this.init();
    const {
      pinned = false,
      packId = 'misc',
      contentType = 'application/octet-stream',
      etag = ''
    } = options;
    const sizeBytes = arrayBuffer.byteLength || 0;
    await this.evictLruIfNeeded(sizeBytes);

    const record = {
      key,
      blob: arrayBuffer,
      sizeBytes,
      pinned: Boolean(pinned),
      packId,
      contentType,
      etag,
      lastAccessed: Date.now()
    };

    let storedPersistent = false;
    if (this.db) {
      storedPersistent = await new Promise((resolve) => {
        try {
          const tx = this.db.transaction('blobs', 'readwrite');
          tx.objectStore('blobs').put(record);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (_) {
          resolve(false);
        }
      });
    }

    if (this.cacheStorage) {
      try {
        const res = new Response(arrayBuffer.slice(0), {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Rapsonyx-Status': 'HIT-LOCAL'
          }
        });
        await this.cacheStorage.put(`/cdn/${key}`, res);
        storedPersistent = true;
      } catch (_) {}
    }

    // Incognito / tight quota fallback keeps critical assets usable in RAM
    if (!storedPersistent || sizeBytes <= 2 * 1024 * 1024) {
      this.memoryBlobs.set(key, arrayBuffer);
    }

    this.memoryIndex.set(key, {
      key,
      sizeBytes,
      pinned: Boolean(pinned),
      packId,
      contentType,
      lastAccessed: record.lastAccessed
    });
    return true;
  }

  async delete(key) {
    await this.init();
    const meta = this.memoryIndex.get(key);
    if (meta && meta.pinned) return false;
    this.memoryBlobs.delete(key);
    if (this.db) {
      await new Promise((resolve) => {
        try {
          const tx = this.db.transaction('blobs', 'readwrite');
          tx.objectStore('blobs').delete(key);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (_) {
          resolve(false);
        }
      });
    }
    if (this.cacheStorage) {
      try {
        await this.cacheStorage.delete(`/cdn/${key}`);
      } catch (_) {}
    }
    this.memoryIndex.delete(key);
    return true;
  }

  async deletePack(keys) {
    let freed = 0;
    for (const k of keys) {
      const meta = this.memoryIndex.get(k);
      if (meta && !meta.pinned) {
        freed += meta.sizeBytes || 0;
        await this.delete(k);
      }
    }
    return freed;
  }

  async clearOptional() {
    await this.init();
    const removable = [];
    for (const [k, v] of this.memoryIndex.entries()) {
      if (!v.pinned) removable.push(k);
    }
    return this.deletePack(removable);
  }

  async getStorageBudgetBytes() {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const defaultCap = isMobile ? 480 * 1024 * 1024 : 1800 * 1024 * 1024;
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        const quota = est.quota || defaultCap * 4;
        return Math.min(defaultCap, Math.floor(quota * 0.25));
      } catch (_) {}
    }
    return defaultCap;
  }

  async evictLruIfNeeded(incomingBytes) {
    const budget = await this.getStorageBudgetBytes();
    let totalUsed = 0;
    const candidates = [];
    for (const v of this.memoryIndex.values()) {
      totalUsed += v.sizeBytes || 0;
      if (!v.pinned) candidates.push(v);
    }
    if (totalUsed + incomingBytes <= budget) return;

    candidates.sort((a, b) => a.lastAccessed - b.lastAccessed);
    for (const c of candidates) {
      if (totalUsed + incomingBytes <= budget) break;
      await this.delete(c.key);
      totalUsed -= c.sizeBytes || 0;
    }
  }

  async getStats() {
    await this.init();
    let totalBytes = 0;
    let pinnedBytes = 0;
    let optionalBytes = 0;
    for (const v of this.memoryIndex.values()) {
      totalBytes += v.sizeBytes || 0;
      if (v.pinned) pinnedBytes += v.sizeBytes || 0;
      else optionalBytes += v.sizeBytes || 0;
    }

    let quotaBytes = 0;
    let usageBytes = totalBytes;
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        quotaBytes = est.quota || 0;
        usageBytes = est.usage || totalBytes;
      } catch (_) {}
    }

    return {
      fileCount: this.memoryIndex.size,
      totalCount: this.memoryIndex.size,
      totalBytes,
      pinnedBytes,
      optionalBytes,
      quotaBytes,
      usageBytes
    };
  }
}

export const LocalAssetCache = new LocalAssetCacheService();

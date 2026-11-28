/**
 * Zero-GC Generic Object Pool for projectiles, particles, lights, and damage popups.
 */

export class ObjectPool {
  constructor(factoryFn, resetFn = null, initialSize = 0) {
    this._factory = factoryFn;
    this._reset = resetFn;
    this._pool = [];
    this._active = new Set();
    for (let i = 0; i < initialSize; i++) {
      this._pool.push(this._factory());
    }
  }

  acquire(...args) {
    const item = this._pool.length > 0 ? this._pool.pop() : this._factory();
    if (this._reset) this._reset(item, ...args);
    this._active.add(item);
    return item;
  }

  release(item) {
    if (!item || !this._active.has(item)) return;
    this._active.delete(item);
    this._pool.push(item);
  }

  releaseAll() {
    for (const item of [...this._active]) {
      this.release(item);
    }
  }

  get activeCount() {
    return this._active.size;
  }

  get availableCount() {
    return this._pool.length;
  }
}

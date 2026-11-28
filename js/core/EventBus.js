/**
 * RAPSONYX Central Typed Event Bus
 * Decouples Boot, UI, World, Audio, Combat, and Network layers.
 */

class EventBusService {
  constructor() {
    this._listeners = new Map();
  }

  on(event, handler) {
    if (!event || typeof handler !== 'function') return () => {};
    let set = this._listeners.get(event);
    if (!set) {
      set = new Set();
      this._listeners.set(event, set);
    }
    set.add(handler);
    return () => this.off(event, handler);
  }

  once(event, handler) {
    if (!event || typeof handler !== 'function') return () => {};
    const wrap = (payload) => {
      this.off(event, wrap);
      handler(payload);
    };
    return this.on(event, wrap);
  }

  off(event, handler) {
    const set = this._listeners.get(event);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) this._listeners.delete(event);
  }

  emit(event, payload = undefined) {
    const set = this._listeners.get(event);
    if (!set || set.size === 0) return;
    for (const fn of [...set]) {
      try {
        fn(payload);
      } catch (err) {
        console.warn(`[EventBus:${event}] listener error:`, err?.message || err);
      }
    }
  }
}

export const EventBus = new EventBusService();

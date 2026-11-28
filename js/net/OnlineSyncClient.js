/**
 * RAPSONYX Online Multiplayer, Private Rooms, Skill Coord Sync & Health Client
 * - Connects to Hugging Face Space backend (/health, /ws/arena)
 * - Supports 6-char Private Room codes, 8s solo bot backfill alerts & tracked skill broadcasts
 * - Automatic seamless failover to local authoritative bot simulation when offline/unreachable
 */

import { NETWORK_CONFIG } from '../config/constants.js';
import { ProfileManager } from '../core/ProfileManager.js';

export class OnlineSyncClient {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.offlineMode = true;
    this.heartbeatTimer = null;
    this.sendTickTimer = 0;
    this.skillTickTimer = 0;
    this.remoteSnapshots = new Map();
    this.onRemoteState = null;
    this.onSkillUpdate = null;
    this.onRoomEvent = null;
  }

  getHttpBase() {
    return String(NETWORK_CONFIG.BACKEND_HTTP || NETWORK_CONFIG.BACKEND_URL || '').replace(/\/+$/, '');
  }

  getWsBase() {
    if (NETWORK_CONFIG.BACKEND_WS) {
      return String(NETWORK_CONFIG.BACKEND_WS).replace(/\/+$/, '');
    }
    return this.getHttpBase().replace(/^http/, 'ws');
  }

  async pingBackendHealth() {
    const base = this.getHttpBase();
    if (!base) return { ok: false, latencyMs: 0 };
    const t0 = performance.now();
    try {
      const res = await fetch(`${base}/health`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      });
      const latencyMs = Math.round(performance.now() - t0);
      if (!res.ok) return { ok: false, latencyMs, status: res.status };
      const data = await res.json().catch(() => ({}));
      return { ok: true, latencyMs, data };
    } catch (_) {
      return { ok: false, latencyMs: Math.round(performance.now() - t0) };
    }
  }

  async connect(roomConfig = { mapId: 'arena_colosseum', heroId: 'freya', squadMode: 'SOLO', roomCode: '' }) {
    this.disconnect();
    const baseUrl = this.getWsBase();
    if (!baseUrl) {
      this.connected = false;
      this.offlineMode = true;
      return false;
    }

    const profile = ProfileManager.getProfile();
    try {
      const socket = new WebSocket(`${baseUrl}/ws/arena`);
      await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('WS Timeout')), 3000);
        socket.onopen = () => {
          clearTimeout(t);
          resolve();
        };
        socket.onerror = (e) => {
          clearTimeout(t);
          reject(e);
        };
      });

      this.ws = socket;
      this.connected = true;
      this.offlineMode = false;

      socket.send(JSON.stringify({
        type: 'join',
        playerId: profile.playerId,
        nickname: profile.nickname,
        mapId: roomConfig.mapId || 'arena_colosseum',
        heroId: roomConfig.heroId || 'freya',
        squadMode: roomConfig.squadMode || 'SOLO',
        roomCode: roomConfig.roomCode || ''
      }));

      socket.onmessage = (evt) => this._handleMessage(evt.data);
      socket.onclose = () => {
        this.connected = false;
        this.offlineMode = true;
      };

      this.heartbeatTimer = window.setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping', t: Date.now() }));
        }
      }, NETWORK_CONFIG.HEARTBEAT_INTERVAL_MS);

      return true;
    } catch (_) {
      this.connected = false;
      this.offlineMode = true;
      return false;
    }
  }

  _handleMessage(raw) {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'state' && Array.isArray(msg.players)) {
        const now = performance.now();
        for (const p of msg.players) {
          this.remoteSnapshots.set(p.id, { ...p, receivedAt: now });
        }
        if (typeof this.onRemoteState === 'function') {
          this.onRemoteState(msg);
        }
      } else if (msg.type === 'skill_update') {
        if (typeof this.onSkillUpdate === 'function') {
          this.onSkillUpdate(msg);
        }
      } else if (msg.type === 'room_joined' || msg.type === 'bot_backfill') {
        if (typeof this.onRoomEvent === 'function') {
          this.onRoomEvent(msg);
        }
      }
    } catch (_) {}
  }

  sendPlayerTransform(dt, pos, yaw, animState = 'idle') {
    if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.sendTickTimer += dt;
    const interval = 1 / NETWORK_CONFIG.TICK_HZ;
    if (this.sendTickTimer < interval) return;
    this.sendTickTimer = 0;

    this.ws.send(JSON.stringify({
      type: 'move',
      x: Math.round(pos.x * 100) / 100,
      y: Math.round(pos.y * 100) / 100,
      z: Math.round(pos.z * 100) / 100,
      yaw: Math.round(yaw * 1000) / 1000,
      anim: animState
    }));
  }

  sendSkillCoord(inst) {
    if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN || !inst) return;
    const pos = inst.currPos || inst.position || {};
    this.ws.send(JSON.stringify({
      type: 'skill_update',
      id: inst.id,
      mode: inst.mode,
      x: Math.round((pos.x || 0) * 100) / 100,
      y: Math.round((pos.y || 0) * 100) / 100,
      z: Math.round((pos.z || 0) * 100) / 100,
      radius: Math.round((inst.radius || 1) * 100) / 100
    }));
  }

  disconnect() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }
    this.connected = false;
    this.offlineMode = true;
    this.remoteSnapshots.clear();
  }
}

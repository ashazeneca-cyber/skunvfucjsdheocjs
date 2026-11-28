/**
 * RAPSONYX Authoritative Node.js TypeScript Server & Full Web Host
 * - Serves static RAPSONYX web client from ./public when present (Docker / HF Spaces)
 * - Authenticated /cdn/* reverse proxy with strict 403 voice-over / offline blacklist
 * - 20Hz WebSocket (/ws/arena) state sync + Colyseus Room + optional TursoDB match logging
 */

import fs from 'fs';
import http from 'http';
import path from 'path';
import { Readable } from 'stream';
import type { ReadableStream as WebReadableStream } from 'stream/web';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { Server as ColyseusServer, Room } from 'colyseus';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from '@libsql/client';

const PORT = Number(process.env.PORT || 7860);
const ORIGIN_REPO = process.env.RAPSONYX_ORIGIN_REPO || 'ashazeneca/onyxpure-live-cdn';
const ORIGIN_BRANCH = process.env.RAPSONYX_ORIGIN_BRANCH || 'main';
const CACHE_TTL = process.env.RAPSONYX_CACHE_TTL || '31536000';
const VOICE_DISABLED = (process.env.RAPSONYX_DISABLE_VOICE || 'true') === 'true';
const SECRET = (process.env.RAPSONYX_SECRET || '').trim();

const FORBIDDEN_PATTERNS: RegExp[] = [
  /^assets\/audio\/voices_real\//i,
  /^assets\/audio\/voices_cloned_504\//i,
  /^assets\/audio\/announcer\//i,
  /^assets\/audio\/sfx_hq_220\/audio_stereo_hq_v5\/hero_voicelines_42\//i,
  /\.npz$/i,
  /\.pt$/i,
  /_raw\.png$/i,
  /voice_refs_42/i,
  /suaramemberjeketi/i
];

const MIME_MAP: Record<string, string> = {
  glb: 'model/gltf-binary',
  gltf: 'model/gltf+json',
  bin: 'application/octet-stream',
  f32: 'application/octet-stream',
  json: 'application/json; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  mjs: 'application/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  hdr: 'application/octet-stream',
  cube: 'text/plain; charset=utf-8',
  ogg: 'audio/ogg',
  mp3: 'audio/mpeg'
};

const app = express();
app.use(cors({
  origin: '*',
  exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges', 'X-Rapsonyx-Status']
}));
app.use(express.json());

const db = process.env.TURSO_DATABASE_URL
  ? createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN || ''
    })
  : null;

interface PlayerState {
  id: string;
  playerId?: string;
  nickname?: string;
  heroId: string;
  mapId: string;
  roomCode?: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  anim: string;
  updatedAt: number;
}

const roomStates = new Map<string, Map<string, PlayerState>>();

class RapsonyxArenaRoom extends Room {
  onCreate(_options: Record<string, unknown>) {
    this.setPatchRate(50);
    this.onMessage('move', (client, data) => {
      this.broadcast('state', { id: client.sessionId, ...data }, { except: client });
    });
  }
}

interface ProfileLeaderboardEntry {
  playerId: string;
  nickname: string;
  rankStars: number;
  rankTier: string;
  wins: number;
  matchesPlayed: number;
  mvpCount: number;
  updatedAt: number;
}

const leaderboardMemory = new Map<string, ProfileLeaderboardEntry>();
let profileTableReady = false;

async function ensureProfileTable() {
  if (!db || profileTableReady) return;
  try {
    await db.execute(
      `CREATE TABLE IF NOT EXISTS rapsonyx_profiles (
        player_id TEXT PRIMARY KEY,
        nickname TEXT NOT NULL,
        rank_stars INTEGER DEFAULT 12,
        rank_tier TEXT DEFAULT 'Rookie',
        wins INTEGER DEFAULT 0,
        matches_played INTEGER DEFAULT 0,
        mvp_count INTEGER DEFAULT 0,
        updated_at INTEGER NOT NULL
      )`
    );
    profileTableReady = true;
  } catch (_) {}
}

function healthPayload() {
  return {
    ok: true,
    status: 'ok',
    service: 'rapsonyx-server',
    version: 'rapsonyx-v3',
    originRepo: ORIGIN_REPO,
    originBranch: ORIGIN_BRANCH,
    voiceDisabled: VOICE_DISABLED,
    secretConfigured: Boolean(SECRET),
    tickHz: 20,
    activeRooms: roomStates.size,
    persistence: Boolean(db),
    timestamp: Date.now()
  };
}

app.get('/health', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Rapsonyx-Status', 'HEALTH-OK');
  res.json(healthPayload());
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Rapsonyx-Status', 'HEALTH-OK');
  res.json(healthPayload());
});

app.get('/api/leaderboard', async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  if (db) {
    try {
      await ensureProfileTable();
      const rowsRes = await db.execute(
        'SELECT player_id, nickname, rank_stars, rank_tier, wins, matches_played, mvp_count, updated_at FROM rapsonyx_profiles ORDER BY rank_stars DESC LIMIT 50'
      );
      if (Array.isArray(rowsRes.rows) && rowsRes.rows.length > 0) {
        const list = rowsRes.rows.map((r: any) => ({
          playerId: String(r.player_id || r[0]),
          nickname: String(r.nickname || r[1] || 'Commander'),
          rankStars: Number(r.rank_stars ?? r[2] ?? 0),
          rankTier: String(r.rank_tier || r[3] || 'Trainee'),
          wins: Number(r.wins ?? r[4] ?? 0),
          matchesPlayed: Number(r.matches_played ?? r[5] ?? 0),
          mvpCount: Number(r.mvp_count ?? r[6] ?? 0),
          updatedAt: Number(r.updated_at ?? r[7] ?? 0)
        }));
        res.json({ ok: true, leaderboard: list });
        return;
      }
    } catch (_) {}
  }
  const fallbackList = Array.from(leaderboardMemory.values())
    .sort((a, b) => b.rankStars - a.rankStars)
    .slice(0, 50);
  res.json({ ok: true, leaderboard: fallbackList });
});

app.get('/api/profile/:id', async (req: Request, res: Response) => {
  const pid = String(req.params.id || '').trim();
  if (!pid) {
    res.status(400).json({ ok: false, error: 'Missing playerId' });
    return;
  }
  if (db) {
    try {
      await ensureProfileTable();
      const r = await db.execute({
        sql: 'SELECT player_id, nickname, rank_stars, rank_tier, wins, matches_played, mvp_count, updated_at FROM rapsonyx_profiles WHERE player_id = ?',
        args: [pid]
      });
      if (r.rows?.length) {
        const row: any = r.rows[0];
        res.json({
          ok: true,
          profile: {
            playerId: String(row.player_id || pid),
            nickname: String(row.nickname || 'Commander'),
            rankStars: Number(row.rank_stars ?? 0),
            rankTier: String(row.rank_tier || 'Trainee'),
            wins: Number(row.wins ?? 0),
            matchesPlayed: Number(row.matches_played ?? 0),
            mvpCount: Number(row.mvp_count ?? 0),
            updatedAt: Number(row.updated_at ?? 0)
          }
        });
        return;
      }
    } catch (_) {}
  }
  const mem = leaderboardMemory.get(pid);
  if (!mem) {
    res.status(404).json({ ok: false, error: 'Profile not found' });
    return;
  }
  res.json({ ok: true, profile: mem });
});

app.post('/api/match-result', async (req: Request, res: Response) => {
  const b = req.body || {};
  const playerId = String(b.playerId || '').trim();
  if (!playerId) {
    res.status(400).json({ ok: false, error: 'Missing playerId' });
    return;
  }
  const entry: ProfileLeaderboardEntry = {
    playerId,
    nickname: String(b.nickname || 'Commander').slice(0, 20),
    rankStars: Math.max(0, Number(b.rankStars ?? 0)),
    rankTier: String(b.rankTier || 'Rookie'),
    wins: Math.max(0, Number(b.wins ?? 0)),
    matchesPlayed: Math.max(0, Number(b.matchesPlayed ?? 0)),
    mvpCount: Math.max(0, Number(b.mvpCount ?? 0)),
    updatedAt: Date.now()
  };
  leaderboardMemory.set(playerId, entry);

  let persisted = false;
  if (db) {
    try {
      await ensureProfileTable();
      await db.execute({
        sql: `INSERT INTO rapsonyx_profiles (player_id, nickname, rank_stars, rank_tier, wins, matches_played, mvp_count, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(player_id) DO UPDATE SET
                nickname = excluded.nickname,
                rank_stars = excluded.rank_stars,
                rank_tier = excluded.rank_tier,
                wins = excluded.wins,
                matches_played = excluded.matches_played,
                mvp_count = excluded.mvp_count,
                updated_at = excluded.updated_at`,
        args: [entry.playerId, entry.nickname, entry.rankStars, entry.rankTier, entry.wins, entry.matchesPlayed, entry.mvpCount, entry.updatedAt]
      });
      await db.execute({
        sql: 'INSERT INTO rapsonyx_matches (player_id, hero_id, map_id, win, kills, deaths, assists, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [playerId, String(b.heroId || 'freya'), String(b.arenaId || 'arena_colosseum'), b.won ? 1 : 0, Number(b.kills || 0), Number(b.deaths || 0), Number(b.assists || 0), Date.now()]
      });
      persisted = true;
    } catch (_) {}
  }
  res.json({ ok: true, persisted, profile: entry });
});

app.post('/api/match/record', async (req: Request, res: Response) => {
  const { playerId, heroId, mapId, win, kills, deaths, assists } = req.body || {};
  if (!db) {
    res.json({ ok: true, persisted: false });
    return;
  }
  try {
    await db.execute({
      sql: 'INSERT INTO rapsonyx_matches (player_id, hero_id, map_id, win, kills, deaths, assists, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [String(playerId || 'guest'), String(heroId || 'freya'), String(mapId || 'arena_colosseum'), win ? 1 : 0, Number(kills || 0), Number(deaths || 0), Number(assists || 0), Date.now()]
    });
    res.json({ ok: true, persisted: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

async function handleCdnProxy(req: Request, res: Response) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, If-None-Match, Content-Type');
    res.status(204).end();
    return;
  }

  let rawPath = req.path;
  if (rawPath.startsWith('/cdn/')) {
    rawPath = rawPath.slice(5);
  } else if (rawPath.startsWith('/assets/assets/')) {
    rawPath = rawPath.slice('/assets/'.length);
  } else {
    rawPath = rawPath.replace(/^\/+/, '');
  }
  try {
    rawPath = decodeURIComponent(rawPath);
  } catch {
    res.status(400).send('Invalid Encoding');
    return;
  }

  if (!rawPath || rawPath.includes('..') || rawPath.startsWith('/')) {
    res.status(400).send('Invalid Asset Path');
    return;
  }

  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.test(rawPath)) {
      res.setHeader('X-Rapsonyx-Status', 'BLOCKED-VOICE-OVER');
      res.status(403).json({
        error: 'Asset blocked by RAPSONYX policy (0% voice-over)',
        path: rawPath
      });
      return;
    }
  }

  const encodedPath = rawPath.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  const upstreamUrl = `https://huggingface.co/datasets/${ORIGIN_REPO}/resolve/${ORIGIN_BRANCH}/${encodedPath}`;

  try {
    let currentUrl = upstreamUrl;
    let upstream: globalThis.Response | null = null;
    for (let hop = 0; hop < 5; hop++) {
      const parsed = new URL(currentUrl);
      const fwdHeaders: Record<string, string> = {};
      if (SECRET && parsed.hostname.endsWith('huggingface.co')) {
        fwdHeaders['Authorization'] = `Bearer ${SECRET}`;
      }
      if (req.headers.range) fwdHeaders['Range'] = String(req.headers.range);
      if (req.headers['if-none-match']) fwdHeaders['If-None-Match'] = String(req.headers['if-none-match']);

      upstream = await fetch(currentUrl, {
        method: req.method === 'HEAD' ? 'HEAD' : 'GET',
        headers: fwdHeaders,
        redirect: 'manual'
      });

      if (upstream.status >= 300 && upstream.status < 400) {
        const loc = upstream.headers.get('location');
        if (!loc) break;
        currentUrl = new URL(loc, currentUrl).toString();
        continue;
      }
      break;
    }

    if (!upstream) {
      res.setHeader('X-Rapsonyx-Status', 'ERROR');
      res.status(502).send('Upstream Proxy Error: No response');
      return;
    }

    if (!upstream.ok && upstream.status !== 206 && upstream.status !== 304) {
      res.setHeader('X-Rapsonyx-Status', `ORIGIN-${upstream.status}`);
      res.status(upstream.status).send(`Origin HTTP ${upstream.status}`);
      return;
    }

    const ext = rawPath.split('.').pop()?.toLowerCase() || '';
    const contentType = MIME_MAP[ext] || upstream.headers.get('content-type') || 'application/octet-stream';
    res.status(upstream.status);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL}, immutable`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, X-Rapsonyx-Status');
    res.setHeader('X-Rapsonyx-Status', 'HIT-ORIGIN');

    for (const h of ['content-length', 'content-range', 'accept-ranges', 'etag']) {
      const val = upstream.headers.get(h);
      if (val) res.setHeader(h, val);
    }

    if (req.method === 'HEAD' || !upstream.body) {
      res.end();
      return;
    }

    const nodeStream = Readable.fromWeb(upstream.body as unknown as WebReadableStream<Uint8Array>);
    nodeStream.on('error', () => {
      if (!res.headersSent) res.status(502);
      res.end();
    });
    nodeStream.pipe(res);
  } catch (err) {
    res.setHeader('X-Rapsonyx-Status', 'ERROR');
    res.status(502).send(`Upstream Proxy Error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

app.all(['/cdn/*', '/assets/*'], (req, res) => {
  handleCdnProxy(req, res).catch(() => {
    if (!res.headersSent) res.status(500).end();
  });
});

// Serve RAPSONYX Web App static assets if bundled inside ./public
const PUBLIC_DIR = path.resolve(__dirname, '../public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR, {
    index: 'index.html',
    setHeaders: (res, filePath) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
    }
  }));
}

const server = http.createServer(app);
const gameServer = new ColyseusServer({ server });
gameServer.define('rapsonyx_arena', RapsonyxArenaRoom);

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  if (request.url && request.url.startsWith('/ws/arena')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

interface ClientSocket extends WebSocket {
  _mapId?: string;
}

wss.on('connection', (ws: ClientSocket) => {
  const clientId = `p_${Math.random().toString(36).slice(2, 9)}`;
  let currentMap = 'arena_colosseum';
  let backfillTimer: ReturnType<typeof setTimeout> | null = null;
  ws._mapId = currentMap;

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', t: Date.now() }));
        return;
      }
      if (msg.type === 'join') {
        roomStates.get(currentMap)?.delete(clientId);
        const rawMap = String(msg.mapId || 'arena_colosseum');
        const roomCode = String(msg.roomCode || '').trim().toUpperCase().slice(0, 6);
        currentMap = roomCode ? `priv_${rawMap}_${roomCode}` : rawMap;
        ws._mapId = currentMap;
        if (!roomStates.has(currentMap)) roomStates.set(currentMap, new Map());
        const roomPlayers = roomStates.get(currentMap)!;
        roomPlayers.set(clientId, {
          id: clientId,
          playerId: String(msg.playerId || clientId),
          nickname: String(msg.nickname || 'Commander'),
          heroId: String(msg.heroId || 'freya'),
          mapId: rawMap,
          roomCode,
          x: 0,
          y: 0,
          z: 0,
          yaw: 0,
          anim: 'idle',
          updatedAt: Date.now()
        });
        ws.send(JSON.stringify({
          type: 'room_joined',
          clientId,
          roomKey: currentMap,
          roomCode,
          playerCount: roomPlayers.size
        }));
        if (!roomCode) {
          if (backfillTimer) clearTimeout(backfillTimer);
          backfillTimer = setTimeout(() => {
            const rm = roomStates.get(currentMap);
            if (ws.readyState === WebSocket.OPEN && rm && rm.size <= 1) {
              ws.send(JSON.stringify({ type: 'bot_backfill', roomKey: currentMap, addedBots: 2 }));
            }
          }, 8000);
        }
      } else if (msg.type === 'move') {
        const players = roomStates.get(currentMap);
        const existing = players?.get(clientId);
        if (existing) {
          existing.x = Number(msg.x || 0);
          existing.y = Number(msg.y || 0);
          existing.z = Number(msg.z || 0);
          existing.yaw = Number(msg.yaw || 0);
          existing.anim = String(msg.anim || 'idle');
          existing.updatedAt = Date.now();
        }
      } else if (msg.type === 'skill_update') {
        const relay = JSON.stringify({ ...msg, senderId: clientId, mapId: currentMap });
        wss.clients.forEach((rawClient) => {
          const client = rawClient as ClientSocket;
          if (client !== ws && client.readyState === WebSocket.OPEN && client._mapId === currentMap) {
            client.send(relay);
          }
        });
      }
    } catch (_) {}
  });

  ws.on('close', () => {
    if (backfillTimer) {
      clearTimeout(backfillTimer);
      backfillTimer = null;
    }
    roomStates.get(currentMap)?.delete(clientId);
  });
});

setInterval(() => {
  const payloadCache = new Map<string, string>();
  for (const [mapId, players] of roomStates.entries()) {
    if (players.size === 0) continue;
    payloadCache.set(mapId, JSON.stringify({ type: 'state', mapId, players: Array.from(players.values()) }));
  }
  if (payloadCache.size === 0) return;

  wss.clients.forEach((rawClient) => {
    const client = rawClient as ClientSocket;
    if (client.readyState === WebSocket.OPEN) {
      const payload = client._mapId ? payloadCache.get(client._mapId) : undefined;
      if (payload) client.send(payload);
    }
  });
}, 50);

server.listen(PORT, () => {
  console.log(`[RAPSONYX Server] Running on port ${PORT} (20Hz authoritative sync + web/cdn host)`);
});

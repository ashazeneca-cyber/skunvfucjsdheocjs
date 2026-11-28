const FORBIDDEN_PATTERNS = [
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

const MIME_MAP = {
  glb: 'model/gltf-binary',
  gltf: 'model/gltf+json',
  bin: 'application/octet-stream',
  f32: 'application/octet-stream',
  json: 'application/json; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  hdr: 'application/octet-stream',
  cube: 'text/plain; charset=utf-8',
  ogg: 'audio/ogg',
  mp3: 'audio/mpeg',
  md: 'text/markdown; charset=utf-8',
  sql: 'text/plain; charset=utf-8'
};

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, If-None-Match, Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const segments = Array.isArray(params.path) ? params.path : [params.path || ''];
  const rawPath = segments.join('/');
  if (!rawPath || rawPath.includes('..') || rawPath.startsWith('/')) {
    return new Response('Invalid Asset Path', { status: 400 });
  }

  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.test(rawPath)) {
      return new Response(
        JSON.stringify({
          error: 'FORBIDDEN_BLACKLISTED_ASSET',
          voiceDisabled: true,
          path: rawPath
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'X-Rapsonyx-Status': 'BLOCKED-403'
          }
        }
      );
    }
  }

  const cache = caches.default;
  const isRange = request.headers.has('Range');
  const cacheKey = new Request(request.url, { method: 'GET' });

  if (!isRange && request.method === 'GET') {
    const cached = await cache.match(cacheKey);
    if (cached) {
      const hitHeaders = new Headers(cached.headers);
      hitHeaders.set('X-Rapsonyx-Status', 'HIT-EDGE');
      return new Response(cached.body, { status: cached.status, headers: hitHeaders });
    }
  }

  const repo = env.RAPSONYX_ORIGIN_REPO || 'ashazeneca/onyxpure-live-cdn';
  const branch = env.RAPSONYX_ORIGIN_BRANCH || 'main';
  const ttl = env.RAPSONYX_CACHE_TTL || '31536000';
  const encodedPath = rawPath.split('/').map(encodeURIComponent).join('/');
  const upstreamUrl = `https://huggingface.co/datasets/${repo}/resolve/${branch}/${encodedPath}`;

  const hfSecret = env.RAPSONYX_SECRET || env[atob('T05ZWFBVUkVfU0VDUkVU')] || '';

  let upstreamRes = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      let currentUrl = upstreamUrl;
      for (let hop = 0; hop < 5; hop++) {
        const parsed = new URL(currentUrl);
        const hopHeaders = new Headers();
        if (isRange) {
          hopHeaders.set('Range', request.headers.get('Range'));
        }
        if (parsed.hostname.endsWith('huggingface.co') && hfSecret) {
          hopHeaders.set('Authorization', `Bearer ${hfSecret}`);
        }
        upstreamRes = await fetch(currentUrl, {
          method: request.method,
          headers: hopHeaders,
          redirect: 'manual'
        });

        if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
          const loc = upstreamRes.headers.get('Location');
          if (!loc) break;
          currentUrl = new URL(loc, currentUrl).toString();
          continue;
        }
        break;
      }

      if (upstreamRes && (upstreamRes.ok || upstreamRes.status === 206 || upstreamRes.status === 404 || upstreamRes.status === 401 || upstreamRes.status === 403)) {
        break;
      }
    } catch (_) {
      upstreamRes = null;
    }
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
  }

  if (!upstreamRes || (!upstreamRes.ok && upstreamRes.status !== 206)) {
    return new Response(
      JSON.stringify({
        error: 'UPSTREAM_ORIGIN_ERROR',
        status: upstreamRes ? upstreamRes.status : 502,
        secretConfigured: Boolean(hfSecret),
        path: rawPath
      }),
      {
        status: upstreamRes ? upstreamRes.status : 502,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Rapsonyx-Status': 'ERROR-ORIGIN'
        }
      }
    );
  }

  const ext = rawPath.split('.').pop().toLowerCase();
  const outHeaders = new Headers();
  outHeaders.set('Content-Type', MIME_MAP[ext] || upstreamRes.headers.get('Content-Type') || 'application/octet-stream');
  outHeaders.set('Cache-Control', `public, max-age=${ttl}, immutable`);
  outHeaders.set('Access-Control-Allow-Origin', '*');
  outHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, ETag, X-Rapsonyx-Status');
  outHeaders.set('X-Rapsonyx-Status', 'MISS-ORIGIN');

  for (const h of ['Content-Length', 'Content-Range', 'Accept-Ranges', 'ETag']) {
    const val = upstreamRes.headers.get(h);
    if (val) outHeaders.set(h, val);
  }

  const response = new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: outHeaders
  });

  if (!isRange && request.method === 'GET' && upstreamRes.status === 200) {
    const contentLen = Number(outHeaders.get('Content-Length') || 0);
    if (contentLen > 0 && contentLen <= 50 * 1024 * 1024) {
      context.waitUntil(cache.put(cacheKey, response.clone()));
    }
  }

  return response;
}

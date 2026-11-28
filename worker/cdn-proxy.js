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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

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

    if (url.pathname === '/api/health') {
      const hasSecret = Boolean(env.RAPSONYX_SECRET || env[atob('T05ZWFBVUkVfU0VDUkVU')]);
      return new Response(
        JSON.stringify({
          service: 'rapsonyx-worker',
          status: 'ok',
          originRepo: env.RAPSONYX_ORIGIN_REPO || 'ashazeneca/onyxpure-live-cdn',
          backendHttp: env.RAPSONYX_BACKEND_HTTP || 'https://ashazeneca-botanalistiktl.hf.space',
          voiceDisabled: true,
          secretConfigured: hasSecret
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (url.pathname === '/api/config') {
      return new Response(
        JSON.stringify({
          app: 'RAPSONYX',
          backendHttp: (env.RAPSONYX_BACKEND_HTTP || 'https://ashazeneca-botanalistiktl.hf.space').replace(/\/+$/, ''),
          backendWs: (env.RAPSONYX_BACKEND_WS || 'wss://ashazeneca-botanalistiktl.hf.space').replace(/\/+$/, ''),
          originRepo: env.RAPSONYX_ORIGIN_REPO || 'ashazeneca/onyxpure-live-cdn',
          voiceDisabled: true
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (!url.pathname.startsWith('/cdn/')) {
      return new Response('RAPSONYX Edge Proxy', { status: 404 });
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const rawPath = decodeURIComponent(url.pathname.slice('/cdn/'.length)).replace(/^\/+/, '');
    if (!rawPath || rawPath.includes('..')) {
      return new Response('Invalid Asset Path', { status: 400 });
    }

    for (const rule of FORBIDDEN_PATTERNS) {
      if (rule.test(rawPath)) {
        return new Response(
          JSON.stringify({ error: 'FORBIDDEN_BLACKLISTED_ASSET', path: rawPath }),
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
    const cacheKey = new Request(url.toString(), { method: 'GET' });
    if (!isRange && request.method === 'GET') {
      const hit = await cache.match(cacheKey);
      if (hit) {
        const headers = new Headers(hit.headers);
        headers.set('X-Rapsonyx-Status', 'HIT-EDGE');
        return new Response(hit.body, { status: hit.status, headers });
      }
    }

    const repo = env.RAPSONYX_ORIGIN_REPO || 'ashazeneca/onyxpure-live-cdn';
    const branch = env.RAPSONYX_ORIGIN_BRANCH || 'main';
    const ttl = env.RAPSONYX_CACHE_TTL || '31536000';
    const encoded = rawPath.split('/').map(encodeURIComponent).join('/');
    const upstreamUrl = `https://huggingface.co/datasets/${repo}/resolve/${branch}/${encoded}`;

    const hfSecret = env.RAPSONYX_SECRET || env[atob('T05ZWFBVUkVfU0VDUkVU')] || '';
    let upstreamRes = null;
    for (let hop = 0; hop < 5; hop++) {
      const parsed = new URL(upstreamUrl);
      const hopHeaders = new Headers();
      if (isRange) hopHeaders.set('Range', request.headers.get('Range'));
      if (parsed.hostname.endsWith('huggingface.co') && hfSecret) {
        hopHeaders.set('Authorization', `Bearer ${hfSecret}`);
      }
      upstreamRes = await fetch(upstreamUrl, {
        method: request.method,
        headers: hopHeaders,
        redirect: 'manual'
      });

      if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
        const loc = upstreamRes.headers.get('Location');
        if (!loc) break;
        upstreamUrl = new URL(loc, upstreamUrl).toString();
        continue;
      }
      break;
    }

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return new Response(
        JSON.stringify({ error: 'UPSTREAM_ORIGIN_ERROR', status: upstreamRes.status, path: rawPath }),
        {
          status: upstreamRes.status,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'X-Rapsonyx-Status': 'ERROR-ORIGIN'
          }
        }
      );
    }

    const outHeaders = new Headers();
    outHeaders.set('Content-Type', upstreamRes.headers.get('Content-Type') || 'application/octet-stream');
    outHeaders.set('Cache-Control', `public, max-age=${ttl}, immutable`);
    outHeaders.set('Access-Control-Allow-Origin', '*');
    outHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, ETag, X-Rapsonyx-Status');
    outHeaders.set('X-Rapsonyx-Status', 'MISS-ORIGIN');

    for (const h of ['Content-Length', 'Content-Range', 'Accept-Ranges', 'ETag']) {
      const v = upstreamRes.headers.get(h);
      if (v) outHeaders.set(h, v);
    }

    const res = new Response(upstreamRes.body, { status: upstreamRes.status, headers: outHeaders });
    if (!isRange && request.method === 'GET' && upstreamRes.status === 200) {
      const len = Number(outHeaders.get('Content-Length') || 0);
      if (len > 0 && len <= 50 * 1024 * 1024) {
        ctx.waitUntil(cache.put(cacheKey, res.clone()));
      }
    }
    return res;
  }
};

export async function onRequest(context) {
  const { env } = context;
  const hasSecret = Boolean(env.RAPSONYX_SECRET || env[atob('T05ZWFBVUkVfU0VDUkVU')]);
  const body = {
    service: 'rapsonyx',
    status: 'ok',
    originRepo: env.RAPSONYX_ORIGIN_REPO || 'ashazeneca/onyxpure-live-cdn',
    originBranch: env.RAPSONYX_ORIGIN_BRANCH || 'main',
    backendHttp: env.RAPSONYX_BACKEND_HTTP || 'https://ashazeneca-botanalistiktl.hf.space',
    voiceDisabled: (env.RAPSONYX_DISABLE_VOICE || 'true') === 'true',
    secretConfigured: hasSecret,
    timestamp: Date.now()
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'X-Rapsonyx-Status': 'HEALTH-OK'
    }
  });
}

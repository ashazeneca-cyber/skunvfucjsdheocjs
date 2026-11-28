export async function onRequest(context) {
  const { env } = context;
  const backendHttp = (env.RAPSONYX_BACKEND_HTTP || 'https://ashazeneca-botanalistiktl.hf.space').replace(/\/+$/, '');
  const backendWs = (env.RAPSONYX_BACKEND_WS || 'wss://ashazeneca-botanalistiktl.hf.space').replace(/\/+$/, '');
  return new Response(
    JSON.stringify({
      app: 'RAPSONYX',
      backendHttp,
      backendWs,
      originRepo: env.RAPSONYX_ORIGIN_REPO || 'ashazeneca/onyxpure-live-cdn',
      voiceDisabled: (env.RAPSONYX_DISABLE_VOICE || 'true') === 'true',
      timestamp: Date.now()
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'X-Rapsonyx-Status': 'CONFIG-OK'
      }
    }
  );
}

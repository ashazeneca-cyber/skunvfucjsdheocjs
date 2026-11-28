#!/usr/bin/env python3
"""
RAPSONYX Pure-Python Cloudflare Pages Direct Upload REST API Deployer (5 Stages)
- Includes verified pure-Python BLAKE3 hasher
- Merges functions/api/health.js + functions/cdn/[[path]].js into in-memory _worker.js
- Sets RAPSONYX_ORIGIN_REPO, RAPSONYX_ORIGIN_BRANCH, RAPSONYX_CACHE_TTL, RAPSONYX_DISABLE_VOICE, and secret RAPSONYX_SECRET
- Verifies live endpoints after deployment
"""
import base64
import json
import mimetypes
import os
import re
import struct
import sys
import urllib.error
import urllib.request
import uuid

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PROJECT_NAME = 'rapsonyx'
ORIGIN_REPO = 'ashazeneca/onyxpure-live-cdn'
DEFAULT_ACCOUNT_ID = ''

IGNORE_DIRS = {'node_modules', '.git', '.wrangler', 'server', 'server-java', 'scripts'}
IGNORE_FILES = {'.cfignore', 'wrangler.toml', 'package.json', 'package-lock.json', '_worker.js'}

EXTRA_MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.glb': 'model/gltf-binary',
    '.txt': 'text/plain; charset=utf-8',
}

_IV = (
    0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
    0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19,
)
_MSG_PERM = (2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8)
_CHUNK_START, _CHUNK_END, _PARENT, _ROOT = 1, 2, 4, 8
_MASK32 = 0xFFFFFFFF


def _rotr32(x, n):
    return ((x >> n) | (x << (32 - n))) & _MASK32


def _g(st, a, b, c, d, mx, my):
    st[a] = (st[a] + st[b] + mx) & _MASK32
    st[d] = _rotr32(st[d] ^ st[a], 16)
    st[c] = (st[c] + st[d]) & _MASK32
    st[b] = _rotr32(st[b] ^ st[c], 12)
    st[a] = (st[a] + st[b] + my) & _MASK32
    st[d] = _rotr32(st[d] ^ st[a], 8)
    st[c] = (st[c] + st[d]) & _MASK32
    st[b] = _rotr32(st[b] ^ st[c], 7)


def _compress(cv, block_words, counter, block_len, flags):
    m = list(block_words)
    st = [
        cv[0], cv[1], cv[2], cv[3], cv[4], cv[5], cv[6], cv[7],
        _IV[0], _IV[1], _IV[2], _IV[3],
        counter & _MASK32, (counter >> 32) & _MASK32, block_len, flags,
    ]
    for r in range(7):
        _g(st, 0, 4, 8, 12, m[0], m[1])
        _g(st, 1, 5, 9, 13, m[2], m[3])
        _g(st, 2, 6, 10, 14, m[4], m[5])
        _g(st, 3, 7, 11, 15, m[6], m[7])
        _g(st, 0, 5, 10, 15, m[8], m[9])
        _g(st, 1, 6, 11, 12, m[10], m[11])
        _g(st, 2, 7, 8, 13, m[12], m[13])
        _g(st, 3, 4, 9, 14, m[14], m[15])
        if r < 6:
            m = [m[i] for i in _MSG_PERM]
    for i in range(8):
        st[i] ^= st[i + 8]
        st[i + 8] ^= cv[i]
    return st


def blake3_hex(data: bytes) -> str:
    cv_stack = []
    chunk_counter = 0
    pos = 0
    total = len(data)
    if total == 0:
        out = _compress(_IV, (0,) * 16, 0, 0, _CHUNK_START | _CHUNK_END | _ROOT)
        return struct.pack('<8I', *out[:8]).hex()

    def parent_cv(left, right):
        words = tuple(left[:8]) + tuple(right[:8])
        return _compress(_IV, words, 0, 64, _PARENT)[:8]

    while pos < total:
        chunk = data[pos:pos + 1024]
        is_last = (pos + len(chunk)) >= total
        pos += len(chunk)
        cv = list(_IV)
        clen = len(chunk)
        blocks = max(1, (clen + 63) // 64)
        for bi in range(blocks):
            blk = chunk[bi * 64:(bi + 1) * 64]
            blen = len(blk)
            padded = blk + b'\x00' * (64 - blen)
            words = struct.unpack('<16I', padded)
            flags = 0
            if bi == 0:
                flags |= _CHUNK_START
            if bi == blocks - 1:
                flags |= _CHUNK_END
            if is_last and bi == blocks - 1 and not cv_stack:
                flags |= _ROOT
            out = _compress(cv, words, chunk_counter, blen, flags)
            cv = out[:8]

        if is_last:
            if not cv_stack:
                return struct.pack('<8I', *cv).hex()
            node = cv
            while len(cv_stack) > 1:
                node = parent_cv(cv_stack.pop(), node)
            left = cv_stack.pop()
            words = tuple(left[:8]) + tuple(node[:8])
            out = _compress(_IV, words, 0, 64, _PARENT | _ROOT)
            return struct.pack('<8I', *out[:8]).hex()

        new_cv = cv
        total_chunks = chunk_counter + 1
        while total_chunks & 1 == 0:
            new_cv = parent_cv(cv_stack.pop(), new_cv)
            total_chunks >>= 1
        cv_stack.append(new_cv)
        chunk_counter += 1


def build_merged_worker_js() -> str:
    health_src = open(os.path.join(ROOT_DIR, 'functions', 'api', 'health.js'), 'r', encoding='utf-8').read()
    cdn_src = open(os.path.join(ROOT_DIR, 'functions', 'cdn', '[[path]].js'), 'r', encoding='utf-8').read()
    health_mod = re.sub(r'export\s+async\s+function\s+onRequest', 'async function onHealthRequest', health_src)
    cdn_mod = re.sub(r'export\s+async\s+function\s+onRequest', 'async function onCdnRequest', cdn_src)

    return f"""// Auto-bundled RAPSONYX Cloudflare Pages _worker.js (Direct Upload)
{health_mod}

{cdn_mod}

export default {{
  async fetch(request, env, ctx) {{
    const url = new URL(request.url);
    if (url.pathname === '/api/health') {{
      return onHealthRequest({{ request, env, params: {{}} }});
    }}
    if (url.pathname.startsWith('/cdn/')) {{
      const rest = url.pathname.slice('/cdn/'.length);
      const pathArr = rest ? rest.split('/') : [];
      return onCdnRequest({{ request, env, params: {{ path: pathArr }}, waitUntil: (p) => ctx.waitUntil(p) }});
    }}
    return env.ASSETS.fetch(request);
  }}
}};
"""


def cf_request(method, path, token, payload=None, content_type='application/json'):
    url = path if path.startswith('http') else f'https://api.cloudflare.com/client/v4{path}'
    data = json.dumps(payload).encode('utf-8') if isinstance(payload, (dict, list)) else payload
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': content_type,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', 'replace')
        raise RuntimeError(f'Cloudflare API {method} {path} -> HTTP {e.code}: {err_body}')


def collect_static_files():
    items = []
    for dp, dn, fn in os.walk(ROOT_DIR):
        dn[:] = [d for d in dn if d not in IGNORE_DIRS and not d.startswith('.')]
        if os.path.relpath(dp, ROOT_DIR).replace('\\', '/').startswith('functions'):
            continue
        for f in fn:
            if f in IGNORE_FILES or f.startswith('.'):
                continue
            full = os.path.join(dp, f)
            rel = '/' + os.path.relpath(full, ROOT_DIR).replace('\\', '/')
            ext = os.path.splitext(f)[1].lower()
            ext_no_dot = ext.lstrip('.')
            ctype = EXTRA_MIME.get(ext) or mimetypes.guess_type(f)[0] or 'application/octet-stream'
            raw = open(full, 'rb').read()
            b64 = base64.b64encode(raw).decode('ascii')
            key = blake3_hex((b64 + ext_no_dot).encode('utf-8'))[:32]
            items.append({'path': rel, 'key': key, 'value': b64, 'contentType': ctype})
    return items


def multipart_deploy(acct_id, token, manifest_dict, worker_js_text):
    boundary = f'----RapsonyxBoundary{uuid.uuid4().hex}'
    parts = []

    def add_field(name, val):
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{val}\r\n'.encode('utf-8'))

    def add_file(name, filename, content_bytes, ctype):
        hdr = f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="{filename}"\r\nContent-Type: {ctype}\r\n\r\n'.encode('utf-8')
        parts.append(hdr + content_bytes + b'\r\n')

    add_field('manifest', json.dumps(manifest_dict))
    add_field('branch', 'main')
    add_file('_worker.js', '_worker.js', worker_js_text.encode('utf-8'), 'application/javascript+module')
    parts.append(f'--{boundary}--\r\n'.encode('utf-8'))

    body = b''.join(parts)
    return cf_request(
        'POST',
        f'/accounts/{acct_id}/pages/projects/{PROJECT_NAME}/deployments',
        token,
        payload=body,
        content_type=f'multipart/form-data; boundary={boundary}',
    )


def check_live(base_url):
    base = base_url.rstrip('/')
    tests = [
        ('Root HTML (200)', f'{base}/', {200}),
        ('Health API (200)', f'{base}/api/health', {200}),
        ('Manifest JSON via /cdn (200)', f'{base}/cdn/assets/heroes/heroes_42_web_manifest.json', {200}),
        ('Loading Tip Card via /cdn (200)', f'{base}/cdn/assets/ui/skyboxes_banners/card_arena_colosseum.webp', {200}),
        ('Startup Maker Logo (200)', f'{base}/startup/logo%20pembuat.png', {200}),
        ('Blokir voices_real (403)', f'{base}/cdn/assets/audio/voices_real/team_dream/freya/freya_01_jiko_01.ogg', {403}),
        ('Blokir .npz (403)', f'{base}/cdn/assets/ai_brain/neural_motion/motion_matching_43k_nodes/motion_matching_aaa_43k_nodes_fp16.npz', {403}),
    ]
    all_ok = True
    for label, url, expected in tests:
        req = urllib.request.Request(url, method='GET', headers={'User-Agent': 'RAPSONYX-Deploy-Check/1.0'})
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                code = r.status
                xstat = r.headers.get('X-Rapsonyx-Status', '-')
        except urllib.error.HTTPError as e:
            code = e.code
            xstat = e.headers.get('X-Rapsonyx-Status', '-') if e.headers else '-'
        ok = code in expected
        all_ok = all_ok and ok
        print(f'[{"PASS" if ok else "FAIL"}] {label}: HTTP {code} (X-Rapsonyx-Status={xstat})', flush=True)
    return all_ok


def main():
    cf_token = os.environ.get('CLOUDFLARE_API_TOKEN', '').strip()
    hf_secret = os.environ.get('RAPSONYX_SECRET', '').strip()
    if not cf_token:
        print('ERROR: Set CLOUDFLARE_API_TOKEN environment variable first!', file=sys.stderr)
        sys.exit(1)
    if not hf_secret:
        print('ERROR: Set RAPSONYX_SECRET environment variable first!', file=sys.stderr)
        sys.exit(1)

    print('[1/5] Mengambil Account ID Cloudflare...', flush=True)
    acct_resp = cf_request('GET', '/accounts', cf_token)
    accounts = acct_resp.get('result') or []
    account_id = accounts[0]['id'] if accounts else os.environ.get('CLOUDFLARE_ACCOUNT_ID', DEFAULT_ACCOUNT_ID)
    print(f'Account ID: {account_id}', flush=True)

    print(f'[2/5] Memastikan project "{PROJECT_NAME}" & memasang RAPSONYX_SECRET...', flush=True)
    try:
        cf_request('POST', f'/accounts/{account_id}/pages/projects', cf_token, {'name': PROJECT_NAME, 'production_branch': 'main'})
        print(f'Project "{PROJECT_NAME}" dibuat.', flush=True)
    except Exception as exc:
        if 'already exists' in str(exc).lower() or '8000002' in str(exc):
            print(f'Project "{PROJECT_NAME}" sudah ada, lanjut update secret.', flush=True)
        else:
            raise

    cf_request(
        'PATCH',
        f'/accounts/{account_id}/pages/projects/{PROJECT_NAME}',
        cf_token,
        {
            'deployment_configs': {
                'production': {
                    'env_vars': {
                        'RAPSONYX_ORIGIN_REPO': {'type': 'plain_text', 'value': ORIGIN_REPO},
                        'RAPSONYX_ORIGIN_BRANCH': {'type': 'plain_text', 'value': 'main'},
                        'RAPSONYX_CACHE_TTL': {'type': 'plain_text', 'value': '31536000'},
                        'RAPSONYX_DISABLE_VOICE': {'type': 'plain_text', 'value': 'true'},
                        'RAPSONYX_SECRET': {'type': 'secret_text', 'value': hf_secret},
                    }
                }
            }
        },
    )
    print('RAPSONYX_SECRET & environment variables terpasang terenkripsi.', flush=True)

    print('[3/5] Meminta Upload JWT Token...', flush=True)
    jwt = cf_request('GET', f'/accounts/{account_id}/pages/projects/{PROJECT_NAME}/upload-token', cf_token)['result']['jwt']

    print('[4/5] Hash BLAKE3 & mengunggah seluruh berkas statis...', flush=True)
    files = collect_static_files()
    batch = []
    batch_bytes = 0
    for f in files:
        entry = {'key': f['key'], 'value': f['value'], 'metadata': {'contentType': f['contentType']}, 'base64': True}
        batch.append(entry)
        batch_bytes += len(f['value'])
        if batch_bytes >= 12 * 1024 * 1024 or len(batch) >= 25:
            cf_request('POST', '/pages/assets/upload', jwt, batch)
            batch, batch_bytes = [], 0
    if batch:
        cf_request('POST', '/pages/assets/upload', jwt, batch)

    all_hashes = [f['key'] for f in files]
    cf_request('POST', '/pages/assets/upsert-hashes', jwt, {'hashes': all_hashes})
    print(f'{len(files)} berkas terunggah & terindeks.', flush=True)

    print('[5/5] Finalisasi deployment (dengan gabungan _worker.js /cdn/* & /api/health)...', flush=True)
    manifest = {f['path']: f['key'] for f in files}
    worker_js = build_merged_worker_js()
    dep = multipart_deploy(account_id, cf_token, manifest, worker_js)
    deploy_url = dep.get('result', {}).get('url') or f'https://{PROJECT_NAME}.pages.dev'
    print(f'Deployed URL: {deploy_url}', flush=True)

    print('\nMemverifikasi endpoint live...', flush=True)
    if not check_live(deploy_url):
        sys.exit(1)
    print(f'\nSUKSES! Live di https://{PROJECT_NAME}.pages.dev', flush=True)


if __name__ == '__main__':
    main()

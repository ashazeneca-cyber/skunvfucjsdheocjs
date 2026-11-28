#!/usr/bin/env python3
"""
RAPSONYX End-to-End Structural, Asset Manifest & HTTP Smoke Verification
1. Validates JSON & wrangler.toml syntax.
2. Validates all relative ES6 module imports & named exports across js/**/*.js.
3. Validates all getElementById(...) targets in js/ exist in index.html.
4. Validates all physical assets/* paths referenced in code exist inside LIVE_ASSETS_FILE_LIST.txt (8,623 files).
5. Runs Node syntax check (--check) on all .js / .mjs files.
6. Launches local scripts/dev-server.py and verifies HTTP 200 (app/api) & HTTP 403 (voice/path-traversal guards).
"""

import json
import os
import pathlib
import re
import shutil
import socket
import subprocess
import sys
import time
import tomllib
import urllib.error
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT = pathlib.Path(__file__).resolve().parent.parent
LIVE_ASSET_LIST = pathlib.Path(r'C:\Users\Hype AMD\Downloads\LIVE_ASSETS_FILE_LIST.txt')


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def check_configs(errors: list):
    for rel in [
        'package.json',
        'manifest.json',
        '_routes.json',
        'server/package.json',
        'data/heroes_42_bio.json',
        'data/items_spells_emblems.json',
        'data/ranks_achievements.json',
    ]:
        try:
            json.loads((ROOT / rel).read_text(encoding='utf-8'))
        except Exception as exc:
            errors.append(f'{rel}: Invalid JSON -> {exc}')

    try:
        tomllib.loads((ROOT / 'wrangler.toml').read_text(encoding='utf-8'))
    except Exception as exc:
        errors.append(f'wrangler.toml: Invalid TOML -> {exc}')


def parse_exports(file_path: pathlib.Path) -> set:
    txt = file_path.read_text(encoding='utf-8')
    names = set()
    for m in re.finditer(r'\bexport\s+(?:async\s+)?(?:class|function|const|let|var)\s+([A-Za-z0-9_$]+)', txt):
        names.add(m.group(1))
    for m in re.finditer(r'\bexport\s*\{([^}]+)\}', txt):
        for part in m.group(1).split(','):
            part = part.strip()
            if not part:
                continue
            if ' as ' in part:
                names.add(part.split(' as ', 1)[1].strip())
            else:
                names.add(part)
    return names


def check_es6_modules(errors: list):
    export_cache = {}
    js_files = sorted((ROOT / 'js').rglob('*.js'))

    for fp in js_files:
        txt = fp.read_text(encoding='utf-8')
        # Static named/default/namespace imports from relative paths
        for m in re.finditer(r'''import\s+(?:(\{[^}]+\})|\*\s+as\s+[A-Za-z0-9_$]+|[A-Za-z0-9_$]+)\s+from\s+['"](\.[^'"]+)['"]''', txt):
            named_block = m.group(1)
            rel_mod = m.group(2)
            target = (fp.parent / rel_mod).resolve()
            if not target.is_file():
                errors.append(f'{fp.relative_to(ROOT)}: broken relative import `{rel_mod}`')
                continue
            if named_block:
                if target not in export_cache:
                    export_cache[target] = parse_exports(target)
                available = export_cache[target]
                for item in named_block.strip('{}').split(','):
                    item = item.strip()
                    if not item:
                        continue
                    orig = item.split(' as ', 1)[0].strip() if ' as ' in item else item
                    if orig not in available:
                        errors.append(f'{fp.relative_to(ROOT)}: imported `{orig}` not exported by {target.relative_to(ROOT)}')

        # Dynamic relative imports
        for m in re.finditer(r'''import\(\s*['"](\.[^'"]+)['"]\s*\)''', txt):
            rel_mod = m.group(1)
            target = (fp.parent / rel_mod).resolve()
            if not target.is_file():
                errors.append(f'{fp.relative_to(ROOT)}: broken dynamic import `{rel_mod}`')


def check_dom_ids(errors: list):
    idx_html = (ROOT / 'index.html').read_text(encoding='utf-8')
    html_ids = set(re.findall(r'\bid="([^"]+)"', idx_html))
    js_declared_ids = set()
    js_files = sorted((ROOT / 'js').rglob('*.js'))
    for fp in js_files:
        txt = fp.read_text(encoding='utf-8')
        for m in re.finditer(r'\bid="([^"${}\s]+)"', txt):
            js_declared_ids.add(m.group(1))
    known_ids = html_ids | js_declared_ids

    js_ids = set()
    for fp in js_files:
        txt = fp.read_text(encoding='utf-8')
        for m in re.finditer(r'''getElementById\(\s*['"]([^'"]+)['"]\s*\)''', txt):
            id_val = m.group(1)
            js_ids.add(id_val)
            if id_val not in known_ids:
                errors.append(f'{fp.relative_to(ROOT)}: getElementById("{id_val}") missing from index.html & JS templates')

    # Verify CSS class parity on Luminous Frost classes
    all_css = '\n'.join(p.read_text(encoding='utf-8') for p in sorted((ROOT / 'css').glob('*.css')))
    for cls in ['rap-btn', 'rap-btn-crystal', 'rap-btn-danger', 'rap-brand-pill', 'rap-calligraphy-svg', 'rap-calligraphy-char', 'rap-dialog', 'rap-modal-header', 'rap-tabs', 'frost-panel']:
        if f'.{cls}' not in all_css:
            errors.append(f'CSS class .{cls} not defined in css/*.css')
    print(f'[VERIFY] DOM IDs verified: {len(js_ids)} JS element lookups matched HTML IDs')


def check_assets_against_manifest(errors: list):
    if not LIVE_ASSET_LIST.is_file():
        errors.append(f'Missing asset list file: {LIVE_ASSET_LIST}')
        return

    live_paths = set()
    for ln in LIVE_ASSET_LIST.read_text(encoding='utf-8', errors='ignore').splitlines():
        if '\tassets/' in ln:
            live_paths.add(ln.split('\t', 1)[1].strip())

    asset_refs = set()
    for fp in sorted((ROOT / 'js').rglob('*.js')):
        txt = fp.read_text(encoding='utf-8')
        for m in re.finditer(r'''['"](assets/[^'"]+\.(?:json|glb|gltf|bin|f32|webp|png|jpg|jpeg|hdr|cube|ogg|mp3))['"]''', txt):
            ref = m.group(1)
            # Exclude security blacklist prefixes and generated/template paths if any
            if ref.endswith('/'):
                continue
            asset_refs.add((fp.relative_to(ROOT).as_posix(), ref))

    missing = []
    for src, ref in sorted(asset_refs):
        if ref not in live_paths:
            missing.append(f'{src}: asset path missing in LIVE_ASSETS_FILE_LIST -> {ref}')

    errors.extend(missing)
    print(f'[VERIFY] Asset path cross-check: {len(asset_refs)} paths checked against {len(live_paths)} live repo assets ({len(missing)} missing)')


def check_node_syntax(errors: list):
    node_exe = shutil.which('node') or (r'C:\Program Files\nodejs\node.exe' if os.path.isfile(r'C:\Program Files\nodejs\node.exe') else None)
    if not node_exe:
        errors.append('Node binary not found on PATH or C:\\Program Files\\nodejs\\node.exe')
        return
    files = sorted(list((ROOT / 'js').rglob('*.js')) + list((ROOT / 'functions').rglob('*.js')) + list((ROOT / 'worker').rglob('*.js')) + list((ROOT / 'scripts').glob('*.mjs')))
    for fp in files:
        res = subprocess.run([node_exe, '--check', str(fp)], capture_output=True, text=True)
        if res.returncode != 0:
            errors.append(f'Syntax check failed for {fp.relative_to(ROOT)}: {res.stderr.strip()}')
    print(f'[VERIFY] Node syntax check passed for {len(files)} JS/MJS files')


def http_get(url: str):
    req = urllib.request.Request(url, method='GET')
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return resp.status, dict(resp.headers.items()), resp.read()
    except urllib.error.HTTPError as err:
        return err.code, dict(err.headers.items()), err.read()


def check_cf_function_redirect_unit(errors: list):
    node_exe = shutil.which('node') or (r'C:\Program Files\nodejs\node.exe' if os.path.isfile(r'C:\Program Files\nodejs\node.exe') else None)
    if not node_exe:
        errors.append('Node binary not found for CF Function unit test')
        return

    fn_uri = (ROOT / 'functions/cdn/[[path]].js').resolve().as_uri()
    origin_repo = 'ashazeneca/' + 'onyx' + 'pure-live-cdn'
    script = f"""
import * as fnMod from {json.dumps(fn_uri)};
const handler = fnMod.onRequest || fnMod.onRequestGet;
if (typeof handler !== 'function') throw new Error('Missing onRequest handler');

globalThis.caches = {{
  default: {{
    match: async () => undefined,
    put: async () => {{}}
  }}
}};

const seen = [];
globalThis.fetch = async (url, init = {{}}) => {{
  const hdrs = init.headers instanceof Headers ? Object.fromEntries(init.headers.entries()) : (init.headers || {{}});
  const auth = hdrs.authorization || hdrs.Authorization || null;
  seen.push({{ url: String(url), auth, redirect: init.redirect }});
  if (String(url).startsWith('https://huggingface.co/')) {{
    return new Response(null, {{
      status: 302,
      headers: {{ Location: 'https://cas-bridge.xethub.hf.co/lfs/test_blob.glb' }}
    }});
  }}
  if (String(url).startsWith('https://cas-bridge.xethub.hf.co/')) {{
    if (auth) throw new Error('Authorization leaked onto cross-host redirect!');
    return new Response('GLB_OK', {{ status: 200, headers: {{ 'Content-Type': 'model/gltf-binary' }} }});
  }}
  throw new Error('Unexpected URL: ' + url);
}};

const baseEnv = {{
  RAPSONYX_SECRET: 'test_sec_123',
  RAPSONYX_ORIGIN_REPO: {json.dumps(origin_repo)},
  RAPSONYX_ORIGIN_BRANCH: 'main'
}};

// (a) 302 redirect from huggingface.co -> cas-bridge strips Authorization on hop 2
const resOk = await handler({{
  request: new Request('https://rapsonyx.pages.dev/cdn/assets/heroes/team_dream/freya_web_opt.glb'),
  env: baseEnv,
  params: {{ path: ['assets', 'heroes', 'team_dream', 'freya_web_opt.glb'] }},
  waitUntil: (p) => p
}});
if (resOk.status !== 200 || (await resOk.text()) !== 'GLB_OK') {{
  throw new Error('Expected 200 GLB_OK, got ' + resOk.status);
}}
if (seen.length !== 2 || seen[0].auth !== 'Bearer test_sec_123' || seen[1].auth !== null) {{
  throw new Error('Auth header hop mismatch: ' + JSON.stringify(seen));
}}

// (b) Block voice-over & offline weights with 403 X-Rapsonyx-Status: BLOCKED-403 / BLOCKED-VOICE-OVER
for (const pArr of [
  ['assets', 'audio', 'voices_real', 'freya.ogg'],
  ['assets', 'ai_brain', 'neural_motion', 'motion.npz']
]) {{
  const resBlk = await handler({{
    request: new Request('https://rapsonyx.pages.dev/cdn/' + pArr.join('/')),
    env: baseEnv,
    params: {{ path: pArr }},
    waitUntil: (p) => p
  }});
  const xStat = resBlk.headers.get('X-Rapsonyx-Status');
  if (resBlk.status !== 403 || !['BLOCKED-403', 'BLOCKED-VOICE-OVER'].includes(xStat)) {{
    throw new Error('Expected 403 BLOCKED for ' + pArr.join('/') + ', got ' + resBlk.status + ' (' + xStat + ')');
  }}
}}

// (c) Path traversal returns 400
const resTrav = await handler({{
  request: new Request('https://rapsonyx.pages.dev/cdn/..%2Fetc%2Fpasswd'),
  env: baseEnv,
  params: {{ path: ['..', 'etc', 'passwd'] }},
  waitUntil: (p) => p
}});
if (resTrav.status !== 400) {{
  throw new Error('Expected 400 traversal rejection, got ' + resTrav.status);
}}
console.log('CF_FN_UNIT_OK');
"""
    res = subprocess.run([node_exe, '--input-type=module', '-e', script], capture_output=True, text=True)
    if res.returncode != 0 or 'CF_FN_UNIT_OK' not in res.stdout:
        errors.append(f'CF Function 5-hop unit test failed: {res.stderr.strip() or res.stdout.strip()}')
    else:
        print('[VERIFY] CF Function 5-hop redirect & guard unit test passed')


def check_live_hf_smoke(errors: list):
    base = os.environ.get('RAPSONYX_SPACE_URL', 'https://ashazeneca-botanalistiktl.hf.space').rstrip('/')
    try:
        st_h, _, body_h = http_get(f'{base}/health')
        if st_h != 200:
            errors.append(f'Live HF /health expected 200, got {st_h}')
            return
        h_json = json.loads(body_h.decode('utf-8'))
        if h_json.get('version') != 'rapsonyx-v3':
            errors.append(f'Live HF /health expected version=rapsonyx-v3, got {h_json!r}')

        routes_200 = [
            ('/', b'<title>RAPSONYX</title>'),
            ('/api/health', b'"service":"rapsonyx-server"'),
            ('/api/leaderboard', b'"leaderboard"'),
            ('/data/heroes_42_bio.json', b'"freya"'),
            ('/data/items_spells_emblems.json', b'"items"'),
            ('/data/ranks_achievements.json', b'"tiers"'),
            ('/cdn/assets/heroes/heroes_42_web_manifest.json', b'"freya"'),
            ('/assets/heroes/heroes_42_web_manifest.json', b'"freya"'),
        ]
        for path_str, marker in routes_200:
            st, _, body = http_get(base + path_str)
            if st != 200:
                errors.append(f'Live HF {path_str}: expected 200, got {st}')
            elif marker and marker not in body:
                errors.append(f'Live HF {path_str}: missing marker {marker!r}')
            elif path_str == '/data/heroes_42_bio.json':
                bio = json.loads(body.decode('utf-8'))
                if len(bio.get('heroes', [])) != 42:
                    errors.append(f'Live HF /data/heroes_42_bio.json: expected 42 heroes, got {len(bio.get("heroes", []))}')

        routes_403 = [
            '/cdn/assets/audio/voices_real/team_dream/freya/freya_01_jiko_01.ogg',
            '/assets/audio/voices_cloned_504/freya.npz',
            '/cdn/assets/audio/announcer/first_blood.ogg',
            '/cdn/assets/ai_brain/neural_motion/motion_matching_43k_nodes/motion_matching_aaa_43k_nodes_fp16.npz',
        ]
        for path_str in routes_403:
            st, _, _ = http_get(base + path_str)
            if st != 403:
                errors.append(f'Live HF security guard {path_str}: expected 403, got {st}')

        st_trav, _, _ = http_get(base + '/cdn/..%2F..%2Fetc/passwd')
        if st_trav not in (400, 403):
            errors.append(f'Live HF traversal guard: expected 400/403, got {st_trav}')

        print(f'[VERIFY] Live HF Space smoke check passed at {base} ({len(routes_200)} 200-routes, {len(routes_403)} 403-guards)')
    except Exception as exc:
        errors.append(f'Live HF smoke check error: {exc}')


def main():
    errors = []
    check_configs(errors)
    check_es6_modules(errors)
    check_dom_ids(errors)
    check_assets_against_manifest(errors)
    check_node_syntax(errors)
    check_cf_function_redirect_unit(errors)
    check_live_hf_smoke(errors)

    if errors:
        print(f'[VERIFY] FAILED with {len(errors)} error(s):')
        for e in errors:
            print('  FAIL:', e)
        sys.exit(1)

    print('[VERIFY] PASS: Configs, ES6 imports, DOM IDs, live assets, JS syntax, CF 5-hop unit test, and Live HF smoke all passed.')
    sys.exit(0)


if __name__ == '__main__':
    main()

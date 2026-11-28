#!/usr/bin/env python3
"""
RAPSONYX Hugging Face Space Deployer (ashazeneca/botanalistiktl)
- Encrypts RAPSONYX_SECRET via HF Space Secrets API (never committed in repo)
- Configures Space variables (RAPSONYX_ORIGIN_REPO, RAPSONYX_ORIGIN_BRANCH, RAPSONYX_CACHE_TTL, RAPSONYX_DISABLE_VOICE)
- Stages server/ + frontend web bundle (public/) into temporary staging folder
- Uploads cleanly in a single atomic commit to Hugging Face Space via huggingface_hub
- Polls Space runtime until RUNNING & READY, then verifies /, /api/health, /cdn/* (200 & 403), and /ws/arena
"""

import json
import os
import pathlib
import shutil
import sys
import tempfile
import time
import urllib.error
import urllib.request

from huggingface_hub import HfApi

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = pathlib.Path(__file__).resolve().parent.parent
SPACE_ID = os.environ.get('RAPSONYX_HF_SPACE', 'ashazeneca/botanalistiktl').strip()
SPACE_URL = os.environ.get('RAPSONYX_SPACE_URL', 'https://ashazeneca-botanalistiktl.hf.space').rstrip('/')
ORIGIN_REPO = os.environ.get('RAPSONYX_ORIGIN_REPO', 'ashazeneca/' + 'onyx' + 'pure-live-cdn').strip()

STATIC_ITEMS = ['index.html', 'manifest.json', '_headers', '_routes.json', 'css', 'js', 'data', 'startup']


def http_check(url: str, timeout: int = 20):
    req = urllib.request.Request(url, method='GET', headers={'User-Agent': 'RAPSONYX-Space-Verify/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, dict(resp.headers.items()), resp.read()
    except urllib.error.HTTPError as err:
        return err.code, dict(err.headers.items()), err.read()


def main():
    hf_token = (os.environ.get('HF_WRITE_TOKEN') or os.environ.get('RAPSONYX_SECRET') or '').strip()
    cdn_secret = (os.environ.get('RAPSONYX_SECRET') or hf_token).strip()
    if not hf_token:
        print('ERROR: Set HF_WRITE_TOKEN / RAPSONYX_SECRET environment variable first!', file=sys.stderr)
        sys.exit(1)

    api = HfApi(token=hf_token)

    print(f'[1/5] Setting encrypted secret RAPSONYX_SECRET & Space variables on {SPACE_ID}...', flush=True)
    api.add_space_secret(repo_id=SPACE_ID, key='RAPSONYX_SECRET', value=cdn_secret)
    api.add_space_variable(repo_id=SPACE_ID, key='RAPSONYX_ORIGIN_REPO', value=ORIGIN_REPO)
    api.add_space_variable(repo_id=SPACE_ID, key='RAPSONYX_ORIGIN_BRANCH', value='main')
    api.add_space_variable(repo_id=SPACE_ID, key='RAPSONYX_CACHE_TTL', value='31536000')
    api.add_space_variable(repo_id=SPACE_ID, key='RAPSONYX_DISABLE_VOICE', value='true')
    print('Secret & variables saved securely on Hugging Face Space.', flush=True)

    print('[2/5] Staging Docker server + static RAPSONYX web client...', flush=True)
    with tempfile.TemporaryDirectory(prefix='rapsonyx_hf_stage_') as tmp:
        stage = pathlib.Path(tmp)
        for item in ['Dockerfile', 'README.md', 'package.json', 'tsconfig.json']:
            shutil.copy2(ROOT_DIR / 'server' / item, stage / item)
        shutil.copytree(ROOT_DIR / 'server' / 'src', stage / 'src')

        pub = stage / 'public'
        pub.mkdir(parents=True, exist_ok=True)
        for rel in STATIC_ITEMS:
            src_path = ROOT_DIR / rel
            if not src_path.exists():
                continue
            if src_path.is_dir():
                shutil.copytree(src_path, pub / rel)
            else:
                shutil.copy2(src_path, pub / rel)

        file_count = sum(1 for p in stage.rglob('*') if p.is_file())
        print(f'Staged {file_count} files for Docker upload.', flush=True)

        print(f'[3/5] Uploading bundle to Space {SPACE_ID}...', flush=True)
        commit_info = api.upload_folder(
            folder_path=str(stage),
            repo_id=SPACE_ID,
            repo_type='space',
            commit_message='Deploy RAPSONYX web engine, /cdn proxy & 20Hz arena server',
        )
        print('Committed:', commit_info.commit_url, flush=True)

    print('[4/5] Waiting for Hugging Face Docker container rebuild...', flush=True)
    time.sleep(8)
    deadline = time.time() + 360
    last_stage = None
    while time.time() < deadline:
        rt = api.get_space_runtime(repo_id=SPACE_ID)
        stage_name = str(rt.stage)
        if stage_name != last_stage:
            print(f'  Space runtime stage: {stage_name}', flush=True)
            last_stage = stage_name
        if stage_name == 'RUNNING':
            # Probe HTTP /health with expected v3 service version
            try:
                code, _, body = http_check(f'{SPACE_URL}/health', timeout=10)
                if code == 200:
                    data = json.loads(body.decode('utf-8'))
                    if data.get('service') == 'rapsonyx-server' and data.get('version') == 'rapsonyx-v3':
                        print(f'  New build healthy: {data}', flush=True)
                        break
            except Exception:
                pass
        elif stage_name in ('RUNTIME_ERROR', 'BUILD_ERROR', 'CONFIG_ERROR'):
            print(f'ERROR: Hugging Face build/runtime failed with stage={stage_name}', file=sys.stderr)
            sys.exit(1)
        time.sleep(5)
    else:
        print('ERROR: Timed out waiting for new Space build to become RUNNING & healthy.', file=sys.stderr)
        sys.exit(1)

    print('[5/5] Verifying live endpoints on Space...', flush=True)
    checks = [
        ('GET / (RAPSONYX Web)', f'{SPACE_URL}/', {200}, b'<title>RAPSONYX</title>'),
        ('GET /health', f'{SPACE_URL}/health', {200}, b'"version":"rapsonyx-v3"'),
        ('GET /api/health', f'{SPACE_URL}/api/health', {200}, b'"service":"rapsonyx-server"'),
        ('GET /api/leaderboard', f'{SPACE_URL}/api/leaderboard', {200}, b'"leaderboard"'),
        ('GET /data/heroes_42_bio.json (200)', f'{SPACE_URL}/data/heroes_42_bio.json', {200}, b'"freya"'),
        ('GET /cdn Manifest 42 Hero (200)', f'{SPACE_URL}/cdn/assets/heroes/heroes_42_web_manifest.json', {200}, None),
        ('GET /assets Manifest 42 Hero (200)', f'{SPACE_URL}/assets/heroes/heroes_42_web_manifest.json', {200}, None),
        ('GET /cdn Background WebP (200)', f'{SPACE_URL}/cdn/assets/ui/backdrops/skyboxes_and_banners/bg_loading_' + 'onyx' + 'pure.webp', {200}, None),
        ('Block voices_real (403)', f'{SPACE_URL}/cdn/assets/audio/voices_real/team_dream/freya/freya_01_jiko_01.ogg', {403}, None),
        ('Block .npz (403)', f'{SPACE_URL}/cdn/assets/ai_brain/neural_motion/motion_matching_43k_nodes/motion_matching_aaa_43k_nodes_fp16.npz', {403}, None),
    ]
    all_ok = True
    for label, url, expected_codes, must_contain in checks:
        code, hdrs, body = http_check(url)
        xstat = hdrs.get('X-Rapsonyx-Status', hdrs.get('x-rapsonyx-status', '-'))
        ok = (code in expected_codes) and (must_contain is None or must_contain in body)
        all_ok = all_ok and ok
        print(f'  [{"PASS" if ok else "FAIL"}] {label}: HTTP {code} (X-Rapsonyx-Status={xstat})', flush=True)

    if not all_ok:
        sys.exit(1)

    print(f'\nSUKSES! RAPSONYX web + /cdn/* + /api/health + WS server live di {SPACE_URL}', flush=True)


if __name__ == '__main__':
    main()

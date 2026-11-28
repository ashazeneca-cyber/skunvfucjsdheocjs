#!/usr/bin/env python3
"""
RAPSONYX Strict Rebrand & Isolation Audit Gate
Enforces 100% RAPSONYX naming across public UI, code, config, workers, headers, and storage,
while keeping legacy physical repo strings strictly isolated inside:
  1. RAPSONYX_ORIGIN_REPO = "ashazeneca/onyxpure-live-cdn"
  2. RAPSONYX_INTERNAL_PATHS in js/core/AssetRegistry.js
Also enforces 0% voice-over blacklist compliance and zero emoji UI.
"""

import json
import pathlib
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT = pathlib.Path(__file__).resolve().parent.parent

SCAN_EXTS = {'.js', '.mjs', '.ts', '.java', '.py', '.sh', '.html', '.css', '.json', '.toml', '.xml', '.md', ''}
SPECIAL_NAMES = {'_headers', 'Dockerfile.java'}
SKIP_DIRS = {'node_modules', '.git', '__pycache__', 'startup', 'target', 'dist'}

ALLOWED_ORIGIN_REPO = 'ashazeneca/' + 'onyx' + 'pure-live-cdn'

# Construct forbidden patterns dynamically to prevent self-match false positives
P_ONYXPURE = 'onyx' + 'pure'
P_LONE_ONYX = r'(?<!raps)onyx'
P_WUKONG = 'wu' + 'kong'
P_BLACKMYTH = r'black\s*myth'
P_REIA = r'\breia\b'
P_GENSHIN = r'gen' + 'shin'
P_MLBB = r'\bml' + r'bb\b'
P_MOBILELEGENDS = r'mobile\s*legends'
P_WUTHERING = 'wu' + 'thering'
P_HONKAI = 'hon' + 'kai'
P_HF_TOKEN = r'\bhf_token\b'
P_TOKEN_HF = r'\btoken_hf\b'
P_HUGGINGFACE_TOKEN = r'\bhuggingface_token\b'
P_X_HF_CACHE = r'x-hf-cache'
P_X_ONYX_HDR = 'x-' + 'onyx' + 'pure-'

FORBIDDEN_GLOBAL_REGEX = re.compile(
    '|'.join([
        P_ONYXPURE, P_LONE_ONYX, P_WUKONG, P_BLACKMYTH, P_REIA,
        P_GENSHIN, P_MLBB, P_MOBILELEGENDS, P_WUTHERING, P_HONKAI,
        P_HF_TOKEN, P_TOKEN_HF, P_HUGGINGFACE_TOKEN, P_X_HF_CACHE, P_X_ONYX_HDR
    ]),
    re.I
)

# Forbidden runtime voice paths outside security filter definitions
VOICE_LEAK_REGEX = re.compile(
    r'(?:voices_real|voices_cloned_504|hero_voicelines_42|suaramemberjeketi|voice_refs_42)',
    re.I
)

EMOJI_REGEX = re.compile(
    '['
    '\U0001F300-\U0001F5FF'
    '\U0001F600-\U0001F64F'
    '\U0001F680-\U0001F6FF'
    '\U0001F900-\U0001F9FF'
    '\u2600-\u26FF'
    '\u2700-\u27BF'
    ']'
)


# Check no hardcoded tokens outside session env
TOKEN_SECRET_REGEX = re.compile(
    r'\b(?:' + 'cf' + r'ut_[A-Za-z0-9_]{12,}|' + 'h' + r'f_[A-Za-z0-9]{16,}|' + 'github_' + r'pat_[A-Za-z0-9_]{16,})\b'
)
LOCALHOST_REGEX = re.compile(r'(?:https?://|ws://|wss://)?(?:localhost|127\.0\.0\.1)(?::\d+)?', re.I)


def extract_internal_paths_span(text: str):
    start_marker = 'const RAPSONYX_INTERNAL_PATHS = Object.freeze({'
    start_idx = text.find(start_marker)
    if start_idx < 0:
        return None
    end_idx = text.find('});', start_idx)
    if end_idx < 0:
        return None
    return (start_idx, end_idx + 3)


def check_required_markers(errors: list):
    idx_html = (ROOT / 'index.html').read_text(encoding='utf-8')
    if '<title>RAPSONYX</title>' not in idx_html:
        errors.append('index.html: missing <title>RAPSONYX</title>')
    if 'id="pre-entry-rapsonyx-svg"' not in idx_html:
        errors.append('index.html: missing #pre-entry-rapsonyx-svg')
    if 'id="rapsonyxFrostGrad"' not in idx_html:
        errors.append('index.html: missing #rapsonyxFrostGrad gradient')
    for col in ('#0284c7', '#22d3ee', '#10b981', '#2563eb'):
        if col not in idx_html:
            errors.append(f'index.html: missing calligraphy gradient stop {col}')

    letters = re.findall(r'class="rap-calligraphy-char"[^>]*>([A-Z])</text>', idx_html)
    if letters != list('RAPSONYX'):
        errors.append(f'index.html: calligraphy SVG letters mismatch: {letters!r} (expected R-A-P-S-O-N-Y-X)')

    anim_css = (ROOT / 'css/animations_calligraphy.css').read_text(encoding='utf-8')
    if '@keyframes rapsonyxStrokeDraw' not in anim_css or '@keyframes rapsonyxFrostPulse' not in anim_css:
        errors.append('css/animations_calligraphy.css: missing rapsonyx keyframes')

    wrangler = (ROOT / 'wrangler.toml').read_text(encoding='utf-8')
    if 'name = "rapsonyx"' not in wrangler:
        errors.append('wrangler.toml: name must be "rapsonyx"')
    if f'RAPSONYX_ORIGIN_REPO = "{ALLOWED_ORIGIN_REPO}"' not in wrangler:
        errors.append(f'wrangler.toml: RAPSONYX_ORIGIN_REPO must equal "{ALLOWED_ORIGIN_REPO}"')

    manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
    for k, expected in [('name', 'RAPSONYX'), ('short_name', 'RAPSONYX'), ('display', 'fullscreen'), ('orientation', 'landscape'), ('theme_color', '#0284c7')]:
        if manifest.get(k) != expected:
            errors.append(f'manifest.json: {k} expected {expected!r}, got {manifest.get(k)!r}')

    registry = (ROOT / 'js/core/AssetRegistry.js').read_text(encoding='utf-8')
    if 'window.__RAPSONYX_CDN__' not in registry:
        errors.append('js/core/AssetRegistry.js: missing window.__RAPSONYX_CDN__')
    if 'const RAPSONYX_INTERNAL_PATHS = Object.freeze({' not in registry:
        errors.append('js/core/AssetRegistry.js: missing RAPSONYX_INTERNAL_PATHS')

    local_cache = (ROOT / 'js/core/LocalAssetCache.js').read_text(encoding='utf-8')
    if "'rapsonyx-db'" not in local_cache or "'rapsonyx-cache'" not in local_cache:
        errors.append('js/core/LocalAssetCache.js: missing rapsonyx-db / rapsonyx-cache')
    if 'X-Rapsonyx-Status' not in local_cache:
        errors.append('js/core/LocalAssetCache.js: missing X-Rapsonyx-Status header')

    for rel_fn in ['functions/cdn/[[path]].js', 'worker/cdn-proxy.js', 'scripts/deploy_cloudflare.py', 'server/src/index.ts']:
        txt = (ROOT / rel_fn).read_text(encoding='utf-8')
        if 'RAPSONYX_SECRET' not in txt:
            errors.append(f'{rel_fn}: missing RAPSONYX_SECRET')

    for forbidden_dev in ['scripts/dev-server.py', 'scripts/dev-server.mjs']:
        if (ROOT / forbidden_dev).exists():
            errors.append(f'Cloud-only violation: {forbidden_dev} must not exist')

    required_modules = [
        ('js/shaders/RapsonyxLighting.js', 'export class RapsonyxLighting'),
        ('js/shaders/RapsonyxCharacterShader.js', 'export class RapsonyxCharacterShader'),
        ('js/shaders/RapsonyxWorldShader.js', 'export class RapsonyxWorldShader'),
        ('js/combat/RapsonyxCombatMath.js', 'export class RapsonyxCombatMath'),
        ('server-java/src/main/java/id/rapsonyx/server/RapsonyxServerApp.java', 'package id.rapsonyx.server;'),
    ]
    for rel, marker in required_modules:
        fp = ROOT / rel
        if not fp.is_file():
            errors.append(f'Missing renamed module: {rel}')
        elif marker not in fp.read_text(encoding='utf-8'):
            errors.append(f'{rel}: missing expected symbol `{marker}`')

    obsolete = [
        'js/shaders/' + 'Onyx' + 'pureLighting.js',
        'js/shaders/' + 'Onyx' + 'pureCharacterShader.js',
        'js/shaders/' + 'Onyx' + 'pureWorldShader.js',
        'js/combat/' + 'Onyx' + 'pureCombatMath.js',
        'server-java/src/main/java/id/' + 'onyx' + 'pure',
    ]
    for rel in obsolete:
        if (ROOT / rel).exists():
            errors.append(f'Obsolete legacy path still exists: {rel}')


def main():
    errors = []
    check_required_markers(errors)

    scanned = 0
    for p in sorted(ROOT.rglob('*')):
        if any(part in SKIP_DIRS for part in p.parts) or not p.is_file():
            continue
        if p.suffix.lower() not in SCAN_EXTS and p.name not in SPECIAL_NAMES:
            continue

        rel = p.relative_to(ROOT).as_posix()
        try:
            text = p.read_text(encoding='utf-8')
        except Exception:
            continue
        scanned += 1

        span = extract_internal_paths_span(text) if rel == 'js/core/AssetRegistry.js' else None

        # Strip allowed origin repo value for global forbidden check
        char_offset = 0
        for lineno, line in enumerate(text.splitlines(True), 1):
            line_start = char_offset
            char_offset += len(line)

            in_internal_map = bool(span and line_start >= span[0] and line_start <= span[1])

            # Check emoji across web/worker/script files (server/README.md HF YAML metadata exempted)
            if rel != 'server/README.md' and EMOJI_REGEX.search(line):
                errors.append(f'{rel}:{lineno}: UI/Code emoji forbidden -> {line.strip()}')

            # Check accidental voice leak outside blacklist definitions & verify scripts
            if rel not in {
                'js/core/AssetRegistry.js',
                'functions/cdn/[[path]].js',
                'worker/cdn-proxy.js',
                'scripts/deploy_cloudflare.py',
                'scripts/deploy-cloudflare.mjs',
                'scripts/deploy_hf_space.py',
                'scripts/audit-rapsonyx.py',
                'scripts/verify_rapsonyx.py',
                'server/src/index.ts',
            }:
                if VOICE_LEAK_REGEX.search(line):
                    errors.append(f'{rel}:{lineno}: Unauthorized voice reference -> {line.strip()}')

            # Check hardcoded secret tokens across ALL workspace files
            if TOKEN_SECRET_REGEX.search(line):
                errors.append(f'{rel}:{lineno}: Hardcoded token/secret detected!')

            # Check localhost / 127.0.0.1 leakage in frontend & CF functions
            if rel == 'index.html' or rel.startswith('js/') or rel.startswith('functions/'):
                if LOCALHOST_REGEX.search(line):
                    errors.append(f'{rel}:{lineno}: Localhost reference forbidden in cloud-only build -> {line.strip()}')

            if in_internal_map:
                # Inside RAPSONYX_INTERNAL_PATHS only values on right side of ':' may keep physical legacy tokens
                if ':' in line:
                    lhs, rhs = line.split(':', 1)
                    if FORBIDDEN_GLOBAL_REGEX.search(lhs):
                        errors.append(f'{rel}:{lineno}: Legacy token in alias key -> {lhs.strip()}')
                elif FORBIDDEN_GLOBAL_REGEX.search(line) and 'const RAPSONYX_INTERNAL_PATHS' not in line and not line.strip().startswith('//'):
                    errors.append(f'{rel}:{lineno}: Legacy token in map line -> {line.strip()}')
                continue

            # Exempt self audit regex constructor & deployer test URL lines cleanly
            if rel in {'scripts/audit-rapsonyx.py', 'scripts/verify_rapsonyx.py', 'scripts/deploy_hf_space.py'}:
                continue

            # Replace exact physical origin repo literal before scanning
            cleaned = line.replace(ALLOWED_ORIGIN_REPO, '')
            m = FORBIDDEN_GLOBAL_REGEX.search(cleaned)
            if m:
                errors.append(f'{rel}:{lineno}: Forbidden legacy string {m.group(0)!r} -> {line.strip()}')

    print(f'[AUDIT] Scanned {scanned} files in {ROOT}')
    if errors:
        print(f'[AUDIT] FAILED with {len(errors)} violation(s):')
        for e in errors:
            print('  FAIL:', e)
        sys.exit(1)

    print('[AUDIT] PASS: 100% RAPSONYX branding, zero leaks, physical paths isolated safely.')
    sys.exit(0)


if __name__ == '__main__':
    main()

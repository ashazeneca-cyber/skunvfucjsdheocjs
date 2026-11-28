#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PROJECT_NAME = 'rapsonyx';

if (!process.env.CLOUDFLARE_API_TOKEN) {
  console.error('ERROR: Set environment variable CLOUDFLARE_API_TOKEN before running deploy-cloudflare.mjs.');
  process.exit(1);
}
process.env.CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';

const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function runStep(label, args, options = {}) {
  console.log(`\n${label}`);
  const result = spawnSync(npxCmd, args, {
    cwd: ROOT_DIR,
    env: process.env,
    stdio: options.input ? ['pipe', 'inherit', 'inherit'] : 'inherit',
    input: options.input,
    shell: process.platform === 'win32'
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0 && !options.allowFail) {
    throw new Error(`Command failed (${result.status}): ${npxCmd} ${args.join(' ')}`);
  }
  return result;
}

async function smokeTest(baseUrl) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const checks = [
    {
      name: 'Manifest 42 Hero Web (200 OK)',
      url: `${cleanBase}/cdn/assets/heroes/heroes_42_web_manifest.json`,
      expected: [200]
    },
    {
      name: 'Blokir voices_real (403 Forbidden)',
      url: `${cleanBase}/cdn/assets/audio/voices_real/team_dream/freya/freya_01_jiko_01.ogg`,
      expected: [403]
    },
    {
      name: 'Blokir announcer (403 Forbidden)',
      url: `${cleanBase}/cdn/assets/audio/announcer/test_blocked.ogg`,
      expected: [403]
    },
    {
      name: 'Blokir offline NPZ (403 Forbidden)',
      url: `${cleanBase}/cdn/assets/ai_brain/neural_motion/motion_matching_43k_nodes/motion_matching_aaa_43k_nodes_fp16.npz`,
      expected: [403]
    }
  ];

  for (const check of checks) {
    try {
      const res = await fetch(check.url, { method: 'GET' });
      const ok = check.expected.includes(res.status);
      console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${check.name} -> HTTP ${res.status}`);
      if (!ok) process.exitCode = 1;
    } catch (err) {
      console.log(`  [WARN] ${check.name} -> ${err.message}`);
    }
  }
}

async function main() {
  runStep('[1/5] Verifikasi akun Cloudflare...', ['wrangler', 'whoami']);

  runStep(
    `[2/5] Pastikan proyek Cloudflare Pages '${PROJECT_NAME}' tersedia...`,
    ['wrangler', 'pages', 'project', 'create', PROJECT_NAME, '--production-branch=main'],
    { allowFail: true }
  );

  const secret = process.env.RAPSONYX_SECRET;
  if (!secret || !secret.trim()) {
    console.error('\nERROR: Variabel lingkungan RAPSONYX_SECRET belum diisi sebelum deploy!');
    console.error('Windows PowerShell:');
    console.error('  $env:RAPSONYX_SECRET="<isi_token_privat_repo>"; npm run deploy');
    console.error('Linux/macOS:');
    console.error('  export RAPSONYX_SECRET="<isi_token_privat_repo>" && npm run deploy');
    process.exit(1);
  }

  console.log(`\n[3/5] Daftarkan Cloudflare Secret 'RAPSONYX_SECRET' pada '${PROJECT_NAME}'...`);
  runStep(
    `Mengunggah RAPSONYX_SECRET ke '${PROJECT_NAME}'...`,
    ['wrangler', 'pages', 'secret', 'put', 'RAPSONYX_SECRET', `--project-name=${PROJECT_NAME}`],
    { input: secret.trim() }
  );
  console.log(`Secret RAPSONYX_SECRET berhasil dipasang di Cloudflare Pages '${PROJECT_NAME}'.`);

  runStep(
    `[4/5] Upload & Deploy otomatis seluruh proyek + /cdn/* Functions ke Cloudflare Pages...`,
    ['wrangler', 'pages', 'deploy', '.', `--project-name=${PROJECT_NAME}`, '--branch=main']
  );

  const verifyUrl = process.env.RAPSONYX_DEPLOY_URL || `https://${PROJECT_NAME}.pages.dev`;
  console.log(`\n[5/5] Verifikasi endpoint /cdn/* dan blokir voice-over (403) pada ${verifyUrl}...`);
  await smokeTest(verifyUrl);
  console.log('\nDeploy RAPSONYX selesai!');
}

main().catch((err) => {
  console.error('\n[DEPLOY ERROR]', err.message);
  process.exit(1);
});

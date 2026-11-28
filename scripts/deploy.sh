#!/usr/bin/env bash
set -euo pipefail

# Token Cloudflare untuk auto-upload proyek "rapsonyx"
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "ERROR: Set CLOUDFLARE_API_TOKEN environment variable first!"
  exit 1
fi
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"
PROJECT_NAME="rapsonyx"

echo "[1/5] Verifikasi akun Cloudflare..."
npx wrangler whoami

echo "[2/5] Pastikan proyek Cloudflare Pages '$PROJECT_NAME' tersedia..."
npx wrangler pages project create "$PROJECT_NAME" --production-branch=main || true

echo "[3/5] Daftarkan Cloudflare Secret 'RAPSONYX_SECRET'..."
if [ -n "${RAPSONYX_SECRET:-}" ]; then
  printf "%s" "$RAPSONYX_SECRET" | npx wrangler pages secret put RAPSONYX_SECRET --project-name="$PROJECT_NAME"
  echo "Secret RAPSONYX_SECRET berhasil dipasang di Cloudflare Pages '$PROJECT_NAME'."
else
  echo "ERROR: Variabel lingkungan RAPSONYX_SECRET belum diisi sebelum deploy!"
  echo "Jalankan: export RAPSONYX_SECRET='<isi_token_privat_repo>' && ./scripts/deploy.sh"
  exit 1
fi

echo "[4/5] Upload & Deploy otomatis seluruh proyek + /cdn/* Functions ke Cloudflare Pages..."
npx wrangler pages deploy . --project-name="$PROJECT_NAME" --branch=main

echo "[5/5] Deploy RAPSONYX selesai! Verifikasi /cdn/* dan blokir voice-over (403)."

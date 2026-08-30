#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "📝 Starting PK Notes (Notion + Obsidian)"
echo "=========================================="

# Kill old processes on port 5175 and 5176 if running
fuser -k 5175/tcp 2>/dev/null || true
fuser -k 5176/tcp 2>/dev/null || true

# Start Backend on port 5176
echo "[1/2] Starting PK Notes Backend on port 5176..."
cd "$DIR/backend"
nohup node server.js > /tmp/pk-notes-backend.log 2>&1 &
BACKEND_PID=$!

# Start Frontend dev / preview on port 5175
echo "[2/2] Starting PK Notes Frontend on port 5175..."
cd "$DIR/frontend"
nohup npx vite --port 5175 --host > /tmp/pk-notes-frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 2

echo "=========================================="
echo "🎉 PK Notes is LIVE!"
echo "📱 Access URL (Local):     http://localhost:5175"
echo "🌐 Access URL (Tailscale): http://homelab.tail7d4c51.ts.net:5175"
echo "📂 Obsidian Vault Path:    /home/phakaphol/obsidian-vault"
echo "=========================================="

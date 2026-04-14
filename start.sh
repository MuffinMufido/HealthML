#!/bin/bash
# HealthML — start all three services
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "Stopping all services..."
  kill "$ML_PID" "$NODE_PID" "$FRONT_PID" 2>/dev/null || true
  wait 2>/dev/null
  echo "Done."
}
trap cleanup EXIT INT TERM

echo "Starting Python ML service (port 8000)..."
cd "$ROOT/backend/ml"
./start.sh &
ML_PID=$!

echo "Starting Node backend (port 3001)..."
cd "$ROOT/backend"
npm run dev &
NODE_PID=$!

echo "Starting Vite frontend (port 5173)..."
cd "$ROOT"
npm run dev &
FRONT_PID=$!

echo ""
echo "All services running:"
echo "  ML service  : http://localhost:8000"
echo "  Node API    : http://localhost:3001"
echo "  Frontend    : http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services."
wait

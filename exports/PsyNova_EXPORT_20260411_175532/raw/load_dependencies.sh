#!/bin/bash
cd "$(dirname "$0")/../.."
[ -f psynova/platform/ops/load_node_env.sh ] && source psynova/platform/ops/load_node_env.sh
echo "[PLOTTER] Sincronizando vendor..."
mkdir -p psynova/lib/npm_cache
npm install --prefix psynova/platform/backend --cache psynova/lib/npm_cache --prefer-offline
npm install --prefix psynova/platform/frontend --cache psynova/lib/npm_cache --prefer-offline

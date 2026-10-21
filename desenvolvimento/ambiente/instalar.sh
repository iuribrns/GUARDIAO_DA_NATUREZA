#!/bin/sh
set -eu
cd /workspace/GUARDIAO_DA_NATUREZA
node --version
npm ci
npm run tools:install
npm run check:tools
npm run build
npm run test:build

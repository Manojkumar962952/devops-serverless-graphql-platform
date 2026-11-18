#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "DevOps Assessment: Codebase & Build Validation"
echo "=========================================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 1. Lambda functions
echo -e "\n[1/3] Validating Lambda Functions..."
cd "$ROOT_DIR/lambda"
npm install
npm run typecheck
npm run build

# 2. Backend GraphQL Server
echo -e "\n[2/3] Validating Backend GraphQL Server..."
cd "$ROOT_DIR/backend"
npm install
npm run typecheck
npm run build

# 3. Frontend React App
echo -e "\n[3/3] Validating React Frontend Application..."
cd "$ROOT_DIR/frontend"
npm install
npm run typecheck
npm run build

cd "$ROOT_DIR"
echo -e "\n=========================================================="
echo " All builds, typechecks, and bundles succeeded with 0 errors!"
echo "=========================================================="

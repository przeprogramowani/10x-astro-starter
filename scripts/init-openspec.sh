#!/usr/bin/env bash
set -euo pipefail

# Load nvm if available (npm is not on PATH in non-interactive shells)
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

npm install -g @fission-ai/openspec@latest && openspec init

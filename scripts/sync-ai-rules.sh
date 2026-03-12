#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/CLAUDE.md"

TARGETS=(
  ".github/copilot-instructions.md"
  ".windsurfrules"
  "AGENTS.md"
)

echo ""
echo "Source: CLAUDE.md"
echo "Targets:"
echo ""

for target in "${TARGETS[@]}"; do
  dest="$ROOT/$target"
  mkdir -p "$(dirname "$dest")"
  cp "$SOURCE" "$dest"
  echo "  ✓ $target"
done

echo ""
echo "Synced ${#TARGETS[@]} file(s)."
echo ""

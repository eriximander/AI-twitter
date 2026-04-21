#!/bin/bash
# Run Codex from within Claude Code session
# Usage: ./scripts/codex-run.sh "your prompt here"
#        ./scripts/codex-run.sh --review          (code review mode)

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

if [ "${1:-}" = "--review" ]; then
    shift
    codex exec review "${@}"
elif [ -n "${1:-}" ]; then
    codex exec --full-auto "$@"
else
    echo "Usage:"
    echo "  ./scripts/codex-run.sh \"prompt\"    Run Codex with a task"
    echo "  ./scripts/codex-run.sh --review    Run code review"
    exit 1
fi

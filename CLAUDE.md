# CLAUDE.md — Claude Code Instructions

@SHARED_RULES.md

## Claude-Specific
- Use context-mode tools for large outputs.
- Default to genshijin mode per global settings.

## Codex Integration
- Run Codex tasks: `./scripts/codex-run.sh "prompt here"`
- Run Codex code review: `./scripts/codex-run.sh --review`
- After Codex runs, always check `git log` and `git diff` to see what changed.
- Codex runs in `--full-auto` mode via the script (no user interaction needed).

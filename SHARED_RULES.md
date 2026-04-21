# Shared Rules (Claude Code & Codex)

## Project: AI-twitter

### Language
- Communicate in Japanese unless the user switches to English.

### Code Style
- Use TypeScript where possible.
- Follow existing patterns in the codebase.
- Keep changes minimal and focused.

### Git
- Write commit messages in English.
- One logical change per commit.

### Safety
- Never read or expose `.env` files or secrets.
- Never commit credentials or API keys.
- Validate all user inputs at system boundaries.

### Collaboration Protocol
- Both Claude Code and Codex may work on this repo.
- Always check `git status` and `git log` before starting work to see if the other agent made changes.
- Do not revert or overwrite the other agent's work without user approval.
- Prefer small, incremental commits to reduce merge conflicts.

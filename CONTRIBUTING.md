# Contributing

The Alpha feature freeze remains in effect. Please discuss product features before implementing them; small bug fixes, security patches and documentation improvements are welcome.

Use Node 24 and pnpm 11.25.0. Follow [local setup](docs/local-development.md), then run `pnpm test`, `pnpm typecheck`, `pnpm build` and `pnpm audit`. The lockfile is part of every dependency change; do not use `npm install` in this pnpm project or bypass the release-age policy.

Keep pull requests focused. Describe the concrete problem, changed behavior, validation and any remaining limitations. Use synthetic fixtures. Do not attach real recipes, backups, screenshots with private account details, tokens or `.env` files. AI outputs are untrusted data and must remain reviewable before saving.

Security issues should follow [SECURITY.md](SECURITY.md), not public issues with exploit details. Use a GitHub no-reply email for commits if you do not want your personal address published in Git history.

Changes to application dependencies require import/backup/owner-isolation regression checks. Changes to hosting/authentication require separate live verification. A public source repository does not make the hosted notebook public.

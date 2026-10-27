# Local development

Use Node 24 and pnpm 11.25.0. Clone the repository and enter its directory, then:

```sh
pnpm install --frozen-lockfile
pnpm db:local
pnpm dev
```

Open the loopback URL printed by the dev server. The local sign-in button creates a **mock identity**, not a real ChatGPT login. Local SQLite/R2 state stays in ignored `.wrangler/state/`. `db:local` applies the four committed migrations locally and is safe to repeat. It never uses `--remote`; do not change that flag for local setup. No cloud account, token or paid service is needed for manual recipes and library development.

The Vite integration only supplies the mock identity on loopback and strips incoming identity headers. Do not expose this development server through a tunnel or bind it publicly. The production application requires the trusted Sites authentication dispatcher. This repository is not a standalone public authentication solution.

Optional AI requires your own server-side configuration: see [.env.example](../.env.example) and [Cloudflare setup](cloudflare-setup.md). Leave AI unconfigured for the initial setup; the library works independently. Never put credentials in browser-prefixed variables or commit `.env` files. Do not reuse the project owner's production credentials.

## Checks

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm audit
pnpm exec drizzle-kit check
```

`pnpm build` creates ignored Worker output and OCR assets. `pnpm start` previews the built Worker; it does not provide the Vite-only mock sign-in. Use `pnpm dev` for the interactive local notebook. Linux CI uses the existing isolated `install:ci` helper; ordinary local installs use the frozen-lockfile command above.

Verified on 27 October 2026 in a fresh checkout without a copied environment file: dependency installation, migrations, dev-server startup and local authenticated notebook API. This is not a replacement for real Sites-account isolation or physical-device tests.

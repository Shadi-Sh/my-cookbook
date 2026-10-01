# My Cookbook · Mein Kochbuch

A private recipe notebook for collecting, adapting and cooking recipes across German, English and Persian. Built with AI assistance from Codex from the owner's requirements. This is a first release, not a security certification or finished automatic AI product.

## Implemented

- Responsive German/English UI and mixed-language recipe fields.
- Recipe editor, photo uploads, yield scaling, filters, favourites, cooked status, cooking events and notes.
- Editable tags with global rename/merge, custom ingredient aliases, multilingual pantry presence matching.
- Shopping list with unit-aware aggregation and checkboxes.
- Structured JSON draft import; unknown quantities and times stay unknown.
- Rule-based completeness check. Original JSON imports and up to 30 previous saved versions are retained.
- Recipe and shopping print layouts (browser Save as PDF).
- Versioned JSON backup/restore including referenced photos and recipe revisions.
- Shared server storage and optimistic concurrency, private platform access and per-user authorization.

Automatic OCR, automatic in-app LLM review, web comparison, semantic search, nutrition estimates and styled full cookbook exports are **not implemented**. No paid model integration is configured. Pantry matching checks presence rather than stock quantity. The supported ingredient dictionary is intentionally small.

## Architecture

React + TypeScript UI, Vinext Worker-compatible server, Zod validation, Drizzle schema migrations, Cloudflare D1 structured storage and R2 photo storage. Hosting and sign-in are supplied by Sites. These platform services are dependencies; this repository alone is not a standalone authentication server. There is no promise of unlimited or permanently free hosting.

See [architecture](docs/architecture.md), [security](SECURITY.md) and [project status](PROJECT_STATUS.md).

## Development

Node.js 22.13+ (for Node's built-in SQLite tests use 22.18+) and the repository's package manager/lockfile are required. Run `npm run install:ci` to install according to the lockfile, `npm run test` for domain/storage tests, and `npm run typecheck` for TypeScript. `npm run build` emits the Worker and its bindings configuration. See the starter scripts for platform-specific local execution.

On your Mac, the supplied `.devcontainer/devcontainer.json` defines a project-scoped non-root environment for an editor supporting Dev Containers. This config is supplied for reproducible local setup; it has not been run on the owner's Mac. Never mount your whole home directory or the Docker socket. The current build was produced in the separate managed Linux workspace.

Hosted authentication depends on dispatcher-provided identity. Direct local execution has no real login dispatcher: API routes fail closed without identity. Any local identity emulation must be isolated to a localhost test environment and must not become a production bypass.

To apply a generated migration to an isolated local D1 after build, use the documented Wrangler local migration command with `dist/server/wrangler.json`; never apply preview data to production. Publishing applies immutable schema migrations through Sites.

## Backup and recovery

Data & backup → Full backup downloads schemaVersion 1 JSON with all state and referenced images. Current limits: 500 recipes, 300 pantry entries, 600 uploaded photo records, 1 MB notebook state, 2 MB per compressed uploaded photo, 14 MB of photos per backup and 20 MB restore file. Restore validates structure and uploads photos under new owner-bound IDs before replacing state. It replaces the current notebook after confirmation. A failed restore does not overwrite the old notebook; uploaded but unused photos may remain and count toward the quota.

No automated garbage collection exists yet. Deleted recipes' unreferenced photos can remain in private storage; backup only includes photos referenced by current recipes/revisions. Backup is not encrypted: keep files private. To recover, select Restore backup and review the confirmation. Reload a second device before editing; stale writes are rejected rather than overwriting newer data.

## Tests and limitations

Tests cover import validation, Persian normalization and aliases, unit-compatible aggregation, optional ingredients, backup state round-trip, same-origin mutation policy, real SQLite owner isolation, photo metadata ownership and version conflicts. They do not constitute a penetration test. Browser/device, full photo backup UI and live sign-in testing require a permitted browser/session; see PROJECT_STATUS.md for what was actually executed.

The demo recipes and generated cookie image are examples, not the owner's tested recipe history. Do not publish private recipes or account data in a portfolio. Repository licensing and public publication have not been selected by the owner.

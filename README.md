# My Cookbook · Mein Kochbuch

A private recipe notebook for collecting recipes from text, images and supported websites, reviewing the extracted draft, saving it and finding it again. Built with Codex assistance from the owner's requirements and technical decisions.

**Alpha feature freeze:** [baseline and limits](docs/alpha-freeze.md). No new features until P01–P03 are completed and reviewed. P01 is an owner pilot; no independent-user validation or unrestricted Alpha-ready claim is made.

## Implemented

- German/English interface and German/English/Persian recipe content; small deterministic ingredient dictionary and personal aliases support cross-language ingredient matching.
- Optional Cloudflare AI for text and up to four recipe-image pages, with German/English output, explicit data-send consent and review before saving. Field origins and review states persist through revisions and backups.
- Two AI attempts per authenticated user and UTC day, reserved atomically in SQLite. Provider failures count; no automatic retries or paid fallback. Provider-wide limits remain separate.
- On-device OCR and deterministic text extraction, plus structured JSON drafts and recipe JSON-LD import from an approved website allowlist.
- Recipe editor, photo attachments, search/filter, favourites, cooked history, tags and notes; unit-aware scaling, pantry matching and shopping lists.
- Versioned JSON backup/restore with photos, input/size validation, reference-protected deletion and explicit orphan cleanup.
- Owner-bound storage, optimistic concurrency, same-origin mutations and content-free diagnostic categories/reference IDs.

Complete recipe translation, semantic search, nutrition estimation and styled full-cookbook exports are not implemented. Known ingredient matching is neither general translation nor a guarantee of ingredient substitutability.

## Architecture

React 19, TypeScript, Vinext/Vite Worker runtime, Next-compatible APIs, Zod and Drizzle; Cloudflare D1 notebooks/metadata and R2 photos. Sites supplies hosting and ChatGPT authentication. The repository alone is not a standalone authentication server. See [architecture](docs/architecture.md) and [security](SECURITY.md).

Optional AI uses a server-side Cloudflare token and confirmed Workers Free configuration. No paid fallback is configured; no promise of permanently free hosting or unlimited provider availability is made. Input/output and personal attempt limits supplement the provider's account-wide limit.

## Development and validation

CI uses Node 24 and pinned pnpm 11.25.0. The [workflow](.github/workflows/check.yml) installs the lockfile, runs `npm run test`, `npm run typecheck` and `npm run build`. The current suite has 102 tests, including real SQLite owner isolation/parallel quota reservations, parser/error categories and backup rollback/reference protection.

On an already configured checkout, use those same test/typecheck/build commands. Installation and runtime helpers depend on the Sites environment; an independent clean-clone setup has not yet been verified for public distribution. Do not expose local identity emulation beyond loopback or turn it into a production authentication bypass. Keep `.env`, runtime state, backups and private pilot observations out of Git.

Automated checks are distinct from device/live verification. The authenticated live text flow passed import → explicit review/edit → save → reload → search. The owner also confirmed mobile UI and an AI image import on a real smartphone. Two real live-account isolation checks and the updated actual provider-usage reading remain open. See [project status](PROJECT_STATUS.md).

## Data and recovery

Notebook writes are limited to 1 MiB; schema allows up to 500 recipes, but large recipes/revisions may reach the byte limit earlier. Up to 600 photo records per owner, 2 MiB per uploaded photo. Backup export/import share validation: compact JSON up to 20 MiB, with an additional 14 MiB raw-photo export limit. Restore uploads fresh owner-bound photo IDs before replacing state and protects the existing notebook on failure.

Referenced photos, including revisions, are protected from deletion. Explicit cleanup removes older unreferenced uploads with a 24-hour grace period; there is no automatic cleanup scheduler. Temporary restore capacity can cause a safe refusal near the photo quota. Backups are unencrypted and must stay private.

## Security, licensing and portfolio status

The 2026-10-19 production dependency audit reports 3 high, 4 moderate and 1 low finding; this is **not** a security-certified release. See the scoped [public/CV readiness check](docs/public-cv-readiness.md) for findings, evidence limits and publication prerequisites.

The repository remains private. A project license has not been selected; preserve included third-party notices. Demo recipes and the generated cookie image are examples. Do not publish personal recipes, backups, participant data or private screenshots. Public release requires an explicit decision and a fresh secret/history, dependency, license and clean-clone review.

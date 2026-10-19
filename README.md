# My Cookbook · Mein Kochbuch

**A private recipe notebook — from scattered sources to a collection you can find and cook from.**

Collect recipes from text, photos and supported websites, review an editable draft, then save it to your own library. My Cookbook combines everyday recipe tools with optional AI-assisted extraction.

[Features](#features) · [Alpha status](#alpha-status) · [Technical overview](#technical-overview) · [Development](#development) · [Documentation](#documentation)

> **Private Alpha · Feature freeze**  
> The current focus is validating **Import → Review → Save → Find again**. P01 is the owner pilot and is documented as not yet started; independent-user validation is still pending.

## How it works

1. **Import** — paste recipe text, use on-device OCR, import Recipe JSON-LD from an approved website, or choose optional Cloudflare AI for text and images.
2. **Review** — compare the draft with its source and correct ingredients, amounts and steps. AI field origins and review states remain visible.
3. **Save** — keep the recipe, source, notes and optional photos in your private library.
4. **Find and cook** — search or filter your collection, scale portions, check pantry ingredients and build a shopping list.

The library and manual editing remain usable when the AI quota is exhausted.

## Features

| Area | Implemented |
| --- | --- |
| Recipe library | Editor, photo attachments, search and filters, favourites, tags, notes, cooked history and revisions |
| Import | Deterministic text extraction, on-device OCR, structured JSON drafts and Recipe JSON-LD from an approved website allowlist |
| Optional AI | Text and up to four recipe-image pages; German or English output, explicit consent before sending, and review before saving |
| Languages | German/English interface; German/English/Persian recipe content; limited ingredient dictionary and personal aliases for cross-language matching |
| Cooking tools | Unit-aware portion scaling, pantry matching and shopping lists |
| Recovery | Versioned JSON backup/restore with photos, validation, reference-protected photo deletion and explicit orphan cleanup |

Complete recipe translation, semantic search, nutrition estimation and styled full-cookbook exports are not implemented. Ingredient matching uses known terms and aliases; it does not establish ingredient substitutability.

## Alpha status

The accepted feature baseline is tagged `alpha-freeze-2026-10-20-owner-ai`. No new product features are planned until P01–P03 are completed and reviewed. P01 is the owner, so its results will not count as independent validation.

- **Verified:** the documented baseline passed 105 automated tests, TypeScript checks and the Worker build. Authenticated live text and image AI flows passed draft → review → save → reload → find again.
- **Mobile evidence:** the owner confirmed smartphone use and an English AI image import. A fresh physical iPhone text retest remains open.
- **Open gates:** isolation between two actual live accounts and dependency security triage remain unresolved. Synthetic acceptance tests do not count as pilot usage or product demand.

**AI allowance:** the configured owner receives **20 attempts per UTC day**; other accounts receive **2**. Provider failures count, with no automatic retries or paid fallback. Cloudflare Free remains the configured plan; its shared provider limits are separate from personal app quotas.

See [project status](PROJECT_STATUS.md), [freeze rules](docs/alpha-freeze.md) and the [owner quota decision and acceptance record](docs/ai-usage-freeze-exception.md).

## Technical overview

| Layer | Technology and role |
| --- | --- |
| Interface | React 19, TypeScript and Tailwind CSS |
| Runtime | Vinext/Vite on Cloudflare Workers, with Next-compatible APIs |
| Validation and schema | Zod and Drizzle |
| Storage | Cloudflare D1 for versioned owner notebooks and metadata; R2 for private photos |
| Extraction | Tesseract.js in the browser; optional server-side Cloudflare Workers AI |
| Hosting and sign-in | Sites hosting and ChatGPT authentication |
| CI | GitHub Actions: tests, type checking and build |

One versioned JSON notebook per owner keeps storage simple; document size and account-wide edit conflicts are explicit tradeoffs.

Controls include owner-bound storage, optimistic concurrency, same-origin mutations and input validation. AI credentials stay server-side; diagnostics exclude recipe content. Sign-in depends on Sites, not a standalone authentication server in this repository.

Built with Codex assistance from the owner's requirements and technical decisions.

## Development

CI uses **Node 24** and **pnpm 11.25.0** with the committed lockfile. On an already configured checkout, run the same checks:

```sh
npm run test
npm run typecheck
npm run build
```

Installation and runtime helpers depend on the Sites environment. An independent clean-clone setup has not yet been verified for public distribution. Keep local identity emulation restricted to loopback, and keep credentials, runtime state, backups and private pilot observations out of Git.

The [CI workflow](.github/workflows/check.yml) covers the automated checks. These do not replace live account, device or recovery verification.

## Data, security and publication

Notebook writes are limited to **1 MiB** (up to 500 recipes in the schema); photos to **600 per owner / 2 MiB each**. Backups support compact JSON up to **20 MiB**, with a **14 MiB raw-photo export limit**. Restore protects existing state on failure and may refuse near the photo quota. Referenced photos are protected; explicit orphan cleanup has a 24-hour grace period. **Backups are unencrypted and must stay private.**

The dependency audit recorded on **19 October 2026** reports **3 high, 4 moderate and 1 low finding**; exposure and patch verification remain open. This is not a security-certified release.

The repository remains private and has no selected project license. Public release requires a fresh secret/history review, dependency and license checks, and verified clean-clone setup. Preserve third-party notices; do not publish personal recipes, backups, participant data or private screenshots.

## Documentation

| Document | Purpose |
| --- | --- |
| [Project status](PROJECT_STATUS.md) | Current implementation, verified evidence and open gates |
| [Architecture](docs/architecture.md) | Data flow, design decisions and tradeoffs |
| [Alpha freeze](docs/alpha-freeze.md) | Accepted scope and pilot boundaries |
| [P01 protocol](docs/pilot-p01.md) | Owner pilot session and 5–7-day observation |
| [AI quota decision](docs/ai-usage-freeze-exception.md) | Owner allowance, provider comparison and rollback |
| [Security model](SECURITY.md) | Trust boundaries and implemented controls |
| [Public/portfolio readiness](docs/public-cv-readiness.md) | Security findings and publication prerequisites |

Detailed documents include older snapshots; the project status and owner quota acceptance record provide the latest Alpha context.

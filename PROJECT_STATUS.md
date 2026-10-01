# Project status

## Decisions

- Product name My Cookbook; German Mein Kochbuch.
- Shared phone/laptop storage required, UI German/English; content supports Persian.
- No paid model runtime or AI subscription dependency.
- Private deployment; owner identity enforced in API and storage queries.
- Implementation built with Codex assistance. Product/recipe decisions remain with the owner.

## Completed implementation

Recipe library/editor, photos, search/filter, tags, favourites, cooked status/history, notes, revisions, yield scaling, pantry presence matching, custom aliases, multi-recipe checkable shopping list, structured draft import, rule-based warnings, print layouts and JSON photo backups. README, threat model, architecture decisions, tests, CI config and a non-root Mac development container configuration are included.

## Verification so far

- 13 automated domain/security/storage tests passed, including real SQLite cross-user isolation and version conflict tests.
- TypeScript and initial production build passed. Dependency patches and TypeScript checks are complete; the final build runs as part of publishing.
- Starter dependency advisories were patched (Next.js 16.3.6 plus scoped transitive overrides). Final production dependency audit: {'info': 0, 'low': 0, 'moderate': 0, 'high': 0, 'critical': 0}. The critical Next.js finding concerned next/og ImageResponse, which this app does not use.
- Supervised preview reported running but HTTP requests could not reach it; no HTTP integration or browser checks are claimed.
- No permitted browser-control skill is available in this environment; interactive browser and WebMCP runtime validation are unavailable. WebMCP registration is feature-detected and optional.
- The Mac Dev Container configuration is supplied, not executed on the owner's device.

## Remaining first-use checks

Open the private app in a real user session; create/edit/reload a recipe, upload a photo, verify print layout, export/restore a photo-containing backup and open on a second device with the same account. Do this with synthetic data first.

## Deferred

LLM-powered extraction, live LLM suggestions/web comparison, semantic search, nutrition, collections, styled multi-recipe cookbook PDF, image garbage collection and provider-independent deployment auth. These are not represented as implemented features.

## Next milestone

Owner tries the first-use checklist; fix concrete issues. Then choose whether to automate extraction with a real model provider or expand cookbook PDF/collections. Avoid a paid integration until a cost/access decision is made.

## October 1 import update

Implemented local photo OCR and deterministic plain-text extraction in the editor, with explicit replacement consent, preserved source text and review warnings. Self-hosted worker/WASM/language assets avoid third-party photo processing. Tests cover German, English, Persian digits, fractions, unknown quantities, ranges and input limits. Actual synthetic English image recognition passed; browser/mobile OCR has not been verified here.

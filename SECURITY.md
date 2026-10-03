# Security model

## Assets and trust boundaries

Private recipe texts/photos, cooking history and pantry data belong to a signed-in user. Trust boundaries: browser → private Sites dispatcher → Worker → D1/R2, and untrusted imported JSON/photos → validation → editable draft. Chat-generated data is untrusted. Optional Cloudflare Workers AI receives selected recipe text or images only after explicit consent. See docs/architecture.md for the current data flow and open provider-policy checks.

## Implemented controls

- Owner-private deployment. Authentication comes from the trusted platform dispatcher; do not expose the Worker as an independently public service with spoofable identity headers.
- All API reads/writes require the signed-in identity, and queries bind that identity in prepared statements. Image metadata lookup checks both image ID and owner. Notebook writes validate ownership of current/revision images.
- Write requests require an exact same-origin Origin header. No permissive CORS, cookie-based app session or password store is added.
- Request streams are size-limited before full assembly. Zod applies field lengths, count limits, known fields, numeric bounds and unique recipe IDs. JSON imports cannot execute code. React renders user strings as text; source strings are not automatically fetched or rendered as HTML.
- Image uploads restrict JPEG/PNG/WebP MIME and signatures, use random keys and private reads with nosniff and no-store. The normal client resizes/re-encodes images; the server verifies signatures, not a full image decoder. Uploaded files are never treated as executable content.
- All per-user API responses are non-cacheable. Mutation version checks prevent stale overwrites. Upload quotas and per-request limits bound ordinary use; there is no bespoke rate limiter yet.
- No runtime SQL schema initialization or privileged frontend key. Cloudflare AI credentials remain server-side. Recipe URL fetching is limited to a fixed HTTPS publisher allowlist, including redirects.
- Credentials and environment files are ignored by git. Only logical storage binding names and platform Site identity are committed. Build artifacts and database preview state are ignored.

## Verification

Automated tests exercise actual repository SQL in in-memory SQLite for two identities, stale writes and image ownership, plus the pure access policy. Domain tests cover imports and multilingual matching. Full dispatch authentication, real mobile interaction and complete R2 backup restoration require additional live tests. Passing tests are not proof against all attacks.

## Development isolation

The supplied Dev Container uses a non-root user, only the project workspace mount and a named dependency volume, with no privileged flags, host Docker socket or private home-directory mounts. It retains tool permission checks; no permission bypass is configured. Container network access is not restricted by a custom firewall in this first configuration. Code can access all files and credentials explicitly made available inside the container. Dev Container execution itself has not been verified here; the build was run in the managed workspace.

## Known limits and next security work

- The notebook is one bounded JSON document per user. Concurrency is account-wide; independent edits need reload/retry. Restore/uploads have no automatic orphan-photo cleanup.
- Photos use a signature check, not malware scanning or full server transcoding. Private access, correct MIME and nosniff reduce active-content exposure.
- Backup files are unencrypted and contain private data. Keep them outside a public repository.
- The platform handles TLS and sign-in/access policy. There is no independent security audit, enforced custom CSP for the React app, or application-level rate-limiting implementation.
- Before a public demo or migration to different hosting: verify identity provenance, access controls, storage policies, abuse limits and CSP compatibility anew. Use synthetic data only.

Report issues privately to the project owner; no public security inbox has been configured.

## Dependency review at handoff

Production dependency advisory scan on 2026-10-01 after patching: {'info': 0, 'low': 0, 'moderate': 0, 'high': 0, 'critical': 0}. This snapshot is not a guarantee of future vulnerability status. Overrides are pinned in pnpm-workspace.yaml; preserve and periodically review them.

## Recipe extraction

Photo OCR runs on-device using same-origin pinned Tesseract worker, WASM and language files. Local OCR sends no recipe content to an external service. The separate optional AI workflow sends selected content to Cloudflare with explicit consent. Images are restricted by type, bytes (10 MB) and decoded dimensions (40 million pixels), then resized to at most 2500 pixels per edge. Text has a 30,000-character limit and remains React-rendered plain text. The parser never executes recipe instructions, performs web requests, or evaluates markup. Existing fields require explicit replacement consent; saving and owner authorization use the existing editor/API validation. The source photo is not retained by OCR. Original text is retained only when the recipe is saved. Recognition accuracy is not guaranteed; imported amounts and steps require human review.

## Current review: 2026-10-03

The personal atomic AI cap is two attempts per authenticated user and UTC day, including provider/network failures. Owner comes from server authentication, never request input. It is not a monetary budget guarantee. Workers Free has been reverified; measured synthetic text/image token usage and the outstanding updated dashboard reading are documented in docs/alpha-ai-usage.md. Photo deletion is reference-protected, orphan cleanup is explicit, and backup compatibility/restore has automated and local runtime coverage. General upload/link rate limiting, a physical smartphone test and two real live-account isolation checks remain open. See docs/alpha-safety-checks.md for evidence and limits.

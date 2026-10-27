# Public repository / portfolio readiness — 27 October 2026

Repository preparation is complete locally; review and CI must pass before merging. GitHub visibility remains private until an explicit publication instruction. The Founder selected MIT for original project code. Third-party notices remain in place. No product features or hosting settings were changed.

## Evidence

- Fresh independent clone from main, without copied credentials or runtime state; Node 24 / pnpm 11.25.0. Documented [local setup](local-development.md), local migrations and authenticated notebook API verified.
- 106 automated tests, TypeScript, Worker build and Drizzle schema check pass. The extra regression test protects sparse AI drafts from invented editor defaults during the Zod update.
- Full dependency audit: **0 critical / high / moderate / low** on this date. Before remediation: 2 critical, 31 high, 29 moderate, 10 low including tooling. [Details and tradeoffs](dependency-security.md).
- Gitleaks 8.30.1 with redacted output: no findings across all fetched branches/tags. Additional private scan of 295 reachable historical blobs found no configured Cloudflare credentials, private-key markers, personal filesystem paths or personal email identities in the checked patterns. Final branch history is rescanned after committing. These checks are bounded evidence, not proof against every possible secret.
- Removed tracked TypeScript cache; ignored databases, backups and pilot evidence. Example environment contains placeholders only. Hosting project IDs are identifiers, not authentication credentials. No private recipes, production databases or participant observations were copied into this checkout.
- MIT selected explicitly; vendored notices retained. Dependency license inventory includes MIT, Apache, BSD and other licenses, including MPL/LGPL/CC-BY. The root MIT license does not replace those terms. [Notices](../THIRD_PARTY_NOTICES.md).
- CI adds a pinned, checksum-verified, redacted history scanner and blocks high/critical dependency advisories. No new paid service or infrastructure.

## Publication and runtime boundaries

Before changing visibility, merge the reviewed changes with green CI and enable/verify GitHub private vulnerability reporting. No public reporting channel is claimed as already active. Do not rewrite history merely to remove nonsecret project identifiers.

The live Site still requires a separate controlled deployment and runtime verification for the dependency patches. Local tests do not establish that production runs these patches. Real two-account owner-isolation verification and the documented device/pilot gates remain independent of source publication. No Alpha-ready, penetration-test or validated-demand claim is made.

## Honest CV description

“My Cookbook: multilingual recipe notebook built with React/TypeScript, a Worker backend and SQLite/object storage. Implemented optional structured text/image AI extraction with explicit review and provenance, atomic per-user daily quotas, owner-bound storage, validated photo backups and CI with 106 tests, type checking, build and dependency/secret checks.”

Disclose Codex assistance and explain your own requirements, technical decisions and reviews. P01 is the owner pilot, not independent market validation. Useful interview topics: bounded JSON notebooks; atomic SQL quota reservation; trusted authentication versus ownership checks; AI output as untrusted input; recovery before state replacement; and the limits of automated versus live verification.

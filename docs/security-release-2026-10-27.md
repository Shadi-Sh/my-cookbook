# Security release and renewed feature freeze — 27 October 2026

## Released state

Sites version **13**, source commit `66ced20c2ed42b542547cb489e1845f9bb00e465`, deployment `appgdep_6ae0c438f8e08191818f01e903d747da` succeeded. Runtime environment revision remains **4**. URL: https://my-cookbook.shadyyysh2.chatgpt.site

Only the reviewed dependency updates, sparse-AI-draft compatibility fix and supporting MIT/local-config files were copied onto the existing Sites source. All compared runtime source paths (`app`, `lib`, `components`, `db`, `build`, `drizzle`, dependency files, Vite config and hosting manifest) are byte-identical to GitHub main commit `b4b54bd`. No database migration, provider, quota or access-policy change was made.

The renewed feature-freeze tag is `alpha-freeze-2026-10-27-security`; it identifies the GitHub source state. The separate Sites source commit above identifies the exact deployed archive. Older freeze tags remain unchanged. Rollback is deployment of saved Sites version 12; no database rollback is needed.

## Verification

- 106/106 tests, TypeScript and Worker build passed in the separate release checkout. Full dependency audit: zero known advisories including tooling on this date. PR #8's checks were green before merge.
- Text-only Cloudflare AI import: synthetic German lentil recipe → suggestions held outside the draft → explicit acceptance/review → title edit → save → full reload → search → reopen. Quantities 100 g / 500 ml / 1 TL and times 5 / 15 / 20 minutes persisted.
- Image Cloudflare AI import: existing synthetic English pasta fixture → German editable draft → review/edit → save → full reload → search → reopen. Quantities and units 200 g pasta, 8–10 basil leaves, 2–3 thyme sprigs were extracted as separate amount/unit/name fields; estimated total 20 minutes was marked.
- Two successful requests consumed two owner attempts (20 → 19 → 18 remaining). No retries, quota resets, paid fallback or provider changes were used. Selected synthetic content was sent after UI consent; no real recipe content or secrets are included in this document.
- The full Sites access policy was equal before and after release: custom audience, one external viewer, policy revision 2. This verifies preservation, not two-real-account isolation.

Both synthetic records are clearly named `Release-Test Text 2026-10-27` and `Release-Test Bild 2026-10-27`, with notes excluding them from pilot observations. They remain in the owner's library as visible acceptance evidence. No existing recipes were edited or deleted.

## Remaining boundaries

The in-app browser test is not a new physical iPhone test. Two actual live-account isolation verification and a fresh physical iPhone text retest remain open. P01 has not been started by this release or by synthetic acceptance tests. Provider-wide capacity measurement and the limits in the Alpha documents remain separate. A feature freeze is not a declaration that every Alpha gate has passed.

The repository is now public under MIT and GitHub private vulnerability reporting is enabled; the hosted recipe library retains its previous restricted audience.

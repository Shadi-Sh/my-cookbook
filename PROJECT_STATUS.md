# Project status – 19 October 2026

## Alpha scope

Milestone: **Import → Review → Save → Find again**. PR #5 was merged into the safety branch; PR #4 then integrated the combined changes into main. Feature baseline is tagged `alpha-freeze-2026-10-19`; see [freeze rules](docs/alpha-freeze.md). No feature work until P01–P03 are completed and reviewed.

P01 is the owner, confirmed by the user. Pilot preparation is complete; the first real moderated session and subsequent 5–7-day observation are pending. Sessions start with two available personal AI attempts. No automated Alpha analytics has been deployed; the separately prepared measurement patch is not integrated. Actual observations remain outside this Git checkout.

## Current implementation

React/TypeScript recipe library, editor, photos, search, tags, revisions, pantry and shopping utilities; deterministic DE/EN/FA text/ingredient handling, on-device OCR, approved-site JSON-LD import, optional Cloudflare text/image AI with DE/EN output, explicit consent/review and persisted AI provenance. Personal two-attempt UTC-day quota, bounded provider decoding and safe failure categories, validated photo backup/restore and protected photo cleanup are implemented.

No complete recipe translation, LLM/vector search, billing infrastructure or new provider. Persian image accuracy is not an Alpha blocker. AI remains optional for library use.

## Verified evidence

- 105 tests, TypeScript and Worker build passed. Combined PR #4/#5 CI passed before merge.
- Authenticated live text-only AI import, explicit review/edit/save, reload/search/open passed on 19 October; quantities/ranges and review marks persisted. Test was in the in-app browser.
- Owner confirmed real-smartphone login, navigation, search, opening/editing/saving, reload, keyboard/scrolling and an English AI image import. Library remains usable when personal AI quota is exhausted.
- Full local photo-backup restore passed with byte integrity and protected-reference deletion tests. This does not prove production restore on a separate real account.
- Deterministic ingredient aliases already match milk/Milch/شیر. Controlled live provider comparison accepted both string content and a text-part array; no general request-format defect demonstrated.

## Open gates and risks

Two actual live accounts for isolation and a fresh physical iPhone text retest remain unverified. Cloudflare Free and actual usage were checked live (80.75/10,000 before the Owner exception). A feature freeze is not an Alpha-ready or public-release approval.

Production dependency audit now reports **3 high, 4 moderate, 1 low, 0 critical**; prior zero-advisory statements were historical snapshots. High findings include Next image optimization, sharp/librsvg and source-map-js. Exposure/patch verification remains open; no unaffected claim is made. Repository stays private, no new test-account access granted.

Root license and independent clean-clone setup are pending. Public/CV findings and an honest CV description are in [readiness](docs/public-cv-readiness.md). Codex assistance is disclosed. No large user base, completed penetration test or validated product demand is claimed.

## Reference documents

- [Alpha safety checks](docs/alpha-safety-checks.md)
- [Live text/image comparison](docs/ai-text-image-comparison-2026-10-19.md)
- [AI error diagnosis](docs/ai-text-diagnosis-2026-10-05.md)
- [Provider usage and measurement limits](docs/alpha-ai-usage.md)
- [P01 protocol](docs/pilot-p01.md)

Earlier implementation details remain in Git history. This file describes the current state rather than repeating outdated initial-release claims.

## Owner AI freeze exception

P01 has not started. Renewed full text/image live acceptance passed; start only after setting the new freeze `alpha-freeze-2026-10-20-owner-ai`. Keep Cloudflare Free; configured Owner 20 attempts/UTC day, other accounts 2. No provider switch or paid plan. [Comparison and acceptance record](docs/ai-usage-freeze-exception.md).

# Dependency security maintenance — 2026-10-27

The 2026-10-19 audit was historical. Rechecking the original lock on 2026-10-27 found 2 critical, 5 high, 7 moderate and 3 low production advisories; including development/build dependencies there were 2 critical, 31 high, 29 moderate and 10 low advisories. Counts are advisory entries, not independently exploitable app paths.

## Targeted changes

- Next 16.3.6 → 16.4.1, ESLint Next config → 16.4.1; React/React DOM/server-dom-webpack aligned on 19.2.8. Fixes the reported Next/upstream security ranges without switching frameworks.
- Vite 8.0.13 → 8.1.6; existing Vinext and Cloudflare plugin architecture retained.
- Zod 3.25.76 → 4.6.6 addresses constrained-collection memory exhaustion. Existing consumers accept this version (the ESLint hooks/validation-error packages permit Zod 3 or 4). Zod 4 applies defaults inside partial objects; AI parsing explicitly retains only supplied fields after validation, preserving unknown yield and rejecting empty recipe results. Existing regression tests found this behavior change; an additional sparse-draft test locks it down. Notebook formats and migrations are unchanged.
- Targeted transitive overrides: sharp 0.35.5, source-map-js 1.2.2, fast-uri 3.1.9, undici 7.30.1, ws 8.21.0, js-yaml 4.3.2, brace-expansion 1.1.21 / 5.0.12, esbuild 0.28.1, fflate 0.7.5 and image-size 2.0.3. Keep separate major lines where applicable. esbuild also replaces the old Drizzle development loader dependency; verify schema tooling as well as build before accepting it.

Overrides are security constraints, not a permanent reason to pin old versions. Review/remove them when the parent dependency guarantees an equally safe release. Existing seven-day minimum release age and explicit build-script allowlist remain enabled. No broad latest-version upgrade or automated force-fix was used.

## Evidence

Final full `pnpm audit --json` on 2026-10-27: **0 critical, high, moderate, low or informational advisories**, including development dependencies. 106 automated tests and TypeScript passed. Build and clean-clone/runtime checks are recorded in [public readiness](public-cv-readiness.md). CI repeats tests/types/build and fails on high/critical audit findings. Audit availability/freshness is external; a clean result is not proof of absence of vulnerabilities.

The production Site has a separate release lifecycle. Preparing/merging this repository does not prove the deployed Worker has these patches; deploy and verify it separately without changing the access audience or claiming a new Alpha runtime freeze.

## Primary advisories

- [Next image optimization / upstream sharp](https://github.com/advisories/GHSA-2464-fhr4-w9xw)
- [Next typed-array cache issue](https://github.com/advisories/GHSA-673q-mjm6-r5xr)
- [Zod constrained collections](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
- [Source maps](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)
- [sharp](https://github.com/advisories/GHSA-wq5f-xc86-pv6w)

The full redacted/local audit outputs are evidence for this review and are not user telemetry. Re-run the current registry audit before the next release rather than treating these counts as permanent.

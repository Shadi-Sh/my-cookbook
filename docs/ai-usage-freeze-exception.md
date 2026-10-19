# Freeze exception: Owner AI usage

Status: implementation prepared; deployment and renewed live acceptance pending. P01 has not begun and remains on hold until the renewed freeze.

## Decision and comparison (19 October 2026)

Keep direct Cloudflare Workers AI with Gemma 4, giving only the configured Owner **20 attempts per UTC day**. Other accounts retain **2/day**. Failed provider/parser requests continue to count. No new feature, provider, platform, migration, retry, billing integration or paid subscription.

Dashboard checked live: Workers **Free / Current plan / $0**, Workers AI **80.75 / 10,000 neurons today** before this change. Actual account-wide reserve at that reading: **9,919.25 neurons (99.1925%)**. This is an observed total, not an isolated per-import measurement.

Prices below are USD before taxes/currency conversion; examples assume 1,000 input + 1,000 output tokens. Image tokenization varies by provider, image size and detail. These are budgeting examples, not measured OpenAI import costs or a guaranteed maximum.

| Option | Expected AI cost | Structured output | Change / estimated engineering effort | Main risk / rollback |
|---|---|---|---|---|
| Cloudflare Free + Owner 20/day (selected) | $0 within account-wide 10,000 neurons/day; above it requests fail | Current prompt JSON + strict server validation; no schema-constrained generation currently requested | Small quota parameter + Owner selection + truthful dynamic messages; about half a day including tests/live acceptance | Provider account budget remains shared; remove Owner configuration and redeploy to return to 2/day |
| Cloudflare Paid, same model | $5/month base Workers subscription; $0.011/1,000 neurons above daily free allowance. Example Gemma inference ~$0.0004 when chargeable, not an additional charge below allowance | Same model/parser; upgrading billing does not improve JSON correctness | Low code effort but billing approval, free-only guard policy update, quota decision and cost controls needed | Variable charges; rolling code back alone does not cancel subscription or accrued charges |
| OpenAI API, e.g. GPT-4.1 mini | $0.40/M input + $1.60/M output tokens; example ~$0.002/import, ~$0.20/100 similar imports; image-heavy inputs cost more | Supports images and strict Structured Outputs. Schema compliance improves, factual correctness still requires review | Roughly 1–2 days: tiny provider adapter, strict schema, envelope/error decoding, secret/config, consent/provider wording, text/image regression tests | New processor, billing and account limits; config back to Cloudflare with original adapter retained. No automatic cross-provider replay |

For a somewhat larger 5,000-input/1,000-output import the token estimates become ~$0.0008 Gemma (when chargeable) or ~$0.0036 GPT-4.1 mini. No OpenAI request or key has been created; output quality on our recipes has not been benchmarked there. GPT-4.1 mini is a suitable low-latency comparison candidate, not a claim it is the cheapest available model.

Previous synthetic production-model samples calculated 27.75 neurons/text and 25.91/image from returned token usage. Twenty comparable Owner attempts: ~555 neurons; another seven testers at two comparable attempts: ~389; together ~944/day, ~90.6% reserve before other account usage. Longer text/four images can consume more. The hard cost boundary is the **confirmed Free plan**, not this extrapolation or the `CF_AI_FREE_ONLY_CONFIRMED` flag (which cannot detect a later billing change). Recheck account usage during real use; do not upgrade automatically.

## Security, privacy and limits

- `AI_OWNER_EMAIL` is stored as a server-side Sites secret. Match it only against the authenticated platform email, with the authenticated ID cross-checked against the existing authorization result. No request-body email, Owner flag or quota value is accepted. Missing/mismatched configuration keeps 2/day.
- Email selects the temporary limit, **never data ownership or access**. Existing authenticated user ID remains the D1 quota and recipe/photo ownership key. No recipe/identity/secret is added to diagnostics. No new endpoint.
- Existing atomic D1 upsert receives the selected limit, preserving the UTC day, consumed attempts and concurrency protection. Lowering the limit does not refund requests. No schema/data rewrite.
- Existing CF credentials stay in Sites secrets; same minimal token permissions, direct fixed provider URL, bounded input/output, 45-second timeout. No keys in browser/repository. An OpenAI variant would require a separate restricted project server key, `store:false`, conservative output limits and explicit spend controls; a dashboard budget must not be assumed a hard spend cap.
- Cloudflare states synchronous inference content is not persisted by default, subject to documented legal/security exceptions; operational metadata may be retained. We use no AI Gateway content logging/caching. Saved recipe/photo storage has its own lifecycle.
- OpenAI API data is not used for training by default; abuse monitoring may retain content for up to 30 days. `store:false` avoids Responses application-state storage, not all abuse retention. A switch would change the processor and require corresponding consent/privacy wording.
- CF default text-generation rate limit is 300 requests/minute, with model exceptions. Daily account neurons are separate from personal app attempts. OpenAI RPM/TPM limits depend on model, project and usage tier. Paid service does not eliminate 429s, timeouts or malformed outputs. Existing safe categories/draft preservation remain necessary.
- Owner use can still consume shared provider neurons. For the eight-person phase, disable the Owner exception or explicitly assess consumption/reserve so Owner testing cannot distort the study. Other users cannot consume the Owner's D1 attempts.

## Tests and rollback

Required: default/missing/mismatched Owner identity; exact Owner match; independent accounts; preserve today's spent attempts on increase; UTC year rollover; rollback without reset/refund; real parallel SQLite connections at both 2 and 20; existing text/image/parser/privacy regressions; TypeScript; Worker build; full live text and image → review → save → reload → search.

Operational rollback: remove `AI_OWNER_EMAIL` in Sites, deploy the same saved source with the new environment revision, confirm 2/day in the UI. Existing usage rows remain intact, so an Owner already above two stays blocked until UTC reset. Code rollback to previous published version is also possible. No provider subscription or stored recipes need changing.

## Sources checked

- [Cloudflare AI pricing/free boundary](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Workers subscription pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare data handling](https://developers.cloudflare.com/workers-ai/platform/data-usage/)
- [Cloudflare limits](https://developers.cloudflare.com/workers-ai/platform/limits/)
- [GPT-4.1 mini modalities, pricing and Structured Outputs](https://developers.openai.com/api/docs/models/gpt-4.1-mini)
- [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data)
- [OpenAI rate limits](https://developers.openai.com/api/docs/guides/rate-limits)

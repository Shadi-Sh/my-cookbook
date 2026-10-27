# Third-party notices and assets

The root MIT license applies to this project's original code and documentation. It does not replace third-party licenses or grant rights to users' imported recipes and photographs.

- The vendored Sites Vite integration is derived from `@openai/sites-vite-plugin` 0.2.0. Its OpenAI MIT copyright and permission notice are preserved in [build/sites-vite-plugin.LICENSE](build/sites-vite-plugin.LICENSE).
- The vendored shadcn Tailwind styles and shadcn-derived UI components retain the upstream MIT terms. The existing notice is preserved in [vendor/shadcn-tailwind-4.13.0.LICENSE.md](vendor/shadcn-tailwind-4.13.0.LICENSE.md).
- npm dependencies retain their own licenses. The exact dependency graph is locked in `pnpm-lock.yaml`; inspect installed notices with `pnpm licenses list`. This repository does not commit `node_modules`, generated OCR assets or deployment archives.
- Tesseract.js and its runtime/language packages are installed as pinned dependencies; OCR files are copied into ignored `public/ocr/` by the build. Their upstream notices and terms continue to apply when distributing build output.
- `public/images/cookies.png` is the AI-generated example illustration documented during project development. Demo recipes are examples, not participant data. Generated imagery is not a claim of exclusive third-party rights clearance.
- Importing a recipe or image does not transfer its copyright. Keep private recipe libraries, backups and participant observations outside this source repository.

This is a source repository notice, not a legal certification of every possible binary distribution. Preserve dependency license files when redistributing packaged builds.

The installed macOS dependency inventory on 27 October 2026 also includes LGPL-3.0-or-later (`@img/sharp-libvips-darwin-arm64`), MPL-2.0 (`@resvg/resvg-wasm`, `@vercel/og`, `axe-core`, `lightningcss` and its platform package, `satori`), CC-BY-4.0 (`caniuse-lite`) and Python-2.0 (`argparse`). Platform packages differ on Linux. Inspect the licenses for your actual distribution target; these dependencies are not relicensed as MIT by this project.

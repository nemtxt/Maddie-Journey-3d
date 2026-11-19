# Maddie Journey — 3D World (V1.0)

An interactive, stylized 3D miniature-world navigation prototype for the Maddie Journey People & Culture fictional demo. Built from scratch as a **separate project**; original source repo is not modified.

## Scope
- Nine interactive island districts connected by an animated path.
- Scroll / drag / touch world exploration, landmark selection, cinematic guided tour, and accessible 2D fallback.
- Read-only dashboard with employee search and workspace report browser.
- All 86 original subcategory identifiers retained in `data/mock-data-manifest.json`.
- Same fictional 51-person demonstration fixture and original normalization code, preserved verbatim in `data/core.js`, `data/data.js`, and `data/demo-data.js` from [Maddie-Journey-Prototype](https://github.com/nemtxt/Maddie-Journey-Prototype). No production connectors.
- Deep links to the original full-detail fictional demo for reports not yet recreated in the new UI.

## Run
Open `index.html` through a local HTTP server (e.g. `python -m http.server 8000`) or enable GitHub Pages on the repository's main branch at root. Internet is required for Three.js from jsDelivr; a 2D fallback remains if WebGL fails.

## Data boundaries
The imported files are **fictional demonstration data only**. No authorization, live data, API keys, actual employee records, or live connector code is intentionally included. Do not connect real employee information to this publicly hosted prototype.

## Roadmap
1. V1 — 3D world, animated route, workspaces, read-only people, 86 report links, responsive controls.
2. V2 — richer bespoke terrain/GLB assets, staged storytelling and employee career timeline.
3. V3 — full 86 new-design report equivalence and comprehensive regression tests.
4. V4 — performance tuning, accessible motion options, mobile optimization, production-grade QA.

## Credits
3D rendering uses Three.js (MIT). Fictional source data and dashboard inventory are mirrored from the user's original demo, unchanged. No paid services required.

# Maddie Journey — Interactive 3D World

**V1.0 · independent fictional-data prototype · November 2026**

An Awwwards-inspired, interactive miniature world for exploring the Maddie Journey People & Culture reporting environment. This project is deliberately **separate from** [the original fictional prototype](https://github.com/nemtxt/Maddie-Journey-Prototype), which has not been changed.

## Implemented
- Original stylized 3D floating island environment created with Three.js: low-poly mountains and snowcaps, forest, tree clusters, river, lake, waterfall, miniature buildings and floating clouds.
- Nine themed landmark destinations, selectable via 3D raycasting, HTML labels, the route strip, or global search.
- Winding illuminated route with moving waypoint marker, smooth orbit/zoom camera navigation and a guided journey tour.
- Full responsive HTML dashboard shell with world, executive overview, people directory and journey stages.
- Search across fictional employees, destinations and 86 registered reports, with a keyboard shortcut (Ctrl/Cmd+K).
- Individual employee modal showing existing sample roster attributes. Directory search and division filter.
- All **nine original workspaces and 86 subcategory identifiers** accessible, with direct links to the corresponding complete original fictional reports.
- Reduced-motion support, an interactive 2D fallback for devices without WebGL, and responsive page layout.

### Deliberate scope boundary
V1 is a **new 3D world and monitoring/navigation layer**. It does not yet recreate every chart or specialized report table from the original 86 screens. Those remain accessible through their existing demo deep links. Do not represent new report summaries as audited replacements until their parity checks are complete.

## Original fictional data, safely mirrored

The project includes:
- `data/mock-data-manifest.json`: unchanged original nine-workspace / 86-route manifest.
- `data/fictional-snapshot.json`: a display-only, source-derived projection of the original **51 fictional employees in eight divisions** (names, roles, status, dates, 201-file completeness, attendance summary). Values used here are derived from the original demo rather than newly invented.

**Important:** The new repository deliberately does **not** contain original runtime connector configuration, the live Claude bootstrap, confidential employee records, salary fields, passwords, or API credentials. No Airtable, Google, or Claude APIs are called. Use only fictional demonstration data in this public project.

## Run locally

Any static HTTP server works. Node is not required for browsing the site:

```bash
python -m http.server 8000
```

Then open http://localhost:8000. **Do not open the HTML directly using `file://`**, because the browser restricts `fetch` of local JSON files. The 3D renderer imports Three.js from jsDelivr (requires an internet connection); the dashboard/2D fallback does not rely on WebGL.

### Validate source and route invariants
```bash
npm test
npm run check
```
No `npm install` or paid dependency is required for these checks.

## Publish with free GitHub Pages

This repository is static and can use GitHub Pages from **Settings → Pages → Build and deployment → Deploy from a branch → main / (root)**. GitHub Pages must be enabled in GitHub repository settings; having the code on `main` does not itself confirm the site is live.

## Controls
- Drag the world to orbit, scroll to zoom; on touch devices, drag the canvas.
- Click a landmark label or the horizontal destinations strip to focus on a workspace.
- Use **Begin the journey** for the animated route tour.
- Use **2D view** to switch away from WebGL.
- Search globally with **Ctrl+K** or **Cmd+K**.
- Open a workspace to access its exact original report routes.

## Next development gates
1. Replace blocky placeholders with optimized, brand-approved original GLB assets.
2. Integrate narrative milestone stops and a real employee-specific journey visualization (not fabricated data).
3. Recreate specialized report tables/charts only after side-by-side comparison to the original source.
4. Complete cross-device WebGL, keyboard, color contrast, reduced motion and performance testing.

## Credits
Three.js under its MIT license. The sample fixture was projected from the user's original fictional Maddie Journey prototype. No paid services are required.

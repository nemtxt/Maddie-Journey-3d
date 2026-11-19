# Maddie Journey — Interactive 3D World

**V1.4 · Immersive World & Original Soundscape · November 2026**

An Awwwards-inspired, interactive miniature world for exploring the Maddie Journey People & Culture reporting environment. This project is deliberately **separate from** [the original fictional prototype](https://github.com/nemtxt/Maddie-Journey-Prototype), which has not been changed.

## V1.1 — Sky-to-island cinematic entrance

The default root / `#overview` opens a full-screen, atmospheric sky with animated cloud layers, the headline **Welcome to Maddie Journey**, and one **Start** action. It deliberately uses the **same Three.js scene and WebGL renderer** as the floating island—no scene swap or video overlay.

**On Start:** GSAP coordinates the welcome typography fade, atmospheric cloud reveal, continuous Bezier camera descent, and the arrival of the existing world navigation and reports. The in-scene 3D clouds drift gently throughout. The camera path ends at the original orbit control target.

**Accessibility and graceful fallbacks:** Skip intro is always available; reduced-motion visitors transition directly to the world; the camera descent uses requestAnimationFrame if GSAP fails to load; an existing 2D fallback is shown if WebGL fails. Deep links into employee and report routes bypass the entrance. Controls remain keyboard navigable.

**Dependencies:** Three.js 0.161.0 and GSAP 3.12.5 are served from jsDelivr; no account, billing, server-side rendering or paid animation plugins are required. A network connection is needed to load these libraries.

## V1.4 — Full-viewport world and original soundscape

**Layout:** The island uses the entire browser viewport on desktop and mobile. The previous full-width top navigation, horizontal destination bar and footer have been removed. A lightweight floating HUD provides Search, Reports, Sound and Motion; the lower-left **Explore divisions** control opens a compact list of all eight division locations. The nine original monitoring workspaces remain available from **Reports** and each division's linked evaluator-details drawer.

**Selected division:** Clicking a world label, its geometry or an entry in the division picker moves the Three.js camera and displays a **large editorial division title on the left**, with a distinctive accent line, campus subtitle and short description. Evaluator names and original report links appear only when the user opens **Discover this division**, so the scene remains immersive. "All divisions" resets the view.

**Sound:** `soundscape.js` generates an **original, non-copyrighted ambient musical score** with slowly shifting chords, plucked notes, filtered wind, nature accents and interaction chimes, using the browser's Web Audio API. No streaming, audio files, paid music library or downloads are used. Sound is **off by default** and requires an explicit click on `Enable ambient sound` (welcome screen) or `Sound off` (world HUD). It can be muted instantly, and its volume is reduced when opening data views. The browser must support Web Audio. The experience remains functional and silent otherwise.

**Graphics:** New immersive sky-dome shader, warm sun gradient, sparse floating environmental particles, luminous division focus and additional CSS light atmospheric effects. Rendering adapts quality on mobile and software WebGL systems. Reduced-motion settings and the existing 2D fallback remain supported.

**Testing:** Source invariants, JavaScript syntax and Chromium browser coverage verify that 51 fictional people, eight company districts, nine monitoring workspaces and 86 report routes are preserved. Browser tests cover full-viewport layout, visible selected-division headings, the evaluator panel, opt-in audio control, mobile and route navigation.

## V1.3 — Eight themed division districts

The world now showcases the **eight requested company divisions** as distinct original 3D campuses:

| 3D district | Visual landmark | Assigned evaluator / user |
| --- | --- | --- |
| HR | People & Culture pavilion, records and 201 Files | GIEZELLE (HR); KURT (HR) |
| Revenue Management Division | KPI observatory and revenue performance tower | TRIZIA BALDOVI — Chief Experience Officer |
| Design Division | Creative atelier, sculptural installations and design boards | AR. AJ TRABADO — Design Operations Manager |
| Corporate Operations | Operations office campus, workflow display and clocktower | RENATO RENDON; ZSARINA MAE LACUMBA — Corporate Operations Head |
| Media | Production studio, broadcasting tower and camera props | MICHELLE OROCIO — Media Manager |
| IT | Data centre, server racks and glowing circuit pathways | INIGO ARELLANO — COO |
| GenCon | Event hall, stage and amphitheater | INIGO ARELLANO — COO |
| Business Development | Growth harbor, partnership bridge and tower | MA. CRISTINE ORTIZ — Business Development Head |

**Data-model separation:** Eight new 3D division districts are **not** a replacement or relabeling of the original nine monitoring workspaces or the fictional sample's eight source-group names. `divisions.js` contains evaluator metadata supplied by the user, whereas `data/fictional-snapshot.json` remains unchanged and exclusively fictional.

**Scene upgrades:**
- Richly differentiated campus models authored procedurally in `world-assets.js`, including KPIs, communications, records and journey signage
- Denser instanced forests with pine/broadleaf variation and GPU-driven subtle canopy sway
- Instanced rocks, wild grasses and landscaping, stratified mountain ridges and snowlines, improved rockfall and scenic paths
- Physically based, gently animated water and ripples, soft contact shadows, fog and sky/environmental lighting
- Transparent glass navigation, interactive district labels, select/hover feedback and dedicated evaluator panels

**Asset policy:** The shipped version uses custom procedural meshes and Three.js primitives, avoiding third-party model copyright and ongoing asset hosting dependencies. Forest models from Sketchfab, Free3D, Envato, CGTrader, Adobe Stock or Khronos may be evaluated for future model additions, but individual asset licenses and attribution terms must be verified **before** redistribution. No purchased or unverified third-party model is included here.

## Implemented
- Original stylized 3D floating island environment created with Three.js: low-poly mountains and snowcaps, forest, tree clusters, river, lake, waterfall, miniature buildings and floating clouds.
- Eight division-themed geographic destinations, selectable via 3D raycasting, HTML labels, the route strip, or global search.
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
- `divisions.js`: eight division destinations, evaluator contacts and related workspace associations, supplied as display metadata.
- `data/mock-data-manifest.json`: unchanged original nine-workspace / 86-route manifest.
- `data/fictional-snapshot.json`: a display-only, source-derived projection of the original **51 fictional employees in eight source-data groupings** (names, roles, status, dates, 201-file completeness, attendance summary). Values used here are derived from the original demo rather than newly invented.

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
- Click a landmark label or the horizontal destinations strip to focus on a division, then open one of its linked reporting workspaces.
- Use **Begin the journey** for the animated route tour.
- Use **2D view** to switch away from WebGL.
- Search globally with **Ctrl+K** or **Cmd+K**.
- Open a workspace to access its exact original report routes.

## Next development gates
1. Optionally supplement bespoke procedural landmarks with rights-cleared optimized GLB assets, retaining offline geometry fallbacks.
2. Integrate narrative milestone stops and a real employee-specific journey visualization (not fabricated data).
3. Recreate specialized report tables/charts only after side-by-side comparison to the original source.
4. Complete cross-device WebGL, keyboard, color contrast, reduced motion and performance testing.

## Credits
Three.js under its MIT license. The sample fixture was projected from the user's original fictional Maddie Journey prototype. No paid services are required.

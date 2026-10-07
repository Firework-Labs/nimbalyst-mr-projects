# Mr. Projects: details

Everything the [README](../README.md) leaves out: features in full, the look file format, storage, the Nimbalyst internals Mr. Projects depends on, and how to build it.

Extension id: `com.fireworklabs.project-theme` (unchanged from the "Custom Project Themes" days, so installs and saved configuration carry over) · version 0.5.1
Depends on: [Mr. Themes](https://github.com/Firework-Labs/nimbalyst-mr-themes) (`com.fireworklabs.theme-editor`) for per-project themes. Without it, the rail and poster features still work and the theme picker shows an install hint.

> **Heads-up: Mr. Projects relies on Nimbalyst internals that are not part of the extension SDK.** It hides Nimbalyst's project rail and shows its own (Nimbalyst's hidden buttons still do every switch, close and add), inserts the poster at the top of the left column, and adds a gutter button. **Open in Finder** and the **settings shortcuts** (gutter button, poster gear) call Nimbalyst's internal app bridge, `window.electronAPI`, which extensions are not documented to use. A Nimbalyst update can make the rail, poster or buttons disappear or look wrong until Mr. Projects is updated; disabling or uninstalling it brings back Nimbalyst's own rail. Details in [Host hooks outside the SDK](#host-hooks-outside-the-sdk). Last verified on Nimbalyst 0.77.5.

## What you get

- **Project Settings › Mr. Projects** (project scope):
  - Theme for this project: the panel shows the current theme (a swatch and its name) next to the description; "Change" expands an accordion with "Global theme" and every theme from the Theme Gallery. Applied whenever the project is active, lifted when you switch to a project without one. The Theme Gallery's tray can set this too.
  - Left rail: a user-wide "Wide rail with project names" toggle, then a live tile preview, per-project short name, tile icon (initials, poster thumbnail, or an image file in the project), tile color (solid or gradient; shown only for the Initials icon, since a poster or image covers the tile), and a reset for rail order and dividers.
  - Poster: "Show poster in left column" (per project); source Shape (five shapes), Pattern (22 Hero Patterns with scale and opacity), or your own image; a three-color solid palette (primary base, accent figure, text overlay) from ten built-ins, your own saved palettes (user-wide, saved from the custom colors with a name), or custom colors; the short name always overlays bottom-left in the text color, with a size choice; "Show sandboxed icon" (a green Sandboxed shield chip, top-right); and a toggle for an "Open in Finder" button under the docked poster. The Shape and Pattern rows show the current choice with a "Browse gallery" button that expands the unique shapes or patterns in the current palette. Generated posters are saved as `.nimbalyst/poster.svg`.
- **The rail**: replaces Nimbalyst's project rail visibly and functionally. Nimbalyst's own rail stays in the DOM, hidden; ours mirrors its items and delegates switch, close, and add to the native buttons. Projects that are not the open one show their icon at 40% opacity (full on hover). In wide mode names wrap to two lines. Drag tiles to reorder. The divider line under the stack has a `+` in its center that adds a horizontal rule or a text divider (a pill with nearly square corners); dividers drag like tiles, show an `×` on hover, and text dividers rename on double-click. Projects without a saved look keep Nimbalyst's own tile color.
- **Poster dock**: the active project's poster sits as a 16:9 banner at the top of the existing column to the right of the navigation gutter: the file sidebar in Files mode, the session history in Agent mode, the tracker sidebar in Tracker mode. No extra column. Projects without a saved look show the default wave poster. Nimbalyst's own 3px per-project color strip at the top of that column is hidden, since the poster and tiles carry the project's color.
- **Gutter button**: a "Mr. Projects" button in the navigation gutter's extension section opens Project Settings › Mr. Projects for the active project. Hovering it shows Nimbalyst's big help tooltip (title plus one sentence), rebuilt in `src/helpTooltip.ts` because the host only offers it to its own buttons. Its icon is `graphic-assets/Project-v2.svg` (a window layout over a camera lens) inlined in `src/components/icons.tsx` with `fill="currentColor"`, so it follows the gutter's muted/hover colors.
- **Short name overlay**: wraps to at most two lines (breaking at spaces or after hyphens, ellipsis if still too long), and both lines sit on the same bottom baseline whether there is one line or two. See `wrapTitle` in `src/poster.ts`; the line-break estimate assumes about 0.58 em per character for the heavy system font.

## Storage

- `<project>/.nimbalyst/project-theme.json` is the source of truth for a project's look and travels with the repo.
- User-wide configuration: `projectLooks` (cache so the rail can paint projects that are not open), `wideRail`, `railLayout` (order plus dividers), `customPalettes` (saved palettes: id, name, primary, accent, text).

```json
{
  "version": 1,
  "themeId": "harbor-dark-juicy",
  "shortName": "Atlas API",
  "icon": { "kind": "poster" },
  "tile": { "kind": "gradient", "from": "#0f172a", "to": "#38bdf8", "angle": 135 },
  "poster": {
    "show": true,
    "source": "pattern",
    "file": ".nimbalyst/poster.svg",
    "shape": "wave",
    "palette": { "primary": "#0f172a", "accent": "#38bdf8", "text": "#0f172a" },
    "pattern": { "id": "topography", "scale": 1, "opacity": 0.35 },
    "title": { "size": "L" },
    "sandboxed": true,
    "openFolderButton": true
  }
}
```

Older files still load. From 0.2: `diagonal-shadow` becomes `diagonal`, emoji and symbol icons become initials, `auto` and `theme` tiles become a gradient from the poster palette, `source: "none"` becomes a hidden poster, and the palette angle and title position are ignored. From 0.3: `palette.from`/`to` become `primary`/`accent`, `title.color` becomes `palette.text` (an `auto` color resolves to white or near-black from the figure's luminance), `palette.gradient` and `title.show` are dropped.

## Bridges

- Consumed: `window.__nimbalystThemeEditor` (Mr. Themes) to list themes and set the per-project override.
- Provided: `window.__nimbalystProjectTheme` with `listProjects()` (rail order, labels, active flag, theme id, poster thumbnail), `setProjectTheme(path, themeId | null)` (writes the project file and cache), `subscribe(fn)`.

## Host hooks outside the SDK

The extension SDK has no API for the project rail, the left column, the navigation gutter, opening a folder, or navigating to a settings page. Mr. Projects depends on these undocumented host behaviors (observed on Nimbalyst 0.77.5 with a probe extension; see `docs/nimbalyst-internals.md`).

**Nimbalyst's internal app bridge, `window.electronAPI`** (the preload bridge the app itself uses; extensions are not documented to call it):

- **Open in Finder** calls `openInDefaultApp(projectPath)`, falling back to `showInFinder(projectPath)`.
- **The gutter button and the gear on the docked poster** call `openAccountSettings()` to show the Settings view, then click the `settings-scope-project` tab and the `settings-route-ext:com.fireworklabs.project-theme:project-theme` sidebar entry by their `data-testid`. A synthetic ⌘, keydown and `invokeWindowMenuItem` do not open Settings from the renderer.
- If either function is missing in a later Nimbalyst, the button shows a toast with the manual path instead of failing silently.

**Nimbalyst's window markup** (class names and data attributes, watched with `MutationObserver`s):

- **Rail:** hides `nav.project-rail[data-testid=project-rail]` and mirrors its `.project-rail-item[data-project-path]` entries, reading `.is-active` and `.project-rail-item-badge`; every switch, close and add clicks the hidden native `.project-rail-item-main`, `.project-rail-item-close` and `.project-rail-add` buttons, so Nimbalyst keeps all rail behavior.
- **Poster dock:** inserts the poster as the first child of the first visible of `.workspace-sidebar` (Files), `.session-history` (Agent) and `.tracker-sidebar` (Tracker), and hides `.workspace-color-accent`.
- **Gutter button:** appends its own `div[data-gutter-item]` to `.navigation-gutter .nav-extension-panels`, with a hover tooltip built from Nimbalyst's own `help-tooltip` class names (`src/helpTooltip.ts`).

If these change, the rail, poster or button may not appear; Nimbalyst's own rail reappears whenever Mr. Projects is disabled or uninstalled.

The bridge to Mr. Themes (`window.__nimbalystThemeEditor`, `window.__nimbalystProjectTheme`) is a pair of global objects, also outside the SDK (`docs/bridge-contract.md`).

## Hero Patterns

`src/heroPatterns.ts` holds 22 patterns from [Hero Patterns](https://heropatterns.com) by Steve Schoger (CC BY 4.0), extracted from the `hero-patterns` npm package (MIT, Alec Lomas). Color and opacity are applied at render time through a wrapping `<g>`, so any palette works.

## Development

```bash
npm install
npm run build
npm test             # tests/model.test.ts: rail layout merge, look normalization, poster SVG, short-name wrap
```

Install with the Extension Developer Kit's `extension_install` tool or Settings › Extensions › Install from folder.

Source layout: `src/types.ts` (look model, rail layout, normalization with 0.2 fallbacks), `src/poster.ts` (shapes, patterns, palettes, SVG generator), `src/heroPatterns.ts`, `src/store.ts` (context, cache, preferences, file IO, event bus, both bridges, host hooks), `src/components/RailEnhancer.tsx` (rail replacement with drag and drop and dividers), `PosterDock.tsx` (poster banner in the left column), `PosterFrame.tsx` (poster image plus the Sandboxed chip, shared by dock and preview), `GutterLink.tsx` (the gutter button), `ProjectThemeSettings.tsx`.

## Repository layout

- `src/`, `tests/`, `manifest.json`: the extension. `tests/fixtures/project-theme.json` is a 0.3-era look file that the tests normalize.
- `docs/`: Nimbalyst internals, the dev workflow, the bridge contract with Mr. Themes, and the marketplace listing draft.
- `screenshots/`: listing screenshots and the harness that renders them from the real extension code with demo data.

## Known limitations

- Images must live inside the project (no file picker; the extension API has no binary file copy). Images load through `file://` URLs.
- Native rail features that are not mirrored: native tooltips and right-click menus.
- The dock finds the left column by class name (`.workspace-sidebar`, `.session-history`, `.tracker-sidebar`), hides `.workspace-color-accent`, and the gutter button targets `.navigation-gutter .nav-extension-panels` (all observed on Nimbalyst 0.77.5). Re-verify after an upgrade.
- Picking a native theme in Settings lifts the project theme until the next project switch (Mr. Themes steps aside by design).

## License

MIT, see `LICENSE`. Includes Hero Patterns by Steve Schoger (CC BY 4.0) via the `hero-patterns` package (MIT, Alec Lomas); see `THIRD-PARTY-NOTICES.md`.

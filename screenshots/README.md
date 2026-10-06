# Marketplace screenshots

`com.fireworklabs.project-theme-0-{dark,light}.png` and
`-1-{dark,light}.png`, 2048×1480 PNG (Nimbalyst's own marketplace size).

## What these are, honestly

The window chrome (title bar, project rail slot, navigation gutter, left
column, Settings view) is a **hand-built replica**: plain HTML/CSS in
`harness/harness.html`, using Nimbalyst's real class names and geometry
(from `../docs/nimbalyst-internals.md` and DOM samples taken with a probe
extension in the running app) so it reads as the
real app, but it is not the real app's code.

Everything Mr. Projects itself draws — the rail (tiles, dividers, drag
handles), the poster dock banner, the gutter button, and the whole
`ProjectThemeSettings` page — is the **genuine extension code** from `../src`,
imported and run unmodified by `harness/harness.tsx`. It runs against a fake
`ExtensionContext` (in-memory configuration + filesystem, five demo
projects) and a stub of the Mr. Themes companion bridge
(`window.__nimbalystThemeEditor`) that serves 8 real, resolved theme presets
copied from `../../mr-themes/src/presets.ts` into `harness/fixtures/themes.json`
and recolors the chrome by writing the same `--nim-*`/`--terminal-*`
variables the real applier writes.

No real project names or paths appear anywhere: the demo projects are Atlas
API, Field Notes, Orchard, Lighthouse (the active one), and Harbor Site,
under `/Users/demo/Projects/...`.

## Rebuilding

```bash
cd mr-projects
npm run screenshots:build   # esbuild bundles harness.tsx -> harness/dist/harness.js
```

Re-run this after any change to `harness.tsx` or to `../src` (the bundle
inlines the real extension source at build time, so it goes stale otherwise).

## Recapturing

Open `screenshots/harness/harness.html` with the Nimbalyst browser MCP tools
at a **1024×740 CSS-px viewport**; headless screenshots at that size come out
2048×1480 (exactly 2x), which is the target size, with no extra scaling step
needed:

```
browser_open_session({ url: "nim-preview://.../harness.html?shot=rail&theme=harbor-dark-juicy", width: 1024, height: 740 })
browser_screenshot(...)
```

Query params:

- `shot=rail` (default) — the window with the wide rail, the gutter button,
  and the poster dock. `shot=settings` — Settings › Project › Mr. Projects,
  with the real `ProjectThemeSettings` mounted into a replica Settings view.
- `theme=<id>` — which fixture preset the active project (Lighthouse) uses;
  this is what recolors the whole chrome, through the real
  `RailEnhancer` → bridge `setOverride` path, not a shortcut. Used here:
  `harbor-dark-juicy` (dark shots) and `harbor-light-subtle` (light shots).
  See `harness/fixtures/themes.json` for the other 6 available ids.

Navigate between shots in one session with `browser_navigate` (same URL,
different query string) rather than reopening a session each time.

For the settings screenshots, the full `ProjectThemeSettings` page is taller
than one 740px viewport (it does not fit "theme panel" + "left rail panel"
+ "poster panel with palettes" in one frame at any scroll position — by
measurement, the gap between the rail panel's tile preview and the poster
panel's palette swatches alone is about 550 CSS px, more than the viewport).
The captured frame is scrolled to `.settings-view-main.scrollTop = 430`
(set via `browser_evaluate`, since `browser_scroll` with a selector did not
visibly move this particular scroll container when tried), which favors the
richer, more colorful composition: the tail of the rail panel, the full
Poster source/pattern/palette picker, and the live poster preview (Sandboxed
chip, short name, Open in Finder button). The "Theme for this project" panel
is above this scroll position and is not in frame; it's visible at
`scrollTop = 0` instead (shown together with the rail panel's tile preview,
but then the poster panel is only a sliver).

## Known deviations from the real app

- **Window chrome is fabricated**, as described above — title bar, content
  mode icons, the Agent-mode session list and transcript, and the Settings
  sidebar are all plausible placeholders, not real DOM from a running
  Nimbalyst. Everything inside the rail/dock/gutter/settings-page is real.
- **No Material Symbols font** (no network fonts allowed). The extension's
  own `.pt-symbol` ligature-text icons (`folder_open`, `expand_more`,
  `horizontal_rule`, `label`) would render as literal text without it;
  `harness.tsx` swaps them for small inline SVGs that approximate the same
  glyphs, purely cosmetic and harness-side only (nothing in `../src`
  changed).
  - `ProjectIcon` (gutter button) and `GearIcon`/`SandboxedChip` (poster)
    are already real inline SVGs in the extension and needed no polish.
- **Harbor Site's tile icon is `kind: "image"`** pointing at a
  `.nimbalyst/icon.png` that doesn't exist in the fake filesystem (there's
  no binary asset backing it); the real `<img onError>` fallback in
  `RailEnhancer` correctly swaps it for initials, so this demonstrates that
  resilience path rather than a broken image.
- One settings screenshot per theme is a single scroll position, not the
  whole page — see "Recapturing" above.

# Marketplace screenshots

`com.fireworklabs.project-theme-0-{dark,light}.png` and
`-1-{dark,light}.png`, 2048×1480 PNG (Nimbalyst's own marketplace size).

## What these are, honestly

The window chrome (title bar, project rail slot, navigation gutter, left
column, Settings view) is a **hand-built replica**: plain HTML/CSS in
`harness/harness.html`, using Nimbalyst's real class names and geometry
(taken from DOM samples of the running app) so it reads as the
real app, but it is not the real app's code.

Everything Mr. Projects itself draws — the rail (tiles, dividers, drag
handles), the poster dock banner, the gutter button, and the whole
`ProjectThemeSettings` page — is the **genuine extension code** from `../src`,
imported and run unmodified by `harness/harness.tsx`. It runs against a fake
`ExtensionContext` (in-memory configuration + filesystem, six demo
projects) and a stub of the Mr. Themes companion bridge
(`window.__nimbalystThemeEditor`) that serves 8 real, resolved theme presets
copied from `../../mr-themes/src/presets.ts` into `harness/fixtures/themes.json`
and recolors the chrome by writing the same `--nim-*`/`--terminal-*`
variables the real applier writes.

No real project names or paths appear anywhere. The six demo projects live
under `/Users/demo/Projects/...` and sit in the rail under three text headings:

| Heading | Project | Tile |
| --- | --- | --- |
| Clients | Atlas API | initials, royal blue gradient |
| Clients | Bluewater | initials, sky blue gradient |
| Team | Field Notes (the active project) | poster thumbnail, yellow base with a green wave |
| Team | Orchard | poster thumbnail, lime base with a yellow diagonal |
| Home | Pink House | photo |
| Home | Flamingo | photo |

Field Notes is active, so the docked poster, the Sandboxed chip, the Open in
Finder button, and the settings page (shot 1) all show its look. The native
rail items and the left-column header are generated from the same
`demoProjects` list in `harness.tsx`, so they cannot drift from it.

## Photos

The two photo tiles use `kind: "image"` icons, which the extension loads from
`file://` URLs inside the project. A page served over `nim-preview://` cannot
read `file://`, so the harness redirects exactly those two URLs to
`harness/fixtures/photos/pink-house.jpg` and `flamingo.jpg` (harness only).
Both are center-cropped squares, 500×500.

- Pink house: photo by Paul Bill,
  <https://unsplash.com/photos/a-pink-and-blue-house-with-a-white-balcony-w0xNq-jWl6k>
- Flamingo: photo by Edrick Krozendijk,
  <https://unsplash.com/photos/pink-flamingo-in-close-up-photography-25JxltstHSc>

Both are used under the [Unsplash License](https://unsplash.com/license).

## Rebuilding

```bash
cd mr-projects
npm run screenshots:build   # esbuild bundles harness.tsx -> harness/dist/harness.js
```

Re-run this after any change to `harness.tsx` or to `../src` (the bundle
inlines the real extension source at build time, so it goes stale otherwise).

## Recapturing

Open `screenshots/harness/harness.html` with the Nimbalyst browser MCP tools
in a session of **2048×1480** and set `document.documentElement.style.zoom = '2'`
(via `browser_evaluate`) before each screenshot, re-setting it after every
navigation. The layout stays 1024×740 CSS px at 2x, and the image comes out
2048×1480, the target size. (A 1024×740 viewport gives 1x images here.)
Confirm with `sips -g pixelWidth -g pixelHeight`.

```
browser_open_session({ url: "nim-preview://.../harness.html?shot=rail&theme=harbor-dark-juicy", width: 2048, height: 1480 })
browser_evaluate({ script: "document.documentElement.style.zoom = '2'" })
browser_screenshot(...)
```

`harness.html` loads the bundle with a timestamp query, so a rebuild is never
served stale; add a throwaway `&t=<n>` to the page URL when navigating to the
same URL again.

Query params:

- `shot=rail` (default) — the window with the wide rail, the gutter button,
  and the poster dock. `shot=settings` — Settings › Project › Mr. Projects,
  with the real `ProjectThemeSettings` mounted into a replica Settings view.
- `theme=<id>` — which fixture preset the active project (Field Notes) uses;
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
- **Inactive rail tiles are shown at full opacity.** The extension draws
  tiles of projects that are not active at 40% opacity (full on hover); at
  that strength the colors and photos wash out in a still image, so the harness
  adds one CSS rule (`.pt-item:not(.active) .pt-tile { opacity: 1 }`), as if
  every tile were hovered. The active project is still marked by its frame.
- The photo tiles load through the harness's URL redirect described under
  "Photos"; the extension's own `<img onError>` fallback to initials is
  untouched.
- One settings screenshot per theme is a single scroll position, not the
  whole page — see "Recapturing" above.

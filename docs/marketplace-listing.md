# Marketplace listing draft: Mr. Projects

Draft for the Nimbalyst extension marketplace, 2026-10-02. Nimbalyst does not document a submission process for third-party extensions yet (checked: the bundled SDK docs, nimbalyst.com/docs/extensions/extension-system-and-marketplace, nimbalyst.com/docs/extensions/building-extensions, nimbalyst.com/extensions). The field names below follow the `marketplace` block in the manifest of Nimbalyst's own Git extension (`com.nimbalyst.git` 1.0.2), the only listing format observed. The same content is in `manifest.json` under `marketplace` (`changelog`, `categories`, `tags`, `icon`, `tagline`, `longDescription` with the heads-up, `screenshots`, `highlights`). A `marketplace` block with `productivity` as its category was already in the manifest; `productivity` is not one of the marketplace's categories, so it is now `developer-tools`.

## Store fields

| Field | Value |
|---|---|
| Name | Mr. Projects |
| Extension id | `com.fireworklabs.project-theme` |
| Author | Firework Labs |
| License | MIT (includes Hero Patterns, CC BY 4.0; see `THIRD-PARTY-NOTICES.md`) |
| Icon (Material Symbol) | `wallpaper` (as in the settings route) |
| Category | `developer-tools` (the five categories that exist are Featured, Diagrams & Visual Editing, Data & Spreadsheets, Developer Tools, AI-Powered Tools) |
| Tags | `theme`, `projects`, `workspace`, `poster`, `left-rail`, `sidebar`, `organization`, `per-project` |
| Repository | `https://github.com/Firework-Labs/nimbalyst-mr-projects` |

**Tagline**

> Uniquify project spaces–designed to work with Mr. Themes.

**Long description**

> Make every project look like itself. Mr. Projects replaces the project rail with one that shows each project's icon and name, lets you drag projects into your own order, and adds rules and headings to group them. Each project gets a poster: a 16:9 banner at the top of the left column, built from a shape or one of 22 Hero Patterns in a three-color palette, or your own image, with its short name on top. Optional extras per project: a Sandboxed chip and an Open in Finder button. With Mr. Themes installed, each project also gets its own color theme, applied whenever you switch to it. A project's look is saved in `.nimbalyst/project-theme.json`, so it travels with the repository.

**Highlights** (kept from the `marketplace` block that was already in `manifest.json`)

- Pick a theme per project; it switches as you switch projects
- Wide left rail with icons, two-line names, drag-and-drop order, rules and text dividers
- Poster banner docked in the left column: shapes, Hero Patterns, or your own image, with a Sandboxed chip, an Open in Finder button, and a gear that opens the settings
- A gutter icon that jumps straight to the Mr. Projects settings
- Settings travel with the project in .nimbalyst/project-theme.json

**Screenshots** (2048×1480, dark and light; files in `screenshots/`)

| # | Alt text |
|---|---|
| 0 | The Mr. Projects rail with project posters, names and a heading, and the active project's poster banner at the top of the left column |
| 1 | Project Settings › Mr. Projects: theme, left rail and poster settings with palettes |

The screenshots are rendered from the extension's real code on a replica of the Nimbalyst window with demo projects (`screenshots/README.md`), so no real project names appear.

**Changelog**

> 0.5.1: Deleting a rail rule or heading now deletes it instead of moving it to the bottom.
> 0.5.0: Renamed from Custom Project Themes; new gutter icon and help tooltip; gear on the docked poster opens the settings.
> 0.4.x: Three-color solid poster palettes with saved palettes; two-line short-name overlay; custom gutter icon.

## "Before you install" callout (also in README.md)

> **Mr. Projects relies on Nimbalyst internals that are not part of the extension SDK.** The SDK has no API for the project rail, the left column or navigation, so Mr. Projects works with Nimbalyst's window directly. It hides Nimbalyst's project rail and shows its own in its place; every switch, close and add is still handled by Nimbalyst's hidden buttons. It inserts the poster at the top of the left column and hides Nimbalyst's thin project color strip there. It adds its button to the navigation gutter. Two buttons use Nimbalyst's internal app bridge (`window.electronAPI`), which extensions are not documented to use: **Open in Finder** calls `openInDefaultApp` (or `showInFinder`), and the **gutter button and the poster's gear** call `openAccountSettings` and then select the project settings page. If a Nimbalyst update changes any of this, the rail, poster or buttons can stop appearing or look wrong until Mr. Projects is updated; the two bridge buttons show a message with the manual path instead of failing silently. Disabling or uninstalling Mr. Projects brings back Nimbalyst's own rail. Last verified on Nimbalyst 0.77.5.

## Requirements and compatibility

- Nimbalyst with extensions enabled. Built against `@nimbalyst/extension-sdk` 0.5, manifest `apiVersion` 1.0.0.
- Last verified in the app (probe extension) on Nimbalyst 0.77.5. On 0.79.1 the extension is enabled and loads; its UI was not re-verified there.
- Per-project themes need Mr. Themes (`com.fireworklabs.theme-editor`). Without it, the rail and posters work and the theme setting shows an install hint.
- Poster and tile images must be inside the project (the SDK has no file picker).
- The folder button reads "Open in Finder" on macOS, "Open in Explorer" on Windows and "Open folder" elsewhere. Only macOS has been tested.

## Permissions and privacy

- **Filesystem** (`permissions.filesystem: true`): to read and write each project's `.nimbalyst/project-theme.json` and `.nimbalyst/poster.svg`, and to show images you place in the project.
- No network access. Rail order, saved palettes and a cache of project looks are stored in Nimbalyst's extension settings on your machine; each project's look is stored in that project.

## Open before submitting

- Ask Nimbalyst whether extensions may use `window.electronAPI` (or whether an SDK route for "open folder" and "open my settings page" is planned); the listing discloses it either way.
- Confirm the category with Nimbalyst.
- Re-verify on the current Nimbalyst release and update "Last verified on".
- Ask whether Nimbalyst wants `dist/` committed or builds from source. Today `dist/` is git-ignored and each GitHub release carries a prebuilt zip.
- Optional: fix the stale-stylesheet bug in `ensureStyles()` (`src/styles.ts`) before a public release, so updates apply their CSS without a restart.

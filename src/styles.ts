const STYLE_ID = 'pt-styles';

export const CSS = `
/* The native rail stays in the DOM (we mirror and delegate to it) but is hidden while ours is up. */
nav.project-rail.pt-native-hidden { display: none !important; }
.pt-rail-host { flex: none; height: 100%; display: flex; }
.pt-rail { width: 56px; height: 100%; background: var(--nim-bg-secondary); border-right: 1px solid var(--nim-border); display: flex; flex-direction: column; align-items: center; padding: 12px 0 8px; gap: 6px; overflow-y: auto; overflow-x: hidden; box-sizing: border-box; scrollbar-width: none; position: relative; }
.pt-rail::-webkit-scrollbar { display: none; }
.pt-rail.wide { width: 88px; }
.pt-rail * { box-sizing: border-box; }

/* Projects */
.pt-item { position: relative; display: flex; flex-direction: column; align-items: center; gap: 3px; width: 48px; padding: 4px 0; border-radius: 10px; cursor: pointer; border: none; background: transparent; color: inherit; font: inherit; flex: none; }
.pt-rail.wide .pt-item { width: 80px; padding: 5px 0 5px; }
.pt-item:hover { background: var(--nim-bg-hover); }
.pt-item.active { background: var(--nim-bg-selected); box-shadow: inset 0 0 0 1px var(--nim-primary); }
.pt-tile { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; overflow: hidden; position: relative; color: var(--nim-text-muted); background: var(--nim-bg-tertiary); flex: none; letter-spacing: .01em; transition: opacity .15s; }
/* Projects that are not the open one sit back at 40%; hover brings them forward. */
.pt-item:not(.active) .pt-tile { opacity: .4; }
.pt-item:not(.active):hover .pt-tile, .pt-item:not(.active):focus-visible .pt-tile { opacity: 1; }
.pt-rail.wide .pt-tile { width: 56px; height: 56px; border-radius: 12px; font-size: 15px; }
.pt-tile img, .pt-tile svg { width: 100%; height: 100%; object-fit: cover; display: block; }
.pt-tile .pt-emoji { font-size: 20px; line-height: 1; }
.pt-rail.wide .pt-tile .pt-emoji { font-size: 28px; }
.pt-symbol { font-family: 'Material Symbols Outlined', 'Material Symbols Rounded', 'Material Icons', sans-serif; font-size: 22px; line-height: 1; font-weight: normal; -webkit-font-feature-settings: 'liga'; font-feature-settings: 'liga'; }
.pt-rail.wide .pt-tile .pt-symbol { font-size: 30px; }
.pt-name { font-size: 10.5px; line-height: 1.2; color: var(--nim-text-muted); max-width: 76px; text-align: center; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word; padding: 0 2px; }
.pt-item:not(.active) .pt-name { opacity: .6; }
.pt-item:not(.active):hover .pt-name { opacity: 1; }
.pt-item.active .pt-name { color: var(--nim-text); font-weight: 600; }
.pt-badge { position: absolute; right: -4px; bottom: -4px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; background: var(--nim-primary); color: var(--nim-on-primary, #111827); font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 2px solid var(--nim-bg-secondary); box-sizing: content-box; }
.pt-close { position: absolute; top: -2px; right: 2px; width: 18px; height: 18px; border-radius: 50%; background: var(--nim-bg-tertiary); color: var(--nim-text-muted); border: 1px solid var(--nim-border); font-size: 12px; line-height: 1; display: none; align-items: center; justify-content: center; cursor: pointer; padding: 0; z-index: 1; }
.pt-rail.wide .pt-close { right: 6px; }
.pt-item:hover .pt-close { display: flex; }
.pt-close:hover { background: var(--nim-error); color: #fff; border-color: var(--nim-error); }

/* Dividers */
.pt-rule { position: relative; width: 48px; padding: 5px 0; flex: none; cursor: grab; }
.pt-rail.wide .pt-rule { width: 80px; }
.pt-rule i { display: block; height: 1px; margin: 0 8px; background: var(--nim-border); }
.pt-rule:hover i { background: var(--nim-text-faint); }
.pt-label { position: relative; flex: none; max-width: 46px; padding: 2px 6px; border-radius: 3px; background: var(--nim-bg-tertiary); color: var(--nim-text-muted); font-size: 9.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; line-height: 1.3; cursor: grab; border: 1px solid var(--nim-border); }
.pt-rail.wide .pt-label { max-width: 80px; font-size: 10px; padding: 3px 8px; }
.pt-label-text { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pt-label:hover { color: var(--nim-text); border-color: var(--nim-text-faint); }
.pt-label-input { width: 100%; min-width: 40px; font: inherit; font-size: 10px; text-transform: none; letter-spacing: 0; background: var(--nim-bg) !important; color: var(--nim-text) !important; border: 1px solid var(--nim-border-focus) !important; border-radius: 3px; padding: 1px 3px; outline: none; box-shadow: none !important; }
.pt-x { position: absolute; top: -7px; right: -4px; width: 16px; height: 16px; border-radius: 50%; background: var(--nim-bg-tertiary); color: var(--nim-text-muted); border: 1px solid var(--nim-border); font-size: 11px; line-height: 1; display: none; align-items: center; justify-content: center; cursor: pointer; padding: 0; z-index: 1; }
.pt-rule .pt-x { top: -4px; right: 0; }
.pt-rule:hover .pt-x, .pt-label:hover .pt-x { display: flex; }
.pt-x:hover { background: var(--nim-error); color: #fff; border-color: var(--nim-error); }

/* Drag and drop */
.pt-rail.dragging .pt-item, .pt-rail.dragging .pt-rule, .pt-rail.dragging .pt-label { cursor: grabbing; }
.is-dragging { opacity: .35; }
.drop-before::before, .drop-after::after { content: ""; position: absolute; left: 4px; right: 4px; height: 2px; border-radius: 1px; background: var(--nim-primary); z-index: 2; }
.drop-before::before { top: -4px; }
.drop-after::after { bottom: -4px; }

/* The divider line under the stack, with a + in its center for adding dividers. */
.pt-divider { position: relative; width: 48px; height: 18px; margin: 2px 0; flex: none; display: flex; align-items: center; justify-content: center; }
.pt-rail.wide .pt-divider { width: 80px; }
.pt-divider > i { position: absolute; left: 6px; right: 6px; top: 50%; height: 1px; background: var(--nim-border); }
.pt-divider-add { position: relative; width: 18px; height: 18px; border-radius: 50%; border: 1px solid var(--nim-border); background: var(--nim-bg-secondary); color: var(--nim-text-faint); font-size: 13px; line-height: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; z-index: 1; }
.pt-divider-add:hover, .pt-divider-add[aria-expanded="true"] { color: var(--nim-text); border-color: var(--nim-text-faint); background: var(--nim-bg-tertiary); }
.pt-menu { position: fixed; z-index: 1000; min-width: 168px; background: var(--nim-bg); border: 1px solid var(--nim-border); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.35); padding: 4px; display: flex; flex-direction: column; }
.pt-menu button { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; border: none; background: transparent; color: var(--nim-text); font: inherit; font-size: 12px; padding: 6px 8px; border-radius: 5px; cursor: pointer; }
.pt-menu button:hover { background: var(--nim-bg-hover); }
.pt-menu button .pt-symbol { font-size: 16px; color: var(--nim-text-muted); }
.pt-menu-hint { font-size: 10.5px; color: var(--nim-text-faint); padding: 4px 8px 4px; border-top: 1px solid var(--nim-border); margin-top: 2px; }
.pt-add { width: 40px; height: 40px; border-radius: 10px; border: 1px dashed var(--nim-border); background: transparent; color: var(--nim-text-faint); font-size: 18px; cursor: pointer; flex: none; }
.pt-rail.wide .pt-add { width: 56px; height: 44px; }
.pt-add:hover { color: var(--nim-text); border-color: var(--nim-text-faint); }

/* Nimbalyst's own per-project color strip at the top of the left column; our poster and tiles replace it. */
.workspace-color-accent { display: none !important; }

/* Poster dock at the top of the existing left column */
.pt-dock-host { flex: none; width: 100%; }
.pt-dock { padding: 8px 8px 6px; border-bottom: 1px solid var(--nim-border); display: flex; flex-direction: column; gap: 6px; }
.pt-poster-frame { position: relative; border-radius: 8px; overflow: hidden; background: var(--nim-bg-tertiary); box-shadow: 0 4px 14px rgba(0,0,0,.25); aspect-ratio: 1 / 1; }
.pt-poster-frame.banner { aspect-ratio: 16 / 9; }
.pt-poster-frame img { width: 100%; height: 100%; display: block; object-fit: cover; }
.pt-chip-sandboxed { position: absolute; top: 6px; right: 6px; display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px 2px 5px; border-radius: 999px; background: #16a34a; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: .02em; line-height: 1.4; box-shadow: 0 1px 4px rgba(0,0,0,.35); pointer-events: none; }
.pt-chip-sandboxed svg { flex: none; }
/* Gear in the poster's bottom-right corner, only while hovering the poster. */
.pt-dock-gear { position: absolute; right: 6px; bottom: 6px; width: 26px; height: 26px; border-radius: 7px; border: none; background: rgba(0,0,0,.5); color: #fff; display: none; align-items: center; justify-content: center; cursor: pointer; padding: 0; box-shadow: 0 1px 4px rgba(0,0,0,.35); }
.pt-dock-gear:hover { background: rgba(0,0,0,.7); }
.pt-poster-frame:hover .pt-dock-gear, .pt-dock-gear:focus-visible { display: flex; }
.pt-dock-open { display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 4px 8px; border: 1px solid var(--nim-border); border-radius: 6px; background: var(--nim-bg-tertiary); color: var(--nim-text-muted); font: inherit; font-size: 11.5px; cursor: pointer; }
.pt-dock-open:hover { background: var(--nim-bg-hover); color: var(--nim-text); }
.pt-dock-open .pt-symbol { font-size: 15px; }

/* Fallback styling for the rebuilt help tooltip (the host's own classes normally apply). */
.pt-help-tooltip { position: fixed; z-index: 10002; max-width: 280px; padding: 10px 12px; background: var(--nim-bg); border: 1px solid var(--nim-border); border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.15), 0 2px 4px rgba(0,0,0,.1); pointer-events: none; font-size: 12px; line-height: 1.5; color: var(--nim-text-muted); }
.pt-help-tooltip .help-tooltip-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.pt-help-tooltip .help-tooltip-title { font-size: 13px; font-weight: 600; color: var(--nim-text); }
.pt-help-tooltip .help-tooltip-paragraph { margin: 0; }

/* Our button in the navigation gutter, styled like Nimbalyst's own nav-buttons. */
.pt-gutter-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 6px; background: transparent; color: var(--nim-text-muted); cursor: pointer; padding: 0; transition: background .15s, color .15s; }
.pt-gutter-btn:hover { background: var(--nim-bg-tertiary); color: var(--nim-text); }
.pt-gutter-btn:active { transform: scale(.95); }
.pt-gutter-btn .pt-symbol { font-size: 20px; }

/* Shared UI for the settings page */
.pt { color: var(--nim-text); font-size: 13px; line-height: 1.45; }
.pt * { box-sizing: border-box; }
.pt h2 { margin: 0 0 4px; font-size: 18px; }
.pt h3 { margin: 0 0 4px; font-size: 13.5px; }
.pt .pt-sub { color: var(--nim-text-faint); margin-bottom: 16px; font-size: 12px; }
.pt .pt-sec { border: 1px solid var(--nim-border); border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; background: var(--nim-bg-secondary); }
.pt .pt-d { color: var(--nim-text-faint); font-size: 12px; margin-bottom: 10px; }
.pt .pt-frow { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; border-top: 1px solid var(--nim-border); flex-wrap: wrap; }
.pt .pt-frow:first-of-type { border-top: none; }
.pt .pt-frow > label { color: var(--nim-text-muted); }
.pt .pt-btn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--nim-border); background: var(--nim-bg-tertiary); color: var(--nim-text); border-radius: 6px; padding: 5px 10px; font-size: 12px; cursor: pointer; font: inherit; }
.pt .pt-btn:hover { background: var(--nim-bg-hover); }
.pt .pt-btn:disabled { opacity: .5; cursor: default; }
.pt .pt-btn.primary { background: var(--nim-primary); color: var(--nim-on-primary, #111827); border-color: var(--nim-primary); font-weight: 600; }
.pt .pt-btn.ghost { background: transparent; border-color: transparent; }
.pt input.pt-input, .pt select.pt-input { background: var(--nim-bg) !important; border: 1px solid var(--nim-border) !important; border-radius: 6px; padding: 5px 8px; color: var(--nim-text) !important; font: inherit; outline: none; box-shadow: none !important; }
.pt input.pt-input:focus { border-color: var(--nim-border-focus) !important; }
.pt input[type=range].pt-range { width: 120px; accent-color: var(--nim-primary); }
.pt .pt-toggle { width: 34px; height: 18px; border-radius: 9px; background: var(--nim-bg-active); position: relative; border: none; cursor: pointer; padding: 0; flex: none; }
.pt .pt-toggle::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: var(--nim-text-faint); transition: left .15s; }
.pt .pt-toggle.on { background: var(--nim-primary); }
.pt .pt-toggle.on::after { left: 18px; background: var(--nim-on-primary, #111827); }
.pt .pt-seg { display: inline-flex; border: 1px solid var(--nim-border); border-radius: 6px; overflow: hidden; }
.pt .pt-seg button { padding: 4px 10px; color: var(--nim-text-muted); font-size: 12px; border: none; border-right: 1px solid var(--nim-border); background: transparent; cursor: pointer; font: inherit; }
.pt .pt-seg button:last-child { border-right: none; }
.pt .pt-seg button.on { background: var(--nim-bg-selected); color: var(--nim-text); }
.pt .pt-swatches { display: flex; gap: 8px; flex-wrap: wrap; }
.pt .pt-swatch { width: 118px; border: 1px solid var(--nim-border); border-radius: 8px; overflow: hidden; background: var(--nim-bg); cursor: pointer; padding: 0; text-align: left; font: inherit; color: inherit; }
.pt .pt-swatch.on { outline: 2px solid var(--nim-primary); }
.pt .pt-swatch .b { height: 34px; display: flex; }
.pt .pt-swatch .b i { flex: 1; display: block; }
.pt .pt-swatch .n { font-size: 11px; padding: 5px 8px; color: var(--nim-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pt .pt-sec-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.pt .pt-sec-head h3 { margin: 0; }
.pt .pt-acc { display: inline-flex; align-items: center; gap: 6px; border: none; background: transparent; color: var(--nim-text-muted); font: inherit; font-size: 12px; cursor: pointer; padding: 4px 6px; border-radius: 6px; }
.pt .pt-acc:hover { background: var(--nim-bg-hover); color: var(--nim-text); }
.pt .pt-acc .pt-symbol { font-size: 18px; transition: transform .15s; }
.pt .pt-acc[aria-expanded="true"] .pt-symbol { transform: rotate(180deg); }
.pt .pt-current { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.pt .pt-current .pt-swatch { width: auto; display: inline-flex; align-items: center; cursor: default; flex: none; }
.pt .pt-current .pt-swatch .b { width: 42px; height: 22px; }
.pt .pt-current .pt-swatch .n { padding: 4px 8px; color: var(--nim-text); font-weight: 600; }
.pt .pt-current .pt-d { margin: 0; }
.pt .pt-pick { display: inline-flex; align-items: center; gap: 10px; }
.pt .pt-pick .pt-thumb { width: 56px; height: 56px; border-radius: 8px; overflow: hidden; border: 1px solid var(--nim-border); background: var(--nim-bg-tertiary); flex: none; }
.pt .pt-pick .pt-thumb img { width: 100%; height: 100%; display: block; object-fit: cover; }
.pt .pt-pick .pt-pick-name { color: var(--nim-text); font-weight: 600; min-width: 70px; }
.pt .pt-shapes { display: flex; gap: 10px; flex-wrap: wrap; padding: 10px 0 4px; }
.pt .pt-shape { width: 72px; border-radius: 8px; overflow: hidden; border: 1px solid var(--nim-border); cursor: pointer; padding: 0; background: transparent; font: inherit; color: var(--nim-text-muted); text-align: center; }
.pt .pt-shape.on { outline: 2px solid var(--nim-primary); }
.pt .pt-shape img { width: 100%; aspect-ratio: 1 / 1; display: block; }
.pt .pt-shape span { display: block; font-size: 10px; padding: 3px 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pt .pt-patterns { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 8px; padding: 10px 0 4px; }
.pt .pt-pattern { border: 1px solid var(--nim-border); border-radius: 8px; overflow: hidden; cursor: pointer; padding: 0; background: transparent; text-align: center; font: inherit; color: var(--nim-text-muted); }
.pt .pt-pattern.on { outline: 2px solid var(--nim-primary); }
.pt .pt-pattern img { width: 100%; aspect-ratio: 1 / 1; display: block; object-fit: cover; }
.pt .pt-pattern span { display: block; font-size: 10px; padding: 3px 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pt .pt-pals { display: flex; gap: 8px; flex-wrap: wrap; padding: 4px 0 8px; }
.pt .pt-pal { position: relative; width: 56px; height: 32px; border-radius: 6px; border: 1px solid var(--nim-border); cursor: pointer; padding: 0; overflow: hidden; font: inherit; }
.pt .pt-pal.on { outline: 2px solid var(--nim-primary); }
.pt .pt-pal .pt-pal-text { position: absolute; left: 6px; bottom: 3px; font-size: 11px; font-weight: 800; letter-spacing: -.02em; line-height: 1; text-shadow: 0 1px 3px rgba(0,0,0,.35); }
.pt .pt-pal-x { position: absolute; top: -6px; right: -6px; width: 16px; height: 16px; border-radius: 50%; background: var(--nim-bg-tertiary); color: var(--nim-text-muted); border: 1px solid var(--nim-border); font-size: 11px; line-height: 1; display: none; align-items: center; justify-content: center; cursor: pointer; padding: 0; z-index: 1; }
.pt .pt-pal-wrap { position: relative; }
.pt .pt-pal-wrap:hover .pt-pal-x { display: flex; }
.pt .pt-pal-x:hover { background: var(--nim-error); color: #fff; border-color: var(--nim-error); }
.pt .pt-pal-label { display: block; font-size: 10px; color: var(--nim-text-faint); text-align: center; margin-top: 3px; max-width: 56px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pt .pt-builder { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 18px; }
.pt .pt-posterprev { border-radius: 10px; overflow: hidden; aspect-ratio: 16 / 9; background: var(--nim-bg-tertiary); }
.pt .pt-posterprev img { width: 100%; height: 100%; display: block; object-fit: cover; }
.pt .pt-posterprev .pt-poster-frame { border-radius: 10px; box-shadow: none; }
.pt .pt-tileprev { display: flex; align-items: center; gap: 12px; }
.pt .pt-color { display: inline-flex; align-items: center; gap: 6px; }
.pt .pt-color input[type=color] { width: 28px; height: 22px; border: 1px solid var(--nim-border); border-radius: 5px; padding: 0; background: transparent; cursor: pointer; }
.pt .pt-hint { border: 1px dashed var(--nim-border); border-radius: 8px; padding: 10px 12px; color: var(--nim-text-muted); font-size: 12px; }
.pt .pt-hint code, .pt code { font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; }
`;

export function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

export function removeStyles(): void {
  document.getElementById(STYLE_ID)?.remove();
}

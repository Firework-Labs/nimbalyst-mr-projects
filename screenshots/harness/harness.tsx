/**
 * Marketplace-screenshot harness for Mr. Projects.
 *
 * This file is NOT part of the extension. It imports the real extension
 * code from ../../src and runs it against a fake ExtensionContext (in-memory
 * configuration + filesystem) and a stub of the Mr. Themes bridge
 * (window.__nimbalystThemeEditor), on top of harness.html's hand-built
 * replica of Nimbalyst's window chrome. Everything rendered by Mr. Projects
 * itself (the rail, the poster dock, the gutter button, the settings page)
 * is the genuine component tree — only the chrome around it is fake.
 *
 * Query params:
 *   ?shot=rail|settings   which screenshot to render (default: rail)
 *   ?theme=<fixture id>   which Mr. Themes preset the active project uses
 *                         (default: harbor-dark-juicy); see fixtures/themes.json
 */
import { createRoot } from 'react-dom/client';
import { activate, hostComponents, settingsPanel } from '../../src/index';
import type { ProjectLook, RailEntry } from '../../src/types';
import type { ExtensionContext } from '@nimbalyst/extension-sdk';
import themeFixturesJson from './fixtures/themes.json';

/* ------------------------------------------------------------------ */
/* Query params                                                        */
/* ------------------------------------------------------------------ */

const params = new URLSearchParams(location.search);
const SHOT: 'rail' | 'settings' = params.get('shot') === 'settings' ? 'settings' : 'rail';
const THEME_ID = params.get('theme') || 'harbor-dark-juicy';
document.documentElement.dataset.shot = SHOT;

/* ------------------------------------------------------------------ */
/* Demo project data (no real user data)                              */
/* ------------------------------------------------------------------ */

const DEMO_ROOT = '/Users/demo/Projects';

function makeLook(partial: Omit<ProjectLook, 'version'>): ProjectLook {
  return { version: 1, ...partial };
}

interface DemoProject {
  path: string;
  name: string;
  badge?: string;
  active?: boolean;
  look: ProjectLook;
}

const photoPoster = (primary: string, accent: string) =>
  ({
    show: true,
    source: 'generated',
    shape: 'wave',
    palette: { primary, accent, text: '#ffffff' },
    pattern: { id: 'topography', scale: 1, opacity: 0.35 },
    title: { size: 'M' },
    sandboxed: false,
    openFolderButton: false,
  }) as const;

// Rail order: Clients (initials, blues), Team (poster thumbnails, greens and
// yellows), Home (photo tiles). Field Notes is the active project.
const demoProjects: DemoProject[] = [
  {
    path: `${DEMO_ROOT}/atlas-api`,
    name: 'Atlas API',
    look: makeLook({
      themeId: null,
      shortName: 'Atlas API',
      icon: { kind: 'initials' },
      tile: { kind: 'gradient', from: '#1d4ed8', to: '#60a5fa', angle: 135 },
      poster: { ...photoPoster('#1d4ed8', '#60a5fa'), title: { size: 'L' } },
    }),
  },
  {
    path: `${DEMO_ROOT}/bluewater`,
    name: 'Bluewater',
    look: makeLook({
      themeId: null,
      shortName: 'Bluewater',
      icon: { kind: 'initials' },
      tile: { kind: 'gradient', from: '#0284c7', to: '#7dd3fc', angle: 135 },
      poster: photoPoster('#0284c7', '#7dd3fc'),
    }),
  },
  {
    path: `${DEMO_ROOT}/field-notes`,
    name: 'Field Notes',
    active: true,
    look: makeLook({
      themeId: THEME_ID,
      shortName: 'Field Notes',
      icon: { kind: 'poster' },
      tile: { kind: 'solid', color: '#facc15' },
      poster: {
        show: true,
        source: 'generated',
        shape: 'wave',
        palette: { primary: '#fde047', accent: '#22c55e', text: '#14532d' },
        pattern: { id: 'leaf', scale: 1.2, opacity: 0.4 },
        title: { size: 'L' },
        sandboxed: true,
        openFolderButton: true,
      },
    }),
  },
  {
    path: `${DEMO_ROOT}/orchard`,
    name: 'Orchard',
    look: makeLook({
      themeId: null,
      shortName: 'Orchard',
      icon: { kind: 'poster' },
      tile: { kind: 'solid', color: '#a3e635' },
      poster: {
        show: true,
        source: 'generated',
        shape: 'diagonal',
        palette: { primary: '#a3e635', accent: '#facc15', text: '#14532d' },
        pattern: { id: 'leaf', scale: 1, opacity: 0.55 },
        title: { size: 'M' },
        sandboxed: false,
        openFolderButton: false,
      },
    }),
  },
  {
    path: `${DEMO_ROOT}/pink-house`,
    name: 'Pink House',
    look: makeLook({
      themeId: null,
      shortName: 'Pink House',
      icon: { kind: 'image', file: 'cover.jpg' }, // photo tile; the harness maps the file:// URL to fixtures/photos
      tile: { kind: 'solid', color: '#f9a8d4' },
      poster: photoPoster('#f9a8d4', '#38bdf8'),
    }),
  },
  {
    path: `${DEMO_ROOT}/flamingo`,
    name: 'Flamingo',
    look: makeLook({
      themeId: null,
      shortName: 'Flamingo',
      icon: { kind: 'image', file: 'cover.jpg' },
      tile: { kind: 'solid', color: '#fb7185' },
      poster: photoPoster('#fb7185', '#7dd3fc'),
    }),
  },
];

/* Photo tiles: in the real app the tile <img> loads file:///<project>/cover.jpg.
   A page served over nim-preview:// cannot read file://, so the harness
   redirects those two URLs (and only those) to the bundled photo fixtures.
   Harness-only; nothing in ../../src changes. */
const PHOTO_URLS: Record<string, string> = {
  [`file://${encodeURI(`${DEMO_ROOT}/pink-house/cover.jpg`)}`]: './fixtures/photos/pink-house.jpg',
  [`file://${encodeURI(`${DEMO_ROOT}/flamingo/cover.jpg`)}`]: './fixtures/photos/flamingo.jpg',
};
const nativeSetAttribute = Element.prototype.setAttribute;
Element.prototype.setAttribute = function (name: string, value: string) {
  if (this instanceof HTMLImageElement && name === 'src' && value in PHOTO_URLS) value = PHOTO_URLS[value];
  return nativeSetAttribute.call(this, name, value);
};
// React may also assign img.src as a property; cover that path too.
const srcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
if (srcDescriptor?.set) {
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    ...srcDescriptor,
    set(value: string) {
      srcDescriptor.set!.call(this, value in PHOTO_URLS ? PHOTO_URLS[value] : value);
    },
  });
}

const ACTIVE = demoProjects.find((p) => p.active) ?? demoProjects[0];

/* ------------------------------------------------------------------ */
/* Fake ExtensionContext: in-memory filesystem + configuration         */
/* ------------------------------------------------------------------ */

const fsFiles = new Map<string, string>();
for (const p of demoProjects) {
  fsFiles.set(`${p.path}/.nimbalyst/project-theme.json`, JSON.stringify(p.look, null, 2));
}

const projectLooksCfg: Record<string, ProjectLook> = {};
for (const p of demoProjects) projectLooksCfg[p.path] = p.look;

const railLayout: RailEntry[] = [
  { kind: 'text', id: 'demo-text-clients', label: 'Clients' },
  { kind: 'project', path: demoProjects[0].path },
  { kind: 'project', path: demoProjects[1].path },
  { kind: 'text', id: 'demo-text-team', label: 'Team' },
  { kind: 'project', path: demoProjects[2].path },
  { kind: 'project', path: demoProjects[3].path },
  { kind: 'text', id: 'demo-text-home', label: 'Home' },
  { kind: 'project', path: demoProjects[4].path },
  { kind: 'project', path: demoProjects[5].path },
];

const configStore: Record<string, unknown> = {
  wideRail: true,
  projectLooks: projectLooksCfg,
  railLayout,
  customPalettes: [],
};

const context = {
  manifest: { id: 'com.fireworklabs.project-theme', name: 'Mr. Projects', version: '0.5.1' },
  extensionPath: '/fake/mr-projects',
  services: {
    filesystem: {
      async readFile(path: string) {
        if (!fsFiles.has(path)) throw new Error(`ENOENT (harness fs): ${path}`);
        return fsFiles.get(path)!;
      },
      async writeFile(path: string, content: string | Uint8Array) {
        fsFiles.set(path, typeof content === 'string' ? content : '');
      },
      async fileExists(path: string) {
        return fsFiles.has(path);
      },
      async findFiles() {
        return [];
      },
    },
    ui: {
      showInfo() {},
      showWarning() {},
      showError() {},
    },
    configuration: {
      get<T>(key: string, defaultValue?: T): T {
        return (key in configStore ? configStore[key] : defaultValue) as T;
      },
      async update(key: string, value: unknown) {
        configStore[key] = value;
      },
      getAll() {
        return { ...configStore };
      },
    },
    collab: {},
  },
  subscriptions: [],
} as unknown as ExtensionContext;

/* ------------------------------------------------------------------ */
/* Stub companion bridge: window.__nimbalystThemeEditor                */
/* Serves the 8 resolved presets in fixtures/themes.json and recolors  */
/* <html> (the --nim- and --terminal- vars the whole chrome is built on) */
/* on setOverride, exactly like the real Mr. Themes applier.           */
/* ------------------------------------------------------------------ */

interface FixtureTheme {
  id: string;
  name: string;
  isDark: boolean;
  vars: Record<string, string>;
}
const fixtures = themeFixturesJson as FixtureTheme[];

function colorsOf(vars: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) out[k.replace(/^--(nim-)?/, '')] = v;
  return out;
}
function summaryOf(t: FixtureTheme) {
  return { id: t.id, name: t.name, isDark: t.isDark, colors: colorsOf(t.vars) };
}

const bridgeListeners = new Set<(s: unknown) => void>();
const appliedKeys = new Set<string>();

function applyVars(theme: FixtureTheme | null) {
  const root = document.documentElement;
  if (!theme) {
    for (const k of appliedKeys) root.style.removeProperty(k);
    appliedKeys.clear();
    root.dataset.theme = 'native:light';
    root.classList.remove('dark-theme');
    return;
  }
  for (const [k, v] of Object.entries(theme.vars)) {
    root.style.setProperty(k, v);
    appliedKeys.add(k);
  }
  root.dataset.theme = theme.id;
  root.classList.toggle('dark-theme', theme.isDark);
}

const themeEditorBridge = {
  version: 1,
  listThemes: () => fixtures.map(summaryOf),
  getTheme: (id: string) => {
    const t = fixtures.find((x) => x.id === id);
    return t ? summaryOf(t) : null;
  },
  getEnabled: () => null,
  getNativeTheme: () => summaryOf(fixtures[0]),
  getActiveTheme: () => summaryOf(fixtures.find((t) => t.id === THEME_ID) ?? fixtures[0]),
  apply: async () => {},
  setOverride: (themeOrId: unknown) => {
    if (themeOrId == null) {
      applyVars(null);
    } else {
      const id = typeof themeOrId === 'string' ? themeOrId : (themeOrId as { id?: string })?.id;
      applyVars(fixtures.find((t) => t.id === id) ?? null);
    }
    bridgeListeners.forEach((fn) => fn({}));
  },
  preview: () => {},
  getState: () => ({}),
  subscribe: (fn: (s: unknown) => void) => {
    bridgeListeners.add(fn);
    return () => bridgeListeners.delete(fn);
  },
};
(window as unknown as { __nimbalystThemeEditor: unknown }).__nimbalystThemeEditor = themeEditorBridge;

/* Harness-only deviation: the real extension draws tiles of projects that are
   not the active one at 40% opacity (full on hover). At that strength colors
   and photos wash out in a still image, so the screenshots show those tiles at
   full opacity, as if hovered. Documented in README.md. */
const harnessStyle = document.createElement('style');
harnessStyle.textContent = '.pt-item:not(.active) .pt-tile { opacity: 1 !important; }';
document.head.appendChild(harnessStyle);

/* Native rail (the replica's <nav class="project-rail">) and the active
   project's header texts, generated from demoProjects so they never drift. */
const nativeNav = document.querySelector('nav.project-rail');
const nativeDivider = nativeNav?.querySelector('.project-rail-divider');
for (const p of demoProjects) {
  const item = document.createElement('div');
  item.className = `project-rail-item${p.active ? ' is-active' : ''}`;
  item.dataset.testid = 'project-rail-item';
  item.dataset.projectPath = p.path;
  item.innerHTML =
    `<button class="project-rail-item-main" aria-label="Switch to project ${p.name}"${p.active ? ' aria-current="true"' : ''}></button>` +
    `<button class="project-rail-item-close" aria-label="Close ${p.name}"></button>`;
  nativeNav?.insertBefore(item, nativeDivider ?? null);
}
document.getElementById('ws-title')!.textContent = ACTIVE.name;
document.getElementById('ws-sub')!.textContent = ACTIVE.path;
document.getElementById('ws-header')!.textContent = ACTIVE.name;

/* ------------------------------------------------------------------ */
/* Activate the real extension, mount its real host components         */
/* ------------------------------------------------------------------ */

activate(context);

const { RailEnhancer, PosterDock, GutterLink } = hostComponents as Record<string, React.ComponentType>;
const { ProjectThemeSettings } = settingsPanel as Record<string, React.ComponentType<Record<string, unknown>>>;

function HostLauncher() {
  return (
    <>
      <RailEnhancer />
      <PosterDock />
      <GutterLink />
    </>
  );
}

const hostRootEl = document.getElementById('harness-host-root');
if (hostRootEl) createRoot(hostRootEl).render(<HostLauncher />);

if (SHOT === 'settings') {
  const settingsRootEl = document.getElementById('settings-main-mount');
  if (settingsRootEl) {
    createRoot(settingsRootEl).render(
      <ProjectThemeSettings workspacePath={ACTIVE.path} theme={document.documentElement.dataset.theme ?? 'light'} storage={{}} />,
    );
  }
}

/* ------------------------------------------------------------------ */
/* Cosmetic polish: Material Symbols ligatures have no font here (no   */
/* network fonts allowed), so the handful of .pt-symbol icons the real */
/* components render ("folder_open", "expand_more", "horizontal_rule", */
/* "label") would show as literal text. Swap them for small inline     */
/* SVGs that match the icon's meaning, purely cosmetic, harness-only.   */
/* ------------------------------------------------------------------ */

const SYMBOL_SVGS: Record<string, string> = {
  folder_open:
    '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H5"/><path d="M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2l-1.3-8.3A2 2 0 0 0 19 8H5a2 2 0 0 0-2 2"/></svg>',
  expand_more:
    '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  horizontal_rule:
    '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M4 12h16"/></svg>',
  label:
    '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h9l9 5-9 5H3Z"/><circle cx="8" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>',
};

function polishSymbols(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('.pt-symbol').forEach((el) => {
    if (el.dataset.ptIconDone) return;
    const key = (el.textContent ?? '').trim();
    const svg = SYMBOL_SVGS[key];
    if (!svg) return;
    el.dataset.ptIconDone = '1';
    el.style.display = 'inline-flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.innerHTML = svg;
  });
}
polishSymbols(document.body);
new MutationObserver(() => polishSymbols(document.body)).observe(document.body, { childList: true, subtree: true });

/* Signal readiness for the capture script once everything has settled. */
window.setTimeout(() => {
  document.body.dataset.harnessReady = '1';
}, 300);

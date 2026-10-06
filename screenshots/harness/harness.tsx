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

const demoProjects: DemoProject[] = [
  {
    path: `${DEMO_ROOT}/atlas-api`,
    name: 'Atlas API',
    badge: '1',
    look: makeLook({
      themeId: null,
      shortName: 'Atlas API',
      icon: { kind: 'initials' },
      tile: { kind: 'gradient', from: '#0f172a', to: '#38bdf8', angle: 135 },
      poster: {
        show: true,
        source: 'generated',
        shape: 'wave',
        palette: { primary: '#6b7280', accent: '#0ea5e9', text: '#ffffff' },
        pattern: { id: 'topography', scale: 1, opacity: 0.35 },
        title: { size: 'L' },
        sandboxed: false,
        openFolderButton: false,
      },
    }),
  },
  {
    path: `${DEMO_ROOT}/field-notes`,
    name: 'Field Notes',
    look: makeLook({
      themeId: 'grove-light-subtle',
      shortName: 'Field Notes',
      icon: { kind: 'poster' },
      tile: { kind: 'solid', color: '#2f7d4f' },
      poster: {
        show: true,
        source: 'pattern',
        shape: 'wave',
        palette: { primary: '#fbf7f0', accent: '#2f7d4f', text: '#ffffff' },
        pattern: { id: 'leaf', scale: 1.2, opacity: 0.4 },
        title: { size: 'M' },
        sandboxed: false,
        openFolderButton: false,
      },
    }),
  },
  {
    path: `${DEMO_ROOT}/orchard`,
    name: 'Orchard',
    look: makeLook({
      themeId: null,
      shortName: 'Orchard',
      icon: { kind: 'initials' },
      tile: { kind: 'solid', color: '#10b981' },
      poster: {
        show: true,
        source: 'generated',
        shape: 'arc',
        palette: { primary: '#1e293b', accent: '#10b981', text: '#ffffff' },
        pattern: { id: 'topography', scale: 1, opacity: 0.35 },
        title: { size: 'M' },
        sandboxed: false,
        openFolderButton: false,
      },
    }),
  },
  {
    path: `${DEMO_ROOT}/lighthouse`,
    name: 'Lighthouse',
    active: true,
    look: makeLook({
      themeId: THEME_ID,
      shortName: 'Lighthouse',
      icon: { kind: 'poster' },
      tile: { kind: 'gradient', from: '#0f172a', to: '#38bdf8', angle: 135 },
      poster: {
        show: true,
        source: 'pattern',
        shape: 'wave',
        // Custom colors (not the built-in "Slate and sky" palette, whose text
        // is #0f172a == its own primary -- unreadable against a pattern on
        // that base). White overlay text keeps the short-name legible.
        palette: { primary: '#0f172a', accent: '#38bdf8', text: '#ffffff' },
        pattern: { id: 'circuitBoard', scale: 0.9, opacity: 0.3 },
        title: { size: 'L' },
        sandboxed: true,
        openFolderButton: true,
      },
    }),
  },
  {
    path: `${DEMO_ROOT}/harbor-site`,
    name: 'Harbor Site',
    look: makeLook({
      themeId: 'lagoon-light-pigment',
      shortName: 'Harbor Site',
      icon: { kind: 'image', file: '.nimbalyst/icon.png' }, // no real file: falls back to initials (onError)
      tile: { kind: 'gradient', from: '#f97316', to: '#0c0a09', angle: 135 },
      poster: {
        show: true,
        source: 'generated',
        shape: 'steps',
        palette: { primary: '#f97316', accent: '#0c0a09', text: '#ffffff' },
        pattern: { id: 'topography', scale: 1, opacity: 0.35 },
        title: { size: 'M' },
        sandboxed: false,
        openFolderButton: false,
      },
    }),
  },
];

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
  { kind: 'project', path: demoProjects[0].path },
  { kind: 'project', path: demoProjects[1].path },
  { kind: 'rule', id: 'demo-rule-1' },
  { kind: 'text', id: 'demo-text-1', label: 'Clients' },
  { kind: 'project', path: demoProjects[2].path },
  { kind: 'project', path: demoProjects[3].path },
  { kind: 'project', path: demoProjects[4].path },
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

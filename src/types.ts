/**
 * Per-project look: theme, rail tile, icon, short name, and poster.
 * Stored at <project>/.nimbalyst/project-theme.json so it can be shared.
 *
 * User-wide state (rail layout, wide rail) lives in the extension
 * configuration; see store.ts.
 */
export const LOOK_FILE = '.nimbalyst/project-theme.json';
export const POSTER_SVG_FILE = '.nimbalyst/poster.svg';

export type ShapeId = 'diagonal' | 'wave' | 'steps' | 'arc' | 'stripes';

/**
 * Three solid colors: the base of the poster (primary), the shape or pattern
 * drawn over it (accent), and the short-name overlay (text).
 */
export interface Palette {
  primary: string;
  accent: string;
  text: string;
}

/** A user-saved palette (user-wide, see store.ts). */
export interface SavedPalette extends Palette {
  id: string;
  name: string;
}

export type IconSpec = { kind: 'initials' } | { kind: 'poster' } | { kind: 'image'; file: string };

export type TileSpec = { kind: 'solid'; color: string } | { kind: 'gradient'; from: string; to: string; angle: number };

/** The short-name overlay on the poster. Always shown, always bottom-left, in the palette's text color. */
export interface TitleSpec {
  size: 'S' | 'M' | 'L';
}

/** A Hero Patterns tile drawn over the base color. */
export interface PatternSpec {
  id: string;
  /** Tile scale multiplier, 0.5 to 3. */
  scale: number;
  /** Pattern fill opacity, 0.05 to 1. */
  opacity: number;
}

export interface PosterSpec {
  /** Whether the poster is docked at the top of the left column. */
  show: boolean;
  source: 'generated' | 'pattern' | 'image';
  /** Project-relative path of an image poster, or of the saved generated SVG. */
  file?: string;
  shape: ShapeId;
  palette: Palette;
  pattern: PatternSpec;
  title: TitleSpec;
  /** Green "Sandboxed" shield chip in the poster's top-right corner. */
  sandboxed: boolean;
  /** "Open in Finder" button under the docked poster. */
  openFolderButton: boolean;
}

export interface ProjectLook {
  version: 1;
  /** Mr. Themes theme id, or null for "same as global". */
  themeId: string | null;
  shortName: string;
  icon: IconSpec;
  tile: TileSpec;
  poster: PosterSpec;
}

const DEFAULT_PRIMARY = '#6b7280';
const DEFAULT_ACCENT = '#0ea5e9';
const DEFAULT_TEXT = '#ffffff';

export function defaultLook(): ProjectLook {
  return {
    version: 1,
    themeId: null,
    shortName: '',
    icon: { kind: 'initials' },
    tile: { kind: 'gradient', from: DEFAULT_PRIMARY, to: DEFAULT_ACCENT, angle: 135 },
    poster: {
      show: true,
      source: 'generated',
      shape: 'wave',
      palette: { primary: DEFAULT_PRIMARY, accent: DEFAULT_ACCENT, text: DEFAULT_TEXT },
      pattern: { id: 'topography', scale: 1, opacity: 0.35 },
      title: { size: 'L' },
      sandboxed: false,
      openFolderButton: false,
    },
  };
}

/** Relative luminance below 0.55 counts as dark; used to pick a legacy "auto" text color. */
export function isDarkColor(hex: string): boolean {
  if (!/^#[0-9a-f]{3,8}$/i.test(hex)) return true;
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.55;
}

const SHAPES: ShapeId[] = ['diagonal', 'wave', 'steps', 'arc', 'stripes'];
/** Shapes from 0.2 that no longer exist, mapped to their nearest survivor. */
const LEGACY_SHAPES: Record<string, ShapeId> = { 'diagonal-shadow': 'diagonal' };
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function color(v: unknown, fallback: string): string {
  return typeof v === 'string' && (HEX.test(v) || /^rgba?\(/.test(v)) ? v : fallback;
}

function num(v: unknown, fallback: number, lo: number, hi: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

export function normalizeLook(input: unknown): ProjectLook {
  const d = defaultLook();
  if (!input || typeof input !== 'object') return d;
  const o = input as Record<string, unknown>;
  const icon = (o.icon && typeof o.icon === 'object' ? o.icon : {}) as Record<string, unknown>;
  const tile = (o.tile && typeof o.tile === 'object' ? o.tile : {}) as Record<string, unknown>;
  const poster = (o.poster && typeof o.poster === 'object' ? o.poster : {}) as Record<string, unknown>;
  const palette = (poster.palette && typeof poster.palette === 'object' ? poster.palette : {}) as Record<string, unknown>;
  const pattern = (poster.pattern && typeof poster.pattern === 'object' ? poster.pattern : {}) as Record<string, unknown>;
  const title = (poster.title && typeof poster.title === 'object' ? poster.title : {}) as Record<string, unknown>;

  // 0.2's "none" source becomes a hidden generated poster.
  const legacyNone = poster.source === 'none';
  const source = poster.source === 'image' || poster.source === 'pattern' ? poster.source : 'generated';
  const shapeRaw = typeof poster.shape === 'string' ? poster.shape : '';
  const shape = SHAPES.includes(shapeRaw as ShapeId) ? (shapeRaw as ShapeId) : LEGACY_SHAPES[shapeRaw] ?? d.poster.shape;

  // Palettes before 0.4 were {from, to, gradient} with the text color under title.color ("auto" or a hex).
  const primary = color(palette.primary ?? palette.from, d.poster.palette.primary);
  const accent = color(palette.accent ?? palette.to, d.poster.palette.accent);
  const legacyTextColor = typeof title.color === 'string' && title.color !== 'auto' ? title.color : undefined;
  const autoText = isDarkColor(source === 'pattern' ? primary : accent) ? '#ffffff' : '#111827';
  const text = color(palette.text ?? legacyTextColor, autoText);

  // 0.2 files may carry emoji/symbol icons; they fall back to initials.
  let iconSpec: IconSpec = d.icon;
  if (icon.kind === 'poster') iconSpec = { kind: 'poster' };
  else if (icon.kind === 'image' && typeof icon.file === 'string') iconSpec = { kind: 'image', file: icon.file };

  // 0.2 files may carry auto/theme tiles; they become a gradient from the poster palette.
  let tileSpec: TileSpec = { kind: 'gradient', from: primary, to: accent, angle: 135 };
  if (tile.kind === 'solid') tileSpec = { kind: 'solid', color: color(tile.color, accent) };
  else if (tile.kind === 'gradient') tileSpec = { kind: 'gradient', from: color(tile.from, primary), to: color(tile.to, accent), angle: typeof tile.angle === 'number' ? tile.angle : 135 };

  return {
    version: 1,
    themeId: typeof o.themeId === 'string' && o.themeId ? o.themeId : null,
    shortName: typeof o.shortName === 'string' ? o.shortName.slice(0, 40) : '',
    icon: iconSpec,
    tile: tileSpec,
    poster: {
      show: legacyNone ? false : bool(poster.show, true),
      source,
      file: typeof poster.file === 'string' ? poster.file : undefined,
      shape,
      palette: { primary, accent, text },
      pattern: {
        id: typeof pattern.id === 'string' && pattern.id ? pattern.id : d.poster.pattern.id,
        scale: num(pattern.scale, d.poster.pattern.scale, 0.5, 3),
        opacity: num(pattern.opacity, d.poster.pattern.opacity, 0.05, 1),
      },
      title: { size: title.size === 'S' || title.size === 'M' ? title.size : 'L' },
      sandboxed: bool(poster.sandboxed, false),
      openFolderButton: bool(poster.openFolderButton, false),
    },
  };
}

/* ---- User-wide saved palettes ---- */

export function normalizeSavedPalettes(input: unknown): SavedPalette[] {
  if (!Array.isArray(input)) return [];
  const out: SavedPalette[] = [];
  const seen = new Set<string>();
  for (const p of input as Record<string, unknown>[]) {
    if (!p || typeof p !== 'object' || typeof p.id !== 'string' || !p.id || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push({
      id: p.id,
      name: typeof p.name === 'string' && p.name.trim() ? p.name.trim().slice(0, 32) : 'Custom',
      primary: color(p.primary, '#6b7280'),
      accent: color(p.accent, '#0ea5e9'),
      text: color(p.text, '#ffffff'),
    });
  }
  return out.slice(0, 40);
}

/* ---- User-wide rail layout ---- */

export type RailEntry =
  | { kind: 'project'; path: string }
  | { kind: 'rule'; id: string }
  | { kind: 'text'; id: string; label: string };

export function normalizeLayout(input: unknown): RailEntry[] {
  if (!Array.isArray(input)) return [];
  const out: RailEntry[] = [];
  const seen = new Set<string>();
  for (const e of input as Record<string, unknown>[]) {
    if (!e || typeof e !== 'object') continue;
    if (e.kind === 'project' && typeof e.path === 'string' && e.path && !seen.has(`p:${e.path}`)) {
      seen.add(`p:${e.path}`);
      out.push({ kind: 'project', path: e.path });
    } else if (e.kind === 'rule' && typeof e.id === 'string' && !seen.has(`r:${e.id}`)) {
      seen.add(`r:${e.id}`);
      out.push({ kind: 'rule', id: e.id });
    } else if (e.kind === 'text' && typeof e.id === 'string' && !seen.has(`t:${e.id}`)) {
      seen.add(`t:${e.id}`);
      out.push({ kind: 'text', id: e.id, label: typeof e.label === 'string' ? e.label.slice(0, 24) : 'Group' });
    }
  }
  return out;
}

/**
 * Merge the rail as currently shown into the saved layout. Projects that are
 * not open right now are not shown, so they are carried over at the end and
 * come back where they were, roughly. Dividers are always shown, so one that
 * is missing from `visible` was deleted on purpose and must not come back.
 */
export function mergeRailLayout(visible: RailEntry[], saved: RailEntry[]): RailEntry[] {
  const shown = new Set(visible.map(entryKey));
  const hiddenProjects = saved.filter((e) => e.kind === 'project' && !shown.has(entryKey(e)));
  return [...visible, ...hiddenProjects];
}

export function entryKey(e: RailEntry): string {
  return e.kind === 'project' ? `p:${e.path}` : e.kind === 'rule' ? `r:${e.id}` : `t:${e.id}`;
}

/** Two-letter initials, the way the native rail computes them. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/[\s_-]+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function projectNameOf(path: string): string {
  return path.replace(/\/+$/, '').split('/').pop() || path;
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

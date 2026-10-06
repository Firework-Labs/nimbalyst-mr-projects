/**
 * Poster generator: bold shapes or Hero Patterns crossed with two-color
 * palettes, rendered to SVG. Pure functions so the dock, the builder preview,
 * and the rail thumbnail all agree.
 */
import { HERO_PATTERNS, heroPatternById } from './heroPatterns';
import type { Palette, PosterSpec, ShapeId, TitleSpec } from './types';

export const SHAPES: { id: ShapeId; name: string }[] = [
  { id: 'diagonal', name: 'Diagonal' },
  { id: 'wave', name: 'Wave' },
  { id: 'steps', name: 'Steps' },
  { id: 'arc', name: 'Arc' },
  { id: 'stripes', name: 'Stripes' },
];

export function shapeName(id: ShapeId): string {
  return SHAPES.find((s) => s.id === id)?.name ?? id;
}

export { HERO_PATTERNS };

/** Built-in palettes: primary is the base, accent the figure, text the short-name overlay. */
export const PALETTES: (Palette & { id: string; name: string })[] = [
  { id: 'fog-sky', name: 'Fog and sky', primary: '#6b7280', accent: '#0ea5e9', text: '#ffffff' },
  { id: 'plum-coral', name: 'Plum and coral', primary: '#5b4a9e', accent: '#ff3b5c', text: '#ffffff' },
  { id: 'cherry-graphite', name: 'Cherry on graphite', primary: '#ff0a54', accent: '#374151', text: '#ffffff' },
  { id: 'slate-sky', name: 'Slate and sky', primary: '#0f172a', accent: '#38bdf8', text: '#0f172a' },
  { id: 'charcoal-mint', name: 'Charcoal and mint', primary: '#1e293b', accent: '#10b981', text: '#ffffff' },
  { id: 'ember-black', name: 'Ember on black', primary: '#f97316', accent: '#0c0a09', text: '#ffffff' },
  { id: 'pink-plum', name: 'Pink on plum', primary: '#f472b6', accent: '#1d1226', text: '#ffffff' },
  { id: 'birch-forest', name: 'Birch and forest', primary: '#fbf7f0', accent: '#2f7d4f', text: '#ffffff' },
  { id: 'frost-nord', name: 'Frost on nord', primary: '#88c0d0', accent: '#2e3440', text: '#ffffff' },
  { id: 'gold-rust', name: 'Gold and rust', primary: '#facc15', accent: '#7c2d12', text: '#ffffff' },
];

export function samePalette(a: Palette, b: Palette): boolean {
  return a.primary.toLowerCase() === b.primary.toLowerCase() && a.accent.toLowerCase() === b.accent.toLowerCase() && a.text.toLowerCase() === b.text.toLowerCase();
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function lighten(hex: string, t: number): string {
  if (!/^#[0-9a-f]{3,8}$/i.test(hex)) return hex;
  const [r, g, b] = hexToRgb(hex);
  const mixc = (c: number) => Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t));
  return `#${[mixc(r), mixc(g), mixc(b)].map((c) => clamp(c, 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

export function isDarkHex(hex: string): boolean {
  if (!/^#[0-9a-f]{3,8}$/i.test(hex)) return true;
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.55;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The shape path in a 400x400 box. The shape is the "to" color; the base is "from". */
function shapePath(shape: ShapeId): { d: string; shadow: boolean } {
  switch (shape) {
    case 'diagonal':
      return { d: 'M400,0 L400,400 L0,400 Z', shadow: false };
    case 'wave':
      return {
        d: 'M400,30 C370,30 360,60 350,100 C340,140 320,130 290,130 C255,130 250,160 245,200 C240,240 215,235 190,235 C160,235 160,265 155,300 C150,335 130,335 100,340 C70,345 60,380 10,400 L400,400 Z',
        shadow: true,
      };
    case 'steps':
      return { d: 'M400,44 L322,68 L300,140 L222,164 L200,236 L122,260 L100,332 L22,356 L0,400 L400,400 Z', shadow: true };
    case 'arc':
      return { d: 'M400,80 A320,320 0 0 0 80,400 L400,400 Z', shadow: false };
    case 'stripes':
      return { d: 'M0,0 H400 V56 H0 Z M0,112 H400 V168 H0 Z M0,224 H400 V280 H0 Z M0,336 H400 V392 H0 Z', shadow: false };
  }
}

function titleFont(size: TitleSpec['size']): number {
  return size === 'S' ? 26 : size === 'M' ? 36 : 48;
}

/** Approximate advance width of heavy system text, in em, good enough to decide line breaks. */
const EM_PER_CHAR = 0.58;

/**
 * Wrap a label into at most two lines that fit maxWidth at the given font
 * size. Breaks at spaces when possible, otherwise inside the word; the second
 * line is cut with an ellipsis if the text still does not fit.
 */
export function wrapTitle(label: string, fontSize: number, maxWidth: number): string[] {
  const fits = (s: string) => s.length * fontSize * EM_PER_CHAR <= maxWidth;
  const maxChars = Math.max(1, Math.floor(maxWidth / (fontSize * EM_PER_CHAR)));
  const text = label.trim().replace(/\s+/g, ' ');
  if (!text) return [];
  if (fits(text)) return [text];

  // Break opportunities: after a space (dropped) or after a hyphen (kept).
  const tokens = text.split(' ').flatMap((w, wi) => w.split(/(?<=-)/).map((part, pi) => ({ part, spaceBefore: pi === 0 && wi > 0 })));
  const join = (from: number, to: number) => tokens.slice(from, to).map((t, k) => (k > 0 && t.spaceBefore ? ` ${t.part}` : t.part)).join('');
  let i = 0;
  let first = '';
  for (; i < tokens.length; i++) {
    const candidate = join(0, i + 1);
    if (fits(candidate)) first = candidate;
    else break;
  }
  if (!first) {
    // A single token longer than the line: break inside it.
    first = tokens[0].part.slice(0, maxChars);
    tokens[0] = { part: tokens[0].part.slice(maxChars), spaceBefore: false };
    i = 0;
  }
  let rest = join(i, tokens.length).trim();
  if (!rest) return [first];
  if (!fits(rest)) rest = `${rest.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
  return [first, rest];
}

export interface PosterRenderOptions {
  /** Short name to overlay bottom-left when title.show. */
  title?: string;
  /** Omit the title overlay entirely (thumbnails). */
  noTitle?: boolean;
  /** Aspect: square (400x400) or banner (400x225). */
  aspect?: 'square' | 'banner';
}

/** Render a poster spec to a standalone SVG string. Fills are solid: primary base, accent figure, text overlay. */
export function posterSvg(spec: PosterSpec, opts: PosterRenderOptions = {}): string {
  const { palette, title } = spec;
  const W = 400;
  const H = opts.aspect === 'banner' ? 225 : 400;
  const isPattern = spec.source === 'pattern';
  const base = palette.primary;
  const fig = palette.accent;

  let body = '';
  let defs = '';
  if (isPattern) {
    const p = heroPatternById(spec.pattern.id) ?? HERO_PATTERNS[0];
    const s = spec.pattern.scale;
    defs += `<pattern id="hp" width="${(p.w * s).toFixed(2)}" height="${(p.h * s).toFixed(2)}" patternUnits="userSpaceOnUse"><g fill="${fig}" fill-opacity="${spec.pattern.opacity}" transform="scale(${s})">${p.body}</g></pattern>`;
    body = `<rect width="${W}" height="${H}" fill="${base}"/><rect width="${W}" height="${H}" fill="url(#hp)"/>`;
  } else {
    const path = shapePath(spec.shape);
    if (path.shadow) defs += `<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="-6" dy="6" stdDeviation="9" flood-color="#000" flood-opacity="0.35"/></filter>`;
    // The shape is authored in a 400x400 box; for banners, anchor it to the bottom so the composition survives the crop.
    const shift = H - 400;
    body = `<rect width="${W}" height="${H}" fill="${base}"/><path d="${path.d}" fill="${fig}"${path.shadow ? ' filter="url(#sh)"' : ''}${shift ? ` transform="translate(0 ${shift})"` : ''}/>`;
  }

  let text = '';
  const label = (opts.title ?? '').trim();
  if (!opts.noTitle && label) {
    const fs = Math.round(titleFont(title.size) * (opts.aspect === 'banner' ? 0.8 : 1));
    const shadow = `text-shadow: 0 2px 8px rgba(0,0,0,.35)`;
    // Up to two lines, anchored to the same bottom baseline whether there are one or two.
    const lines = wrapTitle(label, fs, W - 48);
    const lineHeight = Math.round(fs * 1.02);
    const baseline = H - 24;
    const tspans = lines.map((line, idx) => `<tspan x="24" y="${baseline - (lines.length - 1 - idx) * lineHeight}">${esc(line)}</tspan>`).join('');
    text = `<text text-anchor="start" font-family="-apple-system, 'SF Pro Display', Inter, system-ui, sans-serif" font-size="${fs}" font-weight="800" letter-spacing="-0.02em" fill="${palette.text}" style="${shadow}">${tspans}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${body}${text}</svg>`;
}

export function posterDataUri(spec: PosterSpec, opts: PosterRenderOptions = {}): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(posterSvg(spec, opts))}`;
}

/** Dominant color of a poster, used for tile fallbacks. */
export function posterAccent(p: Palette): string {
  return p.accent;
}

export function fileUrl(projectPath: string, relative: string): string {
  const abs = relative.startsWith('/') ? relative : `${projectPath.replace(/\/+$/, '')}/${relative}`;
  return `file://${encodeURI(abs)}`;
}

/** Image source for a look's poster, or null when it has none. */
export function posterSrc(projectPath: string, look: { poster: PosterSpec } | null, opts: PosterRenderOptions = {}): string | null {
  if (!look) return null;
  const p = look.poster;
  if (p.source === 'generated' || p.source === 'pattern') return posterDataUri(p, opts);
  if (p.source === 'image' && p.file) return fileUrl(projectPath, p.file);
  return null;
}

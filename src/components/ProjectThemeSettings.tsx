/**
 * Project Settings › Mr. Projects.
 */
import { useEffect, useMemo, useState } from 'react';
import type { SettingsPanelProps } from '@nimbalyst/extension-sdk';
import { HERO_PATTERNS, PALETTES, SHAPES, fileUrl, posterDataUri, posterSvg, samePalette, shapeName } from '../poster';
import { heroPatternById } from '../heroPatterns';
import {
  deletePalette, getBridge, getExtensionContext, getLook, getRailLayout, getSavedPalettes, getWideRail, openFolderLabel, refreshFromDisk, savePalette, setLookInCache, setRailLayout, setWideRail, subscribe,
  THEME_EDITOR_ID, toast, writeLookFile, writeProjectFile, type ThemeSummary,
} from '../store';
import { ensureStyles } from '../styles';
import { defaultLook, initialsOf, POSTER_SVG_FILE, projectNameOf, type IconSpec, type Palette, type PosterSpec, type ProjectLook, type SavedPalette, type TileSpec } from '../types';
import { PosterFrame } from './PosterFrame';

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return <button type="button" className={`pt-toggle${on ? ' on' : ''}`} role="switch" aria-checked={on} onClick={() => onChange(!on)} />;
}

function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <span className="pt-seg">
      {options.map(([v, label]) => (
        <button key={v} type="button" className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{label}</button>
      ))}
    </span>
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : '#888888';
  return (
    <span className="pt-color">
      <input type="color" value={hex} onChange={(e) => onChange(e.target.value)} />
      <input className="pt-input" style={{ width: 96, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11.5 }} value={value} onChange={(e) => onChange(e.target.value)} />
    </span>
  );
}

const Faint = ({ children }: { children: string }) => <span style={{ color: 'var(--nim-text-faint)' }}>{children}</span>;

/** Palette swatch: primary left, accent right, "Aa" in the text color. */
function PaletteSwatch({ p, on, title, onClick }: { p: Palette; on: boolean; title: string; onClick: () => void }) {
  return (
    <button type="button" className={`pt-pal${on ? ' on' : ''}`} title={title} onClick={onClick} style={{ background: `linear-gradient(90deg, ${p.primary} 50%, ${p.accent} 50%)` }}>
      <span className="pt-pal-text" style={{ color: p.text }}>Aa</span>
    </button>
  );
}

/** Three-band swatch for a theme, or for the global theme when summary is null. */
function ThemeBands({ t }: { t: ThemeSummary | null }) {
  return t ? (
    <div className="b"><i style={{ background: t.colors.bg ?? '#000' }} /><i style={{ background: t.colors['bg-secondary'] ?? '#000' }} /><i style={{ background: t.colors.primary ?? '#888' }} /></div>
  ) : (
    <div className="b"><i style={{ background: 'var(--nim-bg)' }} /><i style={{ background: 'var(--nim-bg-secondary)' }} /><i style={{ background: 'var(--nim-primary)' }} /></div>
  );
}

export function ProjectThemeSettings(props: SettingsPanelProps) {
  ensureStyles();
  const path = props.workspacePath;
  if (!path) {
    return (
      <div className="pt" style={{ padding: 20 }}>
        <h2>Mr. Projects</h2>
        <div className="pt-hint">Mr. Projects works with local project folders. Open this project locally to set its look.</div>
      </div>
    );
  }
  return <SettingsBody path={path} />;
}

function SettingsBody({ path }: { path: string }) {
  const name = projectNameOf(path);
  const [look, setLook] = useState<ProjectLook>(() => getLook(path) ?? defaultLook());
  const [dirty, setDirty] = useState(false);
  const [wide, setWide] = useState(() => getWideRail());
  const [layoutCount, setLayoutCount] = useState(() => getRailLayout().filter((e) => e.kind !== 'project').length);
  const [saving, setSaving] = useState(false);
  const [imagePath, setImagePath] = useState(look.poster.source === 'image' ? look.poster.file ?? '' : '');
  const [themeOpen, setThemeOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [saved, setSaved] = useState<SavedPalette[]>(() => getSavedPalettes());
  const [paletteName, setPaletteName] = useState('');
  const bridge = getBridge();
  const [themes, setThemes] = useState<ThemeSummary[]>(() => bridge?.listThemes() ?? []);

  useEffect(() => {
    void refreshFromDisk(path).then((l) => {
      if (l) {
        setLook(l);
        setImagePath(l.poster.source === 'image' ? l.poster.file ?? '' : '');
      }
    });
  }, [path]);
  useEffect(() => subscribe(() => {
    setWide(getWideRail());
    setLayoutCount(getRailLayout().filter((e) => e.kind !== 'project').length);
    setSaved(getSavedPalettes());
  }), []);
  useEffect(() => {
    const b = getBridge();
    if (!b) return;
    return b.subscribe(() => setThemes(b.listThemes()));
  }, []);

  const update = (patch: Partial<ProjectLook>) => {
    setLook((l) => ({ ...l, ...patch }));
    setDirty(true);
  };
  const updatePoster = (patch: Partial<PosterSpec>) => update({ poster: { ...look.poster, ...patch } });
  const updatePalette = (patch: Partial<Palette>) => updatePoster({ palette: { ...look.poster.palette, ...patch } });
  const pickPalette = (p: Palette) => updatePalette({ primary: p.primary, accent: p.accent, text: p.text });

  const currentPaletteIsSaved = PALETTES.some((p) => samePalette(p, look.poster.palette)) || saved.some((p) => samePalette(p, look.poster.palette));
  const saveCurrentPalette = async () => {
    try {
      const entry = await savePalette(paletteName, look.poster.palette);
      setPaletteName('');
      toast('info', `Saved palette "${entry.name}".`);
    } catch (e) {
      toast('error', `Could not save the palette: ${(e as Error).message}`);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const next: ProjectLook = { ...look };
      if (next.poster.source === 'generated' || next.poster.source === 'pattern') {
        next.poster = { ...next.poster, file: POSTER_SVG_FILE };
        await writeProjectFile(path, POSTER_SVG_FILE, posterSvg(next.poster, { title: next.shortName || name, aspect: 'banner' }));
      } else {
        const rel = imagePath.trim();
        if (!rel) throw new Error('Choose an image file inside the project first.');
        const fs = getExtensionContext()?.services.filesystem;
        const abs = rel.startsWith('/') ? rel : `${path}/${rel}`;
        if (fs && !(await fs.fileExists(abs))) throw new Error(`No file at ${rel}`);
        next.poster = { ...next.poster, file: rel };
      }
      await writeLookFile(path, next);
      await setLookInCache(path, next);
      setLook(next);
      setDirty(false);
      toast('info', `Saved the look for ${name}.`);
    } catch (e) {
      toast('error', `Could not save: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const previewTitle = look.shortName || name;
  const isGenerated = look.poster.source === 'generated' || look.poster.source === 'pattern';
  const posterPreview = useMemo(
    () => (isGenerated ? posterDataUri(look.poster, { title: previewTitle, aspect: 'banner' }) : imagePath ? fileUrl(path, imagePath) : null),
    [look.poster, previewTitle, isGenerated, imagePath, path],
  );
  const tile = look.tile;
  const currentTheme = look.themeId ? themes.find((t) => t.id === look.themeId) ?? null : null;
  const currentThemeLabel = look.themeId === null ? 'Global theme' : currentTheme?.name ?? look.themeId;

  const tileBg = (): string => (tile.kind === 'solid' ? tile.color : `linear-gradient(${tile.angle}deg, ${tile.from}, ${tile.to})`);

  const chosenPattern = heroPatternById(look.poster.pattern.id) ?? HERO_PATTERNS[0];

  return (
    <div className="pt" style={{ padding: '20px 24px', maxWidth: 900 }} data-testid="project-theme-settings">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2>Mr. Projects</h2>
          <div className="pt-sub">{name} · saved to <code>.nimbalyst/project-theme.json</code> (shareable with your team)</div>
        </div>
        <button type="button" className="pt-btn primary" disabled={!dirty || saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save'}</button>
      </div>

      {/* ---- Theme for this project (accordion) ---- */}
      <div className="pt-sec">
        <div className="pt-sec-head">
          <h3>Theme for this project</h3>
          <button type="button" className="pt-acc" aria-expanded={themeOpen} aria-controls="pt-theme-body" onClick={() => setThemeOpen((v) => !v)}>
            {themeOpen ? 'Hide themes' : 'Change'}
            <span className="pt-symbol">expand_more</span>
          </button>
        </div>
        <div className="pt-current">
          <span className="pt-swatch" title={currentThemeLabel}>
            <ThemeBands t={currentTheme} />
            <span className="n">{currentThemeLabel}</span>
          </span>
          <div className="pt-d">Applied whenever this project is active; other projects keep the global theme. You can also set this from the Theme Gallery's project tray.</div>
        </div>
        {themeOpen ? (
          <div id="pt-theme-body">
            {bridge ? (
              <div className="pt-swatches">
                <button type="button" className={`pt-swatch${look.themeId === null ? ' on' : ''}`} onClick={() => update({ themeId: null })}>
                  <ThemeBands t={null} />
                  <div className="n">Global theme</div>
                </button>
                {themes.map((t) => (
                  <button key={t.id} type="button" className={`pt-swatch${look.themeId === t.id ? ' on' : ''}`} onClick={() => update({ themeId: t.id })} title={t.name}>
                    <ThemeBands t={t} />
                    <div className="n">{t.name}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="pt-hint">
                Install and enable the <b>Mr. Themes</b> extension (<code>{THEME_EDITOR_ID}</code>) to choose a theme per project. The rail and poster features below work without it.
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* ---- Left rail ---- */}
      <div className="pt-sec">
        <h3>Left rail</h3>
        <div className="pt-frow">
          <label>Wide rail with project names <Faint>(applies to all projects; names wrap to two lines)</Faint></label>
          <Toggle on={wide} onChange={(v) => void setWideRail(v)} />
        </div>
        <div className="pt-frow">
          <label>Preview</label>
          <span className="pt-tileprev">
            <span style={{ width: 56, height: 56, borderRadius: 12, background: tileBg(), display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontWeight: 700, fontSize: 15, color: '#fff' }}>
              {look.icon.kind === 'poster' && isGenerated ? <img src={posterDataUri(look.poster, { noTitle: true })} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : look.icon.kind === 'poster' && imagePath ? <img src={fileUrl(path, imagePath)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : look.icon.kind === 'image' && look.icon.file ? <img src={fileUrl(path, look.icon.file)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initialsOf(name)}
            </span>
            <span style={{ color: 'var(--nim-text-muted)', fontSize: 12 }}>{look.shortName || name}</span>
          </span>
        </div>
        <div className="pt-frow">
          <label>Short name</label>
          <input className="pt-input" style={{ width: 200 }} value={look.shortName} placeholder={name} maxLength={24} onChange={(e) => update({ shortName: e.target.value })} />
        </div>
        <div className="pt-frow">
          <label>Tile icon</label>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Seg<IconSpec['kind']>
              value={look.icon.kind}
              options={[['initials', 'Initials'], ['poster', 'Poster'], ['image', 'Image']]}
              onChange={(k) => {
                if (k === 'initials') update({ icon: { kind: 'initials' } });
                else if (k === 'poster') update({ icon: { kind: 'poster' } });
                else update({ icon: { kind: 'image', file: look.icon.kind === 'image' ? look.icon.file : '' } });
              }}
            />
            {look.icon.kind === 'image' ? <input className="pt-input" style={{ width: 220 }} value={look.icon.file} placeholder=".nimbalyst/icon.png" onChange={(e) => update({ icon: { kind: 'image', file: e.target.value } })} /> : null}
          </span>
        </div>
        {look.icon.kind === 'initials' ? (
          <div className="pt-frow">
            <label>Tile color</label>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Seg<TileSpec['kind']>
                value={tile.kind}
                options={[['solid', 'Solid'], ['gradient', 'Gradient']]}
                onChange={(k) => {
                  if (k === 'solid') update({ tile: { kind: 'solid', color: tile.kind === 'solid' ? tile.color : look.poster.palette.accent } });
                  else update({ tile: { kind: 'gradient', from: look.poster.palette.primary, to: look.poster.palette.accent, angle: 135 } });
                }}
              />
              {tile.kind === 'solid' ? <ColorField value={tile.color} onChange={(c) => update({ tile: { kind: 'solid', color: c } })} /> : null}
              {tile.kind === 'gradient' ? (
                <>
                  <ColorField value={tile.from} onChange={(c) => update({ tile: { ...tile, from: c } })} />
                  <ColorField value={tile.to} onChange={(c) => update({ tile: { ...tile, to: c } })} />
                </>
              ) : null}
            </span>
          </div>
        ) : null}
        <div className="pt-frow">
          <label>Order and dividers <Faint>(applies to all projects)</Faint></label>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--nim-text-faint)', fontSize: 12 }}>Drag tiles in the rail to reorder. The + on the divider adds rules and text labels{layoutCount ? ` (${layoutCount} in use)` : ''}.</span>
            <button type="button" className="pt-btn" onClick={() => void setRailLayout([]).then(() => toast('info', 'Rail order and dividers reset.'))} disabled={!getRailLayout().length}>Reset</button>
          </span>
        </div>
      </div>

      {/* ---- Poster ---- */}
      <div className="pt-sec">
        <h3>Poster</h3>
        <div className="pt-d">A banner at the top of the left column (files, sessions, or tracker), also available as the rail tile.</div>
        <div className="pt-frow">
          <label>Show poster in left column</label>
          <Toggle on={look.poster.show} onChange={(v) => updatePoster({ show: v })} />
        </div>
        <div className="pt-frow">
          <label>Source</label>
          <Seg<PosterSpec['source']> value={look.poster.source} options={[['generated', 'Shape'], ['pattern', 'Pattern'], ['image', 'My image']]} onChange={(s) => { updatePoster({ source: s }); setGalleryOpen(false); }} />
        </div>

        {look.poster.source === 'image' ? (
          <>
            <div className="pt-frow">
              <label>Image file in this project</label>
              <input className="pt-input" style={{ width: 280 }} value={imagePath} placeholder=".nimbalyst/poster.png" onChange={(e) => { setImagePath(e.target.value); setDirty(true); }} />
            </div>
            <div className="pt-hint">Drop a PNG, JPG, SVG, or WebP into the project's <code>.nimbalyst/</code> folder, then enter its path above. Wide images suit the banner. The file travels with the project.</div>
          </>
        ) : null}

        <div className="pt-builder" style={{ marginTop: 6 }}>
          <div>
            {look.poster.source === 'generated' ? (
              <>
                <div className="pt-frow">
                  <label>Shape</label>
                  <span className="pt-pick">
                    <span className="pt-thumb"><img src={posterDataUri(look.poster, { noTitle: true })} alt="" /></span>
                    <span className="pt-pick-name">{shapeName(look.poster.shape)}</span>
                    <button type="button" className="pt-btn" aria-expanded={galleryOpen} onClick={() => setGalleryOpen((v) => !v)}>{galleryOpen ? 'Close gallery' : 'Browse gallery'}</button>
                  </span>
                </div>
                {galleryOpen ? (
                  <div className="pt-shapes">
                    {SHAPES.map((s) => (
                      <button key={s.id} type="button" className={`pt-shape${look.poster.shape === s.id ? ' on' : ''}`} title={s.name} onClick={() => { updatePoster({ shape: s.id }); setGalleryOpen(false); }}>
                        <img src={posterDataUri({ ...look.poster, shape: s.id }, { noTitle: true })} alt={s.name} />
                        <span>{s.name}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
            {look.poster.source === 'pattern' ? (
              <>
                <div className="pt-frow">
                  <label>Pattern <Faint>from Hero Patterns by Steve Schoger, CC BY 4.0</Faint></label>
                  <span className="pt-pick">
                    <span className="pt-thumb"><img src={posterDataUri(look.poster, { noTitle: true })} alt="" /></span>
                    <span className="pt-pick-name">{chosenPattern.name}</span>
                    <button type="button" className="pt-btn" aria-expanded={galleryOpen} onClick={() => setGalleryOpen((v) => !v)}>{galleryOpen ? 'Close gallery' : 'Browse gallery'}</button>
                  </span>
                </div>
                {galleryOpen ? (
                  <div className="pt-patterns">
                    {HERO_PATTERNS.map((p) => (
                      <button key={p.id} type="button" className={`pt-pattern${look.poster.pattern.id === p.id ? ' on' : ''}`} title={p.name} onClick={() => { updatePoster({ pattern: { ...look.poster.pattern, id: p.id } }); setGalleryOpen(false); }}>
                        <img src={posterDataUri({ ...look.poster, pattern: { ...look.poster.pattern, id: p.id } }, { noTitle: true })} alt={p.name} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="pt-frow">
                  <label>Scale · Opacity</label>
                  <span style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ color: 'var(--nim-text-faint)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <input className="pt-range" type="range" min={0.5} max={3} step={0.1} value={look.poster.pattern.scale} onChange={(e) => updatePoster({ pattern: { ...look.poster.pattern, scale: Number(e.target.value) } })} />
                      {look.poster.pattern.scale.toFixed(1)}×
                    </label>
                    <label style={{ color: 'var(--nim-text-faint)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <input className="pt-range" type="range" min={0.05} max={1} step={0.05} value={look.poster.pattern.opacity} onChange={(e) => updatePoster({ pattern: { ...look.poster.pattern, opacity: Number(e.target.value) } })} />
                      {Math.round(look.poster.pattern.opacity * 100)}%
                    </label>
                  </span>
                </div>
              </>
            ) : null}
            {isGenerated ? (
              <>
                <div className="pt-frow">
                  <label>Palette <Faint>(primary base, accent figure, text overlay)</Faint></label>
                </div>
                <div className="pt-pals">
                  {PALETTES.map((p) => (
                    <span key={p.id} className="pt-pal-wrap">
                      <PaletteSwatch p={p} on={samePalette(p, look.poster.palette)} title={p.name} onClick={() => pickPalette(p)} />
                    </span>
                  ))}
                  {saved.map((p) => (
                    <span key={p.id} className="pt-pal-wrap">
                      <PaletteSwatch p={p} on={samePalette(p, look.poster.palette)} title={`${p.name} (saved)`} onClick={() => pickPalette(p)} />
                      <button type="button" className="pt-pal-x" aria-label={`Delete palette ${p.name}`} title="Delete this saved palette" onClick={() => void deletePalette(p.id)}>×</button>
                      <span className="pt-pal-label">{p.name}</span>
                    </span>
                  ))}
                </div>
                <div className="pt-frow">
                  <label>Custom colors <Faint>(primary · accent · text)</Faint></label>
                  <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <ColorField value={look.poster.palette.primary} onChange={(c) => updatePalette({ primary: c })} />
                    <ColorField value={look.poster.palette.accent} onChange={(c) => updatePalette({ accent: c })} />
                    <ColorField value={look.poster.palette.text} onChange={(c) => updatePalette({ text: c })} />
                  </span>
                </div>
                {!currentPaletteIsSaved ? (
                  <div className="pt-frow">
                    <label>Save these colors as a palette <Faint>(available in every project)</Faint></label>
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input className="pt-input" style={{ width: 160 }} value={paletteName} placeholder="Palette name" maxLength={32} onChange={(e) => setPaletteName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void saveCurrentPalette(); }} />
                      <button type="button" className="pt-btn" onClick={() => void saveCurrentPalette()}>Save palette</button>
                    </span>
                  </div>
                ) : null}
                <div className="pt-frow">
                  <label>Short name size <Faint>(bottom-left, in the palette's text color)</Faint></label>
                  <Seg value={look.poster.title.size} options={[['S', 'S'], ['M', 'M'], ['L', 'L']]} onChange={(s) => updatePoster({ title: { size: s } })} />
                </div>
              </>
            ) : null}
            <div className="pt-frow">
              <label>Show sandboxed icon <Faint>(green Sandboxed chip, top-right)</Faint></label>
              <Toggle on={look.poster.sandboxed} onChange={(v) => updatePoster({ sandboxed: v })} />
            </div>
            <div className="pt-frow">
              <label>Show "{openFolderLabel()}" button <Faint>(below the poster in the left column)</Faint></label>
              <Toggle on={look.poster.openFolderButton} onChange={(v) => updatePoster({ openFolderButton: v })} />
            </div>
          </div>
          <div>
            {posterPreview ? (
              <>
                <div className="pt-posterprev">
                  <PosterFrame src={posterPreview} alt="Poster preview" sandboxed={look.poster.sandboxed} className="banner" />
                </div>
                {look.poster.openFolderButton ? (
                  <button type="button" className="pt-dock-open" style={{ marginTop: 6 }} disabled>
                    <span className="pt-symbol">folder_open</span>
                    {openFolderLabel()}
                  </button>
                ) : null}
                <div style={{ color: 'var(--nim-text-faint)', fontSize: 11, marginTop: 8, textAlign: 'center' }}>
                  {isGenerated ? <>As docked · saved as <code>.nimbalyst/poster.svg</code></> : 'As docked'}
                  {!look.poster.show ? ' · hidden in the left column' : ''}
                </div>
              </>
            ) : (
              <div className="pt-hint">Enter an image path to preview the poster.</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" className="pt-btn ghost" disabled={!dirty} onClick={() => { const l = getLook(path) ?? defaultLook(); setLook(l); setImagePath(l.poster.source === 'image' ? l.poster.file ?? '' : ''); setDirty(false); }}>Discard changes</button>
        <button type="button" className="pt-btn primary" disabled={!dirty || saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  );
}

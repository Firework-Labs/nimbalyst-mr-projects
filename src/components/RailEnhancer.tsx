/**
 * Replaces the native project rail visibly and functionally.
 *
 * The native <nav class="project-rail"> stays in the DOM, hidden. We mirror
 * its items (path, name, active, badge, color) into our own rail and delegate
 * every action (switch, close, add) to the native buttons, so behavior stays
 * identical to Nimbalyst's own.
 *
 * On top of the mirror we keep a user-wide layout: the order of projects and
 * any dividers (horizontal rules, text labels) between them. Everything is
 * drag-and-drop reorderable; dividers are deletable.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent } from 'react';
import { createPortal } from 'react-dom';
import { posterDataUri, fileUrl } from '../poster';
import { getBridge, getLook, getLooksCache, getRailLayout, getWideRail, orderedEntries, refreshFromDisk, setRailLayout, setRailProjects, subscribe, type RailProject } from '../store';
import { entryKey, initialsOf, mergeRailLayout, newId, projectNameOf, type ProjectLook, type RailEntry } from '../types';

interface RailItem extends RailProject {
  nativeColor: string;
  el: HTMLElement;
}

const NATIVE_NAV = 'nav.project-rail[data-testid="project-rail"]';
const DND_MIME = 'application/x-nimbalyst-rail-entry';

function readItems(nav: HTMLElement): RailItem[] {
  const items: RailItem[] = [];
  nav.querySelectorAll<HTMLElement>('.project-rail-item[data-project-path]').forEach((el) => {
    const path = el.dataset.projectPath ?? '';
    if (!path) return;
    const main = el.querySelector<HTMLElement>('.project-rail-item-main');
    const label = main?.getAttribute('aria-label') ?? '';
    const name = label.replace(/^Switch to project\s*/i, '').trim() || projectNameOf(path);
    const active = el.classList.contains('is-active') || main?.getAttribute('aria-current') === 'true';
    const badge = el.querySelector('.project-rail-item-badge')?.textContent?.trim() ?? '';
    const nativeColor = main ? getComputedStyle(main).backgroundColor : '';
    items.push({ path, name, active, badge, nativeColor, el });
  });
  return items;
}

function signature(items: RailItem[]): string {
  return JSON.stringify(items.map((i) => [i.path, i.name, i.active, i.badge, i.nativeColor]));
}

function isDarkCss(color: string): boolean {
  const m = color.match(/rgba?\(\s*(\d+)[, ]+(\d+)[, ]+(\d+)/);
  if (m) return (0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3]) / 255 < 0.55;
  const h = color.replace('#', '');
  if (/^[0-9a-f]{6}/i.test(h)) {
    const n = parseInt(h.slice(0, 6), 16);
    return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.55;
  }
  return true;
}

/** Projects with a saved look use its tile; unconfigured projects keep Nimbalyst's own color. */
function tileStyle(look: ProjectLook | null, item: RailItem): CSSProperties {
  const t = look?.tile;
  if (t?.kind === 'solid') return { background: t.color, color: isDarkCss(t.color) ? '#fff' : '#111827' };
  if (t?.kind === 'gradient') return { background: `linear-gradient(${t.angle}deg, ${t.from}, ${t.to})`, color: isDarkCss(t.to) ? '#fff' : '#111827' };
  if (item.nativeColor && item.nativeColor !== 'rgba(0, 0, 0, 0)') {
    return { background: item.nativeColor, color: isDarkCss(item.nativeColor) ? 'var(--nim-text)' : '#111827' };
  }
  return {};
}

function TileContent({ look, item }: { look: ProjectLook | null; item: RailItem }) {
  const [broken, setBroken] = useState(false);
  const icon = look?.icon ?? { kind: 'initials' as const };
  const initials = <span>{initialsOf(item.name)}</span>;
  if (broken) return initials;
  if (icon.kind === 'image') return <img src={fileUrl(item.path, icon.file)} alt="" onError={() => setBroken(true)} draggable={false} />;
  if (icon.kind === 'poster' && look) {
    if (look.poster.source === 'generated' || look.poster.source === 'pattern') return <img src={posterDataUri(look.poster, { noTitle: true })} alt="" draggable={false} />;
    if (look.poster.source === 'image' && look.poster.file) return <img src={fileUrl(item.path, look.poster.file)} alt="" onError={() => setBroken(true)} draggable={false} />;
  }
  return initials;
}

type Drop = { key: string; before: boolean } | null;

export function RailEnhancer() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [items, setItems] = useState<RailItem[]>([]);
  const [wide, setWide] = useState(() => getWideRail());
  const [version, setVersion] = useState(0);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [drop, setDrop] = useState<Drop>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // The rail clips horizontal overflow, so the menu is fixed-positioned next to the + button.
  const [menuPos, setMenuPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
  const sigRef = useRef('');
  const navRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => subscribe(() => {
    setWide(getWideRail());
    setVersion((v) => v + 1);
  }), []);

  useEffect(() => {
    let raf = 0;
    let navObserver: MutationObserver | null = null;

    const sync = () => {
      raf = 0;
      const nav = document.querySelector<HTMLElement>(NATIVE_NAV);
      if (!nav) {
        navRef.current = null;
        navObserver?.disconnect();
        navObserver = null;
        setContainer(null);
        return;
      }
      if (nav !== navRef.current) {
        navRef.current = nav;
        navObserver?.disconnect();
        navObserver = new MutationObserver(schedule);
        navObserver.observe(nav, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-current', 'style', 'data-project-path', 'aria-label'], characterData: true });
      }
      nav.classList.add('pt-native-hidden');
      let host = nav.previousElementSibling as HTMLElement | null;
      if (!host || host.dataset.ptRail !== '1') {
        host = document.createElement('div');
        host.dataset.ptRail = '1';
        host.className = 'pt-rail-host';
        nav.parentElement?.insertBefore(host, nav);
      }
      setContainer(host);
      const next = readItems(nav);
      const sig = signature(next);
      if (sig !== sigRef.current) {
        sigRef.current = sig;
        setItems(next);
        setRailProjects(next.map(({ path, name, active, badge }) => ({ path, name, active, badge })));
      }
    };
    const schedule = (records?: MutationRecord[]) => {
      if (records && records.length && records.every((r) => (r.target as Node).parentElement?.closest('[data-pt-rail]'))) return;
      if (!raf) raf = requestAnimationFrame(sync);
    };
    const bodyObserver = new MutationObserver((records) => schedule(records));
    bodyObserver.observe(document.body, { childList: true, subtree: true });
    schedule();

    return () => {
      bodyObserver.disconnect();
      navObserver?.disconnect();
      if (raf) cancelAnimationFrame(raf);
      document.querySelector(NATIVE_NAV)?.classList.remove('pt-native-hidden');
      document.querySelectorAll('[data-pt-rail]').forEach((e) => e.remove());
      getBridge()?.setOverride(null);
    };
  }, []);

  // Close the divider menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [menuOpen]);

  const activePath = items.find((i) => i.active)?.path ?? null;

  // Keep the theme in step with the active project.
  useEffect(() => {
    if (!activePath) return;
    let cancelled = false;
    const apply = () => {
      const look = getLook(activePath);
      getBridge()?.setOverride(look?.themeId ?? null);
    };
    apply();
    void refreshFromDisk(activePath).then(() => {
      if (!cancelled) apply();
    });
    return () => {
      cancelled = true;
    };
  }, [activePath, version]);

  const looks = useMemo(() => getLooksCache(), [version]);
  const byPath = useMemo(() => new Map(items.map((i) => [i.path, i])), [items]);
  const entries = useMemo(() => orderedEntries(items.map(({ path, name, active, badge }) => ({ path, name, active, badge }))), [items, version]);

  /* ---- Layout mutations ---- */

  const persistOrder = (visible: RailEntry[]) => {
    void setRailLayout(mergeRailLayout(visible, getRailLayout()));
  };

  const addEntry = (e: RailEntry) => {
    persistOrder([...entries, e]);
    setMenuOpen(false);
    if (e.kind === 'text') setEditing({ id: e.id, value: e.label });
  };

  const removeEntry = (key: string) => {
    persistOrder(entries.filter((e) => entryKey(e) !== key));
  };

  const renameEntry = (id: string, label: string) => {
    const trimmed = label.trim().slice(0, 24);
    setEditing(null);
    if (!trimmed) {
      removeEntry(`t:${id}`);
      return;
    }
    persistOrder(entries.map((e) => (e.kind === 'text' && e.id === id ? { ...e, label: trimmed } : e)));
  };

  /* ---- Drag and drop ---- */

  const onDragStart = (e: DragEvent, key: string) => {
    e.dataTransfer.setData(DND_MIME, key);
    e.dataTransfer.effectAllowed = 'move';
    setDragKey(key);
  };
  const onDragOver = (e: DragEvent, key: string) => {
    if (!dragKey || dragKey === key) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const before = e.clientY < r.top + r.height / 2;
    if (drop?.key !== key || drop.before !== before) setDrop({ key, before });
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const from = dragKey ?? e.dataTransfer.getData(DND_MIME);
    const target = drop;
    setDragKey(null);
    setDrop(null);
    if (!from || !target || from === target.key) return;
    const moving = entries.find((x) => entryKey(x) === from);
    if (!moving) return;
    const rest = entries.filter((x) => entryKey(x) !== from);
    const at = rest.findIndex((x) => entryKey(x) === target.key);
    if (at < 0) return;
    rest.splice(target.before ? at : at + 1, 0, moving);
    persistOrder(rest);
  };
  const onDragEnd = () => {
    setDragKey(null);
    setDrop(null);
  };

  if (!container) return null;

  const nav = navRef.current;
  const addBtn = nav?.querySelector<HTMLElement>('.project-rail-add') ?? null;
  const dropClass = (key: string) => (drop?.key === key ? (drop.before ? ' drop-before' : ' drop-after') : '');

  return createPortal(
    <nav className={`pt-rail${wide ? ' wide' : ''}${dragKey ? ' dragging' : ''}`} aria-label="Open projects" data-testid="project-theme-rail" onDrop={onDrop} onDragOver={(e) => { if (dragKey) e.preventDefault(); }}>
      {entries.map((entry) => {
        const key = entryKey(entry);
        if (entry.kind === 'rule') {
          return (
            <div
              key={key}
              className={`pt-rule${dragKey === key ? ' is-dragging' : ''}${dropClass(key)}`}
              draggable
              onDragStart={(e) => onDragStart(e, key)}
              onDragOver={(e) => onDragOver(e, key)}
              onDragEnd={onDragEnd}
              title="Divider · drag to move"
              role="separator"
            >
              <i />
              <button type="button" className="pt-x" aria-label="Remove divider" title="Remove divider" onClick={() => removeEntry(key)}>×</button>
            </div>
          );
        }
        if (entry.kind === 'text') {
          const isEditing = editing?.id === entry.id;
          return (
            <div
              key={key}
              className={`pt-label${dragKey === key ? ' is-dragging' : ''}${dropClass(key)}`}
              draggable={!isEditing}
              onDragStart={(e) => onDragStart(e, key)}
              onDragOver={(e) => onDragOver(e, key)}
              onDragEnd={onDragEnd}
              title={`${entry.label} · double-click to rename, drag to move`}
              onDoubleClick={() => setEditing({ id: entry.id, value: entry.label })}
            >
              {isEditing ? (
                <input
                  className="pt-label-input"
                  autoFocus
                  value={editing.value}
                  maxLength={24}
                  onChange={(e) => setEditing({ id: entry.id, value: e.target.value })}
                  onBlur={() => renameEntry(entry.id, editing.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') renameEntry(entry.id, editing.value);
                    if (e.key === 'Escape') setEditing(null);
                  }}
                  aria-label="Divider text"
                />
              ) : (
                <span className="pt-label-text">{entry.label}</span>
              )}
              <button type="button" className="pt-x" aria-label={`Remove label ${entry.label}`} title="Remove label" onClick={() => removeEntry(key)}>×</button>
            </div>
          );
        }
        const item = byPath.get(entry.path);
        if (!item) return null;
        const look = looks[item.path] ?? null;
        const label = wide ? (look?.shortName || item.name) : '';
        return (
          <div
            key={key}
            className={`pt-item${item.active ? ' active' : ''}${dragKey === key ? ' is-dragging' : ''}${dropClass(key)}`}
            role="button"
            tabIndex={0}
            title={item.name}
            aria-current={item.active ? 'true' : undefined}
            draggable
            onDragStart={(e) => onDragStart(e, key)}
            onDragOver={(e) => onDragOver(e, key)}
            onDragEnd={onDragEnd}
            onClick={() => item.el.querySelector<HTMLElement>('.project-rail-item-main')?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.el.querySelector<HTMLElement>('.project-rail-item-main')?.click();
              }
            }}
          >
            <div className="pt-tile" style={tileStyle(look, item)}>
              <TileContent look={look} item={item} />
              {item.badge ? <span className="pt-badge" aria-label={`${item.badge} streaming session(s)`}>{item.badge}</span> : null}
            </div>
            {wide ? <span className="pt-name">{label}</span> : null}
            <button
              type="button"
              className="pt-close"
              aria-label={`Close ${item.name}`}
              title={`Close ${item.name}`}
              onClick={(e) => {
                e.stopPropagation();
                item.el.querySelector<HTMLElement>('.project-rail-item-close')?.click();
              }}
            >
              ×
            </button>
          </div>
        );
      })}

      <div className="pt-divider" ref={menuRef}>
        <i />
        <button
          type="button"
          className="pt-divider-add"
          aria-label="Add a divider"
          title="Add a divider"
          aria-expanded={menuOpen}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setMenuPos({ left: r.right + 8, top: Math.max(8, r.top - 8) });
            setMenuOpen((v) => !v);
          }}
        >
          +
        </button>
        {menuOpen ? (
          <div className="pt-menu" role="menu" style={{ left: menuPos.left, top: menuPos.top }}>
            <button type="button" role="menuitem" onClick={() => addEntry({ kind: 'rule', id: newId() })}>
              <span className="pt-symbol">horizontal_rule</span> Horizontal rule
            </button>
            <button type="button" role="menuitem" onClick={() => addEntry({ kind: 'text', id: newId(), label: 'Label' })}>
              <span className="pt-symbol">label</span> Text divider
            </button>
            <div className="pt-menu-hint">Drag projects and dividers to reorder. Hover a divider for ×.</div>
          </div>
        ) : null}
      </div>
      {addBtn ? (
        <button type="button" className="pt-add" aria-label="Add project to rail" title="Add project" onClick={() => addBtn.click()}>
          +
        </button>
      ) : null}
    </nav>,
    container,
  );
}

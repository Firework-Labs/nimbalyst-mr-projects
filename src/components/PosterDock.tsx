/**
 * Docks the active project's poster at the top of the existing left column
 * (the one to the right of the navigation gutter): the file sidebar in Files
 * mode, the session history in Agent mode, the tracker sidebar in Tracker
 * mode. No extra column is created. Always a banner, always at the top.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { posterSrc } from '../poster';
import { getLook, getRailProjects, openFolderLabel, openProjectFolder, openProjectThemeSettings, subscribe } from '../store';
import { defaultLook, projectNameOf } from '../types';
import { GearIcon } from './icons';
import { PosterFrame } from './PosterFrame';

const COLUMN_SELECTORS = ['.workspace-sidebar', '.session-history', '.tracker-sidebar'];
const HOST_ATTR = 'data-pt-dock';

function visible(el: HTMLElement): boolean {
  if (!el.isConnected) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

function findColumn(): HTMLElement | null {
  for (const sel of COLUMN_SELECTORS) {
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
      if (visible(el)) return el;
    }
  }
  return null;
}

export function PosterDock() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    let raf = 0;
    const sync = () => {
      raf = 0;
      const column = findColumn();
      const existing = document.querySelector<HTMLElement>(`[${HOST_ATTR}]`);
      if (!column) {
        existing?.remove();
        setHost(null);
        return;
      }
      let el = existing;
      if (!el || el.parentElement !== column) {
        el?.remove();
        el = document.createElement('div');
        el.setAttribute(HOST_ATTR, '1');
        el.className = 'pt-dock-host';
      }
      if (column.firstElementChild !== el) column.insertBefore(el, column.firstChild);
      setHost(el);
    };
    const schedule = (records?: MutationRecord[]) => {
      if (records && records.length && records.every((r) => (r.target as Element).closest?.(`[${HOST_ATTR}]`) || (r.target as Node).parentElement?.closest(`[${HOST_ATTR}]`))) return;
      if (!raf) raf = requestAnimationFrame(sync);
    };
    const observer = new MutationObserver((records) => schedule(records));
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    const unsub = subscribe(() => schedule());
    schedule();
    return () => {
      observer.disconnect();
      unsub();
      if (raf) cancelAnimationFrame(raf);
      document.querySelectorAll(`[${HOST_ATTR}]`).forEach((e) => e.remove());
    };
  }, []);

  if (!host) return null;

  const active = getRailProjects().find((p) => p.active) ?? null;
  if (!active) return null;
  const look = getLook(active.path) ?? defaultLook();
  if (!look.poster.show) return null;
  const name = projectNameOf(active.path);
  const title = look.shortName || active.name || name;
  const src = posterSrc(active.path, look, { title, aspect: 'banner' });
  if (!src) return null;

  return createPortal(
    <div className="pt-dock" data-testid="project-poster-dock" data-version={version}>
      <PosterFrame src={src} alt={`${name} poster`} sandboxed={look.poster.sandboxed} className="banner">
        <button type="button" className="pt-dock-gear" title="Mr. Projects settings" aria-label="Open Mr. Projects settings" onClick={() => void openProjectThemeSettings()}>
          <GearIcon />
        </button>
      </PosterFrame>
      {look.poster.openFolderButton ? (
        <button type="button" className="pt-dock-open" onClick={() => void openProjectFolder(active.path)} title={active.path}>
          <span className="pt-symbol">folder_open</span>
          {openFolderLabel()}
        </button>
      ) : null}
    </div>,
    host,
  );
}

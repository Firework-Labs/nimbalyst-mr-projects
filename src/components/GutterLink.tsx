/**
 * A button in the navigation gutter (the 48px column between the project
 * rail and the left column) that opens Project Settings › Mr. Projects for
 * the active project. The gutter is Nimbalyst's; we add one host element to
 * its "extension panels" section, right after Mr. Themes' button when present,
 * and portal our button into it, styled like the native nav-buttons.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { attachHelpTooltip } from '../helpTooltip';
import { openProjectThemeSettings } from '../store';
import { ProjectIcon } from './icons';

export const TOOLTIP = { title: 'Mr. Projects', body: 'Uniquify project spaces–designed to work with Mr. Themes' };

const GUTTER = '.navigation-gutter';
const SECTION = '.nav-section.nav-extension-panels';
const HOST_ATTR = 'data-pt-gutter';
const THEMES_ITEM = '[data-gutter-item^="com.fireworklabs.theme-editor."]';

export function GutterLink() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [btn, setBtn] = useState<HTMLButtonElement | null>(null);

  useEffect(() => (btn ? attachHelpTooltip(btn, TOOLTIP) : undefined), [btn]);

  useEffect(() => {
    let raf = 0;
    const sync = () => {
      raf = 0;
      const gutter = document.querySelector<HTMLElement>(GUTTER);
      const section = gutter?.querySelector<HTMLElement>(SECTION) ?? gutter;
      const existing = document.querySelector<HTMLElement>(`[${HOST_ATTR}]`);
      if (!section) {
        existing?.remove();
        setHost(null);
        return;
      }
      let el = existing;
      if (!el) {
        el = document.createElement('div');
        el.setAttribute(HOST_ATTR, '1');
        el.dataset.gutterItem = 'com.fireworklabs.project-theme.settings';
      }
      // Sit right after Mr. Themes' panel button when it is shown; otherwise at the end.
      // Nimbalyst renders sidebar panels, Terminal and bottom panels after fullscreen
      // panels like Mr. Themes, so appending alone leaves those in between.
      const themes = section.querySelector<HTMLElement>(`:scope > ${THEMES_ITEM}`);
      if (themes ? themes.nextElementSibling !== el : el.parentElement !== section) {
        if (themes) themes.after(el);
        else section.appendChild(el);
      }
      setHost(el);
    };
    const schedule = (records?: MutationRecord[]) => {
      if (records && records.length && records.every((r) => (r.target as Element).closest?.(`[${HOST_ATTR}]`) || (r.target as Node).parentElement?.closest(`[${HOST_ATTR}]`))) return;
      if (!raf) raf = requestAnimationFrame(sync);
    };
    const observer = new MutationObserver((records) => schedule(records));
    observer.observe(document.body, { childList: true, subtree: true });
    schedule();
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
      document.querySelectorAll(`[${HOST_ATTR}]`).forEach((e) => e.remove());
    };
  }, []);

  if (!host) return null;

  const open = async () => {
    setBusy(true);
    try {
      await openProjectThemeSettings();
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <button ref={setBtn} type="button" className="pt-gutter-btn" aria-label="Mr. Projects settings" data-testid="project-theme-gutter-button" disabled={busy} onClick={() => void open()}>
      <ProjectIcon size={22} />
    </button>,
    host,
  );
}

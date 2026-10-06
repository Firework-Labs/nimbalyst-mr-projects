/**
 * Mr. Projects - extension entry point.
 */
import type { ExtensionContext } from '@nimbalyst/extension-sdk';
import { GutterLink } from './components/GutterLink';
import { PosterDock } from './components/PosterDock';
import { ProjectThemeSettings } from './components/ProjectThemeSettings';
import { RailEnhancer } from './components/RailEnhancer';
import { getBridge, installProjectBridge, setExtensionContext, uninstallProjectBridge } from './store';
import { ensureStyles, removeStyles } from './styles';

export const components = {};

export const hostComponents = {
  RailEnhancer,
  PosterDock,
  GutterLink,
};

export const settingsPanel = {
  ProjectThemeSettings,
};

export function activate(context: ExtensionContext): void {
  setExtensionContext(context);
  ensureStyles();
  installProjectBridge();
}

export function deactivate(): void {
  getBridge()?.setOverride(null);
  uninstallProjectBridge();
  document.querySelector('nav.project-rail')?.classList.remove('pt-native-hidden');
  document.querySelectorAll('[data-pt-rail], [data-pt-dock], [data-pt-gutter]').forEach((e) => e.remove());
  removeStyles();
  setExtensionContext(null);
}

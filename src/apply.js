import { CSS } from './styles.js';
import {
  DEFAULT_ENTRY_WIDTH,
  DEFAULT_VISIBLE,
  INJECT,
  LIMIT,
  MAX_ENTRY_WIDTH,
  MAX_VISIBLE,
  MIN_ENTRY_WIDTH,
  MIN_VISIBLE,
  NS,
  PKG,
  VERSION,
} from './constants.js';
import { zh, en } from './locales.js';
import { createNavHistory } from './history.js';
import {
  clampEntryWidth,
  clampVisible,
  entryKey,
  readLocation,
  resolvePanelLabel,
  resolveSessionLabel,
} from './utils.js';
import { loadHistory, loadSettings, saveHistory, saveSettings } from './storage.js';
import { installMouseButtons, registerShortcuts } from './shortcuts.js';
import { createConfigSection, createNavBar } from './view.js';

/**
 * Build the client half of the plugin. React is injected instead of required
 * here so the whole module graph can be imported and tested without a bundler.
 */
export function createClientModule(React) {
  function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'nav-history: dictionaries');
    const fallbackT = (key) => {
      try {
        const t = ctx.locale.bind(NS);
        return t(key);
      } catch (error) {
        return key;
      }
    };

    ctx.effect(() => {
      const style = document.createElement('style');
      style.setAttribute('data-dsh-nav-history', '');
      style.textContent = CSS;
      document.head.appendChild(style);
      return () => style.remove();
    }, 'nav-history: styles');

    const settings = loadSettings();
    const controller = createNavHistory({
      limit: LIMIT,
      maxVisible: settings.maxVisible,
      entryWidth: settings.entryWidth,
      readLocation: () => readLocation(ctx),
      openSession: (sessionId) => {
        if (ctx.uiWorkspace && typeof ctx.uiWorkspace.openSession === 'function') {
          ctx.uiWorkspace.openSession(sessionId);
        }
      },
      selectPanel: (panelId) => {
        if (ctx.layout && typeof ctx.layout.selectPanel === 'function') {
          ctx.layout.selectPanel(panelId);
        }
      },
      panelLabel: (panelId) => resolvePanelLabel(ctx, panelId),
      sessionLabel: (sessionId) => resolveSessionLabel(ctx, sessionId),
      load: loadHistory,
      persist: saveHistory,
      persistSettings: saveSettings,
      onError: (error) => console.warn('[nav-history] restore dropped one entry:', error),
    });

    const NavBar = createNavBar(React, controller, fallbackT);
    const ConfigSection = createConfigSection(React, controller, fallbackT);

    /** Register into an optional host seat without taking the plugin down if it is taken. */
    const registerIntoSlot = (name, options, component) => {
      try {
        return ctx.slots.register({ name, ...options }, component);
      } catch (error) {
        console.warn(`[nav-history] slot ${name} registration failed:`, error);
        return () => {};
      }
    };

    ctx.slots.inject('shell.bottom', () =>
      registerIntoSlot('shell.bottom', { locale: NS, registrant: PKG }, NavBar),
    );

    ctx.slots.inject('plugins.bundle.config', () =>
      registerIntoSlot('plugins.bundle.config', { key: PKG, order: 10, locale: NS, registrant: PKG }, ConfigSection),
    );

    ctx.effect(() => {
      const disposers = [];
      try {
        if (ctx.layout && ctx.layout.panelInfo && typeof ctx.layout.panelInfo.subscribe === 'function') {
          disposers.push(ctx.layout.panelInfo.subscribe(() => controller.onChange()));
        }
      } catch (error) {
        console.warn('[nav-history] panel tracking unavailable:', error);
      }
      try {
        const selection = ctx.uiWorkspace && ctx.uiWorkspace.selection;
        if (selection && typeof selection.subscribe === 'function') {
          disposers.push(selection.subscribe(() => controller.onChange()));
        }
      } catch (error) {
        console.warn('[nav-history] session tracking unavailable:', error);
      }
      try {
        if (ctx.sessions && ctx.sessions.list && typeof ctx.sessions.list.subscribe === 'function') {
          disposers.push(ctx.sessions.list.subscribe(() => controller.refresh()));
        }
      } catch (error) {
        console.warn('[nav-history] session labels unavailable:', error);
      }
      disposers.push(installMouseButtons(controller));
      disposers.push(registerShortcuts(ctx, controller, fallbackT));
      return () => {
        for (const dispose of disposers) {
          try {
            dispose();
          } catch (error) {
            // ignore
          }
        }
      };
    }, 'nav-history: tracking');

    controller.start();
    console.info('[nav-history] ready', {
      version: VERSION,
      entries: controller.getSnapshot().length,
      maxVisible: controller.getMaxVisible(),
      entryWidth: controller.getEntryWidth(),
    });
    if (typeof window !== 'undefined') {
      try {
        // Read-only diagnostics for troubleshooting a reported navigation path.
        window.__dshNavHistory = {
          version: VERSION,
          dump: () => ({
            index: controller.index(),
            maxVisible: controller.getMaxVisible(),
            entryWidth: controller.getEntryWidth(),
            entries: controller.entries(),
          }),
          back: controller.back,
          forward: controller.forward,
        };
      } catch (error) {
        // diagnostics are optional
      }
    }
  }

  return {
    name: PKG,
    inject: INJECT,
    apply,
    internals: {
      createNavHistory,
      readLocation,
      resolvePanelLabel,
      resolveSessionLabel,
      entryKey,
      clampVisible,
      clampEntryWidth,
      MIN_VISIBLE,
      MAX_VISIBLE,
      DEFAULT_VISIBLE,
      MIN_ENTRY_WIDTH,
      MAX_ENTRY_WIDTH,
      DEFAULT_ENTRY_WIDTH,
      zh,
      en,
    },
  };
}

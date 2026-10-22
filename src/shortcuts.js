import { LABEL_PREFIX } from './constants.js';

function installMouseButtons(controller) {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return () => {};
  const onDown = (event) => {
    if (event.button === 3 || event.button === 4) {
      try {
        event.preventDefault();
      } catch (error) {
        // ignore
      }
    }
  };
  const onUp = (event) => {
    if (event.button === 3) {
      try {
        event.preventDefault();
      } catch (error) {
        // ignore
      }
      controller.back();
    } else if (event.button === 4) {
      try {
        event.preventDefault();
      } catch (error) {
        // ignore
      }
      controller.forward();
    }
  };
  window.addEventListener('mousedown', onDown, true);
  window.addEventListener('mouseup', onUp, true);
  return () => {
    window.removeEventListener('mousedown', onDown, true);
    window.removeEventListener('mouseup', onUp, true);
  };
}

function registerShortcuts(ctx, controller, t) {
  const shortcuts = ctx.shortcuts;
  if (!shortcuts || typeof shortcuts.register !== 'function') return () => {};
  const disposers = [];
  const bindings = [
    {
      id: 'nav-history.back',
      labelKey: 'back',
      aliases: ['back', 'go back', 'previous page', 'nav history back'],
      win: { code: 'ArrowLeft', modifiers: ['alt'] },
      mac: { code: 'BracketLeft', modifiers: ['primary'] },
      run: () => controller.back(),
    },
    {
      id: 'nav-history.forward',
      labelKey: 'forward',
      aliases: ['forward', 'go forward', 'next page', 'nav history forward'],
      win: { code: 'ArrowRight', modifiers: ['alt'] },
      mac: { code: 'BracketRight', modifiers: ['primary'] },
      run: () => controller.forward(),
    },
  ];
  for (const binding of bindings) {
    try {
      disposers.push(
        shortcuts.register({
          id: binding.id,
          label: () => `${LABEL_PREFIX}${t(binding.labelKey)}`,
          aliases: binding.aliases,
          defaults: {
            'desktop:windows': binding.win,
            'desktop:macos': binding.mac,
          },
          regions: ['page', 'editable'],
          modals: [],
          resolve: () => ({
            status: 'handled',
            run: binding.run,
          }),
        }),
      );
    } catch (error) {
      console.warn(`[nav-history] shortcut ${binding.id} registration failed:`, error);
    }
  }
  return () => {
    for (const dispose of disposers) {
      try {
        dispose();
      } catch (error) {
        // ignore
      }
    }
  };
}

export { installMouseButtons, registerShortcuts };

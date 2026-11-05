import { LABEL_PREFIX } from './constants.js';
import { navigateUserMessage } from './conversation.js';

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

function registerShortcuts(ctx, controller, t) {  const shortcuts = ctx.shortcuts;
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
    {
      id: 'nav-history.prev-message',
      labelKey: 'prevMessage',
      aliases: ['previous message', 'prev message', '上一条用户消息', '上一条消息', 'nav history previous message'],
      win: { code: 'ArrowUp', modifiers: ['alt'] },
      mac: { code: 'ArrowUp', modifiers: ['alt'] },
      run: () => navigateUserMessage('up'),
    },
    {
      id: 'nav-history.next-message',
      labelKey: 'nextMessage',
      aliases: ['next message', '下一条用户消息', '下一条消息', 'nav history next message'],
      win: { code: 'ArrowDown', modifiers: ['alt'] },
      mac: { code: 'ArrowDown', modifiers: ['alt'] },
      run: () => navigateUserMessage('down'),
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
          resolve: (context) => {
            if (binding.id === 'nav-history.prev-message' || binding.id === 'nav-history.next-message') {
              try {
                console.info('[nav-history] shortcut dispatched', binding.id, context && context.region);
              } catch (error) {
                // diagnostics are optional
              }
            }
            return { status: 'handled', run: binding.run };
          },
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

const REPEAT_INTERVAL_MS = 90;

function bindingMatchesInput(binding, input) {
  if (!binding || binding.code !== input.code || binding.secondCode !== undefined) return false;
  const modifiers = ['control', 'alt', 'shift', 'meta'].filter((name) => input[name]);
  const expected = binding.modifiers || [];
  return modifiers.length === expected.length && modifiers.every((name) => expected.includes(name));
}

/** Direction for one native key-repeat input, or null when it is not ours. */
export function repeatDirection(rows, input) {
  if (!input || input.repeat !== true || input.kind !== 'keyboard') return null;
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row || !row.binding) continue;
    if (!bindingMatchesInput(row.binding, input)) continue;
    if (row.id === 'nav-history.prev-message') return 'up';
    if (row.id === 'nav-history.next-message') return 'down';
  }
  return null;
}

/**
 * The shortcut registry suppresses `run` for key repeats, so holding the key
 * would step exactly once. The native keyboard bridge still delivers those
 * repeats; subscribe to it and step again, throttled so a held key walks the
 * transcript instead of racing through it.
 */
export function installRepeatNavigation(ctx) {
  if (typeof window === 'undefined') return () => {};
  const keyboard = window.dshDesktop && window.dshDesktop.keyboard;
  if (!keyboard || typeof keyboard.subscribe !== 'function') return () => {};
  const catalog = ctx && ctx.shortcuts && ctx.shortcuts.catalog;
  if (!catalog || typeof catalog.getSnapshot !== 'function') return () => {};
  let rows = catalog.getSnapshot() || [];
  const offCatalog = typeof catalog.subscribe === 'function'
    ? catalog.subscribe(() => {
        rows = catalog.getSnapshot() || [];
      })
    : null;
  let lastAt = 0;
  const unsubscribe = keyboard.subscribe((input) => {
    const direction = repeatDirection(rows, input);
    if (direction === null) return;
    const now = Date.now();
    if (now - lastAt < REPEAT_INTERVAL_MS) return;
    lastAt = now;
    navigateUserMessage(direction);
  });
  return () => {
    if (typeof offCatalog === 'function') {
      try {
        offCatalog();
      } catch (error) {
        // ignore
      }
    }
    if (typeof unsubscribe === 'function') {
      try {
        unsubscribe();
      } catch (error) {
        // ignore
      }
    }
  };
}

export { installMouseButtons, registerShortcuts };

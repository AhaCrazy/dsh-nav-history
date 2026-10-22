import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * `client.js` is a plain browser bundle (`window.__ModuleLoader__.load`), not an
 * ES module. Capture the registration, run the factory with a React stub, then
 * exercise the exported internals and the real plugin registration against a
 * fake client Context.
 */
const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');

const ReactStub = {
  createElement: (...args) => args,
  useState: (value) => [typeof value === 'function' ? value() : value, () => {}],
  useEffect: () => {},
  useRef: (value) => ({ current: value }),
  useMemo: (factory) => factory(),
};

let registration = null;
const windowStub = {
  __ModuleLoader__: {
    load(definition) {
      registration = definition;
    },
  },
  addEventListener() {},
  removeEventListener() {},
};
const documentStub = {
  createElement: () => ({
    setAttribute() {},
    remove() {},
    textContent: '',
  }),
  head: { appendChild() {} },
};
const storage = new Map();
const localStorageStub = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};
globalThis.window = windowStub;
globalThis.document = documentStub;
globalThis.localStorage = localStorageStub;

new Function('window', source)(windowStub);

const plugin = registration === null
  ? null
  : registration.factory((id) => {
      if (id === 'react') return ReactStub;
      throw new Error(`unexpected module request: ${id}`);
    });

const { createNavHistory, readLocation, resolvePanelLabel, resolveSessionLabel, entryKey, clampVisible } = plugin.internals;

/** Minimal controller harness: fake stores plus fake navigation APIs. */
function createHarness(options = {}) {
  let location = { ...(options.initial ?? { panelId: null, sessionId: 's1' }) };
  const subscribers = new Set();
  const calls = [];
  const settingsSink = [];
  const notify = () => {
    for (const listener of [...subscribers]) listener();
  };
  const controller = createNavHistory({
    limit: options.limit ?? 10,
    maxVisible: options.maxVisible,
    readLocation: () => ({ ...location }),
    openSession: (sessionId) => {
      calls.push(['open', sessionId]);
      location = { ...location, sessionId };
      notify();
    },
    selectPanel: (panelId) => {
      if (options.gonePanels && options.gonePanels.includes(panelId)) throw new Error(`unknown panel ${panelId}`);
      calls.push(['panel', panelId]);
      location = { ...location, panelId };
      notify();
    },
    panelLabel: (panelId) => `panel:${panelId}`,
    sessionLabel: (sessionId) => `session:${sessionId}`,
    load: options.load ?? (() => null),
    persist: options.persist ?? (() => {}),
    persistSettings: (value) => settingsSink.push(value),
    onError: options.onError ?? (() => {}),
  });
  subscribers.add(() => controller.onChange());
  controller.start();
  return {
    controller,
    calls,
    settingsSink,
    go(next) {
      location = { ...next };
      notify();
    },
  };
}

test('bundle registers under the package name with the navigation services', () => {
  assert.equal(registration.id, 'dsh-nav-history');
  assert.equal(plugin.name, 'dsh-nav-history');
  assert.deepEqual(plugin.inject, ['slots', 'locale', 'layout', 'uiWorkspace', 'sessions', 'shortcuts']);
  assert.equal(typeof plugin.apply, 'function');
  assert.equal(typeof plugin.internals.createNavHistory, 'function');
  assert.match(source, /shell\.bottom/);
  assert.match(source, /ctx\.shortcuts/);
  assert.match(source, /nav-history\.back/);
  assert.match(source, /nav-history\.forward/);
});

test('history records session -> panel -> session and walks back/forward', () => {
  const harness = createHarness({ initial: { panelId: null, sessionId: 's1' } });
  const { controller } = harness;
  assert.equal(controller.getSnapshot().length, 1);
  assert.equal(controller.getSnapshot().canBack, false);

  harness.go({ panelId: 'market', sessionId: 's1' });
  assert.equal(controller.getSnapshot().length, 2);
  assert.equal(controller.getSnapshot().label, 'panel:market');
  assert.equal(controller.getSnapshot().kind, 'panel');

  harness.go({ panelId: null, sessionId: 's2' });
  assert.equal(controller.getSnapshot().length, 3);
  assert.equal(controller.getSnapshot().label, 'session:s2');

  assert.equal(controller.back(), true);
  assert.deepEqual(harness.calls, [['open', 's1'], ['panel', 'market']]);
  assert.equal(controller.getSnapshot().index, 1);
  assert.equal(controller.getSnapshot().label, 'panel:market');

  assert.equal(controller.back(), true);
  assert.deepEqual(harness.calls, [['open', 's1'], ['panel', 'market'], ['panel', null]]);
  assert.equal(controller.getSnapshot().index, 0);
  assert.equal(controller.getSnapshot().canBack, false);

  assert.equal(controller.forward(), true);
  assert.deepEqual(harness.calls, [['open', 's1'], ['panel', 'market'], ['panel', null], ['panel', 'market']]);
  assert.equal(controller.getSnapshot().index, 1);
  assert.equal(controller.getSnapshot().canForward, true);
});

test('consecutive identical locations are not duplicated', () => {
  const harness = createHarness();
  harness.go({ panelId: null, sessionId: 's1' });
  harness.go({ panelId: null, sessionId: 's1' });
  assert.equal(harness.controller.getSnapshot().length, 1);
});

test('navigating after going back truncates the forward branch', () => {
  const harness = createHarness();
  harness.go({ panelId: null, sessionId: 's2' });
  harness.go({ panelId: null, sessionId: 's3' });
  harness.controller.back();
  assert.equal(harness.controller.getSnapshot().canForward, true);
  harness.go({ panelId: null, sessionId: 's4' });
  assert.equal(harness.controller.getSnapshot().canForward, false);
  assert.equal(harness.controller.getSnapshot().length, 3);
  assert.equal(harness.controller.getSnapshot().label, 'session:s4');
});

test('visible-entry window is bounded, configurable, and its chips jump', () => {
  assert.equal(clampVisible(0), 1);
  assert.equal(clampVisible(99), 7);
  assert.equal(clampVisible('3'), 3);
  assert.equal(clampVisible('garbage'), 3);

  const harness = createHarness({ initial: { panelId: null, sessionId: 'a' }, maxVisible: 3 });
  harness.go({ panelId: null, sessionId: 'b' });
  harness.go({ panelId: null, sessionId: 'c' });
  harness.go({ panelId: null, sessionId: 'd' });
  assert.equal(harness.controller.getMaxVisible(), 3);
  assert.deepEqual(
    harness.controller.getSnapshot().items.map((item) => item.label),
    ['session:b', 'session:c', 'session:d'],
  );
  assert.equal(harness.controller.getSnapshot().items[2].active, true);

  assert.equal(harness.controller.jumpTo(1), true);
  assert.equal(harness.controller.getSnapshot().index, 1);
  assert.equal(harness.controller.getSnapshot().items[1].active, true);

  assert.equal(harness.controller.setMaxVisible(5), true);
  assert.equal(harness.controller.getMaxVisible(), 5);
  assert.equal(harness.settingsSink.at(-1).maxVisible, 5);
  assert.equal(harness.controller.setMaxVisible(100), true);
  assert.equal(harness.controller.getMaxVisible(), 7);
  assert.equal(harness.controller.setMaxVisible(7), false);
  assert.equal(harness.controller.setMaxVisible(0), true);
  assert.equal(harness.controller.getMaxVisible(), 1);
  // maxVisible 1 keeps only the current page in the strip.
  assert.equal(harness.controller.getSnapshot().items.length, 1);
  assert.equal(harness.controller.getSnapshot().items[0].active, true);
});

test('stepping back to c and then opening f drops the old d/e branch', () => {
  const harness = createHarness({ initial: { panelId: null, sessionId: 'a' } });
  harness.go({ panelId: null, sessionId: 'b' });
  harness.go({ panelId: null, sessionId: 'c' });
  harness.go({ panelId: null, sessionId: 'd' });
  harness.go({ panelId: null, sessionId: 'e' });
  assert.equal(harness.controller.getSnapshot().length, 5);

  harness.controller.back();
  harness.controller.back();
  assert.equal(harness.controller.getSnapshot().index, 2);

  harness.go({ panelId: null, sessionId: 'f' });
  assert.deepEqual(harness.controller.entries().map((entry) => entry.sessionId), ['a', 'b', 'c', 'f']);
  assert.equal(harness.controller.getSnapshot().index, 3);
  assert.equal(harness.controller.getSnapshot().length, 4);
  assert.equal(harness.controller.getSnapshot().canForward, false);
});

test('a restore that lands beside its entry keeps the cursor and still truncates next time', () => {
  // A panel entry recorded when no session was selected: restoring it lands on
  // "panel + current session", which does not match the stored entry exactly.
  const harness = createHarness({ initial: { panelId: null, sessionId: null } });
  harness.go({ panelId: 'board', sessionId: null });
  harness.go({ panelId: null, sessionId: 'a' });
  harness.go({ panelId: null, sessionId: 'b' });
  assert.equal(harness.controller.getSnapshot().length, 3);

  harness.controller.back();
  assert.equal(harness.controller.getSnapshot().index, 1);
  harness.controller.back();
  assert.equal(harness.controller.getSnapshot().index, 0);
  assert.equal(harness.controller.entries()[0].panelId, 'board');
  assert.equal(harness.controller.entries()[0].sessionId, 'a');

  // The cursor stayed on the restored entry: navigating away truncates forward.
  harness.go({ panelId: null, sessionId: 'f' });
  assert.deepEqual(harness.controller.entries().map((entry) => entry.sessionId), ['a', 'f']);
  assert.equal(harness.controller.getSnapshot().length, 2);
  assert.equal(harness.controller.getSnapshot().index, 1);
  assert.equal(harness.controller.getSnapshot().canForward, false);
});

test('a failed restore drops that entry and keeps the rest usable', () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const harness = createHarness({ initial: { panelId: null, sessionId: 'a' }, gonePanels: ['gone'] });
    harness.go({ panelId: 'gone', sessionId: 'a' });
    harness.go({ panelId: null, sessionId: 'b' });
    assert.equal(harness.controller.getSnapshot().length, 3);

    // Back to the dead panel entry fails during selectPanel; the entry is dropped
    // and the stack falls back to the previous live session.
    assert.equal(harness.controller.back(), true);
    assert.equal(harness.controller.getSnapshot().length, 2);
    assert.equal(harness.controller.getSnapshot().index, 0);
    assert.equal(harness.controller.getSnapshot().label, 'session:a');
    assert.equal(harness.controller.getSnapshot().canBack, false);

    // The surviving forward entry still works.
    assert.equal(harness.controller.forward(), true);
    assert.equal(harness.controller.getSnapshot().label, 'session:b');
  } finally {
    console.warn = originalWarn;
  }
});

test('persisted history is restored and pruned by age', () => {
  const now = Date.now();
  const old = now - 8 * 24 * 60 * 60 * 1000;
  const harness = createHarness({
    initial: { panelId: 'market', sessionId: 'a' },
    load: () => ({
      entries: [
        { panelId: null, sessionId: 'a', at: now },
        { panelId: 'market', sessionId: 'a', at: now },
        { panelId: null, sessionId: 'expired', at: old },
      ],
      index: 1,
    }),
  });
  assert.equal(harness.controller.getSnapshot().length, 2);
  assert.equal(harness.controller.getSnapshot().index, 1);
  assert.equal(harness.controller.getSnapshot().canBack, true);
  assert.equal(harness.controller.getSnapshot().canForward, false);
});

test('readLocation prefers the layout panel and the retained main session', () => {
  const ctx = {
    layout: { panelInfo: { getSnapshot: () => ({ activePanelId: 'board' }) } },
    uiWorkspace: { selection: { getSnapshot: () => ({ sessionId: 'sess-1' }) } },
    sessions: { list: { getSnapshot: () => ({ byId: {} }) } },
  };
  assert.deepEqual(readLocation(ctx), { panelId: 'board', sessionId: 'sess-1' });
});

test('readLocation falls back to the mainView retention row', () => {
  const ctx = {
    layout: { panelInfo: { getSnapshot: () => ({ activePanelId: null }) } },
    uiWorkspace: {},
    sessions: {
      list: {
        getSnapshot: () => ({
          byId: {
            a: { id: 'a', retainedBy: { mainView: 0 } },
            b: { id: 'b', retainedBy: { mainView: 1 } },
          },
        }),
      },
    },
  };
  assert.deepEqual(readLocation(ctx), { panelId: null, sessionId: 'b' });
});

test('labels resolve from sidebar panel rows and session titles', () => {
  const ctx = {
    slots: {
      entries: (name) => (name === 'sidebar.panellist'
        ? [{ options: { id: 'market', label: () => '插件市场' } }]
        : []),
    },
    sessions: {
      list: {
        getSnapshot: () => ({
          byId: { s1: { id: 's1', displayTitle: '我的主会话' } },
        }),
      },
    },
  };
  assert.equal(resolvePanelLabel(ctx, 'market'), '插件市场');
  assert.equal(resolvePanelLabel(ctx, 'unknown-panel'), 'unknown-panel');
  assert.equal(resolveSessionLabel(ctx, 's1'), '我的主会话');
  assert.equal(entryKey({ panelId: null, sessionId: 's1' }), 'c|s1');
  assert.equal(entryKey({ panelId: 'market', sessionId: 's1' }), 'p:market|s1');
});

test('apply registers the bottom bar, shortcuts and tracking subscriptions', () => {
  const state = { panelId: null, sessionId: 's1' };
  const panelSubs = new Set();
  const selectionSubs = new Set();
  const listSubs = new Set();
  const registeredSlots = [];
  const registeredShortcuts = [];
  const effectLabels = [];

  const ctx = {
    effect(callback, label) {
      effectLabels.push(label);
      const dispose = callback();
      return typeof dispose === 'function' ? dispose : () => {};
    },
    locale: {
      register() {},
      bind: () => (key) => key,
    },
    slots: {
      injected: [],
      entries: (name) => (name === 'sidebar.panellist' ? [{ options: { id: 'market', label: '插件市场' } }] : []),
      inject(name, callback) {
        this.injected.push(name);
        callback();
      },
      register(options, component) {
        registeredSlots.push({ options, component });
        return () => {};
      },
    },
    shortcuts: {
      register(options) {
        registeredShortcuts.push(options);
        return () => {};
      },
    },
    layout: {
      panelInfo: {
        getSnapshot: () => ({ activePanelId: state.panelId }),
        subscribe: (listener) => {
          panelSubs.add(listener);
          return () => panelSubs.delete(listener);
        },
      },
      selectPanel(panelId) {
        state.panelId = panelId;
        for (const listener of [...panelSubs]) listener();
      },
    },
    uiWorkspace: {
      selection: {
        getSnapshot: () => ({ sessionId: state.sessionId }),
        subscribe: (listener) => {
          selectionSubs.add(listener);
          return () => selectionSubs.delete(listener);
        },
      },
      openSession(sessionId) {
        state.sessionId = sessionId;
        state.panelId = null;
        for (const listener of [...selectionSubs]) listener();
      },
    },
    sessions: {
      list: {
        getSnapshot: () => ({
          byId: {
            s1: { id: 's1', displayTitle: '主会话', retainedBy: { mainView: 1 } },
            s2: { id: 's2', displayTitle: '成员会话', retainedBy: { mainView: 0 } },
          },
        }),
        subscribe: (listener) => {
          listSubs.add(listener);
          return () => listSubs.delete(listener);
        },
      },
    },
  };

  plugin.apply(ctx);

  assert.ok(ctx.slots.injected.includes('shell.bottom'));
  assert.ok(ctx.slots.injected.includes('plugins.bundle.config'));
  assert.equal(registeredSlots.length, 2);
  const barSlot = registeredSlots.find((item) => item.options.name === 'shell.bottom');
  const configSlot = registeredSlots.find((item) => item.options.name === 'plugins.bundle.config');
  assert.ok(barSlot);
  assert.ok(configSlot);
  assert.equal(barSlot.options.locale, 'nav-history');
  assert.equal(typeof barSlot.component, 'function');
  assert.equal(configSlot.options.key, 'dsh-nav-history');
  assert.equal(typeof configSlot.component, 'function');

  assert.deepEqual(registeredShortcuts.map((item) => item.id).sort(), ['nav-history.back', 'nav-history.forward']);
  const shortcutLabels = Object.fromEntries(registeredShortcuts.map((item) => [item.id, item.label()]));
  assert.equal(shortcutLabels['nav-history.back'], 'Nav History: back');
  assert.equal(shortcutLabels['nav-history.forward'], 'Nav History: forward');
  for (const shortcut of registeredShortcuts) {
    assert.ok(shortcut.aliases.includes(`nav history ${shortcut.id.split('.').pop()}`));
    assert.ok(shortcut.defaults['desktop:windows']);
    assert.ok(shortcut.defaults['desktop:macos']);
    // Web/Linux defaults are omitted on purpose: ArrowLeft/ArrowRight are
    // reserved there and would make the whole registration throw.
    assert.equal(shortcut.defaults['web:windows'], undefined);
    assert.equal(shortcut.defaults['desktop:linux'], undefined);
  }
  assert.ok(effectLabels.includes('nav-history: tracking'));

  // The bar renders and its buttons stay disabled until there is somewhere to go.
  const tree = barSlot.component({ t: (key) => key });
  assert.equal(tree[0], 'div');
  const [backButton, forwardButton] = tree.slice(2, 4);
  assert.equal(backButton[0], 'button');
  assert.equal(backButton[1].disabled, true);
  assert.equal(forwardButton[1].disabled, true);

  // Opening the market panel records a second location; Back becomes available.
  state.panelId = 'market';
  for (const listener of [...panelSubs]) listener();
  const after = barSlot.component({ t: (key) => key });
  const backAfter = after.slice(2, 4)[0];
  assert.equal(backAfter[1].disabled, false);
  backAfter[1].onClick();
  assert.equal(state.panelId, null);
  assert.equal(state.sessionId, 's1');

  // The per-bundle configuration card: 1..7 choices, persisted on click.
  const config = configSlot.component({
    t: (key) => (key === 'config.maxVisible' ? 'max' : key),
    view: 'page',
  });
  assert.equal(config[0], 'section');
  const choices = config[3][3];
  const choiceButtons = choices.slice(2);
  assert.equal(choiceButtons.length, 7);
  const choiceFive = choiceButtons.find((button) => button[2] === '5');
  assert.ok(choiceFive);
  choiceFive[1].onClick();
  assert.equal(JSON.parse(storage.get('dsh.nav-history.settings.v1')).maxVisible, 5);
  const rerendered = configSlot.component({
    t: (key) => (key === 'config.maxVisible' ? 'max' : key),
    view: 'page',
  });
  const checked = rerendered[3][3].slice(2).find((button) => button[2] === '5');
  assert.equal(checked[1]['aria-checked'], true);
});

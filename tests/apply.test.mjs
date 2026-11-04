import assert from 'node:assert/strict';
import test from 'node:test';
import { createClientModule } from '../src/apply.js';
import { ReactStub, resetStorage, storage } from './support.mjs';

test('apply registers the bottom bar, shortcuts and tracking subscriptions', () => {
  resetStorage();
  const plugin = createClientModule(ReactStub);
  assert.equal(plugin.name, 'dsh-nav-history');
  assert.deepEqual(plugin.inject, ['slots', 'locale', 'layout', 'uiWorkspace', 'sessions', 'shortcuts']);

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

  assert.deepEqual(
    registeredShortcuts.map((item) => item.id).sort(),
    ['nav-history.back', 'nav-history.forward', 'nav-history.next-message', 'nav-history.prev-message'],
  );
  const shortcutLabels = Object.fromEntries(registeredShortcuts.map((item) => [item.id, item.label()]));
  assert.equal(shortcutLabels['nav-history.back'], 'Nav History: back');
  assert.equal(shortcutLabels['nav-history.forward'], 'Nav History: forward');
  assert.equal(shortcutLabels['nav-history.prev-message'], 'Nav History: prevMessage');
  assert.equal(shortcutLabels['nav-history.next-message'], 'Nav History: nextMessage');
  for (const shortcut of registeredShortcuts) {
    assert.ok(shortcut.defaults['desktop:windows']);
    assert.ok(shortcut.defaults['desktop:macos']);
    // Web/Linux defaults are omitted on purpose: the arrow keys are reserved
    // there and would make the whole registration throw.
    assert.equal(shortcut.defaults['web:windows'], undefined);
    assert.equal(shortcut.defaults['desktop:linux'], undefined);
  }
  const prevMessage = registeredShortcuts.find((item) => item.id === 'nav-history.prev-message');
  const nextMessage = registeredShortcuts.find((item) => item.id === 'nav-history.next-message');
  assert.deepEqual(prevMessage.defaults['desktop:windows'], { code: 'ArrowUp', modifiers: ['alt'] });
  assert.deepEqual(nextMessage.defaults['desktop:windows'], { code: 'ArrowDown', modifiers: ['alt'] });
  assert.ok(prevMessage.aliases.includes('nav history previous message'));
  assert.ok(nextMessage.aliases.includes('nav history next message'));
  // The shortcut also handles presses while the composer has focus; the
  // desktop keyboard bridge consumes the key before the editor sees it, so the
  // caret/paragraph editing path is not entered and focus stays put.
  assert.equal(prevMessage.resolve({ region: 'editable' }).status, 'handled');
  assert.equal(prevMessage.resolve({ region: 'page' }).status, 'handled');
  assert.ok(effectLabels.includes('nav-history: tracking'));

  // The bar renders and its buttons stay disabled until there is somewhere to go.
  const tree = barSlot.component({ t: (key) => key });
  assert.equal(tree[0], 'div');
  const [backButton, forwardButton] = tree.slice(2, 4);
  assert.equal(backButton[0], 'button');
  assert.equal(backButton[1].disabled, true);
  assert.equal(forwardButton[1].disabled, true);
  assert.equal(tree[5][1].style.maxWidth, '160px');

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

  // The entry-width slider clamps through the controller and repaints the bar.
  const widthRow = rerendered[5];
  const widthInput = widthRow[3][2];
  assert.equal(widthInput[1].type, 'range');
  assert.equal(widthInput[1].min, 64);
  assert.equal(widthInput[1].max, 320);
  assert.equal(widthInput[1].value, 160);
  widthInput[1].onChange({ target: { value: '240' } });
  assert.equal(JSON.parse(storage.get('dsh.nav-history.settings.v1')).entryWidth, 240);
  const barAfterWidth = barSlot.component({ t: (key) => key });
  assert.equal(barAfterWidth[5][1].style.maxWidth, '240px');
});

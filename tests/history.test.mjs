import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clampEntryWidth,
  clampVisible,
  entryKey,
  readLocation,
  resolvePanelLabel,
  resolveSessionLabel,
} from '../src/utils.js';
import { createHarness } from './support.mjs';

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

test('per-entry width is bounded, persisted and exposed on the bar', () => {
  assert.equal(clampEntryWidth(70), 72);
  assert.equal(clampEntryWidth(0), 64);
  assert.equal(clampEntryWidth(9999), 320);
  assert.equal(clampEntryWidth('garbage'), 160);
  assert.equal(clampEntryWidth(undefined), 160);

  const harness = createHarness({ initial: { panelId: null, sessionId: 'a' }, maxVisible: 3, entryWidth: 160 });
  harness.go({ panelId: null, sessionId: 'b' });
  assert.equal(harness.controller.getEntryWidth(), 160);
  assert.equal(harness.controller.getSnapshot().entryWidth, 160);

  assert.equal(harness.controller.setEntryWidth(240), true);
  assert.equal(harness.controller.getEntryWidth(), 240);
  assert.equal(harness.controller.getSnapshot().entryWidth, 240);
  assert.deepEqual(harness.settingsSink.at(-1), { maxVisible: 3, entryWidth: 240 });
  assert.equal(harness.controller.setEntryWidth(240), false);
  assert.equal(harness.controller.setEntryWidth(0), true);
  assert.equal(harness.controller.getEntryWidth(), 64);
  assert.equal(harness.controller.setEntryWidth(9999), true);
  assert.equal(harness.controller.getEntryWidth(), 320);
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

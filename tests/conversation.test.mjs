import assert from 'node:assert/strict';
import test from 'node:test';
import {
  adjacentTurn,
  currentTurnOf,
  findChatSurface,
  findLoadOlderButton,
  findTurnRail,
  navigateUserMessage,
  pickAdjacentMark,
  pickTurnRow,
  scrollToTurnRow,
  setMessageNavigationHost,
  turnAtAnchor,
} from '../src/conversation.js';
import { repeatDirection } from '../src/shortcuts.js';

const rect = (top, bottom, width = 800, height = bottom - top) => ({
  top,
  bottom,
  left: 0,
  right: width,
  width,
  height,
});

function fakeMark(index, active = false) {
  return {
    clicked: 0,
    getAttribute: (name) => {
      if (name === 'data-index') return String(index);
      if (name === 'aria-current') return active ? 'true' : null;
      return null;
    },
    getBoundingClientRect: () => rect(0, 400, 20),
    click() {
      this.clicked += 1;
    },
  };
}

function fakeNav(marks, visible = true) {
  return {
    getBoundingClientRect: () => (visible ? rect(0, 400, 20) : rect(0, 0, 0)),
    querySelectorAll: () => marks,
  };
}

function fakeRow(turn, top, bottom = top + 100) {
  return {
    getAttribute: () => String(turn),
    getBoundingClientRect: () => rect(top, bottom),
  };
}

function fakeScrollport(rows, options = {}) {
  return {
    scrollTop: options.scrollTop ?? 0,
    lastScroll: null,
    getBoundingClientRect: () => rect(0, 600),
    querySelectorAll: (selector) => {
      if (selector === '[data-chat-flow]') return options.flows ?? [];
      if (selector === 'button' || selector.includes('_older')) return [];
      return rows;
    },
    scrollTo(settings) {
      this.lastScroll = settings;
    },
  };
}

function fakeDoc({ navs = [], ports = [], flows = [] } = {}) {
  return {
    querySelectorAll: (selector) => {
      if (selector === 'nav') return navs;
      if (selector === '[data-chat-flow]') return flows;
      if (selector === 'button' || selector.includes('_older')) return [];
      return ports;
    },
  };
}

function fakeOlderButton(disabled = false) {
  return {
    tagName: 'BUTTON',
    disabled,
    clicked: 0,
    click() {
      this.clicked += 1;
    },
  };
}

function fakeFlow(button) {
  const older = {
    tagName: 'DIV',
    children: [button],
    hasAttribute: () => false,
  };
  return { children: [older] };
}

test('pickAdjacentMark steps one index and stops at both ends', () => {
  assert.equal(pickAdjacentMark([0, 1, 2], 1, 'up'), 0);
  assert.equal(pickAdjacentMark([0, 1, 2], 1, 'down'), 2);
  assert.equal(pickAdjacentMark([0, 1, 2], 0, 'up'), null);
  assert.equal(pickAdjacentMark([0, 1, 2], 2, 'down'), null);
  assert.equal(pickAdjacentMark([], 0, 'down'), null);
});

test('findTurnRail returns the marks of the painted rail in index order', () => {
  const marks = [fakeMark(2), fakeMark(0), fakeMark(1, true)];
  const rail = findTurnRail(fakeDoc({ navs: [fakeNav(marks)] }));
  assert.ok(rail);
  assert.deepEqual(rail.marks.map((mark) => mark.index), [0, 1, 2]);
});

test('navigateUserMessage clicks the adjacent mark like a mouse click on the rail', () => {
  const up = fakeMark(0);
  const active = fakeMark(1, true);
  const down = fakeMark(2);
  const doc = fakeDoc({ navs: [fakeNav([up, active, down])] });

  assert.equal(navigateUserMessage('down', doc), true);
  assert.equal(down.clicked, 1);
  assert.equal(up.clicked, 0);
  assert.equal(active.clicked, 0);

  assert.equal(navigateUserMessage('up', doc), true);
  assert.equal(up.clicked, 1);
});

test('a hidden rail (narrow layout) falls back to transcript scrolling', () => {
  const hiddenNav = fakeNav([fakeMark(0, true), fakeMark(1)], false);
  const rows = [fakeRow(1, 0), fakeRow(2, 150, 400)];
  const scrollport = fakeScrollport(rows);
  const doc = fakeDoc({ navs: [hiddenNav], ports: [scrollport] });

  // The rail is display:none in a narrow container, so findTurnRail sees nothing.
  assert.equal(findTurnRail(doc), null);
  assert.equal(navigateUserMessage('down', doc), true);
  assert.deepEqual(scrollport.lastScroll, { top: 126, behavior: 'smooth' });
  assert.equal(navigateUserMessage('up', doc), false);
});

test('turnAtAnchor and adjacentTurn pick the visible and neighbouring turns', () => {
  const rows = [
    { turn: 1, top: 0, bottom: 100 },
    { turn: 2, top: 150, bottom: 400 },
    { turn: 3, top: 450, bottom: 600 },
  ];
  assert.equal(turnAtAnchor(rows, 20), 1);
  assert.equal(turnAtAnchor(rows, 160), 2);
  assert.equal(turnAtAnchor(rows, 420), 3);
  assert.equal(turnAtAnchor(rows, 900), 3);
  assert.equal(turnAtAnchor([], 10), null);

  assert.equal(adjacentTurn([1, 2, 3], 2, 'up'), 1);
  assert.equal(adjacentTurn([1, 2, 3], 2, 'down'), 3);
  assert.equal(adjacentTurn([1, 2, 3], 1, 'up'), null);
  assert.equal(adjacentTurn([1, 2, 3], 3, 'down'), null);
});

test('findChatSurface dedupes rows; pickTurnRow and scrollToTurnRow align the target', () => {
  const rows = [fakeRow(2, 150, 400), fakeRow(1, 0), fakeRow(2, 150, 400)];
  const scrollport = fakeScrollport(rows, { scrollTop: 100 });
  const surface = findChatSurface(fakeDoc({ ports: [scrollport] }));
  assert.ok(surface);
  assert.deepEqual(surface.rows.map((item) => item.turn), [1, 2]);
  assert.equal(currentTurnOf(surface), 1);

  const next = pickTurnRow(surface, 'down');
  assert.equal(next.turn, 2);
  assert.equal(scrollToTurnRow(surface, next), true);
  assert.deepEqual(scrollport.lastScroll, { top: 226, behavior: 'smooth' });
});

test('at the earliest loaded turn, Up prefers the session loadOlder bridge', () => {
  let calls = 0;
  setMessageNavigationHost({
    loadOlder: () => {
      calls += 1;
      return true;
    },
  });
  try {
    const button = fakeOlderButton();
    const scrollport = fakeScrollport([fakeRow(5, 0, 100)], { flows: [fakeFlow(button)] });
    const doc = fakeDoc({ ports: [scrollport] });
    assert.equal(navigateUserMessage('up', doc), true);
    assert.equal(calls, 1);
    // The DOM fallback is not touched when the session bridge accepted the call.
    assert.equal(button.clicked, 0);
  } finally {
    setMessageNavigationHost(null);
  }
});

test('at the earliest loaded turn, Up clicks the chat load-older control', () => {
  const button = fakeOlderButton();
  const scrollport = fakeScrollport([fakeRow(5, 0, 100)], { flows: [fakeFlow(button)] });
  const doc = fakeDoc({ ports: [scrollport] });

  assert.equal(findLoadOlderButton(doc, scrollport), button);
  assert.equal(navigateUserMessage('up', doc), true);
  assert.equal(button.clicked, 1);

  // While loading (disabled) or when no more history exists, it is a no-op.
  const disabledScrollport = fakeScrollport([fakeRow(5, 0, 100)], { flows: [fakeFlow(fakeOlderButton(true))] });
  const disabledDoc = fakeDoc({ ports: [disabledScrollport] });
  assert.equal(navigateUserMessage('up', disabledDoc), false);
  assert.equal(navigateUserMessage('up', fakeDoc({ ports: [fakeScrollport([fakeRow(5, 0, 100)])] })), false);
});

test('repeatDirection only accepts key repeats of the message shortcuts', () => {
  const rows = [
    { id: 'nav-history.prev-message', binding: { code: 'ArrowUp', modifiers: ['alt'] } },
    { id: 'nav-history.next-message', binding: { code: 'ArrowDown', modifiers: ['alt'] } },
  ];
  assert.equal(repeatDirection(rows, { kind: 'keyboard', repeat: true, code: 'ArrowUp', alt: true }), 'up');
  assert.equal(repeatDirection(rows, { kind: 'keyboard', repeat: true, code: 'ArrowDown', alt: true }), 'down');
  assert.equal(repeatDirection(rows, { kind: 'keyboard', repeat: false, code: 'ArrowUp', alt: true }), null);
  assert.equal(repeatDirection(rows, { kind: 'keyboard', repeat: true, code: 'ArrowUp' }), null);
  assert.equal(repeatDirection(rows, { kind: 'keyboard', repeat: true, code: 'ArrowUp', alt: true, shift: true }), null);
  assert.equal(repeatDirection(rows, { kind: 'keyboard', repeat: true, code: 'KeyA', alt: true }), null);
  assert.equal(repeatDirection([], { kind: 'keyboard', repeat: true, code: 'ArrowUp', alt: true }), null);
});

test('navigateUserMessage reports false without a rail or transcript', () => {
  assert.equal(navigateUserMessage('down', fakeDoc({})), false);
  assert.equal(navigateUserMessage('down', { querySelectorAll: () => [] }), false);
  assert.equal(navigateUserMessage('down', null), false);
});

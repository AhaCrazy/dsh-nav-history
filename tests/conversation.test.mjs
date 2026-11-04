import assert from 'node:assert/strict';
import test from 'node:test';
import {
  adjacentTurn,
  currentTurnOf,
  findChatSurface,
  navigateUserMessage,
  pickTurn,
  scrollToTurn,
  turnAtAnchor,
} from '../src/conversation.js';

const rect = (top, bottom, left = 0, right = 800) => ({
  top,
  bottom,
  left,
  right,
  width: right - left,
  height: bottom - top,
});

function fakeRow(turn, top, bottom) {
  const classes = new Set();
  return {
    turn,
    row: {
      getBoundingClientRect: () => rect(top, bottom),
      getAttribute: () => String(turn),
      classList: {
        add: (name) => classes.add(name),
        remove: (name) => classes.delete(name),
      },
      classes,
    },
  };
}

function fakeSurface(rows, options = {}) {
  const scrollport = {
    scrollTop: options.scrollTop ?? 0,
    lastScroll: null,
    getBoundingClientRect: () => rect(0, 600),
    scrollTo(settings) {
      this.lastScroll = settings;
    },
  };
  return { scrollport, rows };
}

test('turnAtAnchor finds the row crossing the top edge and clamps at the end', () => {
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
});

test('adjacentTurn is null at both ends and picks the nearest neighbour otherwise', () => {
  assert.equal(adjacentTurn([1, 2, 3], 2, 'up'), 1);
  assert.equal(adjacentTurn([1, 2, 3], 2, 'down'), 3);
  assert.equal(adjacentTurn([1, 2, 3], 1, 'up'), null);
  assert.equal(adjacentTurn([1, 2, 3], 3, 'down'), null);
});

test('pickTurn and scrollToTurn align the target row below the scrollport top', () => {
  const surface = fakeSurface([fakeRow(1, 0, 100), fakeRow(2, 150, 400), fakeRow(3, 450, 600)], { scrollTop: 100 });
  assert.equal(currentTurnOf(surface), 1);
  assert.equal(pickTurn(surface, 'up'), null);
  const next = pickTurn(surface, 'down');
  assert.equal(next.turn, 2);

  assert.equal(scrollToTurn(surface, next), true);
  assert.deepEqual(surface.scrollport.lastScroll, { top: 226, behavior: 'smooth' });
  assert.ok(next.row.classes.has('dnh-turn-flash'));
});

test('findChatSurface dedupes rows and skips empty or unrendered scrollports', () => {
  const rows = [fakeRow(2, 10, 200), fakeRow(1, 0, 100), fakeRow(2, 10, 200)];
  const scrollport = {
    getBoundingClientRect: () => rect(0, 600),
    querySelectorAll: () => rows.map((item) => item.row),
  };
  const emptyPort = {
    getBoundingClientRect: () => rect(0, 600),
    querySelectorAll: () => [],
  };
  const doc = { querySelectorAll: () => [emptyPort, scrollport] };
  const surface = findChatSurface(doc);
  assert.ok(surface);
  assert.deepEqual(surface.rows.map((item) => item.turn), [1, 2]);
});

test('navigateUserMessage moves to the next turn and reports when there is no target', () => {
  const rows = [fakeRow(1, 0, 100), fakeRow(2, 150, 400)];
  const scrollport = {
    scrollTop: 0,
    lastScroll: null,
    getBoundingClientRect: () => rect(0, 600),
    querySelectorAll: () => rows.map((item) => item.row),
    scrollTo(settings) {
      this.lastScroll = settings;
    },
  };
  const doc = { querySelectorAll: () => [scrollport] };
  assert.equal(navigateUserMessage('down', doc), true);
  assert.equal(scrollport.lastScroll.top, 126);
  assert.equal(navigateUserMessage('up', doc), false);
  assert.equal(navigateUserMessage('down', { querySelectorAll: () => [] }), false);
});

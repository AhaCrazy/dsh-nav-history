import assert from 'node:assert/strict';
import test from 'node:test';
import { findTurnRail, navigateUserMessage, pickAdjacentMark } from '../src/conversation.js';

const rect = (width = 40, height = 400) => ({
  top: 0,
  left: 0,
  right: width,
  bottom: height,
  width,
  height,
});

function fakeMark(index, active = false) {
  const mark = {
    clicked: 0,
    getAttribute: (name) => {
      if (name === 'data-index') return String(index);
      if (name === 'aria-current') return active ? 'true' : null;
      return null;
    },
    getBoundingClientRect: () => rect(),
    click() {
      this.clicked += 1;
    },
  };
  return mark;
}

function fakeRail(marks) {
  const nav = {
    getBoundingClientRect: () => rect(),
    querySelectorAll: () => marks,
  };
  return { doc: { querySelectorAll: () => [nav] }, nav, marks };
}

test('pickAdjacentMark steps one index and stops at both ends', () => {
  assert.equal(pickAdjacentMark([0, 1, 2], 1, 'up'), 0);
  assert.equal(pickAdjacentMark([0, 1, 2], 1, 'down'), 2);
  assert.equal(pickAdjacentMark([0, 1, 2], 0, 'up'), null);
  assert.equal(pickAdjacentMark([0, 1, 2], 2, 'down'), null);
  assert.equal(pickAdjacentMark([], 0, 'down'), null);
});

test('findTurnRail returns the marks of the visible rail in index order', () => {
  const { doc, marks } = fakeRail([fakeMark(2), fakeMark(0), fakeMark(1, true)]);
  const rail = findTurnRail(doc);
  assert.ok(rail);
  assert.deepEqual(rail.marks.map((mark) => mark.index), [0, 1, 2]);
  assert.deepEqual(rail.marks.map((mark) => mark.button), marks.slice().sort((a, b) => Number(a.getAttribute('data-index')) - Number(b.getAttribute('data-index'))));
});

test('findTurnRail ignores navs without marks and returns null without a document', () => {
  const emptyNav = { getBoundingClientRect: () => rect(), querySelectorAll: () => [] };
  assert.equal(findTurnRail({ querySelectorAll: () => [emptyNav] }), null);
  assert.equal(findTurnRail(null), null);
});

test('navigateUserMessage clicks the adjacent mark like a mouse click on the rail', () => {
  const up = fakeMark(0);
  const active = fakeMark(1, true);
  const down = fakeMark(2);
  const { doc } = fakeRail([up, active, down]);

  assert.equal(navigateUserMessage('down', doc), true);
  assert.equal(down.clicked, 1);
  assert.equal(up.clicked, 0);
  assert.equal(active.clicked, 0);

  assert.equal(navigateUserMessage('up', doc), true);
  assert.equal(up.clicked, 1);
});

test('navigateUserMessage reports false when there is no rail, no active mark or no neighbour', () => {
  assert.equal(navigateUserMessage('down', { querySelectorAll: () => [] }), false);

  const noActive = fakeRail([fakeMark(0), fakeMark(1)]);
  assert.equal(navigateUserMessage('down', noActive.doc), false);

  const onlyOne = fakeRail([fakeMark(0, true)]);
  assert.equal(navigateUserMessage('down', onlyOne.doc), false);

  const first = fakeRail([fakeMark(0, true), fakeMark(1)]);
  assert.equal(navigateUserMessage('up', first.doc), false);
});

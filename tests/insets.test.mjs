import assert from 'node:assert/strict';
import test from 'node:test';
import { measureBarInsets, installBarInsets } from '../src/insets.js';

// Bottom bar is 0..1440 in a 1440px viewport, 30px tall, sitting at the bottom.
const VIEWPORT_WIDTH = 1440;
const BAR = makeRect(0, VIEWPORT_WIDTH);

function makeRect(left, right, top = 700, bottom = 730) {
  return { left, right, top, bottom, width: right - left, height: bottom - top };
}

function makeStyle() {
  const values = new Map();
  return {
    values,
    getPropertyValue: (key) => (values.has(key) ? values.get(key) : ''),
    setProperty: (key, value) => values.set(key, String(value)),
  };
}

function makeElement(rect) {
  return { parentNode: null, getBoundingClientRect: () => rect };
}

function makeBar(rect, doc) {
  return {
    parentNode: null,
    ownerDocument: doc,
    style: makeStyle(),
    getBoundingClientRect: () => rect,
  };
}

/** A document stub: `hit` decides what is painted at a point. */
function makeDoc({ column = null, hit = () => null } = {}) {
  return {
    elementFromPoint: (x, y) => hit(x, y),
    querySelector: (selector) => (selector === '[class*="_centerCol"]' ? column : null),
    defaultView: null,
  };
}

/** Left overlay over 0..edge (ds-bot's fixed left column), bar elsewhere. */
function leftOverlayHit(bar, edge) {
  const overlay = makeElement(makeRect(0, edge, 0, 800));
  return (x) => (x < edge ? overlay : bar);
}

test('a bar that is not laid out keeps both insets at zero', () => {
  const doc = makeDoc({ column: makeElement(makeRect(240, VIEWPORT_WIDTH)) });
  const bar = makeBar(makeRect(0, 0), doc);
  bar.parentNode = null;
  assert.deepEqual(measureBarInsets(bar), { left: 0, right: 0 });
  assert.deepEqual(measureBarInsets(null), { left: 0, right: 0 });
});

test('a shifted main column alone does not move the bar (native sidebar)', () => {
  // The native sidebar is a column above the bottom row: the bar is still
  // reachable at its left edge, so the content must not shift.
  const doc = makeDoc({ column: makeElement(makeRect(240, VIEWPORT_WIDTH)) });
  const bar = makeBar(BAR, doc);
  doc.elementFromPoint = () => bar;
  assert.deepEqual(measureBarInsets(bar), { left: 0, right: 0 });
});

test('the bar pads in by the main column under a covering left overlay (ds-bot open)', () => {
  const doc = makeDoc({ column: makeElement(makeRect(260, VIEWPORT_WIDTH)) });
  const bar = makeBar(BAR, doc);
  doc.elementFromPoint = leftOverlayHit(bar, 260);
  assert.deepEqual(measureBarInsets(bar), { left: 260, right: 0 });
});

test('the rail-width left column maps to its own inset', () => {
  const doc = makeDoc({ column: makeElement(makeRect(88, VIEWPORT_WIDTH)) });
  const bar = makeBar(BAR, doc);
  doc.elementFromPoint = leftOverlayHit(bar, 88);
  assert.deepEqual(measureBarInsets(bar), { left: 88, right: 0 });
});

test('a covering right panel pads in from the right edge', () => {
  const doc = makeDoc({ column: makeElement(makeRect(0, 1200)) });
  const bar = makeBar(BAR, doc);
  const overlay = makeElement(makeRect(1200, VIEWPORT_WIDTH, 0, 800));
  doc.elementFromPoint = (x) => (x > 1200 ? overlay : bar);
  assert.deepEqual(measureBarInsets(bar), { left: 0, right: 240 });
});

test('both overlays open at once are measured independently', () => {
  const doc = makeDoc({ column: makeElement(makeRect(260, 1200)) });
  const bar = makeBar(BAR, doc);
  const left = makeElement(makeRect(0, 260, 0, 800));
  const right = makeElement(makeRect(1200, VIEWPORT_WIDTH, 0, 800));
  doc.elementFromPoint = (x) => (x < 260 ? left : x > 1200 ? right : bar);
  assert.deepEqual(measureBarInsets(bar), { left: 260, right: 240 });
});

test('an uncovered bar is never widened by a missing or moved column', () => {
  const doc = makeDoc(); // no main column at all
  const bar = makeBar(BAR, doc);
  doc.elementFromPoint = leftOverlayHit(bar, 260);
  assert.deepEqual(measureBarInsets(bar), { left: 0, right: 0 });
});

test('a host mask over the whole row leaves the bar untouched', () => {
  // Bar is 0..400, the mask covers both edges: squeezing would empty it.
  const barRect = makeRect(0, 400);
  const doc = makeDoc({ column: makeElement(makeRect(350, 380)) });
  const bar = makeBar(barRect, doc);
  const mask = makeElement(makeRect(0, 400, 0, 800));
  doc.elementFromPoint = () => mask;
  assert.deepEqual(measureBarInsets(bar), { left: 0, right: 0 });
});

test('a covering element inside the bar itself is not coverage', () => {
  const doc = makeDoc({ column: makeElement(makeRect(260, VIEWPORT_WIDTH)) });
  const bar = makeBar(BAR, doc);
  const child = { parentNode: bar, getBoundingClientRect: () => makeRect(0, 24) };
  doc.elementFromPoint = () => child;
  assert.deepEqual(measureBarInsets(bar), { left: 0, right: 0 });
});

test('installBarInsets writes the variables, follows resizes and cleans up', () => {
  const state = { covered: true, edge: 260 };
  const listeners = new Map();
  const doc = makeDoc({ column: makeElement(makeRect(260, VIEWPORT_WIDTH)) });
  doc.defaultView = {
    requestAnimationFrame: (callback) => {
      callback();
      return 1;
    },
    cancelAnimationFrame: () => {},
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
  };
  const bar = makeBar(BAR, doc);
  doc.elementFromPoint = (x) => (state.covered && x < state.edge ? makeElement(makeRect(0, state.edge, 0, 800)) : bar);

  const dispose = installBarInsets(bar);
  assert.equal(typeof dispose, 'function');
  assert.equal(bar.style.getPropertyValue('--dnh-inset-left'), '260px');
  assert.equal(bar.style.getPropertyValue('--dnh-inset-right'), '0px');
  assert.ok(listeners.has('resize'));

  // ds-bot collapses: the overlay is gone, the inset must fall back to zero.
  state.covered = false;
  listeners.get('resize')();
  assert.equal(bar.style.getPropertyValue('--dnh-inset-left'), '0px');

  // After unmount nothing may keep writing.
  dispose();
  assert.equal(listeners.has('resize'), false);
  state.covered = true;
  assert.equal(bar.style.getPropertyValue('--dnh-inset-left'), '0px');
});

test('installBarInsets is a no-op without a document', () => {
  const dispose = installBarInsets({ getBoundingClientRect: () => makeRect(0, 100) });
  assert.equal(typeof dispose, 'function');
  dispose();
  assert.deepEqual(measureBarInsets({ getBoundingClientRect: () => makeRect(0, 100) }), { left: 0, right: 0 });
});

/** An element whose rect is read through a getter, so tests can move it. */
function makeDynamicElement(getRect) {
  return { parentNode: null, getBoundingClientRect: () => getRect() };
}

/** A window stub whose animation frames run only when the test drains them. */
function makeQueuedView() {
  const queue = [];
  const listeners = new Map();
  let nextId = 1;
  const view = {
    requestAnimationFrame(callback) {
      const id = nextId;
      nextId += 1;
      queue.push({ id, callback });
      return id;
    },
    cancelAnimationFrame(id) {
      const at = queue.findIndex((item) => item.id === id);
      if (at >= 0) queue.splice(at, 1);
    },
    addEventListener(name, callback) {
      listeners.set(name, callback);
    },
    removeEventListener(name) {
      listeners.delete(name);
    },
  };
  const drain = (limit = 40) => {
    let ran = 0;
    while (queue.length > 0 && ran < limit) {
      ran += 1;
      const item = queue.shift();
      item.callback();
    }
    return ran;
  };
  return { view, listeners, drain };
}

/** Record MutationObserver constructions and let the test fire their callback. */
function installMutationStub() {
  const observers = [];
  const saved = globalThis.MutationObserver;
  class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.target = null;
      this.options = null;
      this.disconnected = false;
      observers.push(this);
    }
    observe(target, options) {
      this.target = target;
      this.options = options;
    }
    disconnect() {
      this.disconnected = true;
    }
  }
  globalThis.MutationObserver = FakeMutationObserver;
  return {
    observers,
    restore() {
      if (saved === undefined) delete globalThis.MutationObserver;
      else globalThis.MutationObserver = saved;
    },
  };
}

/** Controlled clock so throttles and settle windows are deterministic. */
function installFakeClock(start = 10000) {
  const real = Date.now;
  let now = start;
  Date.now = () => now;
  return {
    tick(ms) {
      now += ms;
      return now;
    },
    restore() {
      Date.now = real;
    },
  };
}

function makeShellDoc(view, column, hit) {
  const doc = makeDoc({ column });
  doc.defaultView = view;
  doc.documentElement = {};
  doc.elementFromPoint = hit;
  return doc;
}

test('an overlay appearing with no size change is measured (Agent <-> Bot switch)', () => {
  // The failure this covers: the bar and the main column keep their size, only
  // a fixed overlay appears. ResizeObserver never fires for that, so the
  // mutation path has to do the work.
  const clock = installFakeClock();
  const mutations = installMutationStub();
  try {
    const state = { covered: false };
    const { view, drain } = makeQueuedView();
    const bar = makeBar(BAR, null);
    const column = makeDynamicElement(() => makeRect(260, VIEWPORT_WIDTH));
    const doc = makeShellDoc(view, column, (x) => (
      state.covered && x < 260 ? makeElement(makeRect(0, 260, 0, 800)) : bar
    ));
    bar.ownerDocument = doc;

    const dispose = installBarInsets(bar);
    drain(5);
    // Agent mode: nothing covers the bar, so no inset — even though the
    // native sidebar already pushes the main column in by 260.
    assert.equal(bar.style.getPropertyValue('--dnh-inset-left'), '0px');

    const observer = mutations.observers[0];
    assert.ok(observer);
    assert.equal(observer.target, doc.documentElement);
    assert.equal(observer.options.childList, true);
    assert.equal(observer.options.subtree, true);
    assert.equal(observer.options.attributes, true);
    assert.ok(Array.isArray(observer.options.attributeFilter));

    // Bot mode: the left column appears, nothing resizes.
    state.covered = true;
    clock.tick(200);
    observer.callback([]);
    drain(5);
    assert.equal(bar.style.getPropertyValue('--dnh-inset-left'), '260px');

    // Back to Agent mode: the inset must be cleared, not left behind.
    state.covered = false;
    clock.tick(900);
    observer.callback([]);
    drain(5);
    assert.equal(bar.style.getPropertyValue('--dnh-inset-left'), '0px');

    dispose();
  } finally {
    mutations.restore();
    clock.restore();
  }
});

test('the settle burst follows the slide after the mutation has stopped', () => {
  // Bot mode inserts the overlay, then the content column slides in with a CSS
  // transition while no further mutation fires; the burst must land the inset.
  const clock = installFakeClock();
  const mutations = installMutationStub();
  try {
    const state = { columnLeft: 0 };
    const { view, drain } = makeQueuedView();
    const bar = makeBar(BAR, null);
    const column = makeDynamicElement(() => makeRect(state.columnLeft, VIEWPORT_WIDTH));
    const doc = makeShellDoc(view, column, (x) => (x < 260 ? makeElement(makeRect(0, 260, 0, 800)) : bar));
    bar.ownerDocument = doc;

    const dispose = installBarInsets(bar);
    drain(5);
    // Covered, but the column has not slid yet: no inset to apply.
    assert.equal(bar.style.getPropertyValue('--dnh-inset-left'), '0px');

    const observer = mutations.observers[0];
    observer.callback([]);
    drain(2);
    assert.equal(bar.style.getPropertyValue('--dnh-inset-left'), '0px');

    // The slide finishes with no mutation at all.
    state.columnLeft = 260;
    drain(40);
    assert.equal(bar.style.getPropertyValue('--dnh-inset-left'), '260px');

    dispose();
  } finally {
    mutations.restore();
    clock.restore();
  }
});

test('the mutation observer stops with the bar', () => {
  const mutations = installMutationStub();
  try {
    const { view } = makeQueuedView();
    const bar = makeBar(BAR, null);
    const doc = makeShellDoc(view, makeElement(makeRect(0, VIEWPORT_WIDTH)), () => bar);
    bar.ownerDocument = doc;

    const dispose = installBarInsets(bar);
    const observer = mutations.observers[0];
    assert.ok(observer);
    dispose();
    assert.equal(observer.disconnected, true);
  } finally {
    mutations.restore();
  }
});

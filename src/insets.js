// Bottom-bar insets: keep the bar's content clear of fixed overlays that cover
// the shell's edges (currently ds-bot's portalled left column, which is
// `position: fixed` over the frame and only shifts the main column).
//
// The host renders `shell.bottom` as a full-width row below the three columns,
// so when something covers the viewport's left/right edge it covers our bar
// too. We measure, do not guess: the bar keeps its full background, and its
// content is padded in by the main column's inset. When no overlay covers the
// bar (ds-bot absent, or the native sidebar, which is a column above the row),
// both insets stay 0 and the bar looks exactly as before.
//
// ResizeObserver alone is not enough: ds-bot's Agent <-> Bot surface switch
// inserts a fixed overlay without changing the size of the bar or the main
// column, and it may even replace the column element. Mutations and a short
// settle burst after them cover that path; the burst follows the slide
// animation even when nothing mutates any more.

// The main content column. It starts where the shell's sidebar ends, so its
// edge is the visible edge of the content area, whatever overlay produced it.
const BAR_INSET_SELECTOR = '[class*="_centerCol"]';
// Leave at least this much bar for its own content; anything more than that
// covered means a host mask (drawer) is over the whole row and we stay put.
const BAR_INSET_MIN_CONTENT = 64;
// How far from the bar's edge to probe for a covering element.
const BAR_INSET_EDGE = 2;
// After a mutation, keep re-measuring for this long so slide animations land.
const BAR_INSET_SETTLE_MS = 450;
// ...but never more than this many frames, so a stalled clock cannot spin.
const BAR_INSET_SETTLE_FRAMES = 30;
// Mutations are coalesced: one measurement per frame at most, and a trailing
// measurement when a burst of mutations keeps the throttle closed.
const BAR_INSET_MUTATION_GAP_MS = 120;
// A mutation-driven settle burst is not restarted more often than this, so an
// always-busy transcript does not keep the burst loop running forever.
const BAR_INSET_BURST_GAP_MS = 800;
// Attributes that signal a surface/overlay change without any size change.
const BAR_INSET_ATTRIBUTE_FILTER = [
  'class',
  'data-left',
  'data-sidebar-collapsed',
  'data-sidebar-drawer',
  'data-animating',
];

function barReadRect(element) {
  try {
    const rect = element && typeof element.getBoundingClientRect === 'function'
      ? element.getBoundingClientRect()
      : null;
    if (!rect || !(rect.width > 0) || !(rect.height > 0)) return null;
    return rect;
  } catch (error) {
    return null;
  }
}

function barOwnerDocument(bar) {
  if (bar && bar.ownerDocument) return bar.ownerDocument;
  return typeof document === 'undefined' ? null : document;
}

function barView(doc) {
  if (doc && doc.defaultView) return doc.defaultView;
  return typeof window === 'undefined' ? null : window;
}

/** Is the point at (x, y) painted by anything other than the bar? */
function barPointCovered(bar, doc, x, y) {
  if (!doc || typeof doc.elementFromPoint !== 'function') return false;
  let hit = null;
  try {
    hit = doc.elementFromPoint(x, y);
  } catch (error) {
    return false;
  }
  if (!hit) return false;
  let node = hit;
  while (node) {
    if (node === bar) return false;
    node = node.parentNode || null;
  }
  return true;
}

/** The bottom row that owns `shell.bottom`; the bar sits inside it. */
function barBottomRow(bar) {
  let node = bar && bar.parentElement ? bar.parentElement : null;
  for (let hop = 0; node && hop < 8; hop += 1) {
    if (typeof node.hasAttribute === 'function' && node.hasAttribute('data-shell-bottom')) return node;
    node = node.parentElement || null;
  }
  return null;
}

function barColumnInFrame(frame) {
  if (!frame || !frame.children) return null;
  try {
    for (const child of frame.children) {
      if (child && typeof child.className === 'string' && child.className.includes('_centerCol')) return child;
    }
  } catch (error) {
    // fall through to the document query
  }
  return null;
}

/**
 * Resolve the main column. Normally it is a sibling of the bar's bottom row
 * inside the shell frame, so this walk is short; the document query is the
 * fallback for a host layout we do not recognise.
 */
function barColumn(doc, bar) {
  const bottomRow = barBottomRow(bar);
  const frame = bottomRow ? bottomRow.parentElement : null;
  const own = barColumnInFrame(frame);
  if (own) return own;
  if (!doc || typeof doc.querySelector !== 'function') return null;
  try {
    return doc.querySelector(BAR_INSET_SELECTOR);
  } catch (error) {
    return null;
  }
}

function barClampInset(value, span) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(value, Math.max(0, span));
}

/**
 * One measurement pass: how far the bar's content must move in from each edge.
 * Returns { left: 0, right: 0 } whenever the answer is not confidently known
 * (no bar rect, no document, no covering edge, no main column), so a selector
 * that lands nowhere can never narrow or jitter the bar.
 */
function measureBarInsets(bar) {
  const empty = { left: 0, right: 0 };
  const barRect = barReadRect(bar);
  if (barRect === null) return empty;
  const doc = barOwnerDocument(bar);
  if (!doc) return empty;

  const y = barRect.top + barRect.height / 2;
  const coveredLeft = barPointCovered(bar, doc, barRect.left + BAR_INSET_EDGE, y);
  const coveredRight = barPointCovered(bar, doc, barRect.right - BAR_INSET_EDGE, y);
  if (!coveredLeft && !coveredRight) return empty;

  const columnRect = barReadRect(barColumn(doc, bar));
  if (columnRect === null) return empty;

  const left = coveredLeft ? barClampInset(columnRect.left - barRect.left, barRect.width) : 0;
  const right = coveredRight ? barClampInset(barRect.right - columnRect.right, barRect.width) : 0;
  // Wholly masked (host drawer): do not squeeze the bar against the mask.
  if (left + right > barRect.width - BAR_INSET_MIN_CONTENT) return empty;
  return { left, right };
}

function barWriteInset(bar, name, value) {
  const next = value > 0 ? `${Math.round(value)}px` : '0px';
  try {
    const style = bar.style;
    if (!style || typeof style.setProperty !== 'function') return;
    if (typeof style.getPropertyValue === 'function' && style.getPropertyValue(name) === next) return;
    style.setProperty(name, next);
  } catch (error) {
    // Style writes are best effort; a failed write keeps the CSS fallback.
  }
}

/** Track the insets while the bar is mounted; returns the disposer. */
function installBarInsets(bar) {
  const noop = () => {};
  if (!bar) return noop;
  const doc = barOwnerDocument(bar);
  if (!doc) return noop;
  const view = barView(doc);
  if (!view) return noop;

  const raf = typeof view.requestAnimationFrame === 'function'
    ? view.requestAnimationFrame.bind(view)
    : (callback) => setTimeout(callback, 16);
  const cancel = typeof view.cancelAnimationFrame === 'function'
    ? view.cancelAnimationFrame.bind(view)
    : (id) => clearTimeout(id);

  let frame = null;
  let pending = false;
  let stopped = false;
  let watchedColumn = null;
  let resizeObserver = null;
  let mutationObserver = null;
  let lastInsets = null;
  let lastMutationAt = 0;
  let lastBurstAt = 0;
  let trailingTimer = null;
  let burstFrame = null;
  let burstFrames = 0;
  let burstUntil = 0;

  const flush = () => {
    if (stopped) return;
    const column = barColumn(doc, bar);
    if (column !== watchedColumn) {
      watchedColumn = column;
      if (resizeObserver) {
        try {
          resizeObserver.disconnect();
        } catch (error) {
          // ignore
        }
        resizeObserver = null;
      }
      if (typeof ResizeObserver === 'function') {
        try {
          resizeObserver = new ResizeObserver(() => schedule());
          resizeObserver.observe(bar);
          if (column) resizeObserver.observe(column);
        } catch (error) {
          resizeObserver = null;
        }
      }
    }
    const insets = measureBarInsets(bar);
    // The first pass only records a baseline: nothing has moved yet, so a
    // burst would be wasted (the ResizeObserver still covers first layout).
    const changed = lastInsets !== null
      && (lastInsets.left !== insets.left || lastInsets.right !== insets.right);
    lastInsets = insets;
    barWriteInset(bar, '--dnh-inset-left', insets.left);
    barWriteInset(bar, '--dnh-inset-right', insets.right);
    if (changed) armSettle(false);
  };

  const schedule = () => {
    if (stopped || pending) return;
    pending = true;
    const run = () => {
      pending = false;
      frame = null;
      flush();
    };
    try {
      frame = raf(run);
    } catch (error) {
      pending = false;
      frame = null;
    }
  };

  /**
   * Re-measure every frame for a short window. Covers overlays that slide in
   * after the mutation that introduced them, and mode switches where nothing
   * changes size once the switch is committed.
   */
  const armSettle = (fromMutation) => {
    const now = Date.now();
    if (stopped || now < burstUntil) return;
    if (fromMutation && now - lastBurstAt < BAR_INSET_BURST_GAP_MS) return;
    lastBurstAt = now;
    burstUntil = now + BAR_INSET_SETTLE_MS;
    burstFrames = 0;
    const tick = () => {
      burstFrame = null;
      if (stopped || burstFrames >= BAR_INSET_SETTLE_FRAMES || Date.now() >= burstUntil) return;
      burstFrames += 1;
      flush();
      burstFrame = raf(tick);
    };
    burstFrame = raf(tick);
  };

  const measureAfterMutation = () => {
    lastMutationAt = Date.now();
    schedule();
    armSettle(true);
  };

  const onMutation = () => {
    if (stopped) return;
    const now = Date.now();
    if (now - lastMutationAt >= BAR_INSET_MUTATION_GAP_MS) {
      measureAfterMutation();
      return;
    }
    // Throttled: still guarantee one measurement after the burst of mutations.
    if (trailingTimer === null && typeof setTimeout === 'function') {
      trailingTimer = setTimeout(() => {
        trailingTimer = null;
        if (stopped) return;
        measureAfterMutation();
      }, BAR_INSET_MUTATION_GAP_MS);
      return;
    }
    schedule();
  };

  if (typeof view.addEventListener === 'function') {
    try {
      view.addEventListener('resize', schedule);
    } catch (error) {
      // ignore
    }
  }

  const MutationCtor = typeof MutationObserver !== 'undefined'
    ? MutationObserver
    : (view && typeof view.MutationObserver === 'function' ? view.MutationObserver : null);
  const mutationTarget = doc.documentElement || doc.body || null;
  if (MutationCtor && mutationTarget) {
    try {
      mutationObserver = new MutationCtor(onMutation);
      mutationObserver.observe(mutationTarget, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: BAR_INSET_ATTRIBUTE_FILTER,
      });
    } catch (error) {
      mutationObserver = null;
    }
  }

  schedule();

  return () => {
    stopped = true;
    if (frame !== null) {
      try {
        cancel(frame);
      } catch (error) {
        // ignore
      }
      frame = null;
    }
    if (burstFrame !== null) {
      try {
        cancel(burstFrame);
      } catch (error) {
        // ignore
      }
      burstFrame = null;
    }
    if (trailingTimer !== null && typeof clearTimeout === 'function') {
      try {
        clearTimeout(trailingTimer);
      } catch (error) {
        // ignore
      }
      trailingTimer = null;
    }
    if (resizeObserver) {
      try {
        resizeObserver.disconnect();
      } catch (error) {
        // ignore
      }
      resizeObserver = null;
    }
    if (mutationObserver) {
      try {
        mutationObserver.disconnect();
      } catch (error) {
        // ignore
      }
      mutationObserver = null;
    }
    if (typeof view.removeEventListener === 'function') {
      try {
        view.removeEventListener('resize', schedule);
      } catch (error) {
        // ignore
      }
    }
  };
}

export { measureBarInsets, installBarInsets };

/**
 * Conversation-level navigation between user messages (previous/next turn).
 *
 * Primary path: activate the neighbouring mark of DSH's own TurnNavigator rail.
 * Clicking a mark calls the chat package's internal viewport navigation, which
 * aligns precisely, updates the reading position and fetches older history for
 * unloaded turns. The rail hides itself in narrow layouts (its stylesheet uses
 * `@container (width<=900px) { .frame { display:none } }`), which is exactly
 * what happens when a sidebar is open, so a fallback is required.
 *
 * Fallback path: scroll the transcript itself. The chat list publishes one
 * `[data-chat-turn="N"]` row per turn inside `[data-conversation-scroll]`;
 * geometry tells us which turn crosses the viewport's top edge, and the next
 * row is aligned below it. It cannot fetch unloaded turns, but it keeps the
 * shortcut working when the rail is not painted.
 *
 * DOM contract used here (stable attributes, no private client service):
 *   nav > button[data-index]          turn rail marks, in turn order
 *   button[aria-current="true"]       mark of the turn currently in view
 *   [data-conversation-scroll]        transcript scrollport
 *   [data-chat-turn="N"]              one transcript row per turn
 */

const NAV_SELECTOR = 'nav';
const MARK_SELECTOR = 'button[data-index]';
const ACTIVE_ATTRIBUTE = 'aria-current';
const SCROLLPORT_SELECTOR = '[data-conversation-scroll]';
const TURN_ROW_SELECTOR = '[data-chat-turn]';
const ALIGN_OFFSET = 24;

/**
 * Host bridge filled by apply(): `loadOlder()` asks the session service for the
 * previous page, the same method the chat's own "load earlier" button calls.
 * Calling it directly is far less fragile than guessing at the button's DOM.
 */
let navigationHost = null;
let pagingInFlight = false;

export function setMessageNavigationHost(host) {
  navigationHost = host;
}

function requestEarlierPage(surface, doc) {
  if (navigationHost !== null && typeof navigationHost.loadOlder === 'function') {
    try {
      if (navigationHost.loadOlder() === true) {
        console.info('[nav-history] message navigation: request earlier via session service');
        return true;
      }
    } catch (error) {
      // fall through to the button
    }
  }
  let button = findLoadOlderButton(doc, surface.scrollport);
  if (button === null) button = findLoadOlderButton(doc);
  if (button === null) {
    console.info('[nav-history] message navigation: no load-older control found');
    return false;
  }
  if (button.disabled === true) {
    console.info('[nav-history] message navigation: load-older control is disabled');
    return false;
  }
  try {
    button.click();
    console.info('[nav-history] message navigation: request earlier via DOM button');
  } catch (error) {
    return false;
  }
  return true;
}

function rectOf(element) {
  try {
    return element.getBoundingClientRect();
  } catch (error) {
    return null;
  }
}

function isRendered(element) {
  const rect = element === null || element === undefined ? null : rectOf(element);
  return rect !== null && rect.width > 0 && rect.height > 0;
}

// ------------------------------------------------------------------ turn rail

/** Index of the mark to activate for one direction, or null at the rail's ends. */
export function pickAdjacentMark(indices, active, direction) {
  if (!Array.isArray(indices) || indices.length === 0 || !Number.isSafeInteger(active)) return null;
  const wanted = direction === 'up' ? active - 1 : active + 1;
  return indices.includes(wanted) ? wanted : null;
}

/** Locate the painted turn navigator rail and its mark buttons. */
export function findTurnRail(doc = typeof document === 'undefined' ? null : document) {
  if (!doc || typeof doc.querySelectorAll !== 'function') return null;
  let navs;
  try {
    navs = [...doc.querySelectorAll(NAV_SELECTOR)];
  } catch (error) {
    return null;
  }
  for (const nav of navs) {
    if (!isRendered(nav)) continue;
    let buttons;
    try {
      buttons = [...nav.querySelectorAll(MARK_SELECTOR)];
    } catch (error) {
      continue;
    }
    if (buttons.length === 0) continue;
    const marks = [];
    for (const button of buttons) {
      const index = Number(button.getAttribute('data-index'));
      if (!Number.isSafeInteger(index)) continue;
      marks.push({ index, button });
    }
    if (marks.length === 0) continue;
    marks.sort((left, right) => left.index - right.index);
    return { nav, marks };
  }
  return null;
}

/** Native path: click the neighbouring rail mark, like a mouse click on it. */
function navigateViaRail(direction, doc) {
  const rail = findTurnRail(doc);
  if (rail === null) return false;
  const active = rail.marks.find((mark) => mark.button.getAttribute(ACTIVE_ATTRIBUTE) === 'true');
  if (active === undefined) return false;
  const target = pickAdjacentMark(
    rail.marks.map((mark) => mark.index),
    active.index,
    direction,
  );
  if (target === null) return false;
  const mark = rail.marks.find((candidate) => candidate.index === target);
  if (mark === undefined || typeof mark.button.click !== 'function') return false;
  mark.button.click();
  return true;
}

// -------------------------------------------------------------- scroll fallback

/** Turn whose row crosses the viewport's top edge. */
export function turnAtAnchor(rows, anchorY) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  for (const row of rows) {
    if (row.bottom > anchorY) return row.turn;
  }
  return rows[rows.length - 1].turn;
}

/** Nearest turn above/below the current one; null when there is nowhere to go. */
export function adjacentTurn(turns, current, direction) {
  if (!Array.isArray(turns) || turns.length === 0 || !Number.isSafeInteger(current)) return null;
  let candidate = null;
  for (const turn of turns) {
    if (direction === 'up') {
      if (turn < current) candidate = turn;
      else break;
    } else if (turn > current) {
      return turn;
    }
  }
  return direction === 'up' ? candidate : null;
}

/** Area of a port that is actually inside the viewport; larger wins. */
function visibleArea(element) {
  const rect = rectOf(element);
  if (rect === null) return 0;
  const viewportWidth = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : rect.right;
  const viewportHeight = typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : rect.bottom;
  const width = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
  const height = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
  return width * height;
}

/** Locate the visible transcript scrollport and its rendered turn rows. */
export function findChatSurface(doc = typeof document === 'undefined' ? null : document) {
  if (!doc || typeof doc.querySelectorAll !== 'function') return null;
  let ports;
  try {
    ports = [...doc.querySelectorAll(SCROLLPORT_SELECTOR)];
  } catch (error) {
    return null;
  }
  const candidates = [];
  for (const scrollport of ports) {
    if (!isRendered(scrollport)) continue;
    const seen = new Set();
    const rows = [];
    for (const row of scrollport.querySelectorAll(TURN_ROW_SELECTOR)) {
      if (!isRendered(row)) continue;
      const turn = Number(row.getAttribute('data-chat-turn'));
      if (!Number.isSafeInteger(turn) || seen.has(turn)) continue;
      seen.add(turn);
      rows.push({ turn, row });
    }
    if (rows.length === 0) continue;
    rows.sort((left, right) => left.turn - right.turn);
    candidates.push({ scrollport, rows, area: visibleArea(scrollport) });
  }
  if (candidates.length === 0) return null;
  // Sidebar/rightbar panels can mount a second transcript; navigate the one
  // that actually occupies the viewport instead of the first DOM match.
  candidates.sort((left, right) => right.area - left.area);
  const chosen = candidates[0];
  return { scrollport: chosen.scrollport, rows: chosen.rows };
}

/** Turn row currently at the top of the scrollport. */
export function currentTurnOf(surface) {
  if (surface === null || surface === undefined) return null;
  const portRect = rectOf(surface.scrollport);
  if (portRect === null) return null;
  const anchorY = portRect.top + Math.min(ALIGN_OFFSET, Math.max(1, portRect.height * 0.1));
  const rows = surface.rows.map(({ turn, row }) => {
    const rect = rectOf(row);
    return { turn, top: rect === null ? 0 : rect.top, bottom: rect === null ? 0 : rect.bottom };
  });
  return turnAtAnchor(rows, anchorY);
}

/** The row to land on for one direction, or null when the transcript has no such turn. */
export function pickTurnRow(surface, direction) {
  if (surface === null || surface === undefined || !Array.isArray(surface.rows) || surface.rows.length === 0) {
    return null;
  }
  const current = currentTurnOf(surface);
  if (current === null) return null;
  const target = adjacentTurn(surface.rows.map((item) => item.turn), current, direction);
  if (target === null) return null;
  return surface.rows.find((item) => item.turn === target) ?? null;
}

/** Align one turn row below the scrollport's top edge. */
export function scrollToTurnRow(surface, target) {
  if (surface === null || surface === undefined || target === null || target === undefined) return false;
  const port = surface.scrollport;
  const portRect = rectOf(port);
  const rowRect = rectOf(target.row);
  if (portRect === null || rowRect === null) return false;
  const top = Math.max(0, port.scrollTop + rowRect.top - portRect.top - ALIGN_OFFSET);
  try {
    if (typeof port.scrollTo === 'function') port.scrollTo({ top, behavior: 'smooth' });
    else port.scrollTop = top;
  } catch (error) {
    try {
      port.scrollTop = top;
    } catch (ignored) {
      return false;
    }
  }
  return true;
}

/**
 * The chat's own "load earlier" control, present while more history exists.
 * Pass the surface's scrollport to stay inside the chat we are navigating;
 * other mounted transcripts (for example a side conversation) must not answer.
 */
export function findLoadOlderButton(doc = typeof document === 'undefined' ? null : document, scope = null) {
  const root = scope !== null && scope !== undefined && typeof scope.querySelectorAll === 'function' ? scope : doc;
  if (!root || typeof root.querySelectorAll !== 'function') return null;
  // The control's own CSS-module class is the most direct marker: the hashed
  // prefix changes between builds, the `_older` suffix does not.
  try {
    for (const button of root.querySelectorAll('[class*="_older"] button')) {
      if (button && button.tagName === 'BUTTON') return button;
    }
  } catch (error) {
    // fall through
  }
  let flows;
  try {
    flows = [...root.querySelectorAll('[data-chat-flow]')];
  } catch (error) {
    return null;
  }
  for (const flow of flows) {
    const children = flow && flow.children ? [...flow.children] : [];
    for (const child of children) {
      if (!child || child.tagName !== 'DIV') continue;
      // Turn rows and their wrappers live below the control; stop there.
      if (typeof child.hasAttribute === 'function' && child.hasAttribute('data-chat-turn')) break;
      const kids = child.children ? [...child.children] : [];
      if (kids.length !== 1) continue;
      const button = kids[0];
      if (button && button.tagName === 'BUTTON') return button;
    }
  }
  // Last resort: the localized label, which every shipped locale spells out.
  try {
    for (const button of root.querySelectorAll('button')) {
      const text = typeof button.textContent === 'string' ? button.textContent.trim() : '';
      if (/加载更早|Load earlier|Load older|earlier history/i.test(text)) return button;
    }
  } catch (error) {
    // fall through
  }
  return null;
}

/**
 * Keep focus where the user left it. A synthetic click can leave the clicked
 * "load earlier" control as the active element in some Electron builds, and
 * the composer then stops receiving its shortcuts until the page is clicked.
 */
function restoreFocus(doc, previous) {
  if (!previous || previous === doc.body) return;
  try {
    if (previous.isConnected === false) return;
    if (typeof previous.focus !== 'function') return;
    if (doc.activeElement === previous) return;
    previous.focus({ preventScroll: true });
  } catch (error) {
    // focus restoration is best-effort
  }
}

/** Snapshot for the console diagnostics of a message-navigation attempt. */
export function messageNavState(doc = typeof document === 'undefined' ? null : document) {
  const active = doc === null || doc === undefined ? null : doc.activeElement;
  const loadOlder = doc === null || doc === undefined ? null : findLoadOlderButton(doc);
  const surface = doc === null || doc === undefined ? null : findChatSurface(doc);
  return {
    hasFocus: doc !== null && doc !== undefined && typeof doc.hasFocus === 'function' ? doc.hasFocus() : null,
    active: active === null || active === undefined ? null : `${active.tagName ?? '?'}${active.className ? `.${String(active.className).split(' ')[0]}` : ''}`,
    rail: findTurnRail(doc) !== null,
    loadOlder: loadOlder === null ? null : loadOlder.disabled === true ? 'disabled' : 'enabled',
    scrollTop: surface === null ? null : surface.scrollport.scrollTop,
    turns: surface === null ? [] : surface.rows.map((item) => item.turn),
  };
}

/**
 * After "load earlier" prepends a page, land on the immediate predecessor of
 * the turn that was at the top before the load. MutationObserver is only used
 * in a real document; tests may omit it.
 */
function watchForPrependedTurn(doc, beforeTurn, onLanded, scope = null) {
  if (typeof MutationObserver === 'undefined') return;
  let flow = null;
  try {
    const root = scope !== null && scope !== undefined && typeof scope.querySelectorAll === 'function' ? scope : doc;
    flow = root.querySelectorAll('[data-chat-flow]')[0] ?? null;
  } catch (error) {
    flow = null;
  }
  if (flow === null) return;
  let observer = null;
  let timer = null;
  const stop = () => {
    if (observer !== null) {
      try {
        observer.disconnect();
      } catch (error) {
        // ignore
      }
      observer = null;
    }
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
  observer = new MutationObserver(() => {
    const surface = findChatSurface(doc);
    if (surface === null) return;
    const earlier = surface.rows.filter((item) => item.turn < beforeTurn);
    if (earlier.length === 0) return;
    stop();
    scrollToTurnRow(surface, earlier[earlier.length - 1]);
    if (typeof onLanded === 'function') onLanded();
  });
  observer.observe(flow, { childList: true, subtree: true });
  timer = setTimeout(stop, 15000);
}

/** At the earliest loaded turn: ask the chat to load one more page, then step. */
function loadOlderAndStep(surface, doc) {
  if (pagingInFlight) return false;
  const beforeTurn = surface.rows[0].turn;
  const previousFocus = doc.activeElement ?? null;
  const requested = requestEarlierPage(surface, doc);
  if (!requested) return false;
  if (typeof MutationObserver !== 'undefined') {
    pagingInFlight = true;
    setTimeout(() => {
      pagingInFlight = false;
    }, 15000);
  }
  try {
    console.info('[nav-history] message navigation: requesting earlier page', { beforeTurn });
  } catch (error) {
    // diagnostics are optional
  }
  restoreFocus(doc, previousFocus);
  watchForPrependedTurn(doc, beforeTurn, () => {
    pagingInFlight = false;
    restoreFocus(doc, previousFocus);
  }, surface.scrollport);
  return true;
}

/** Fallback path: scroll the transcript when the rail is not painted. */
function navigateViaScroll(direction, doc) {
  const surface = findChatSurface(doc);
  if (surface === null) return false;
  // A zero scroll offset is the top of the transcript. Rows still rendered
  // above the viewport (or stale geometry after a history prepend) must not be
  // "scrolled to" — there is nowhere to go, so ask for the previous page.
  if (direction === 'up' && surface.scrollport.scrollTop <= 0) {
    try {
      console.info('[nav-history] message navigation: at transcript top, requesting earlier page');
    } catch (error) {
      // diagnostics are optional
    }
    return loadOlderAndStep(surface, doc);
  }
  const target = pickTurnRow(surface, direction);
  if (target !== null) {
    const current = currentTurnOf(surface);
    try {
      console.info('[nav-history] message navigation: scroll', {
        direction,
        current,
        target: target.turn,
        scrollTop: surface.scrollport.scrollTop,
        rows: surface.rows.map((item) => item.turn),
      });
    } catch (error) {
      // diagnostics are optional
    }
    return scrollToTurnRow(surface, target);
  }
  // No earlier loaded turn: page one more screen of history, then land on the
  // immediate predecessor once it arrives.
  return direction === 'up' ? loadOlderAndStep(surface, doc) : false;
}

/**
 * Shortcut action: move to the previous/next user message. Prefers the native
 * turn-navigator path; falls back to transcript scrolling when the rail is
 * hidden by a narrow layout (for example with a sidebar open).
 */
export function navigateUserMessage(direction, doc) {
  const step = direction === 'up' ? 'up' : 'down';
  if (navigateViaRail(step, doc)) return true;
  const handled = navigateViaScroll(step, doc);
  if (!handled) {
    try {
      // Kept in the shipped bundle: one line per failed attempt is a cheap way
      // to tell a swallowed shortcut from a missing rail/transcript.
      console.info('[nav-history] message navigation unavailable', step, messageNavState(doc));
    } catch (error) {
      // diagnostics are optional
    }
  }
  return handled;
}

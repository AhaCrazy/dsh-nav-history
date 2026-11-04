/**
 * Conversation-level navigation: jump to the previous/next user message by
 * activating the matching mark of DSH's own turn navigator rail.
 *
 * The rail is the product's existing, supported way to move the transcript:
 * clicking a mark calls the chat package's internal viewport navigation, which
 * aligns precisely, updates the reading position, and loads older history for
 * marks whose turn is not in memory yet. Re-implementing that with scrollTop
 * arithmetic would only approximate all four.
 *
 * DOM contract used here (stable attributes, no private client service):
 *   nav > button[data-index]          one mark per known turn
 *   button[aria-current="true"]       the mark of the turn currently in view
 * Mark order follows turn order, so `activeIndex ± 1` is the neighbouring turn.
 */

const NAV_SELECTOR = 'nav';
const MARK_SELECTOR = 'button[data-index]';
const ACTIVE_ATTRIBUTE = 'aria-current';

function isRendered(element) {
  if (!element || typeof element.getBoundingClientRect !== 'function') return false;
  try {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  } catch (error) {
    return false;
  }
}

/** Index of the mark to activate for one direction, or null at the rail's ends. */
export function pickAdjacentMark(indices, active, direction) {
  if (!Array.isArray(indices) || indices.length === 0 || !Number.isSafeInteger(active)) return null;
  const wanted = direction === 'up' ? active - 1 : active + 1;
  return indices.includes(wanted) ? wanted : null;
}

/** Locate the visible turn navigator rail and its mark buttons. */
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

/**
 * Shortcut action: activate the neighbouring turn-navigator mark, i.e. the
 * exact same path a mouse click on the rail takes.
 */
export function navigateUserMessage(direction, doc) {
  const rail = findTurnRail(doc);
  if (rail === null) return false;
  const active = rail.marks.find((mark) => mark.button.getAttribute(ACTIVE_ATTRIBUTE) === 'true');
  if (active === undefined) return false;
  const target = pickAdjacentMark(
    rail.marks.map((mark) => mark.index),
    active.index,
    direction === 'up' ? 'up' : 'down',
  );
  if (target === null) return false;
  const mark = rail.marks.find((candidate) => candidate.index === target);
  if (mark === undefined || typeof mark.button.click !== 'function') return false;
  mark.button.click();
  return true;
}

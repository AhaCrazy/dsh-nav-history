/**
 * Conversation-level navigation: jump the transcript to the previous/next
 * user message by moving the chat scrollport to that turn's row.
 *
 * DSH renders every turn inside `[data-conversation-scroll]` as
 * `[data-chat-turn="N"]` rows, so no private client service is needed: the
 * published DOM is the contract here. The row for a turn starts with the
 * user's message, which is exactly the anchor the shortcut wants.
 */

export const TURN_FLASH_CLASS = 'dnh-turn-flash';
const SCROLLPORT_SELECTOR = '[data-conversation-scroll]';
const TURN_ROW_SELECTOR = '[data-chat-turn]';
const ALIGN_OFFSET = 24;
const FLASH_MS = 1400;

function isRendered(element) {
  if (
    !element
    || typeof element.getBoundingClientRect !== 'function'
    || (typeof element.hasAttribute === 'function' && element.hasAttribute('hidden'))
  ) {
    return false;
  }
  try {
    const rect = element.getBoundingClientRect();
    return rect.height > 0 && rect.width > 0;
  } catch (error) {
    return false;
  }
}

/** Index of the turn row currently crossing the viewport's top edge. */
export function turnAtAnchor(rows, anchorY) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  for (const row of rows) {
    if (row.bottom > anchorY) return row.turn;
  }
  return rows[rows.length - 1].turn;
}

/** Nearest turn above/below the current one; null when there is nowhere to go. */
export function adjacentTurn(turns, current, direction) {
  if (!Array.isArray(turns) || turns.length === 0 || current === null) return null;
  if (direction === 'up') {
    let candidate = null;
    for (const turn of turns) {
      if (turn < current) candidate = turn;
      else break;
    }
    return candidate;
  }
  for (const turn of turns) {
    if (turn > current) return turn;
  }
  return null;
}

/** Locate the visible chat surface: its scrollport plus the rendered turn rows. */
export function findChatSurface(doc = typeof document === 'undefined' ? null : document) {
  if (!doc || typeof doc.querySelectorAll !== 'function') return null;
  let ports;
  try {
    ports = [...doc.querySelectorAll(SCROLLPORT_SELECTOR)];
  } catch (error) {
    return null;
  }
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
    return { scrollport, rows };
  }
  return null;
}

/** Turn row currently at the top of the scrollport, accounting for its own offset. */
export function currentTurnOf(surface) {
  if (!surface) return null;
  const portRect = surface.scrollport.getBoundingClientRect();
  const anchorY = portRect.top + Math.min(ALIGN_OFFSET, Math.max(1, portRect.height * 0.1));
  const rows = surface.rows.map(({ turn, row }) => {
    const rect = row.getBoundingClientRect();
    return { turn, top: rect.top, bottom: rect.bottom };
  });
  return turnAtAnchor(rows, anchorY);
}

/** The row to land on for one direction, or null when the transcript has no such turn. */
export function pickTurn(surface, direction) {
  if (!surface || !Array.isArray(surface.rows) || surface.rows.length === 0) return null;
  const current = currentTurnOf(surface);
  if (current === null) return null;
  const target = adjacentTurn(surface.rows.map((item) => item.turn), current, direction);
  if (target === null) return null;
  return surface.rows.find((item) => item.turn === target) ?? null;
}

function flash(row) {
  try {
    row.classList.add(TURN_FLASH_CLASS);
    setTimeout(() => {
      try {
        row.classList.remove(TURN_FLASH_CLASS);
      } catch (error) {
        // the row may have been unmounted by virtualization
      }
    }, FLASH_MS);
  } catch (error) {
    // highlighting is cosmetic
  }
}

/** Scroll one turn row below the scrollport's top edge and briefly highlight it. */
export function scrollToTurn(surface, target) {
  if (!surface || !target) return false;
  const port = surface.scrollport;
  const portRect = port.getBoundingClientRect();
  const rowRect = target.row.getBoundingClientRect();
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
  flash(target.row);
  return true;
}

/** Shortcut action: move the transcript to the previous/next user message. */
export function navigateUserMessage(direction, doc) {
  const surface = findChatSurface(doc);
  if (!surface) return false;
  const target = pickTurn(surface, direction === 'up' ? 'up' : 'down');
  if (target === null) return false;
  return scrollToTurn(surface, target);
}

import { ENTRY_TTL_MS, LIMIT } from './constants.js';
import { clampEntryWidth, clampVisible, entryKey, isNonEmptyString } from './utils.js';

function createNavHistory(options) {
  const limit = typeof options.limit === 'number' && options.limit > 0 ? options.limit : LIMIT;
  const entries = [];
  let index = -1;
  let applying = null;
  let snapshot = null;
  let maxVisible = clampVisible(options.maxVisible);
  let entryWidth = clampEntryWidth(options.entryWidth);
  const listeners = new Set();

  function current() {
    const location = options.readLocation() || {};
    return {
      panelId: location.panelId === undefined ? null : location.panelId,
      sessionId: isNonEmptyString(location.sessionId) ? location.sessionId : null,
    };
  }

  function describe(entry) {
    if (entry === null || entry === undefined) return '';
    if (entry.panelId !== null) {
      try {
        return options.panelLabel(entry.panelId) || '';
      } catch (error) {
        return '';
      }
    }
    if (entry.sessionId !== null) {
      try {
        return options.sessionLabel(entry.sessionId) || '';
      } catch (error) {
        return '';
      }
    }
    return '';
  }

  /** Entries currently shown in the bar: the current page plus neighbours. */
  function windowItems() {
    if (entries.length === 0) return [];
    if (maxVisible <= 1) {
      const entry = entries[index];
      if (entry === undefined) return [];
      return [{ index, label: describe(entry), kind: entry.panelId !== null ? 'panel' : 'session', active: true }];
    }
    const half = Math.floor((maxVisible - 1) / 2);
    const start = Math.max(0, Math.min(index - half, entries.length - maxVisible));
    const end = Math.min(entries.length, start + maxVisible);
    const items = [];
    for (let cursor = start; cursor < end; cursor += 1) {
      const entry = entries[cursor];
      if (entry === undefined) continue;
      items.push({
        index: cursor,
        label: describe(entry),
        kind: entry.panelId !== null ? 'panel' : 'session',
        active: cursor === index,
      });
    }
    return items;
  }

  function publish(force) {
    const location = current();
    const top = entries[index];
    const items = windowItems();
    const next = {
      index,
      length: entries.length,
      canBack: index > 0,
      canForward: index >= 0 && index + 1 < entries.length,
      label: describe(top),
      kind: location.panelId !== null ? 'panel' : 'session',
      panelId: location.panelId,
      sessionId: location.sessionId,
      maxVisible,
      entryWidth,
      items,
    };
    const signature = items.map((item) => `${item.index}:${item.active ? 1 : 0}:${item.label}`).join('|');
    if (
      !force &&
      snapshot !== null &&
      snapshot.index === next.index &&
      snapshot.length === next.length &&
      snapshot.canBack === next.canBack &&
      snapshot.canForward === next.canForward &&
      snapshot.label === next.label &&
      snapshot.kind === next.kind &&
      snapshot.maxVisible === next.maxVisible &&
      snapshot.entryWidth === next.entryWidth &&
      snapshot.signature === signature
    ) {
      return;
    }
    next.signature = signature;
    snapshot = next;
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch (error) {
        console.error('[nav-history] subscriber failed:', error);
      }
    }
  }

  function persist() {
    if (typeof options.persist !== 'function') return;
    try {
      options.persist(entries.map((entry) => ({ panelId: entry.panelId, sessionId: entry.sessionId, at: entry.at })), index);
    } catch (error) {
      console.warn('[nav-history] history persist failed:', error);
    }
  }

  function push(location) {
    if (location.sessionId === null && location.panelId === null) return false;
    const top = entries[index];
    if (top !== undefined && entryKey(top) === entryKey(location)) return false;
    if (index < entries.length - 1) entries.splice(index + 1);
    entries.push({ panelId: location.panelId, sessionId: location.sessionId, at: Date.now() });
    index = entries.length - 1;
    while (entries.length > limit) {
      entries.shift();
      index -= 1;
    }
    if (index < 0) index = 0;
    persist();
    return true;
  }

  /** Record the actual landing of a restore on its own entry, keeping the cursor. */
  function rewriteEntry(entry, landing) {
    const at = entries.indexOf(entry);
    if (at < 0) return;
    entries[at] = { panelId: landing.panelId, sessionId: landing.sessionId, at: entry.at };
    persist();
  }

  function onChange() {
    // Notifications fired synchronously during a restore are that restore's
    // own intermediate states (the session write precedes the panel write);
    // recording them would create phantom entries.
    if (applying !== null) return;
    const pushed = push(current());
    if (!pushed) publish();
    else publish(true);
  }

  function applyEntry(entry) {
    applying = entryKey(entry);
    let failure = null;

    try {
      const before = current();
      if (entry.sessionId !== null && before.sessionId !== entry.sessionId) {
        options.openSession(entry.sessionId);
      }
      if (entry.panelId !== null) {
        options.selectPanel(entry.panelId);
      } else if (before.panelId !== null) {
        // Back to a conversation entry while a whole-page panel is showing:
        // `selectPanel(null)` returns to the conversation view.
        options.selectPanel(null);
      }
    } catch (error) {
      failure = error;
    }

    const expected = entryKey(entry);
    const landing = current();
    applying = null;

    if (failure !== null) {
      console.warn('[nav-history] restore failed:', failure);
      const at = entries.indexOf(entry);
      if (at >= 0) {
        entries.splice(at, 1);
        if (index > at) index -= 1;
        else if (index === at) index = Math.max(0, at - 1);
        if (index >= entries.length) index = entries.length - 1;
        persist();
      }
      if (typeof options.onError === 'function') options.onError(failure);
      return;
    }

    if (entryKey(landing) !== expected) {
      // The restore landed on a nearby location (for example a panel entry
      // recorded before any session was selected). Keep the cursor on this
      // entry and store the real landing: appending a new entry here would
      // jump the cursor to the end and silently keep the forward branch.
      rewriteEntry(entry, landing);
    }
  }

  function back() {
    if (index <= 0) return false;
    index -= 1;
    const target = entries[index];
    applyEntry(target);
    publish(true);
    return true;
  }

  function forward() {
    if (index < 0 || index + 1 >= entries.length) return false;
    index += 1;
    applyEntry(entries[index]);
    publish(true);
    return true;
  }

  /** Jump directly to one history position (a bar chip, or a config-driven move). */
  function jumpTo(target) {
    if (!Number.isInteger(target) || target < 0 || target >= entries.length || target === index) return false;
    index = target;
    applyEntry(entries[index]);
    publish(true);
    return true;
  }

  /** Clamp and apply a new visible-entry preference; persisted by the caller. */
  function persistPreferences() {
    if (typeof options.persistSettings !== 'function') return;
    try {
      options.persistSettings({ maxVisible, entryWidth });
    } catch (error) {
      console.warn('[nav-history] settings persist failed:', error);
    }
  }

  function setMaxVisible(value) {
    const next = clampVisible(value);
    if (next === maxVisible) return false;
    maxVisible = next;
    publish(true);
    persistPreferences();
    return true;
  }

  function getMaxVisible() {
    return maxVisible;
  }

  /** Clamp and apply a new per-entry maximum width in pixels. */
  function setEntryWidth(value) {
    const next = clampEntryWidth(value);
    if (next === entryWidth) return false;
    entryWidth = next;
    publish(true);
    persistPreferences();
    return true;
  }

  function getEntryWidth() {
    return entryWidth;
  }

  function load() {
    if (typeof options.load !== 'function') return;
    try {
      const saved = options.load();
      if (!saved || !Array.isArray(saved.entries)) return;
      const now = Date.now();
      const restored = [];
      for (const raw of saved.entries) {
        if (!raw || typeof raw !== 'object') continue;
        const panelId = raw.panelId === undefined ? null : raw.panelId;
        const sessionId = isNonEmptyString(raw.sessionId) ? raw.sessionId : null;
        if (panelId !== null && !isNonEmptyString(panelId)) continue;
        if (panelId === null && sessionId === null) continue;
        if (typeof raw.at === 'number' && now - raw.at > ENTRY_TTL_MS) continue;
        restored.push({ panelId, sessionId, at: typeof raw.at === 'number' ? raw.at : now });
      }
      const kept = restored.slice(-limit);
      if (kept.length === 0) return;
      entries.length = 0;
      entries.push(...kept);
      const savedIndex = Number.isInteger(saved.index) ? saved.index : kept.length - 1;
      index = Math.min(Math.max(savedIndex, 0), entries.length - 1);
    } catch (error) {
      console.warn('[nav-history] history load failed:', error);
    }
  }

  function start() {
    load();
    const location = current();
    if (entries.length === 0) push(location);
    else {
      const top = entries[index];
      if (top === undefined || entryKey(top) !== entryKey(location)) push(location);
    }
    publish(true);
  }

  return {
    start,
    onChange,
    refresh: () => publish(),
    back,
    forward,
    jumpTo,
    setMaxVisible,
    getMaxVisible,
    setEntryWidth,
    getEntryWidth,
    getSnapshot: () => {
      if (snapshot === null) publish(true);
      return snapshot;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    // Exposed for diagnostics/tests.
    entries: () => entries.map((entry) => ({ ...entry })),
    index: () => index,
  };
}

export { createNavHistory };

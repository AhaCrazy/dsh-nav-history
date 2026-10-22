import {
  DEFAULT_ENTRY_WIDTH,
  DEFAULT_VISIBLE,
  MAX_ENTRY_WIDTH,
  MAX_VISIBLE,
  MIN_ENTRY_WIDTH,
  MIN_VISIBLE,
  WIDTH_STEP,
} from './constants.js';

function isNonEmptyString(value) {
  return typeof value === 'string' && value !== '';
}

function entryKey(entry) {
  if (entry === null || entry === undefined) return '';
  const panel = entry.panelId === null || entry.panelId === undefined ? 'c' : `p:${entry.panelId}`;
  const session = entry.sessionId === null || entry.sessionId === undefined ? '' : entry.sessionId;
  return `${panel}|${session}`;
}

function shorten(value, limit) {
  if (typeof value !== 'string') return '';
  const max = typeof limit === 'number' ? limit : 42;
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/** Current (panelId, sessionId). Panel is authoritative; the session is the retained main view. */
function readLocation(ctx) {
  let panelId = null;
  try {
    const info = ctx.layout && ctx.layout.panelInfo && ctx.layout.panelInfo.getSnapshot
      ? ctx.layout.panelInfo.getSnapshot()
      : null;
    if (info && isNonEmptyString(info.activePanelId)) panelId = info.activePanelId;
  } catch (error) {
    panelId = null;
  }

  let sessionId = null;
  try {
    const selection = ctx.uiWorkspace && ctx.uiWorkspace.selection;
    const snapshot = selection && typeof selection.getSnapshot === 'function' ? selection.getSnapshot() : null;
    if (snapshot && isNonEmptyString(snapshot.sessionId)) sessionId = snapshot.sessionId;
  } catch (error) {
    sessionId = null;
  }

  if (sessionId === null) {
    // Documented fallback: the session currently retained by the main view.
    try {
      const list = ctx.sessions && ctx.sessions.list && ctx.sessions.list.getSnapshot
        ? ctx.sessions.list.getSnapshot()
        : null;
      const rows = list && list.byId ? Object.values(list.byId) : [];
      const retained = rows.filter((row) => row && row.retainedBy && (row.retainedBy.mainView || 0) > 0);
      if (retained.length > 0) {
        const last = retained[retained.length - 1];
        if (last && isNonEmptyString(last.id)) sessionId = last.id;
      }
    } catch (error) {
      sessionId = null;
    }
  }

  return { panelId, sessionId };
}

/** Localized label of a registered whole-page panel, or its id as a fallback. */
function resolvePanelLabel(ctx, panelId) {
  try {
    const entries = ctx.slots && ctx.slots.entries ? ctx.slots.entries('sidebar.panellist') : [];
    for (const entry of entries || []) {
      const options = entry && entry.options;
      if (!options || options.id !== panelId) continue;
      const raw = options.label;
      const label = typeof raw === 'function' ? raw() : raw;
      if (isNonEmptyString(label)) return label;
    }
  } catch (error) {
    // fall through
  }
  return shorten(panelId);
}

/** Title of a session row; falls back to the raw id. */
function resolveSessionLabel(ctx, sessionId) {
  try {
    const list = ctx.sessions && ctx.sessions.list && ctx.sessions.list.getSnapshot
      ? ctx.sessions.list.getSnapshot()
      : null;
    const row = list && list.byId ? list.byId[sessionId] : null;
    if (row) {
      const title = row.displayTitle || row.title;
      if (isNonEmptyString(title)) return title;
    }
  } catch (error) {
    // fall through
  }
  return shorten(sessionId);
}

/** Coerce a stored preference into the allowed 1..MAX_VISIBLE range. */
function clampVisible(value) {
  if (value === null || value === undefined || value === '') return DEFAULT_VISIBLE;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_VISIBLE;
  return Math.min(MAX_VISIBLE, Math.max(MIN_VISIBLE, Math.round(numeric)));
}

/** Coerce a stored preference into the allowed MIN..MAX entry width, snapped to the slider step. */
function clampEntryWidth(value) {
  if (value === null || value === undefined || value === '') return DEFAULT_ENTRY_WIDTH;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_ENTRY_WIDTH;
  const snapped = Math.round(numeric / WIDTH_STEP) * WIDTH_STEP;
  return Math.min(MAX_ENTRY_WIDTH, Math.max(MIN_ENTRY_WIDTH, snapped));
}

export {
  isNonEmptyString,
  entryKey,
  shorten,
  readLocation,
  resolvePanelLabel,
  resolveSessionLabel,
  clampVisible,
  clampEntryWidth,
};

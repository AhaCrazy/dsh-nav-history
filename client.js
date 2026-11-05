/* Generated file - do not edit. Edit src/*.js and run `npm run build`. */
window.__ModuleLoader__.load({
  id: 'dsh-nav-history',
  factory(require) {
    const React = require('react');
  const NS = 'nav-history';
  const PKG = 'dsh-nav-history';
  const VERSION = '0.4.2';
  /** Prefix every shortcut title so the commands are easy to find in the shortcut list. */
  const LABEL_PREFIX = 'Nav History: ';
  const LIMIT = 100;
  const STORE_KEY = 'dsh.nav-history.v1';
  const SETTINGS_KEY = 'dsh.nav-history.settings.v1';
  const ENTRY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  /** Bounded visible-entry count: at least the current page, at most a readable strip. */
  const MIN_VISIBLE = 1;
  const MAX_VISIBLE = 7;
  const DEFAULT_VISIBLE = 3;
  /** Bounded per-entry width in CSS pixels, so one long title cannot swallow the strip. */
  const MIN_ENTRY_WIDTH = 64;
  const MAX_ENTRY_WIDTH = 320;
  const WIDTH_STEP = 8;
  const DEFAULT_ENTRY_WIDTH = 160;

  /** Client services this plugin reads; kept next to the constants for one place to change. */
  const INJECT = ['slots', 'locale', 'layout', 'uiWorkspace', 'sessions', 'shortcuts'];

  const zh = {
    back: '后退',
    forward: '前进',
    empty: '暂无历史',
    label: '页面历史',
    bar: '页面历史导航',
    hint: 'Alt+← / Alt+→',
    count: '{index}/{total}',
    prevMessage: '上一条用户消息',
    nextMessage: '下一条用户消息',
    config: {
      title: '导航栏',
      desc: '控制底部页面历史导航条最多同时显示多少个页面。',
      maxVisible: '最多显示条目数',
      hint: '设为 1 时只显示当前页面；大于 1 时显示当前页面前后的页面，可直接点击跳转。可选范围 1–7。',
      entryWidth: '每个页面的最大宽度',
      widthValue: '{width} px',
      widthHint: '限制每个页面记录在导航条中的最大宽度，超出部分省略。可选范围 64–320 像素。',
      shortcuts: '「后退 / 前进 / 上一条用户消息 / 下一条用户消息」快捷键可在 设置 → 通用 → 快捷键 中查看和修改。',
    },
  };
  const en = {
    back: 'Back',
    forward: 'Forward',
    empty: 'No history',
    label: 'History',
    bar: 'Navigation history',
    hint: 'Alt+Left / Alt+Right',
    count: '{index}/{total}',
    prevMessage: 'Previous user message',
    nextMessage: 'Next user message',
    config: {
      title: 'Navigation bar',
      desc: 'How many pages the bottom history strip shows at once.',
      maxVisible: 'Maximum visible entries',
      hint: 'Set to 1 to show only the current page. Above 1 the strip also shows neighbouring pages you can click. Allowed range: 1–7.',
      entryWidth: 'Maximum width per page',
      widthValue: '{width} px',
      widthHint: 'Caps how wide one page entry may grow in the strip; longer titles are truncated. Allowed range: 64–320 px.',
      shortcuts: 'The Back / Forward / Previous message / Next message shortcuts can be viewed and rebound in Settings → General → Shortcuts.',
    },
  };

  const CSS = `
    .dnh-bar {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 4px;
      height: 30px;
      padding: 0 10px;
      /* Fixed overlays can cover the shell's edges (ds-bot's portalled left
         column); src/insets.js measures the main column and pads in by that
         amount. Both variables fall back to 0, so a missing selector restores
         the plain bar. */
      padding-left: calc(10px + var(--dnh-inset-left, 0px));
      padding-right: calc(10px + var(--dnh-inset-right, 0px));
      font: inherit;
      font-size: 11.5px;
      line-height: 1;
      color: var(--dsw-alias-label-secondary);
      background: var(--dsw-alias-bg-base);
      border-top: 1px solid var(--dsw-alias-border-l1);
      overflow: hidden;
      user-select: none;
    }
    .dnh-btn {
      appearance: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      width: 24px;
      height: 24px;
      padding: 0;
      border: 1px solid transparent;
      border-radius: 6px;
      background: transparent;
      color: var(--dsw-alias-label-secondary);
      cursor: pointer;
    }
    .dnh-btn:hover:not(:disabled) {
      background: var(--dsw-alias-bg-layer-2);
      color: var(--dsw-alias-label-primary);
    }
    .dnh-btn:active:not(:disabled) {
      transform: translateY(0.5px);
    }
    .dnh-btn:disabled {
      opacity: 0.32;
      cursor: default;
    }
    .dnh-btn:focus-visible {
      outline: 2px solid var(--dsw-alias-brand-primary);
      outline-offset: 1px;
    }
    .dnh-sep {
      flex: none;
      width: 1px;
      height: 13px;
      margin: 0 3px;
      background: var(--dsw-alias-border-l1);
    }
    .dnh-loc {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--dsw-alias-label-primary);
      max-width: 46vw;
    }
    .dnh-loc-panel {
      color: var(--dsw-alias-label-secondary);
    }
    .dnh-item {
      appearance: none;
      flex: 0 1 auto;
      min-width: 0;
      max-width: 22ch;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 4px 8px;
      border: 1px solid transparent;
      border-radius: 6px;
      background: transparent;
      color: var(--dsw-alias-label-secondary);
      font: inherit;
      font-size: 11.5px;
      line-height: 1;
      cursor: pointer;
    }
    .dnh-item:hover {
      background: var(--dsw-alias-bg-layer-2);
      color: var(--dsw-alias-label-primary);
    }
    .dnh-item-active {
      border-color: var(--dsw-alias-border-l2);
      background: var(--dsw-alias-bg-layer-2);
      color: var(--dsw-alias-label-primary);
      font-weight: 600;
    }
    .dnh-item-panel {
      color: var(--dsw-alias-label-secondary);
    }
    .dnh-count {
      flex: none;
      margin-left: auto;
      padding-left: 10px;
      font-variant-numeric: tabular-nums;
      opacity: 0.6;
    }
    .dnh-cfg {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 14px 16px;
      border: 1px solid var(--dsw-alias-border-l1);
      border-radius: 10px;
      background: var(--dsw-alias-bg-layer-1);
    }
    .dnh-cfg-title {
      margin: 0;
      font-size: 14px;
      line-height: 1.3;
      font-weight: 600;
      color: var(--dsw-alias-label-primary);
    }
    .dnh-cfg-desc,
    .dnh-cfg-hint {
      margin: 0;
      font-size: 12px;
      line-height: 1.6;
      color: var(--dsw-alias-label-secondary);
    }
    .dnh-cfg-hint {
      opacity: 0.85;
    }
    .dnh-cfg-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .dnh-cfg-label {
      font-size: 12.5px;
      color: var(--dsw-alias-label-primary);
    }
    .dnh-cfg-choices {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 2px;
      border: 1px solid var(--dsw-alias-border-l1);
      border-radius: 8px;
      background: var(--dsw-alias-bg-base);
    }
    .dnh-choice {
      appearance: none;
      width: 28px;
      height: 26px;
      padding: 0;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: var(--dsw-alias-label-secondary);
      font: inherit;
      font-size: 12px;
      line-height: 1;
      cursor: pointer;
      font-variant-numeric: tabular-nums;
    }
    .dnh-choice:hover {
      background: var(--dsw-alias-bg-layer-2);
      color: var(--dsw-alias-label-primary);
    }
    .dnh-choice-active {
      background: var(--dsw-alias-bg-layer-2);
      color: var(--dsw-alias-label-primary);
      font-weight: 650;
    }
    .dnh-choice:focus-visible {
      outline: 2px solid var(--dsw-alias-brand-primary);
      outline-offset: 1px;
    }
    .dnh-cfg-width {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .dnh-cfg-width input[type='range'] {
      width: 170px;
      accent-color: var(--dsw-alias-brand-primary);
      cursor: pointer;
    }
    .dnh-cfg-value {
      min-width: 54px;
      text-align: right;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      color: var(--dsw-alias-label-secondary);
    }
  `;

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

  function loadHistory() {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(STORE_KEY);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function saveHistory(entries, index) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(STORE_KEY, JSON.stringify({ entries, index }));
    } catch (error) {
      // storage quota / privacy mode: history stays in memory only
    }
  }

  /** Persisted, range-checked preferences. */
  function loadSettings() {
    try {
      if (typeof localStorage === 'undefined') {
        return { maxVisible: DEFAULT_VISIBLE, entryWidth: DEFAULT_ENTRY_WIDTH };
      }
      const raw = localStorage.getItem(SETTINGS_KEY);
      const parsed = raw === null ? null : JSON.parse(raw);
      return {
        maxVisible: parsed === null ? DEFAULT_VISIBLE : clampVisible(parsed.maxVisible),
        entryWidth: parsed === null ? DEFAULT_ENTRY_WIDTH : clampEntryWidth(parsed.entryWidth),
      };
    } catch (error) {
      return { maxVisible: DEFAULT_VISIBLE, entryWidth: DEFAULT_ENTRY_WIDTH };
    }
  }

  function saveSettings(settings) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          maxVisible: clampVisible(settings && settings.maxVisible),
          entryWidth: clampEntryWidth(settings && settings.entryWidth),
        }),
      );
    } catch (error) {
      // storage quota / privacy mode: settings stay in memory only
    }
  }

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

  function setMessageNavigationHost(host) {
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
  function pickAdjacentMark(indices, active, direction) {
    if (!Array.isArray(indices) || indices.length === 0 || !Number.isSafeInteger(active)) return null;
    const wanted = direction === 'up' ? active - 1 : active + 1;
    return indices.includes(wanted) ? wanted : null;
  }

  /** Locate the painted turn navigator rail and its mark buttons. */
  function findTurnRail(doc = typeof document === 'undefined' ? null : document) {
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
  function turnAtAnchor(rows, anchorY) {
    if (!Array.isArray(rows) || rows.length === 0) return null;
    for (const row of rows) {
      if (row.bottom > anchorY) return row.turn;
    }
    return rows[rows.length - 1].turn;
  }

  /** Nearest turn above/below the current one; null when there is nowhere to go. */
  function adjacentTurn(turns, current, direction) {
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
  function findChatSurface(doc = typeof document === 'undefined' ? null : document) {
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
  function currentTurnOf(surface) {
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
  function pickTurnRow(surface, direction) {
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
  function scrollToTurnRow(surface, target) {
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
  function findLoadOlderButton(doc = typeof document === 'undefined' ? null : document, scope = null) {
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
  function messageNavState(doc = typeof document === 'undefined' ? null : document) {
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
  function navigateUserMessage(direction, doc) {
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

  function installMouseButtons(controller) {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return () => {};
    const onDown = (event) => {
      if (event.button === 3 || event.button === 4) {
        try {
          event.preventDefault();
        } catch (error) {
          // ignore
        }
      }
    };
    const onUp = (event) => {
      if (event.button === 3) {
        try {
          event.preventDefault();
        } catch (error) {
          // ignore
        }
        controller.back();
      } else if (event.button === 4) {
        try {
          event.preventDefault();
        } catch (error) {
          // ignore
        }
        controller.forward();
      }
    };
    window.addEventListener('mousedown', onDown, true);
    window.addEventListener('mouseup', onUp, true);
    return () => {
      window.removeEventListener('mousedown', onDown, true);
      window.removeEventListener('mouseup', onUp, true);
    };
  }

  function registerShortcuts(ctx, controller, t) {  const shortcuts = ctx.shortcuts;
    if (!shortcuts || typeof shortcuts.register !== 'function') return () => {};
    const disposers = [];
    const bindings = [
      {
        id: 'nav-history.back',
        labelKey: 'back',
        aliases: ['back', 'go back', 'previous page', 'nav history back'],
        win: { code: 'ArrowLeft', modifiers: ['alt'] },
        mac: { code: 'BracketLeft', modifiers: ['primary'] },
        run: () => controller.back(),
      },
      {
        id: 'nav-history.forward',
        labelKey: 'forward',
        aliases: ['forward', 'go forward', 'next page', 'nav history forward'],
        win: { code: 'ArrowRight', modifiers: ['alt'] },
        mac: { code: 'BracketRight', modifiers: ['primary'] },
        run: () => controller.forward(),
      },
      {
        id: 'nav-history.prev-message',
        labelKey: 'prevMessage',
        aliases: ['previous message', 'prev message', '上一条用户消息', '上一条消息', 'nav history previous message'],
        win: { code: 'ArrowUp', modifiers: ['alt'] },
        mac: { code: 'ArrowUp', modifiers: ['alt'] },
        run: () => navigateUserMessage('up'),
      },
      {
        id: 'nav-history.next-message',
        labelKey: 'nextMessage',
        aliases: ['next message', '下一条用户消息', '下一条消息', 'nav history next message'],
        win: { code: 'ArrowDown', modifiers: ['alt'] },
        mac: { code: 'ArrowDown', modifiers: ['alt'] },
        run: () => navigateUserMessage('down'),
      },
    ];
    for (const binding of bindings) {
      try {
        disposers.push(
          shortcuts.register({
            id: binding.id,
            label: () => `${LABEL_PREFIX}${t(binding.labelKey)}`,
            aliases: binding.aliases,
            defaults: {
              'desktop:windows': binding.win,
              'desktop:macos': binding.mac,
            },
            regions: ['page', 'editable'],
            modals: [],
            resolve: (context) => {
              if (binding.id === 'nav-history.prev-message' || binding.id === 'nav-history.next-message') {
                try {
                  console.info('[nav-history] shortcut dispatched', binding.id, context && context.region);
                } catch (error) {
                  // diagnostics are optional
                }
              }
              return { status: 'handled', run: binding.run };
            },
          }),
        );
      } catch (error) {
        console.warn(`[nav-history] shortcut ${binding.id} registration failed:`, error);
      }
    }
    return () => {
      for (const dispose of disposers) {
        try {
          dispose();
        } catch (error) {
          // ignore
        }
      }
    };
  }

  const REPEAT_INTERVAL_MS = 90;

  function bindingMatchesInput(binding, input) {
    if (!binding || binding.code !== input.code || binding.secondCode !== undefined) return false;
    const modifiers = ['control', 'alt', 'shift', 'meta'].filter((name) => input[name]);
    const expected = binding.modifiers || [];
    return modifiers.length === expected.length && modifiers.every((name) => expected.includes(name));
  }

  /** Direction for one native key-repeat input, or null when it is not ours. */
  function repeatDirection(rows, input) {
    if (!input || input.repeat !== true || input.kind !== 'keyboard') return null;
    for (const row of Array.isArray(rows) ? rows : []) {
      if (!row || !row.binding) continue;
      if (!bindingMatchesInput(row.binding, input)) continue;
      if (row.id === 'nav-history.prev-message') return 'up';
      if (row.id === 'nav-history.next-message') return 'down';
    }
    return null;
  }

  /**
   * The shortcut registry suppresses `run` for key repeats, so holding the key
   * would step exactly once. The native keyboard bridge still delivers those
   * repeats; subscribe to it and step again, throttled so a held key walks the
   * transcript instead of racing through it.
   */
  function installRepeatNavigation(ctx) {
    if (typeof window === 'undefined') return () => {};
    const keyboard = window.dshDesktop && window.dshDesktop.keyboard;
    if (!keyboard || typeof keyboard.subscribe !== 'function') return () => {};
    const catalog = ctx && ctx.shortcuts && ctx.shortcuts.catalog;
    if (!catalog || typeof catalog.getSnapshot !== 'function') return () => {};
    let rows = catalog.getSnapshot() || [];
    const offCatalog = typeof catalog.subscribe === 'function'
      ? catalog.subscribe(() => {
          rows = catalog.getSnapshot() || [];
        })
      : null;
    let lastAt = 0;
    const unsubscribe = keyboard.subscribe((input) => {
      const direction = repeatDirection(rows, input);
      if (direction === null) return;
      const now = Date.now();
      if (now - lastAt < REPEAT_INTERVAL_MS) return;
      lastAt = now;
      navigateUserMessage(direction);
    });
    return () => {
      if (typeof offCatalog === 'function') {
        try {
          offCatalog();
        } catch (error) {
          // ignore
        }
      }
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          // ignore
        }
      }
    };
  }

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

  /**
   * Plugin-detail configuration card. `React` is injected by the caller so this
   * module stays free of bundler globals and is directly unit-testable.
   */
  function createConfigSection(React, controller, fallbackT) {
    const h = React.createElement;
    return function NavHistorySettings(props) {
      const t = props && typeof props.t === 'function' ? props.t : fallbackT;
      const [maxVisible, setMaxVisible] = React.useState(controller.getMaxVisible());
      const [entryWidth, setEntryWidth] = React.useState(controller.getEntryWidth());
      React.useEffect(() => {
        let alive = true;
        const sync = () => {
          if (!alive) return;
          setMaxVisible(controller.getMaxVisible());
          setEntryWidth(controller.getEntryWidth());
        };
        const off = controller.subscribe(sync);
        sync();
        return () => {
          alive = false;
          off();
        };
      }, []);

      // Rendered by the plugin manager's per-bundle configuration entry, so
      // this card only ever appears on this bundle's own detail page.
      const choices = [];
      for (let value = MIN_VISIBLE; value <= MAX_VISIBLE; value += 1) choices.push(value);

      return h(
        'section',
        {
          className: 'dnh-cfg',
          'data-dsh-nav-history-config': '',
          'aria-label': t('config.title'),
        },
        h(
          'div',
          { className: 'dnh-cfg-head' },
          h('h3', { className: 'dnh-cfg-title' }, t('config.title')),
          h('p', { className: 'dnh-cfg-desc' }, t('config.desc')),
        ),
        h(
          'div',
          { className: 'dnh-cfg-row' },
          h('span', { className: 'dnh-cfg-label' }, t('config.maxVisible')),
          h(
            'div',
            { className: 'dnh-cfg-choices', role: 'radiogroup', 'aria-label': t('config.maxVisible') },
            ...choices.map((value) =>
              h(
                'button',
                {
                  key: String(value),
                  type: 'button',
                  role: 'radio',
                  'aria-checked': value === maxVisible,
                  className: `dnh-choice${value === maxVisible ? ' dnh-choice-active' : ''}`,
                  onClick: () => controller.setMaxVisible(value),
                },
                String(value),
              ),
            ),
          ),
        ),
        h('p', { className: 'dnh-cfg-hint' }, t('config.hint')),
        h(
          'div',
          { className: 'dnh-cfg-row' },
          h('span', { className: 'dnh-cfg-label' }, t('config.entryWidth')),
          h(
            'div',
            { className: 'dnh-cfg-width' },
            h('input', {
              type: 'range',
              min: MIN_ENTRY_WIDTH,
              max: MAX_ENTRY_WIDTH,
              step: WIDTH_STEP,
              value: entryWidth,
              'aria-label': t('config.entryWidth'),
              onChange: (event) => controller.setEntryWidth(Number(event.target.value)),
            }),
            h('span', { className: 'dnh-cfg-value' }, t('config.widthValue').replace('{width}', String(entryWidth))),
          ),
        ),
        h('p', { className: 'dnh-cfg-hint' }, t('config.widthHint')),
        h('p', { className: 'dnh-cfg-hint' }, t('config.shortcuts')),
      );
    };
  }

  /** Back/forward chevron, built as a component so the bar owns no markup helpers. */
  function createNavIcon(React) {
    const h = React.createElement;
    return function NavIcon({ direction }) {
      const path = direction === 'back'
        ? 'M9.8 3.6 5.2 8l4.6 4.4'
        : 'M6.2 3.6 10.8 8l-4.6 4.4';
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: 14,
          height: 14,
          'aria-hidden': 'true',
          focusable: 'false',
          style: { display: 'block' },
        },
        h('path', {
          d: path,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      );
    };
  }

  /** Bottom history strip: arrows, the visible window of pages and the n/m counter. */
  function createNavBar(React, controller, fallbackT) {
    const h = React.createElement;
    const NavIcon = createNavIcon(React);
    // The ref callback is created once so React only calls it on mount/unmount;
    // an inline one would re-measure on every history change.
    let barNode = null;
    let releaseInsets = null;
    const attachBar = (node) => {
      if (!node) {
        if (typeof releaseInsets === 'function') {
          try {
            releaseInsets();
          } catch (error) {
            // ignore
          }
          releaseInsets = null;
        }
        barNode = null;
        return;
      }
      if (barNode === node && typeof releaseInsets === 'function') return;
      if (typeof releaseInsets === 'function') {
        try {
          releaseInsets();
        } catch (error) {
          // ignore
        }
        releaseInsets = null;
      }
      barNode = node;
      try {
        releaseInsets = installBarInsets(node);
      } catch (error) {
        releaseInsets = null;
      }
    };
    return function NavBar(props) {
      const t = props && typeof props.t === 'function' ? props.t : fallbackT;
      const [snapshot, setSnapshot] = React.useState(controller.getSnapshot());
      React.useEffect(() => {
        let alive = true;
        const refresh = () => {
          if (alive) setSnapshot(controller.getSnapshot());
        };
        const off = controller.subscribe(refresh);
        refresh();
        return () => {
          alive = false;
          off();
        };
      }, []);

      const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || '');
      const backKey = mac ? '⌘[' : 'Alt+←';
      const forwardKey = mac ? '⌘]' : 'Alt+→';
      const count = snapshot.length > 1
        ? t('count')
          .replace('{index}', String(snapshot.index + 1))
          .replace('{total}', String(snapshot.length))
        : '';

      const children = [
        h(
          'button',
          {
            type: 'button',
            className: 'dnh-btn',
            disabled: !snapshot.canBack,
            title: `${t('back')} (${backKey})`,
            'aria-label': t('back'),
            onClick: () => controller.back(),
          },
          h(NavIcon, { direction: 'back' }),
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'dnh-btn',
            disabled: !snapshot.canForward,
            title: `${t('forward')} (${forwardKey})`,
            'aria-label': t('forward'),
            onClick: () => controller.forward(),
          },
          h(NavIcon, { direction: 'forward' }),
        ),
        h('span', { className: 'dnh-sep', 'aria-hidden': 'true' }),
      ];

      if (snapshot.items.length <= 1) {
        const current = snapshot.items[0];
        children.push(
          h(
            'span',
            {
              key: 'current',
              className: snapshot.kind === 'panel' ? 'dnh-loc dnh-loc-panel' : 'dnh-loc',
              style: { maxWidth: `${snapshot.entryWidth}px` },
              title: (current && current.label) || snapshot.label || t('empty'),
            },
            (current && current.label) || snapshot.label || t('empty'),
          ),
        );
      } else {
        for (const item of snapshot.items) {
          children.push(
            h(
              'button',
              {
                key: `entry-${item.index}`,
                type: 'button',
                className: `dnh-item${item.active ? ' dnh-item-active' : ''}${item.kind === 'panel' ? ' dnh-item-panel' : ''}`,
                style: { maxWidth: `${snapshot.entryWidth}px` },
                title: item.label || t('empty'),
                'aria-current': item.active ? 'page' : undefined,
                onClick: () => controller.jumpTo(item.index),
              },
              item.label || t('empty'),
            ),
          );
        }
      }

      if (count !== '') {
        children.push(h('span', { key: 'count', className: 'dnh-count', 'aria-hidden': 'true' }, count));
      }

      return h(
        'div',
        {
          className: 'dnh-bar',
          role: 'toolbar',
          'aria-label': t('bar'),
          'data-dsh-nav-history': 'bar',
          ref: attachBar,
        },
        ...children,
      );
    };
  }

  /**
   * Build the client half of the plugin. React is injected instead of required
   * here so the whole module graph can be imported and tested without a bundler.
   */
  function createClientModule(React) {
    function apply(ctx) {
      // Hot-reloaded client bundles can leave a previous instance mounted. Tear
      // it down first so shortcut handlers and observers never run twice.
      try {
        if (typeof window !== 'undefined' && typeof window.__dshNavHistoryDispose === 'function') {
          window.__dshNavHistoryDispose();
        }
      } catch (error) {
        // ignore
      }
      const owned = [];
      const keep = (disposer) => {
        if (typeof disposer === 'function') owned.push(disposer);
        return disposer;
      };

      keep(ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'nav-history: dictionaries'));
      const fallbackT = (key) => {
        try {
          const t = ctx.locale.bind(NS);
          return t(key);
        } catch (error) {
          return key;
        }
      };

      keep(ctx.effect(() => {
        const style = document.createElement('style');
        style.setAttribute('data-dsh-nav-history', '');
        style.textContent = CSS;
        document.head.appendChild(style);
        return () => style.remove();
      }, 'nav-history: styles'));

      const settings = loadSettings();
      const controller = createNavHistory({
        limit: LIMIT,
        maxVisible: settings.maxVisible,
        entryWidth: settings.entryWidth,
        readLocation: () => readLocation(ctx),
        openSession: (sessionId) => {
          if (ctx.uiWorkspace && typeof ctx.uiWorkspace.openSession === 'function') {
            ctx.uiWorkspace.openSession(sessionId);
          }
        },
        selectPanel: (panelId) => {
          if (ctx.layout && typeof ctx.layout.selectPanel === 'function') {
            ctx.layout.selectPanel(panelId);
          }
        },
        panelLabel: (panelId) => resolvePanelLabel(ctx, panelId),
        sessionLabel: (sessionId) => resolveSessionLabel(ctx, sessionId),
        load: loadHistory,
        persist: saveHistory,
        persistSettings: saveSettings,
        onError: (error) => console.warn('[nav-history] restore dropped one entry:', error),
      });

      const NavBar = createNavBar(React, controller, fallbackT);
      const ConfigSection = createConfigSection(React, controller, fallbackT);

      // Same call the chat's own "load earlier" button makes: session.loadOlder().
      // Preferring the service over a guessed DOM button removes a whole class of
      // failures (button moved into another transcript, hidden, or re-rendered).
      setMessageNavigationHost({
        loadOlder: () => {
          try {
            const location = readLocation(ctx);
            const sessions = ctx.sessions;
            if (!location.sessionId) {
              console.info('[nav-history] loadOlder: no active session');
              return false;
            }
            if (!sessions || typeof sessions.binding !== 'function') {
              console.info('[nav-history] loadOlder: sessions.binding unavailable');
              return false;
            }
            const binding = sessions.binding(location.sessionId);
            const session = binding && binding.session;
            if (!session) {
              console.info('[nav-history] loadOlder: no session binding for', location.sessionId);
              return false;
            }
            if (typeof session.loadOlder !== 'function') {
              console.info('[nav-history] loadOlder: session has no loadOlder()');
              return false;
            }
            const result = session.loadOlder();
            if (result && typeof result.catch === 'function') result.catch(() => {});
            return true;
          } catch (error) {
            return false;
          }
        },
      });

      /** Register into an optional host seat without taking the plugin down if it is taken. */
      const registerIntoSlot = (name, options, component) => {
        try {
          return ctx.slots.register({ name, ...options }, component);
        } catch (error) {
          console.warn(`[nav-history] slot ${name} registration failed:`, error);
          return () => {};
        }
      };

      keep(ctx.slots.inject('shell.bottom', () =>
        registerIntoSlot('shell.bottom', { locale: NS, registrant: PKG }, NavBar),
      ));

      keep(ctx.slots.inject('plugins.bundle.config', () =>
        registerIntoSlot('plugins.bundle.config', { key: PKG, order: 10, locale: NS, registrant: PKG }, ConfigSection),
      ));

      keep(ctx.effect(() => {
        const disposers = [];
        try {
          if (ctx.layout && ctx.layout.panelInfo && typeof ctx.layout.panelInfo.subscribe === 'function') {
            disposers.push(ctx.layout.panelInfo.subscribe(() => controller.onChange()));
          }
        } catch (error) {
          console.warn('[nav-history] panel tracking unavailable:', error);
        }
        try {
          const selection = ctx.uiWorkspace && ctx.uiWorkspace.selection;
          if (selection && typeof selection.subscribe === 'function') {
            disposers.push(selection.subscribe(() => controller.onChange()));
          }
        } catch (error) {
          console.warn('[nav-history] session tracking unavailable:', error);
        }
        try {
          if (ctx.sessions && ctx.sessions.list && typeof ctx.sessions.list.subscribe === 'function') {
            disposers.push(ctx.sessions.list.subscribe(() => controller.refresh()));
          }
        } catch (error) {
          console.warn('[nav-history] session labels unavailable:', error);
        }
        disposers.push(installMouseButtons(controller));
        disposers.push(installRepeatNavigation(ctx));
        disposers.push(registerShortcuts(ctx, controller, fallbackT));
        return () => {
          for (const dispose of disposers) {
            try {
              dispose();
            } catch (error) {
              // ignore
            }
          }
        };
      }, 'nav-history: tracking'));

      controller.start();
      console.info('[nav-history] ready', {
        version: VERSION,
        entries: controller.getSnapshot().length,
        maxVisible: controller.getMaxVisible(),
        entryWidth: controller.getEntryWidth(),
      });
      if (typeof window !== 'undefined') {
        try {
          // Read-only diagnostics for troubleshooting a reported navigation path.
          window.__dshNavHistory = {
            version: VERSION,
            dump: () => ({
              index: controller.index(),
              maxVisible: controller.getMaxVisible(),
              entryWidth: controller.getEntryWidth(),
              entries: controller.entries(),
            }),
            back: controller.back,
            forward: controller.forward,
            messageNav: (direction) => navigateUserMessage(direction),
            state: () => messageNavState(),
          };
        } catch (error) {
          // diagnostics are optional
        }
      }
      const cleanup = () => {
        setMessageNavigationHost(null);
        for (const dispose of owned.splice(0)) {
          try {
            dispose();
          } catch (error) {
            // ignore
          }
        }
        try {
          if (typeof window !== 'undefined' && window.__dshNavHistoryDispose === cleanup) {
            delete window.__dshNavHistoryDispose;
          }
        } catch (error) {
          // ignore
        }
      };
      try {
        if (typeof window !== 'undefined') window.__dshNavHistoryDispose = cleanup;
      } catch (error) {
        // ignore
      }
    }

    return {
      name: PKG,
      inject: INJECT,
      apply,
      internals: {
        createNavHistory,
        readLocation,
        resolvePanelLabel,
        resolveSessionLabel,
        entryKey,
        clampVisible,
        clampEntryWidth,
        MIN_VISIBLE,
        MAX_VISIBLE,
        DEFAULT_VISIBLE,
        MIN_ENTRY_WIDTH,
        MAX_ENTRY_WIDTH,
        DEFAULT_ENTRY_WIDTH,
        zh,
        en,
      },
    };
  }
    return createClientModule(React);
  },
});

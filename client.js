/* Generated file - do not edit. Edit src/*.js and run `npm run build`. */
window.__ModuleLoader__.load({
  id: 'dsh-nav-history',
  factory(require) {
    const React = require('react');
  const NS = 'nav-history';
  const PKG = 'dsh-nav-history';
  const VERSION = '0.3.0';
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
    config: {
      title: '导航栏',
      desc: '控制底部页面历史导航条最多同时显示多少个页面。',
      maxVisible: '最多显示条目数',
      hint: '设为 1 时只显示当前页面；大于 1 时显示当前页面前后的页面，可直接点击跳转。可选范围 1–7。',
      entryWidth: '每个页面的最大宽度',
      widthValue: '{width} px',
      widthHint: '限制每个页面记录在导航条中的最大宽度，超出部分省略。可选范围 64–320 像素。',
      shortcuts: '「后退 / 前进」快捷键可在 设置 → 通用 → 快捷键 中查看和修改。',
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
    config: {
      title: 'Navigation bar',
      desc: 'How many pages the bottom history strip shows at once.',
      maxVisible: 'Maximum visible entries',
      hint: 'Set to 1 to show only the current page. Above 1 the strip also shows neighbouring pages you can click. Allowed range: 1–7.',
      entryWidth: 'Maximum width per page',
      widthValue: '{width} px',
      widthHint: 'Caps how wide one page entry may grow in the strip; longer titles are truncated. Allowed range: 64–320 px.',
      shortcuts: 'The Back / Forward shortcuts can be viewed and rebound in Settings → General → Shortcuts.',
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

  function registerShortcuts(ctx, controller, t) {
    const shortcuts = ctx.shortcuts;
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
            resolve: () => ({
              status: 'handled',
              run: binding.run,
            }),
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
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'nav-history: dictionaries');
      const fallbackT = (key) => {
        try {
          const t = ctx.locale.bind(NS);
          return t(key);
        } catch (error) {
          return key;
        }
      };

      ctx.effect(() => {
        const style = document.createElement('style');
        style.setAttribute('data-dsh-nav-history', '');
        style.textContent = CSS;
        document.head.appendChild(style);
        return () => style.remove();
      }, 'nav-history: styles');

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

      /** Register into an optional host seat without taking the plugin down if it is taken. */
      const registerIntoSlot = (name, options, component) => {
        try {
          return ctx.slots.register({ name, ...options }, component);
        } catch (error) {
          console.warn(`[nav-history] slot ${name} registration failed:`, error);
          return () => {};
        }
      };

      ctx.slots.inject('shell.bottom', () =>
        registerIntoSlot('shell.bottom', { locale: NS, registrant: PKG }, NavBar),
      );

      ctx.slots.inject('plugins.bundle.config', () =>
        registerIntoSlot('plugins.bundle.config', { key: PKG, order: 10, locale: NS, registrant: PKG }, ConfigSection),
      );

      ctx.effect(() => {
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
      }, 'nav-history: tracking');

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
          };
        } catch (error) {
          // diagnostics are optional
        }
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

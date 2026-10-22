export const NS = 'nav-history';
export const PKG = 'dsh-nav-history';
export const VERSION = '0.3.0';
/** Prefix every shortcut title so the commands are easy to find in the shortcut list. */
export const LABEL_PREFIX = 'Nav History: ';
export const LIMIT = 100;
export const STORE_KEY = 'dsh.nav-history.v1';
export const SETTINGS_KEY = 'dsh.nav-history.settings.v1';
export const ENTRY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Bounded visible-entry count: at least the current page, at most a readable strip. */
export const MIN_VISIBLE = 1;
export const MAX_VISIBLE = 7;
export const DEFAULT_VISIBLE = 3;
/** Bounded per-entry width in CSS pixels, so one long title cannot swallow the strip. */
export const MIN_ENTRY_WIDTH = 64;
export const MAX_ENTRY_WIDTH = 320;
export const WIDTH_STEP = 8;
export const DEFAULT_ENTRY_WIDTH = 160;

/** Client services this plugin reads; kept next to the constants for one place to change. */
export const INJECT = ['slots', 'locale', 'layout', 'uiWorkspace', 'sessions', 'shortcuts'];

import { DEFAULT_ENTRY_WIDTH, DEFAULT_VISIBLE, SETTINGS_KEY, STORE_KEY } from './constants.js';
import { clampEntryWidth, clampVisible } from './utils.js';

export function loadHistory() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORE_KEY);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export function saveHistory(entries, index) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORE_KEY, JSON.stringify({ entries, index }));
  } catch (error) {
    // storage quota / privacy mode: history stays in memory only
  }
}

/** Persisted, range-checked preferences. */
export function loadSettings() {
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

export function saveSettings(settings) {
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

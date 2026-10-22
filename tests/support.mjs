// Shared test doubles: a React stub, browser-ish globals and a controller harness.
import { readFileSync } from 'node:fs';
import { createNavHistory } from '../src/history.js';

export const ReactStub = {
  createElement: (...args) => args,
  useState: (value) => [typeof value === 'function' ? value() : value, () => {}],
  useEffect: () => {},
  useRef: (value) => ({ current: value }),
  useMemo: (factory) => factory(),
};

const storage = new Map();
export const localStorageStub = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};
export function resetStorage() {
  storage.clear();
}
export { storage };

export const documentStub = {
  createElement: () => ({
    setAttribute() {},
    remove() {},
    textContent: '',
  }),
  head: { appendChild() {} },
};

export const windowStub = {
  addEventListener() {},
  removeEventListener() {},
};

globalThis.window = windowStub;
globalThis.document = documentStub;
globalThis.localStorage = localStorageStub;

/** Evaluate the generated browser bundle and return its registration + module. */
export function loadBundle() {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  let registration = null;
  const win = {
    ...windowStub,
    __ModuleLoader__: {
      load(definition) {
        registration = definition;
      },
    },
  };
  new Function('window', source)(win);
  const plugin = registration === null
    ? null
    : registration.factory((id) => {
        if (id === 'react') return ReactStub;
        throw new Error(`unexpected module request: ${id}`);
      });
  return { registration, plugin, source };
}

/** Minimal controller harness: fake stores plus fake navigation APIs. */
export function createHarness(options = {}) {
  let location = { ...(options.initial ?? { panelId: null, sessionId: 's1' }) };
  const subscribers = new Set();
  const calls = [];
  const settingsSink = [];
  const notify = () => {
    for (const listener of [...subscribers]) listener();
  };
  const controller = createNavHistory({
    limit: options.limit ?? 10,
    maxVisible: options.maxVisible,
    entryWidth: options.entryWidth,
    readLocation: () => ({ ...location }),
    openSession: (sessionId) => {
      calls.push(['open', sessionId]);
      location = { ...location, sessionId };
      notify();
    },
    selectPanel: (panelId) => {
      if (options.gonePanels && options.gonePanels.includes(panelId)) throw new Error(`unknown panel ${panelId}`);
      calls.push(['panel', panelId]);
      location = { ...location, panelId };
      notify();
    },
    panelLabel: (panelId) => `panel:${panelId}`,
    sessionLabel: (sessionId) => `session:${sessionId}`,
    load: options.load ?? (() => null),
    persist: options.persist ?? (() => {}),
    persistSettings: (value) => settingsSink.push(value),
    onError: options.onError ?? (() => {}),
  });
  subscribers.add(() => controller.onChange());
  controller.start();
  return {
    controller,
    calls,
    settingsSink,
    go(next) {
      location = { ...next };
      notify();
    },
  };
}

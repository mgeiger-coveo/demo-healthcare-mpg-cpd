// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Workstream B (Phase 0.1): this jsdom/Node combination exposes no Web Storage -- both
// `window.localStorage` and the bare `localStorage` global are undefined, and Node only
// provides its own behind --localstorage-file. Several application modules read storage at
// MODULE scope (notably src/common/generateToken.js, which src/App.tsx imports through
// src/common/Engine.tsx), so importing them in a test throws before any test can run.
// This is a test-environment gap, not application behavior: the browser always supplies
// localStorage. The stub below restores the standard API for tests only. No application
// file was changed to accommodate it.
if (typeof globalThis.localStorage === "undefined") {
  const createStorage = (): Storage => {
    let entries = new Map<string, string>();
    return {
      get length() {
        return entries.size;
      },
      clear: () => {
        entries = new Map();
      },
      getItem: (key: string) =>
        entries.has(String(key)) ? entries.get(String(key))! : null,
      key: (index: number) => Array.from(entries.keys())[index] ?? null,
      removeItem: (key: string) => {
        entries.delete(String(key));
      },
      setItem: (key: string, value: string) => {
        entries.set(String(key), String(value));
      },
    } as Storage;
  };

  for (const name of ["localStorage", "sessionStorage"] as const) {
    const storage = createStorage();
    Object.defineProperty(globalThis, name, {
      value: storage,
      configurable: true,
      writable: true,
    });
    if (typeof window !== "undefined") {
      Object.defineProperty(window, name, {
        value: storage,
        configurable: true,
        writable: true,
      });
    }
  }
}

// Polyfill for Node.js 25's experimental localStorage
// This fixes the "localStorage.getItem is not a function" error

export async function register() {
  if (typeof globalThis.localStorage !== 'undefined') {
    // Check if localStorage methods are not properly defined
    if (typeof globalThis.localStorage.getItem !== 'function') {
      const storage = new Map<string, string>();
      
      // Create a proper localStorage polyfill
      (globalThis as { localStorage?: Storage }).localStorage = {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => { storage.set(key, String(value)); },
        removeItem: (key: string) => { storage.delete(key); },
        clear: () => { storage.clear(); },
        key: (index: number) => Array.from(storage.keys())[index] ?? null,
        get length() { return storage.size; },
      };
    }
  }
}

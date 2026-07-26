// A hand-rolled redux-persist storage engine, instead of importing
// `redux-persist/lib/storage`. That package is CJS with a default export,
// and Vite's dependency pre-bundling (at least on Vite 8 here) doesn't
// unwrap it correctly — `storage.getItem` comes back undefined at runtime
// even though it type-checks fine. redux-persist only needs this three
// method shape, so it's simpler to implement it directly against
// window.localStorage than to fight the interop.
const localStorageEngine = {
  getItem(key: string): Promise<string | null> {
    return Promise.resolve(window.localStorage.getItem(key));
  },
  setItem(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem(key: string): Promise<void> {
    window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

export default localStorageEngine;

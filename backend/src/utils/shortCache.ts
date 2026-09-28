/**
 * A few seconds of memory for a read that many clients make at the same moment.
 *
 * A live scoreboard is read in waves: one change is broadcast, and every open
 * page asks again within the same second. Each of those requests would load and
 * score the same data independently. This keeps the answer for `ttlMs`, and
 * because it stores the promise rather than the value, requests that arrive
 * while the first load is still running wait on that load instead of starting
 * their own.
 *
 * A failed load is forgotten at once, so an error is never served from memory.
 *
 * `load` may return any thenable. A Mongoose query is one, but it is not a
 * promise: it runs each time `then` or `catch` is called on it and throws if
 * asked to run twice. It is adopted into a real promise here, so it runs once
 * however many requests wait on it.
 */
export function shortCache<T>(ttlMs: number, maxEntries = 5000) {
  const entries = new Map<string, { at: number; value: Promise<T> }>();

  const prune = (now: number) => {
    for (const [key, entry] of entries) if (now - entry.at >= ttlMs) entries.delete(key);
  };

  return {
    get(key: string, load: () => PromiseLike<T>): Promise<T> {
      const now = Date.now();
      const hit = entries.get(key);
      if (hit && now - hit.at < ttlMs) return hit.value;
      if (entries.size >= maxEntries) prune(now);
      const value = Promise.resolve(load());
      entries.set(key, { at: now, value });
      value.catch(() => { if (entries.get(key)?.value === value) entries.delete(key); });
      return value;
    },
    /** Replaces the entry with a value the caller knows to be current, such as a just-committed write. */
    set(key: string, value: T) {
      entries.set(key, { at: Date.now(), value: Promise.resolve(value) });
    },
    delete(key: string) {
      entries.delete(key);
    },
  };
}

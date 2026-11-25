(() => {
  const prefix = 'namba-walk:';
  const memory = new Map();
  const subscribers = new Map();

  const read = (key, fallback) => {
    const cached = memory.get(key);
    if (cached && !cached.persistent) return cached.value;

    try {
      return JSON.parse(window.localStorage.getItem(`${prefix}${key}`)) ?? fallback;
    } catch {
      return cached?.value ?? fallback;
    }
  };

  const publish = (key) => {
    const listeners = subscribers.get(key);
    if (listeners) [...listeners].forEach((listener) => listener());
  };

  const update = (key, fallback, transform) => {
    const value = transform(read(key, fallback));
    let persistent = false;
    try {
      window.localStorage.setItem(`${prefix}${key}`, JSON.stringify(value));
      persistent = true;
    } catch {
      // Keep the change usable in this session if storage is unavailable.
    }
    memory.set(key, { value, persistent });
    publish(key);
    return { value, persistent };
  };

  const subscribe = (key, listener) => {
    if (!subscribers.has(key)) subscribers.set(key, new Set());
    const listeners = subscribers.get(key);
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  window.addEventListener('storage', (event) => {
    if (event.storageArea !== window.localStorage) return;
    if (event.key === null) {
      memory.clear();
      subscribers.forEach((_, key) => publish(key));
    } else if (event.key.startsWith(prefix)) {
      const key = event.key.slice(prefix.length);
      memory.delete(key);
      publish(key);
    }
  });

  window.NAMBA_TRIP_STORAGE = { read, update, subscribe };
})();

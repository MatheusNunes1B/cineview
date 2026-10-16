// A mount owns its global listeners, timers and observers.
export function createScope() {
  const controller = new AbortController();
  const cleanups = [];
  return {
    get active() { return !controller.signal.aborted; },
    on(target, type, handler, options = {}) {
      target?.addEventListener(type, handler, options);
      cleanups.push(() => target?.removeEventListener(type, handler, options));
    },
    cleanup(fn) { cleanups.push(fn); },
    frame(fn) { const id = requestAnimationFrame(() => { if (!controller.signal.aborted) fn(); }); cleanups.push(() => cancelAnimationFrame(id)); },
    timeout(fn, delay) { const id = setTimeout(() => { if (!controller.signal.aborted) fn(); }, delay); cleanups.push(() => clearTimeout(id)); },
    observer(callback, options) { const observer = new IntersectionObserver(callback, options); cleanups.push(() => observer.disconnect()); return observer; },
    dispose() { controller.abort(); cleanups.splice(0).forEach(fn => fn()); }
  };
}

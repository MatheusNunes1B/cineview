import { useEffect, useState } from 'react';
import { supabase } from './services/supabaseClient.js';
import { loadCatalog } from './services/catalog.js';

export default function App() {
  const [status, setStatus] = useState({ loading: true, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let timeoutId;
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('O Supabase n?o respondeu. Verifique a internet e tente novamente.'));
      }, 15000);
    });
    let active = true;
    async function start() {
      setStatus({ loading: true, error: null });
      try {
        const catalog = await Promise.race([loadCatalog(supabase, controller.signal), timeout]);
        if (!active) return;
        const { mountCineview } = await import('../www/js/app.js');
        if (!active) return;
        await mountCineview(catalog);
        if (active) setStatus({ loading: false, error: null });
      } catch (error) {
        if (active) setStatus({ loading: false, error: controller.signal.aborted
          ? 'O Supabase não respondeu. Verifique a internet e tente novamente.'
          : error.message || 'Não foi possível carregar o catálogo.' });
      } finally {
        clearTimeout(timeoutId);
      }
    }
    start();
    return () => { active = false; clearTimeout(timeoutId); controller.abort(); };
  }, [attempt]);

  return (
    <>
      {(status.loading || status.error) && (
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-white">
          {status.loading && <p role="status">Conectando ao catálogo do Supabase…</p>}
          {status.error && <div role="alert">
            <p>{status.error}</p>
            <button type="button" onClick={() => setAttempt(value => value + 1)}
              className="mt-4 rounded-lg bg-accent px-4 py-2">Tentar novamente</button>
          </div>}
        </div>
      )}
      <div id="app" />
    </>
  );
}

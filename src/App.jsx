import AuthScreen from './components/AuthScreen.jsx';
import AccountDialog from './components/AccountDialog.jsx';
import ProfilePhotoPicker from './components/ProfilePhotoPicker.jsx';
import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext.jsx';
import { supabase } from './services/supabaseClient.js';
import { loadCatalog } from './services/catalog.js';
import { initializeStorage, resetStorage } from '../www/js/storage.js';
import { movies } from '../www/data/movies.js';
import { series } from '../www/data/series.js';

export default function App() {
  const auth = useAuth();
  const [status, setStatus] = useState({ loading: true, error: null });
  const [attempt, setAttempt] = useState(0);
  const userId = auth.user?.id || null;
  const blocked = auth.loading || Boolean(auth.error);
  useEffect(() => {
    if (blocked || !userId) return;
    const controller = new AbortController();
    let active = true, cleanup;
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    setStatus({ loading: true, error: null });
    (async () => {
      try {
        const catalog = supabase ? await loadCatalog(supabase, controller.signal) : [...movies, ...series];
        if (!active) return;
        await initializeStorage(auth.session, controller.signal);
        const { mountCineview } = await import('../www/js/app.js');
        if (!active) return;
        cleanup = mountCineview(catalog);
        setStatus({ loading: false, error: null });
      } catch (error) {
        if (active) setStatus({ loading: false, error: controller.signal.aborted
          ? 'A conexão demorou para responder. Tente novamente.' : error.message });
      } finally { clearTimeout(timeoutId); }
    })();
    return () => { active = false; clearTimeout(timeoutId); controller.abort(); cleanup?.(); resetStorage(); };
  }, [blocked, userId, attempt]);
  if (!blocked && !userId) return <AuthScreen />;
  const error = auth.error || (userId ? status.error : null);
  const loading = auth.loading || (Boolean(userId) && !auth.error && status.loading);
  return <>
    {(loading || error) && <div className="mx-auto max-w-3xl px-4 py-16 text-center text-white">
      <p className="mb-6 text-2xl font-bold"><span className="rounded-lg bg-accent px-2">Cine</span>View</p>
      {loading && <p role="status">{auth.loading ? 'Restaurando sua conta…' : 'Carregando seu catálogo…'}</p>}
      {error && <div role="alert"><p>{error}</p>
        <button type="button" onClick={() => auth.error ? auth.retry().catch(() => {}) : setAttempt(n => n + 1)}
          className="mt-4 rounded-lg bg-accent px-4 py-2">Tentar novamente</button>
      </div>}
    </div>}
    {userId && !blocked && <AccountDialog />}
    {userId && !blocked && !status.loading && !status.error && <ProfilePhotoPicker />}
    <div id="app" hidden={blocked || status.loading || Boolean(status.error)} />
  </>;
}

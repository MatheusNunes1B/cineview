import { authFormError } from './authErrors.js';
export const SESSION_KEY = 'supabase_session';
const recoverableMessage = 'Não foi possível restaurar a conta. Verifique a conexão e tente novamente. Sua sessão foi preservada.';
const storageMessage = 'Não foi possível acessar o armazenamento da conta. Tente novamente antes de fechar ou navegar.';
const invalidSession = error => ['AuthInvalidJwtError', 'AuthSessionMissingError'].includes(error?.name) || ['refresh_token_not_found', 'refresh_token_already_used', 'invalid_refresh_token',
  'session_not_found', 'session_expired', 'bad_jwt', 'user_not_found', 'user_banned'].includes(error?.code)
  || error?.status === 401 || error?.status === 403;

// The SDK keeps only volatile state. This controller owns all durable writes.
export function createAuthController(client, preferences, { timeoutMs = 15000 } = {}) {
  let state = { session: null, user: null, loading: true, busy: false, error: null };
  const listeners = new Set();
  let subscription, initialized = false, bootstrap, operations = Promise.resolve();
  let writes = Promise.resolve(), writeError = null, desired = null, revision = 0;
  let operating = false, pendingLogout = false;
  const publish = patch => {
    state = { ...state, ...patch };
    state.user = state.session?.user || null;
    listeners.forEach(listener => listener());
  };
  function persist(session) {
    desired = session;
    const version = ++revision;
    const task = writes.then(() => session
      ? preferences.set({ key: SESSION_KEY, value: JSON.stringify(session) })
      : preferences.remove({ key: SESSION_KEY }));
    // Keep the queue usable after a failure; retain the error for explicit flush/retry.
    writes = task.then(() => {
      if (version === revision) writeError = null;
    }, () => {
      writeError = new Error(storageMessage);
      publish({ error: storageMessage, loading: false });
    });
    return writes;
  }
  async function flush() {
    let pending;
    do { pending = writes; await pending; } while (pending !== writes);
    if (writeError) throw writeError;
  }
  function connect() {
    if (!client || subscription) return;
    subscription = client.auth.onAuthStateChange((event, session) => {
      // Never await or invoke another auth method while the SDK holds its lock.
      if (event === 'INITIAL_SESSION' || (pendingLogout && event !== 'SIGNED_OUT')) return;
      if (!['SIGNED_IN', 'TOKEN_REFRESHED', 'SIGNED_OUT', 'USER_UPDATED', 'PASSWORD_RECOVERY'].includes(event)) return;
      const changed = (state.user?.id || null) !== (session?.user?.id || null);
      publish({ session, ...(changed ? { loading: true } : {}) });
      const version = revision + 1;
      persist(event === 'SIGNED_OUT' ? null : session).then(() => {
        if (version === revision && initialized && !operating && !writeError) publish({ loading: false });
      });
    }).data.subscription;
  }
  function run(operation) {
    const task = operations.then(async () => {
      operating = true;
      publish({ busy: true, error: null });
      // A timeout only releases the loading UI, never the serialization lock.
      // A retry joins the outstanding bootstrap, so late SDK results cannot race a new login.
      const timer = setTimeout(() => publish({ loading: false, error: 'A conta demorou para responder. Verifique a conexão e tente novamente.' }), timeoutMs);
      try { const result = await operation(); if (!writeError) publish({ error: null }); return result; }
      catch (error) { if (!error.formError) publish({ error: error.message || recoverableMessage }); throw error; }
      finally { clearTimeout(timer); operating = false; publish({ busy: false, loading: false }); }
    });
    operations = task.catch(() => {});
    return task;
  }
  function initialize() {
    connect();
    if (bootstrap) return bootstrap;
    if (initialized) return Promise.resolve();
    publish({ loading: true });
    bootstrap = run(async () => {
      if (!client) { initialized = true; return; }
      // Also handles an email-confirmation redirect already processed by the SDK.
      const current = await client.auth.getSession();
      if (current.error) throw new Error(recoverableMessage);
      if (current.data.session) {
        publish({ session: current.data.session });
        await persist(current.data.session);
        await flush();
        initialized = true;
        return;
      }
      let value;
      try { ({ value } = await preferences.get({ key: SESSION_KEY })); }
      catch { throw new Error(storageMessage); }
      if (!value) { initialized = true; return; }
      let saved;
      try {
        saved = JSON.parse(value);
        if (!saved || typeof saved.access_token !== 'string' || !saved.access_token.trim()
          || typeof saved.refresh_token !== 'string' || !saved.refresh_token.trim()) throw new Error();
      } catch {
        await persist(null);
        await flush();
        initialized = true;
        return;
      }
      let result;
      try { result = await client.auth.setSession({ access_token: saved.access_token, refresh_token: saved.refresh_token }); }
      catch (error) { if (!invalidSession(error)) throw new Error(recoverableMessage); result = { error }; }
      if (result.error) {
        if (!invalidSession(result.error)) throw new Error(recoverableMessage);
        await persist(null);
        await flush();
        publish({ session: null });
      } else {
        publish({ session: result.data.session });
        await persist(result.data.session);
        await flush();
      }
      initialized = true;
    }).finally(() => { bootstrap = null; });
    return bootstrap;
  }
  async function authenticate(method, credentials) {
    await initialize();
    return run(async () => {
      if (!client) throw new Error('Autenticação indisponível: Supabase não configurado.');
      let result;
      try { result = await client.auth[method](credentials); }
      catch (error) { throw authFormError(error, method); }
      if (result.error) throw authFormError(result.error, method);
      if (result.data.session) {
        publish({ session: result.data.session });
        await persist(result.data.session);
      }
      await flush();
      return result.data;
    });
  }
  function signOut() {
    pendingLogout = true;
    return run(async () => {
      // Immediate private-state removal; the operation queue excludes old bootstraps/logins.
      publish({ session: null, loading: true });
      await persist(null);
      await flush();
      if (client) {
        const { error } = await client.auth.signOut({ scope: 'local' });
        if (error) throw new Error('Não foi possível concluir a saída. Tente novamente.');
      }
      await flush();
      initialized = true;
      pendingLogout = false;
    });
  }
  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    start: initialize,
    stop() { subscription?.unsubscribe(); subscription = null; },
    flush,
    async settled() { await operations; await flush(); if (state.error) throw new Error(state.error); },
    retry() {
      if (pendingLogout) return signOut();
      if (bootstrap) return bootstrap;
      if (!initialized) return initialize();
      publish({ loading: true });
      return run(async () => { await persist(desired); await flush(); });
    },
    signIn: credentials => authenticate('signInWithPassword', credentials),
    signUp: credentials => authenticate('signUp', credentials),
    signInWithGoogle: redirectTo => authenticate('signInWithOAuth', { provider: 'google', options: { redirectTo, skipBrowserRedirect: true } }),
    acceptOAuthSession: tokens => authenticate('setSession', tokens),
    signOut
  };
}

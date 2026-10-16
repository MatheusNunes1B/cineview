import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { listenForOAuth, readOAuthError, signInWithGoogle } from '../services/googleOAuth.js';
import { auth } from '../services/auth.js';
import { resetStorage } from '../../www/js/storage.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const state = useSyncExternalStore(auth.subscribe, auth.getSnapshot);
  const [oauthError, setOAuthError] = useState('');
  useEffect(() => {
    let active = true, removeOAuth;
    const callbackError = readOAuthError();
    if (callbackError) setOAuthError(callbackError);
    listenForOAuth(setOAuthError, () => active).then(remove => { if (active) removeOAuth = remove; else remove(); }).catch(() => { if (active) setOAuthError('Não foi possível receber o retorno do Google. Reabra o app e tente novamente.'); });
    let userId = auth.getSnapshot().user?.id || null;
    const unsubscribe = auth.subscribe(() => {
      const next = auth.getSnapshot().user?.id || null;
      if (next !== userId) { userId = next; resetStorage(); }
    });
    auth.start().catch(() => {});
    return () => { active = false; removeOAuth?.(); unsubscribe(); auth.stop(); resetStorage(); };
  }, []);
  return <AuthContext.Provider value={{ ...state, oauthError, clearOAuthError: () => setOAuthError(''), signInWithGoogle, signIn: auth.signIn, signUp: auth.signUp,
    signOut: auth.signOut, retry: auth.retry }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth precisa de AuthProvider.');
  return value;
}

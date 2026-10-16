import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { auth } from '../services/auth.js';
import { resetStorage } from '../../www/js/storage.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const state = useSyncExternalStore(auth.subscribe, auth.getSnapshot);
  useEffect(() => {
    let userId = auth.getSnapshot().user?.id || null;
    const unsubscribe = auth.subscribe(() => {
      const next = auth.getSnapshot().user?.id || null;
      if (next !== userId) { userId = next; resetStorage(); }
    });
    auth.start().catch(() => {});
    return () => { unsubscribe(); auth.stop(); resetStorage(); };
  }, []);
  return <AuthContext.Provider value={{ ...state, signIn: auth.signIn, signUp: auth.signUp,
    signOut: auth.signOut, retry: auth.retry }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth precisa de AuthProvider.');
  return value;
}

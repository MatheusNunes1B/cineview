import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';
import { auth } from './auth.js';
import { isGoogleEnabled } from './supabaseClient.js';

export const NATIVE_CALLBACK = 'com.cineview://auth/callback';
const PENDING_KEY = 'cineview_oauth_pending';
const CALLBACK_ERROR = 'Não foi possível concluir o login Google. Volte e toque em Entrar com Google para iniciar uma nova tentativa.';
let callbackTask;
export function webRedirect() {
  // Preserve a deployment subdirectory, but never retain callback parameters.
  const base = new URL('.', window.location.href);
  return base.pathname === '/' ? base.origin : base.href;
}
export function readOAuthError() {
  const url = new URL(window.location.href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  if (!url.searchParams.has('error') && !fragment.has('error')) return '';
  for (const key of ['error', 'error_code', 'error_description']) url.searchParams.delete(key);
  if (fragment.has('error')) url.hash = '';
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  return CALLBACK_ERROR;
}
export async function signInWithGoogle() {
  if (!await isGoogleEnabled()) throw new Error('O login Google ainda não está disponível. Use e-mail e senha por enquanto.');
  const native = Capacitor.isNativePlatform();
  const result = await auth.signInWithGoogle(native ? NATIVE_CALLBACK : webRedirect());
  if (!result.url) throw new Error(CALLBACK_ERROR);
  await auth.settled();
  if (native) {
    await Preferences.set({ key: PENDING_KEY, value: String(Date.now()) });
    try { await Browser.open({ url: result.url }); }
    catch { await Preferences.remove({ key: PENDING_KEY }); throw new Error('Não foi possível abrir o navegador. Tente novamente.'); }
  } else window.location.assign(result.url);
}
async function handleNativeCallback(raw) {
  let url;
  try { url = new URL(raw); } catch { return; }
  if (url.protocol !== 'com.cineview:' || url.hostname !== 'auth' || url.pathname !== '/callback') return;
  if (callbackTask) return callbackTask;
  callbackTask = (async () => {
    const { value } = await Preferences.get({ key: PENDING_KEY });
    const elapsed = Date.now() - Number(value);
    if (!value || elapsed < 0 || elapsed > 15 * 60 * 1000) throw new Error(CALLBACK_ERROR);
    const params = new URLSearchParams(url.hash.slice(1));
    if (url.searchParams.has('error') || params.has('error')) {
      await Preferences.remove({ key: PENDING_KEY });
      throw new Error(CALLBACK_ERROR);
    }
    const access_token = params.get('access_token'), refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) throw new Error(CALLBACK_ERROR);
    await auth.acceptOAuthSession({ access_token, refresh_token });
    await Preferences.remove({ key: PENDING_KEY });
    await Browser.close().catch(() => {});
  })().finally(() => { callbackTask = null; });
  return callbackTask;
}
export async function listenForOAuth(onError, isActive) {
  if (!Capacitor.isNativePlatform()) return () => {};
  const receive = async raw => {
    if (!isActive()) return;
    try { await handleNativeCallback(raw); } catch { if (isActive()) onError(CALLBACK_ERROR); }
  };
  const listener = await App.addListener('appUrlOpen', ({ url }) => { void receive(url); });
  if (!isActive()) { await listener.remove(); return () => {}; }
  try {
    const launch = await App.getLaunchUrl();
    if (launch?.url) await receive(launch.url);
  } catch (error) { await listener.remove(); throw error; }
  return () => { void listener.remove(); };
}

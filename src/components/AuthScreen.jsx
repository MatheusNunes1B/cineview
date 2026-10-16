import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { isSupabaseConfigured } from '../services/supabaseClient.js';
import { webRedirect } from '../services/googleOAuth.js';

export default function AuthScreen() {
  const auth = useAuth();
  const [signup, setSignup] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const busy = pending || auth.busy;
  async function run(operation) {
    if (busy) return;
    setPending(true); setError(''); setMessage(''); auth.clearOAuthError();
    try { await operation(); }
    catch (failure) { setError(failure.message || 'Não foi possível concluir. Tente novamente.'); }
    finally { setPending(false); }
  }
  function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    void run(async () => {
      const credentials = { email: String(fields.get('email')).trim(), password: String(fields.get('password')) };
      if (signup) credentials.options = { data: { full_name: String(fields.get('name')).trim() }, emailRedirectTo: webRedirect() };
      const result = signup ? await auth.signUp(credentials) : await auth.signIn(credentials);
      if (!result.session) {
        form.reset();
        setMessage('Confira seu e-mail para confirmar o cadastro. Se já tem uma conta, volte para Entrar.');
      }
    });
  }
  function switchMode() { setSignup(!signup); setMessage(''); setError(''); auth.clearOAuthError(); }
  return <main className="auth-page">
    <div className="auth-brand" aria-label="CineView"><span>Cine</span>View</div>
    <section className="auth-card" aria-labelledby="auth-title">
      <p className="auth-eyebrow">SEU PRÓXIMO FILME COMEÇA AQUI</p>
      <h1 id="auth-title">{signup ? 'Crie sua conta' : 'Bem-vindo de volta'}</h1>
      <p className="auth-subtitle">{signup ? 'Organize seus favoritos e descubra novas histórias.' : 'Entre para continuar sua lista de filmes e séries.'}</p>
      <button className="auth-google" type="button" disabled={busy || !isSupabaseConfigured} onClick={() => run(auth.signInWithGoogle)}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.6 4.6 0 0 1-2 3v2.8h3.2c1.9-1.8 3-4.4 3-7.9Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.8c-.9.6-2 1-3.4 1-2.6 0-4.9-1.8-5.7-4.2H3v2.8A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.3 13.6a6 6 0 0 1 0-3.2V7.6H3a10 10 0 0 0 0 8.8l3.3-2.8Z"/><path fill="#EA4335" d="M12 6.2c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.6l3.3 2.8A6 6 0 0 1 12 6.2Z"/></svg>
        Entrar com Google
      </button>
      <div className="auth-divider"><span>ou use seu e-mail</span></div>
      <form onSubmit={submit} className="auth-form" key={signup ? 'signup' : 'login'}>
        <fieldset disabled={busy || !isSupabaseConfigured}>
          {signup && <label>Nome<input name="name" autoComplete="name" required maxLength={100} placeholder="Como podemos chamar você?" /></label>}
          <label>E-mail<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="voce@exemplo.com" /></label>
          <label>Senha<input name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} required minLength={signup ? 8 : undefined} aria-describedby={signup ? 'password-hint' : undefined} placeholder={signup ? 'Crie uma senha segura' : 'Sua senha'} /></label>
          {signup && <p id="password-hint" className="auth-hint">Use pelo menos 8 caracteres.</p>}
          <button className="auth-submit" type="submit" value={signup ? 'signup' : 'login'}>{busy ? 'Aguarde…' : signup ? 'Criar conta' : 'Entrar'}</button>
        </fieldset>
      </form>
      {(error || auth.oauthError) && <p className="auth-error" role="alert">{error || auth.oauthError}</p>}
      {!isSupabaseConfigured && <p className="auth-error" role="alert">O serviço de contas ainda não está configurado.</p>}
      {message && <p className="auth-message" role="status">{message}</p>}
      <p className="auth-switch">{signup ? 'Já tem uma conta?' : 'Ainda não tem conta?'} <button type="button" disabled={busy} onClick={switchMode}>{signup ? 'Entrar' : 'Cadastre-se'}</button></p>
    </section>
    <p className="auth-caption">Seus favoritos. Sua lista. Seu universo de cinema.</p>
  </main>;
}

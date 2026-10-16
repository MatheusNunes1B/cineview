import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
export default function AccountDialog() {
  const { user, busy, signOut } = useAuth();
  const dialog = useRef(null);
  useEffect(() => {
    const open = () => dialog.current?.showModal();
    window.addEventListener('cineview:account-open', open);
    return () => window.removeEventListener('cineview:account-open', open);
  }, []);
  const profile = user?.user_metadata || {};
  const name = profile.full_name || profile.name || 'Minha conta';
  let avatar;
  try { const url = new URL(profile.avatar_url); if (url.protocol === 'https:') avatar = url.href; } catch {}
  return <dialog className="account-dialog" ref={dialog} aria-labelledby="account-title">
    <div className="account-content">
      <button type="button" aria-label="Fechar" className="account-close" onClick={() => dialog.current.close()}>×</button>
      {avatar && <img className="account-avatar" src={avatar} alt="Foto de perfil" referrerPolicy="no-referrer" onError={event => { event.currentTarget.hidden = true; }} />}
      <h2 id="account-title">{name}</h2>
      <p data-account-status>{user?.email}</p>
      <button type="button" data-signout disabled={busy} onClick={() => { void signOut().catch(() => {}); }}>Sair da conta</button>
    </div>
  </dialog>;
}

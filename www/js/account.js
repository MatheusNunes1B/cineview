import { getClient } from './backend.js';
import { getCurrentUser } from './storage.js';

export function attachAccount() {
  const open = document.querySelector('[data-account]');
  const dialog = document.createElement('dialog');
  dialog.className = 'account-dialog';
  dialog.setAttribute('aria-labelledby', 'account-title');
  dialog.innerHTML = `
    <div class="account-content">
      <button type="button" data-account-close aria-label="Fechar" class="account-close">×</button>
      <h2 id="account-title">Minha conta</h2>
      <p data-account-status role="status" aria-live="polite"></p>
      <form data-account-form>
        <label>E-mail<input name="email" type="email" autocomplete="email" required maxlength="254"></label>
        <label>Senha<input name="password" type="password" autocomplete="current-password" required minlength="8"></label>
        <div class="account-actions">
          <button type="submit" name="action" value="login">Entrar</button>
          <button type="submit" name="action" value="signup">Criar conta</button>
        </div>
      </form>
      <div data-account-signed hidden>
        <button type="button" data-signout>Sair da conta</button>
      </div>
    </div>`;
  document.body.appendChild(dialog);
  const status = dialog.querySelector('[data-account-status]');
  const form = dialog.querySelector('form');
  const current = getCurrentUser();
  form.hidden = Boolean(current);
  dialog.querySelector('[data-account-signed]').hidden = !current;
  status.textContent = current ? 'Conectado como ' + current.email
    : 'Entre para salvar favoritos, lista e assistidos no Supabase.';
  open.textContent = current ? 'Minha conta' : 'Entrar';
  open.addEventListener('click', () => dialog.showModal());
  dialog.querySelector('[data-account-close]').addEventListener('click', () => dialog.close());
  async function run(operation) {
    const buttons = dialog.querySelectorAll('button:not([data-account-close])');
    buttons.forEach(button => { button.disabled = true; });
    status.textContent = 'Aguarde…';
    try { await operation(); }
    catch (error) { status.textContent = error.message || 'Não foi possível concluir. Tente novamente.'; }
    finally { buttons.forEach(button => { button.disabled = false; }); }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const action = event.submitter?.value || 'login';
    const fields = new FormData(form);
    run(async () => {
      const client = await getClient();
      const credentials = { email: fields.get('email').trim(), password: fields.get('password') };
      const result = action === 'signup'
        ? await client.auth.signUp(credentials)
        : await client.auth.signInWithPassword(credentials);
      if (result.error) {
        throw new Error(action === 'login'
          ? 'Não foi possível entrar. Confira e-mail e senha.'
          : 'Não foi possível criar a conta. Confira os dados ou tente novamente mais tarde.');
      }
      form.reset();
      if (result.data.session) {
        window.location.reload();
      } else {
        status.textContent = 'O projeto Supabase ainda exige confirmação de e-mail. Desative Confirm Email em Authentication > Providers > Email.';
      }
    });
  });
  dialog.querySelector('[data-signout]').addEventListener('click', () => run(async () => {
    const client = await getClient();
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw new Error('Não foi possível sair. Tente novamente.');
    window.location.reload();
  }));
}

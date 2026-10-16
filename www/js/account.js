// The legacy catalog dispatches an event; React owns the account interface.
export function attachAccount(scope) {
  const open = document.querySelector('[data-account]');
  if (!open) return;
  open.textContent = 'Minha conta';
  scope.on(open, 'click', () => window.dispatchEvent(new Event('cineview:account-open')));
}

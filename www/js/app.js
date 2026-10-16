import { auth } from '../../src/services/auth.js';
import { createScope } from './lifecycle.js';
import { attachAccount } from './account.js';
import { header, searchModal, footer, showToast } from './ui.js';
import { homePage, attachHome } from './home.js';
import { detailsPage } from './details.js';
import { catalogPage, attachCatalog, collectionPage, attachCollection } from './pages.js';
import {
  addFavorite,
  addToWatchlist,
  markAsWatched,
  isFavorite,
  inWatchlist,
  isWatched
} from './storage.js';
import { params } from './utils.js';
import { attachSearch } from './search.js';

export function mountCineview(all) {
const scope = createScope();
const movies = all.filter(item => item.type === 'movie');
const series = all.filter(item => item.type === 'series');
const page = document.body.dataset.page || 'home';
const app  = document.querySelector('#app');

/* ====================================================
   RENDER
   ==================================================== */
function renderApp() {
  let content = '';

  if (page === 'home') {
    content = homePage(all);
  } else if (page === 'movies') {
    content = catalogPage(movies, 'Filmes');
  } else if (page === 'series') {
    content = catalogPage(series, 'Séries');
  } else if (page === 'details') {
    const targetId     = params().get('id');
    const selectedItem = all.find(x => x.id === targetId);
    content = detailsPage(selectedItem, all);
  } else if (page === 'favorites' || page === 'watchlist') {
    content = collectionPage(all, page);
  } else {
    content = homePage(all);
  }

  app.innerHTML = header(page) + content + searchModal() + footer();
}

// ─── Initial render ──────────────────────────────────────────────────────────
renderApp();
attachAccount(scope);
scope.cleanup(() => app.replaceChildren());

scope.on(document, 'click', async event => {
  const link = event.target.closest('a[href]');
  if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey
    || link.target === '_blank' || link.hasAttribute('download') || link.getAttribute('href').startsWith('#')
    || link.origin !== location.origin) return;
  event.preventDefault();
  try { await auth.settled(); if (scope.active) window.location.assign(link.href); }
  catch (error) { if (scope.active) showToast(error.message); }
}, { capture: true });

// ─── Page-specific controllers ───────────────────────────────────────────────
if (page === 'home')                                   attachHome(scope);
if (page === 'movies')                                 attachCatalog(movies, scope);
if (page === 'series')                                 attachCatalog(series, scope);
if (page === 'favorites' || page === 'watchlist')      attachCollection(all, page, scope);
attachSearch(all, scope);

// ─── Global scroll-reveal for non-catalog pages ──────────────────────────────
scope.frame(() => {
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (!revealEls.length) return;

  const obs = scope.observer((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => obs.observe(el));
});

/* ====================================================
   GLOBAL CLICK HANDLER
   ==================================================== */
scope.on(document, 'click', async e => {
  // ── Mobile Menu Toggle ──────────────────────────────
  const menuBtn = e.target.closest('[data-menu]');
  if (menuBtn) {
    const mobileMenu = document.querySelector('[data-mobile-menu]');
    if (mobileMenu) mobileMenu.classList.toggle('hidden');
  }

  // Close mobile menu when clicking outside header
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
    if (!e.target.closest('header')) mobileMenu.classList.add('hidden');
  }

  // ── Quick Action Buttons (card ♥/+) ─────────────────
  const actionBtn = e.target.closest('[data-action]');
  if (!actionBtn) return;

  const action    = actionBtn.dataset.action;
  const id        = actionBtn.dataset.id;
  const item      = all.find(x => x.id === id);
  const itemTitle = item ? item.title : 'Item';

  if (actionBtn.disabled) return;
  actionBtn.disabled = true;
  try {
    if (action === 'favorite') {
      const added = await addFavorite(id);
      showToast(
        added ? `"${itemTitle}" adicionado aos Favoritos!` : `"${itemTitle}" removido dos Favoritos!`,
        added ? 'accent' : 'info'
      );
    } else if (action === 'watchlist') {
      const added = await addToWatchlist(id);
      showToast(
        added ? `"${itemTitle}" adicionado à Minha Lista!` : `"${itemTitle}" removido da Minha Lista!`,
        added ? 'success' : 'info'
      );
    } else if (action === 'watched') {
      const added = await markAsWatched(id);
      showToast(
        added ? `"${itemTitle}" marcado como Assistido!` : `"${itemTitle}" desmarcado de Assistido.`,
        added ? 'success' : 'info'
      );
    }

    if (!scope.active) return;
    // Re-render details hero if we're on the details page
    if (page === 'details') {
      const targetId     = params().get('id');
      const selectedItem = all.find(x => x.id === targetId);
      const mainEl       = document.querySelector('main');
      if (mainEl && selectedItem) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = detailsPage(selectedItem, all);
        mainEl.replaceWith(tempDiv.firstElementChild);
      }
    }
  } catch (error) {
    if (!scope.active) return;
    showToast(error.message || 'Não foi possível salvar. Tente novamente.');
  } finally { actionBtn.disabled = false; }
});



return () => scope.dispose();
}

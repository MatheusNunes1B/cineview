import { isFavorite, inWatchlist, isWatched } from './storage.js';
import { detailUrl, escapeHtml, formatRating } from './utils.js';

export const icon = {
  search: '⌕',
  plus: '＋',
  check: '✓',
  menu: '☰',
  close: '×',
  heartFilled: '♥',
  heartEmpty: '♡',
  chevLeft: '‹',
  chevRight: '›'
};

/* ---- HEADER ---- */
export function header(currentPage) {
  const links = [
    ['index.html', 'Início', 'home'],
    ['movies.html', 'Filmes', 'movies'],
    ['series.html', 'Séries', 'series'],
    ['watchlist.html', 'Minha Lista', 'watchlist'],
    ['favorites.html', 'Favoritos', 'favorites']
  ];

  return `
    <header class="sticky top-0 z-40 border-b border-white/10 glass">
      <nav class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="index.html" class="flex items-center gap-2 text-xl font-bold tracking-tight group">
          <span class="rounded-lg bg-accent px-2 py-0.5 text-xs font-black uppercase text-white shadow-lg shadow-red-900/40 group-hover:shadow-red-900/60 transition-shadow">Cine</span>
          <span class="text-white">View</span>
        </a>

        <div class="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
          ${links.map(([url, label, key]) => {
            const active = currentPage === key;
            return `<a class="relative py-1 transition-colors hover:text-white ${active ? 'text-white font-semibold' : ''}" href="${url}">
              ${label}
              ${active ? '<span class="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-accent"></span>' : ''}
            </a>`;
          }).join('')}
        </div>

        <div class="flex items-center gap-2">
          <button data-account class="rounded-lg border border-white/10 px-3 py-1.5 text-sm">Entrar</button>
          <button data-open-search aria-label="Abrir pesquisa"
            class="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-white/20 hover:bg-white/10 hover:text-white">
            <span class="text-base leading-none">${icon.search}</span>
            <span class="hidden sm:inline text-xs">Buscar...</span>
          </button>
          <button data-menu aria-label="Menu" class="rounded-lg p-2 text-xl text-zinc-400 hover:bg-white/10 hover:text-white md:hidden">
            ${icon.menu}
          </button>
        </div>
      </nav>

      <div data-mobile-menu class="hidden border-t border-white/10 bg-panel px-5 py-3 md:hidden">
        <nav class="flex flex-col gap-1">
          ${links.map(([url, label, key]) => {
            const active = currentPage === key;
            return `<a class="rounded-xl px-4 py-2.5 text-sm font-medium transition ${active ? 'bg-accent/10 text-accent' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}" href="${url}">${label}</a>`;
          }).join('')}
        </nav>
      </div>
    </header>
  `;
}

/* ---- CARD ---- */
export function card(x) {
  const fav = isFavorite(x.id);
  const list = inWatchlist(x.id);
  const watched = isWatched(x.id);
  const isSeries = x.type === 'series';
  const posterSrc = x.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=85';

  return `
    <article class="card group relative flex flex-col overflow-hidden rounded-xl bg-card">
      <a href="${detailUrl(x.id)}" aria-label="Ver ${escapeHtml(x.title)}" class="relative block w-full overflow-hidden" style="padding-top:150%">
        <img
          class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          src="${posterSrc}"
          alt="Pôster de ${escapeHtml(x.title)}"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=85'"
        >

        <!-- gradient info overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="absolute inset-x-0 bottom-0 p-3 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-200">${isSeries ? 'Série' : 'Filme'}</span>
            <span class="text-[11px] font-bold text-amber-300">★ ${formatRating(x.rating)}</span>
          </div>
          <h3 class="truncate text-sm font-semibold text-white group-hover:text-accent transition-colors">${escapeHtml(x.title)}</h3>
          <p class="text-[11px] text-zinc-400 mt-0.5">${x.year}</p>
        </div>
      </a>

      <!-- quick actions -->
      <div class="absolute right-1.5 top-1.5 flex flex-col gap-1 z-10">
        <button
          data-action="favorite" data-id="${x.id}"
          title="${fav ? 'Desfavoritar' : 'Favoritar'}"
          class="h-8 w-8 flex items-center justify-center rounded-full text-sm backdrop-blur-sm transition hover:scale-115 ${fav ? 'bg-accent/30 border border-accent/50 text-accent' : 'bg-black/60 text-white hover:bg-black/80'}"
        >${fav ? icon.heartFilled : icon.heartEmpty}</button>

        <button
          data-action="watchlist" data-id="${x.id}"
          title="${list ? 'Remover da lista' : 'Adicionar à lista'}"
          class="h-8 w-8 flex items-center justify-center rounded-full text-sm backdrop-blur-sm transition hover:scale-115 ${list ? 'bg-emerald-500/30 border border-emerald-500/50 text-emerald-400' : 'bg-black/60 text-white hover:bg-black/80'}"
        >${list ? icon.check : icon.plus}</button>
      </div>

      ${watched ? `
        <div class="absolute left-1.5 top-1.5 z-10 badge-watched">
          <span class="rounded-md bg-emerald-600/90 backdrop-blur-sm px-2 py-0.5 text-[9px] font-black tracking-widest uppercase text-white shadow">ASSISTIDO</span>
        </div>` : ''}
    </article>
  `;
}

/* ---- EMPTY STATE ---- */
export function empty(title, text, actionText = null, actionHref = null) {
  return `
    <section class="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-panel px-6 py-20 text-center">
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-3xl">🎬</div>
      <h2 class="text-lg font-bold text-white">${escapeHtml(title)}</h2>
      <p class="mt-2 max-w-xs text-sm text-zinc-400">${escapeHtml(text)}</p>
      ${actionText && actionHref ? `<a href="${actionHref}" class="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 hover:scale-105">${escapeHtml(actionText)}</a>` : ''}
    </section>
  `;
}

/* ---- SEARCH MODAL ---- */
export function searchModal() {
  return `
    <div data-search-modal class="hidden fixed inset-0 z-50 flex items-start justify-center bg-black/80 px-4 pt-14 backdrop-blur-md">
      <div class="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-2xl">
        <div class="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <span class="text-xl text-zinc-400 leading-none">${icon.search}</span>
          <input data-global-search type="text"
            class="w-full bg-transparent text-base text-white outline-none placeholder:text-zinc-500"
            placeholder="Filmes, séries, gêneros, elenco...">
          <button data-close-search aria-label="Fechar" class="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:bg-white/10 hover:text-white">${icon.close}</button>
        </div>
        <div data-search-results class="max-h-[66vh] overflow-y-auto p-4">
          <p class="py-10 text-center text-sm text-zinc-500">Digite para encontrar filmes e séries...</p>
        </div>
      </div>
    </div>
  `;
}

/* ---- FOOTER ---- */
export function footer() {
  return `
    <footer class="mt-auto border-t border-white/8 bg-panel/60 py-10">
      <div class="mx-auto max-w-7xl px-4 sm:px-6">
        <div class="flex flex-col items-center gap-4 text-center">
          <div class="flex items-center gap-2 text-lg font-bold">
            <span class="rounded-lg bg-accent px-2 py-0.5 text-xs font-black uppercase text-white">Cine</span>
            <span>View</span>
          </div>
          <p class="text-sm text-zinc-400 max-w-sm">Seu guia para descobrir os melhores filmes e séries de todos os tempos.</p>
          <div class="flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-zinc-600">
            <span>HTML5 + Tailwind CSS</span><span>·</span>
            <span>Vanilla JavaScript</span><span>·</span>
            <span>Sua coleção de cinema</span>
          </div>
        </div>
      </div>
    </footer>
  `;
}

/* ---- TOAST ---- */
export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = Object.assign(document.createElement('div'), { id: 'toast-container' });
    document.body.appendChild(container);
  }

  const colorMap = {
    success: 'border-emerald-500/40 bg-emerald-950/95 text-emerald-200',
    accent:  'border-red-500/40 bg-red-950/95 text-red-200',
    info:    'border-white/10 bg-zinc-900/95 text-zinc-200'
  };

  const iconMap = { success: '✓', accent: '♥', info: 'ℹ' };

  const toast = document.createElement('div');
  toast.className = `toast ${colorMap[type] || colorMap.info}`;
  toast.innerHTML = `<span class="shrink-0 text-sm">${iconMap[type] || iconMap.info}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}

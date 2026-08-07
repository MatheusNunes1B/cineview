import { isFavorite, inWatchlist, isWatched } from './storage.js';
import { detailUrl, escapeHtml, formatRating } from './utils.js';

export const icon = {
  search: '⌕',
  star: '★',
  plus: '＋',
  check: '✓',
  menu: '☰',
  close: '×',
  heartFilled: '♥',
  heartEmpty: '♡',
  trash: '🗑'
};

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
        <a href="index.html" class="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span class="rounded-lg bg-accent px-2 py-0.5 text-xs font-black uppercase text-white shadow-lg shadow-red-900/30">Cine</span>
          <span class="text-white">View</span>
        </a>

        <div class="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
          ${links.map(([url, label, pageKey]) => {
            const isActive = currentPage === pageKey;
            return `<a class="transition-colors hover:text-white ${isActive ? 'font-semibold text-accent border-b-2 border-accent pb-1' : ''}" href="${url}">${label}</a>`;
          }).join('')}
        </div>

        <div class="flex items-center gap-2">
          <button data-open-search aria-label="Abrir pesquisa" class="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white">
            <span class="text-base">${icon.search}</span>
            <span class="hidden sm:inline text-xs text-zinc-400">Buscar...</span>
          </button>
          <button data-menu aria-label="Abrir menu" class="rounded-lg p-2 text-xl hover:bg-white/10 md:hidden">
            ${icon.menu}
          </button>
        </div>
      </nav>

      <div data-mobile-menu class="hidden border-t border-white/10 bg-panel px-5 py-4 md:hidden">
        <div class="flex flex-col gap-2">
          ${links.map(([url, label, pageKey]) => {
            const isActive = currentPage === pageKey;
            return `<a class="rounded-lg px-3 py-2.5 text-base font-medium ${isActive ? 'bg-accent/10 font-semibold text-accent' : 'text-zinc-300 hover:bg-white/5'}" href="${url}">${label}</a>`;
          }).join('')}
        </div>
      </div>
    </header>
  `;
}

export function card(x) {
  const fav = isFavorite(x.id);
  const list = inWatchlist(x.id);
  const watched = isWatched(x.id);
  const isSeries = x.type === 'series';

  return `
    <article class="card group relative flex flex-col overflow-hidden rounded-xl bg-card border border-white/10 shadow-md">
      <a href="${detailUrl(x.id)}" aria-label="Ver detalhes de ${escapeHtml(x.title)}" class="relative block w-full overflow-hidden aspect-[2/3]">
        <img 
          class="poster absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
          src="${x.poster}" 
          alt="Pôster de ${escapeHtml(x.title)}" 
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=85'"
        >
        
        <!-- Gradient Overlay & Info -->
        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/80 to-transparent p-3 pt-12 transition-opacity">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300 uppercase">${isSeries ? 'Série' : 'Filme'}</span>
            <span class="text-xs text-amber-300 font-semibold">★ ${formatRating(x.rating)}</span>
          </div>
          <h3 class="truncate text-sm font-semibold text-white group-hover:text-accent transition-colors">${escapeHtml(x.title)}</h3>
          <p class="mt-0.5 text-xs text-zinc-400">${x.year}</p>
        </div>
      </a>

      <!-- Quick Action Buttons -->
      <div class="absolute right-2 top-2 flex flex-col gap-1.5 z-10">
        <button 
          data-action="favorite" 
          data-id="${x.id}" 
          aria-label="${fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" 
          title="${fav ? 'Favoritado' : 'Favoritar'}"
          class="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 backdrop-blur-md text-sm transition hover:scale-110 ${fav ? 'text-accent bg-accent/20 border border-accent/40' : 'text-white hover:bg-black/90'}"
        >
          ${fav ? icon.heartFilled : icon.heartEmpty}
        </button>
        
        <button 
          data-action="watchlist" 
          data-id="${x.id}" 
          aria-label="${list ? 'Remover da minha lista' : 'Adicionar à minha lista'}" 
          title="${list ? 'Na Minha Lista' : 'Adicionar à Minha Lista'}"
          class="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 backdrop-blur-md text-sm transition hover:scale-110 ${list ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40' : 'text-white hover:bg-black/90'}"
        >
          ${list ? icon.check : icon.plus}
        </button>
      </div>

      ${watched ? `
        <div class="absolute left-2 top-2 z-10">
          <span class="rounded-md bg-emerald-600/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold tracking-wider text-white shadow-md">
            ASSISTIDO
          </span>
        </div>
      ` : ''}
    </article>
  `;
}

export function empty(title, text, actionText = null, actionHref = null) {
  return `
    <section class="col-span-full rounded-2xl border border-dashed border-zinc-800 bg-panel px-6 py-16 text-center">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900/80 text-2xl text-zinc-500">
        🎬
      </div>
      <h2 class="mt-4 text-xl font-semibold text-white">${escapeHtml(title)}</h2>
      <p class="mx-auto mt-2 max-w-sm text-sm text-zinc-400">${escapeHtml(text)}</p>
      ${actionText && actionHref ? `
        <a href="${actionHref}" class="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600">
          ${escapeHtml(actionText)}
        </a>
      ` : ''}
    </section>
  `;
}

export function searchModal() {
  return `
    <div data-search-modal class="hidden fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-16 backdrop-blur-md">
      <div class="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-2xl transition-all">
        <div class="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <span class="text-xl text-zinc-400">⌕</span>
          <input 
            data-global-search 
            type="text"
            class="w-full bg-transparent text-base text-white outline-none placeholder:text-zinc-500" 
            placeholder="Pesquise por títulos, gêneros, elenco ou diretor..."
          >
          <button data-close-search aria-label="Fechar pesquisa" class="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white">
            ${icon.close}
          </button>
        </div>
        <div data-search-results class="max-h-[65vh] overflow-y-auto p-4">
          <p class="py-8 text-center text-sm text-zinc-500">Digite para encontrar filmes e séries...</p>
        </div>
      </div>
    </div>
  `;
}

export function footer() {
  return `
    <footer class="mt-auto border-t border-white/10 bg-panel py-8">
      <div class="mx-auto max-w-7xl px-4 text-center sm:px-6">
        <div class="flex items-center justify-center gap-2 text-lg font-bold tracking-tight mb-3">
          <span class="rounded-lg bg-accent px-2 py-0.5 text-xs font-black uppercase text-white">Cine</span>
          <span class="text-white">View</span>
        </div>
        <p class="text-sm text-zinc-400">Seu guia definitivo para explorar os melhores filmes e séries.</p>
        <div class="mt-4 flex justify-center gap-6 text-xs text-zinc-500">
          <span>HTML5 & Tailwind CSS</span>
          <span>·</span>
          <span>Vanilla JavaScript</span>
          <span>·</span>
          <span>LocalStorage Persistente</span>
        </div>
        <p class="mt-4 text-xs text-zinc-600">© CineView — Todos os direitos reservados.</p>
      </div>
    </footer>
  `;
}

export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-200' :
                  type === 'accent' ? 'border-accent/30 bg-red-950/90 text-red-200' :
                  'border-white/10 bg-zinc-900/90 text-zinc-200';

  toast.className = `toast flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-md ${bgClass}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

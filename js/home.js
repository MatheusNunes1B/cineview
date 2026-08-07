import { card, icon } from './ui.js';
import { inWatchlist, isFavorite } from './storage.js';
import { escapeHtml, formatRating } from './utils.js';

export function homePage(all) {
  const featured = all.find(x => x.featured) || all[0];
  const fav = isFavorite(featured.id);
  const list = inWatchlist(featured.id);

  const row = (name, items, linkUrl = 'movies.html') => `
    <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="h-4 w-1 rounded-full bg-accent"></span>
          <h2 class="text-xl font-bold text-white">${name}</h2>
        </div>
        <a class="flex items-center gap-1 text-sm font-semibold text-accent hover:underline" href="${linkUrl}">
          <span>Ver tudo</span>
          <span>→</span>
        </a>
      </div>
      <div class="scroll-row flex gap-4 overflow-x-auto pb-4 pt-1">
        ${items.map(card).join('')}
      </div>
    </section>
  `;

  return `
    <!-- Hero Banner -->
    <section class="hero relative min-h-[520px] flex items-end" style="background-image: url('${featured.backdrop}')">
      <div class="relative z-10 mx-auto flex min-h-[520px] w-full max-w-7xl items-end px-4 pb-14 pt-20 sm:px-6">
        <div class="max-w-2xl">
          <div class="mb-3 flex items-center gap-2">
            <span class="rounded bg-accent px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg">Destaque CineView</span>
            <span class="text-xs font-semibold text-amber-300">★ ${formatRating(featured.rating)}</span>
          </div>

          <h1 class="display text-4xl font-bold leading-tight text-white sm:text-6xl">${escapeHtml(featured.title)}</h1>
          
          <p class="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base line-clamp-3">${escapeHtml(featured.description)}</p>
          
          <p class="mt-4 text-xs font-medium text-zinc-400">
            ${featured.year} · ${featured.genres ? featured.genres.join(' · ') : ''}
          </p>

          <div class="mt-6 flex flex-wrap items-center gap-3">
            <a 
              class="flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-900/30 transition hover:bg-red-600 hover:scale-105" 
              href="details.html?id=${featured.id}"
            >
              <span>Ver detalhes</span>
            </a>

            <button 
              data-action="watchlist" 
              data-id="${featured.id}" 
              class="flex items-center gap-2 rounded-xl ${list ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'} px-5 py-3.5 text-sm font-semibold backdrop-blur-md transition"
            >
              <span>${list ? icon.check : icon.plus}</span>
              <span>${list ? 'Na Minha Lista' : 'Minha Lista'}</span>
            </button>

            <button 
              data-action="favorite" 
              data-id="${featured.id}" 
              class="flex items-center justify-center rounded-xl ${fav ? 'bg-accent text-white' : 'bg-white/10 text-white hover:bg-white/20'} p-3.5 text-sm font-semibold backdrop-blur-md transition"
              title="${fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
            >
              <span>${fav ? icon.heartFilled : icon.heartEmpty}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Catalog Rows -->
    <div class="space-y-4 py-6">
      ${row('Em Destaque', all.filter(x => x.featured), 'movies.html')}
      ${row('Filmes Populares', all.filter(x => x.type === 'movie'), 'movies.html')}
      ${row('Séries Populares', all.filter(x => x.type === 'series'), 'series.html')}
      ${row('Mais Bem Avaliados', [...all].sort((a, b) => b.rating - a.rating), 'movies.html')}
    </div>
  `;
}

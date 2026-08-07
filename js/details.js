import { isFavorite, inWatchlist, isWatched } from './storage.js';
import { escapeHtml, formatDuration, formatRating } from './utils.js';
import { card, icon } from './ui.js';

export function detailsPage(item, allItems = []) {
  if (!item) {
    return `
      <main class="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 class="text-3xl font-bold">Título não encontrado</h1>
        <p class="mt-2 text-zinc-400">O título que você está procurando não existe ou foi removido.</p>
        <a class="mt-6 inline-block rounded-lg bg-accent px-6 py-3 font-semibold text-white transition hover:bg-red-600" href="index.html">
          Voltar ao início
        </a>
      </main>
    `;
  }

  const fav = isFavorite(item.id);
  const list = inWatchlist(item.id);
  const watched = isWatched(item.id);
  const isSeries = item.type === 'series';

  // Find related items (same type and at least 1 common genre, excluding self)
  const related = allItems
    .filter(x => x.id !== item.id && x.type === item.type && x.genres.some(g => item.genres.includes(g)))
    .slice(0, 5);

  return `
    <main class="pb-16">
      <!-- Hero Header -->
      <section class="hero relative min-h-[460px] flex items-end" style="background-image: url('${item.backdrop}');">
        <div class="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-start gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-end">
          <img 
            class="poster shadow-2xl w-44 rounded-xl border border-white/10 hidden md:block shrink-0" 
            src="${item.poster}" 
            alt="Pôster de ${escapeHtml(item.title)}"
          >
          <div class="max-w-3xl">
            <div class="flex flex-wrap items-center gap-2 mb-3">
              <span class="rounded bg-accent px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">${isSeries ? 'Série' : 'Filme'}</span>
              <span class="text-xs text-zinc-400">${item.year}</span>
              <span class="text-xs text-zinc-400">·</span>
              <span class="text-xs font-semibold text-amber-300">★ ${formatRating(item.rating)}/10</span>
            </div>

            <h1 class="display text-3xl font-bold text-white sm:text-5xl leading-tight">${escapeHtml(item.title)}</h1>
            ${item.originalTitle ? `<p class="mt-1 text-sm italic text-zinc-400">${escapeHtml(item.originalTitle)}</p>` : ''}
            
            <p class="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">${escapeHtml(item.description)}</p>

            <div class="mt-5 flex flex-wrap gap-2">
              ${item.genres.map(g => `<span class="rounded-full border border-white/15 bg-black/40 backdrop-blur-md px-3 py-1 text-xs text-zinc-300">${g}</span>`).join('')}
            </div>
          </div>
        </div>
      </section>

      <!-- Content Grid -->
      <section class="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1fr_300px]">
        <div class="space-y-10">
          <!-- Information Box -->
          <div class="rounded-2xl border border-white/10 bg-panel p-6 shadow-xl">
            <h2 class="text-xl font-bold text-white mb-4">Ficha Técnica</h2>
            <dl class="grid grid-cols-2 gap-6 text-sm sm:grid-cols-3">
              <div>
                <dt class="text-xs uppercase tracking-wider text-zinc-500">Avaliação</dt>
                <dd class="mt-1 text-base font-semibold text-amber-300">★ ${formatRating(item.rating)} <span class="text-xs font-normal text-zinc-500">/ 10</span></dd>
              </div>

              <div>
                <dt class="text-xs uppercase tracking-wider text-zinc-500">Duração</dt>
                <dd class="mt-1 text-base font-semibold text-zinc-200">${formatDuration(item.duration, item.type)}</dd>
              </div>

              <div>
                <dt class="text-xs uppercase tracking-wider text-zinc-500">Classificação</dt>
                <dd class="mt-1 text-base font-semibold text-zinc-200">${item.classification ? (item.classification === 'Livre' ? 'Livre' : item.classification + ' anos') : 'N/I'}</dd>
              </div>

              <div>
                <dt class="text-xs uppercase tracking-wider text-zinc-500">Direção</dt>
                <dd class="mt-1 font-medium text-zinc-200">${escapeHtml(item.director || 'N/I')}</dd>
              </div>

              <div class="col-span-2">
                <dt class="text-xs uppercase tracking-wider text-zinc-500">Elenco Principal</dt>
                <dd class="mt-1 font-medium text-zinc-200">${item.cast ? item.cast.map(escapeHtml).join(', ') : 'N/I'}</dd>
              </div>
            </dl>
          </div>

          <!-- Series Seasons and Episodes Structure -->
          ${isSeries && item.seasons && item.seasons.length > 0 ? `
            <div class="rounded-2xl border border-white/10 bg-panel p-6 shadow-xl">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-white">Temporadas e Episódios</h2>
                <span class="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400 font-medium">${item.seasons.length} Temporada${item.seasons.length > 1 ? 's' : ''}</span>
              </div>

              <div class="space-y-4">
                ${item.seasons.map((season, sIndex) => `
                  <details ${sIndex === 0 ? 'open' : ''} class="group rounded-xl border border-white/5 bg-black/30 overflow-hidden transition">
                    <summary class="flex cursor-pointer items-center justify-between px-5 py-4 font-semibold text-white hover:bg-white/5 transition">
                      <span class="flex items-center gap-3">
                        <span class="rounded bg-accent/20 px-2 py-0.5 text-xs text-accent font-bold">T${season.number}</span>
                        <span>${escapeHtml(season.name || `Temporada ${season.number}`)}</span>
                      </span>
                      <span class="flex items-center gap-3 text-xs text-zinc-400">
                        <span>${season.episodes ? season.episodes.length : 0} episódios</span>
                        <svg class="h-4 w-4 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                      </span>
                    </summary>

                    <div class="border-t border-white/5 p-4 space-y-3">
                      ${season.episodes && season.episodes.length > 0 ? season.episodes.map(ep => `
                        <div class="flex flex-col gap-1.5 rounded-lg bg-panel/80 p-3 text-sm border border-white/5">
                          <div class="flex items-center justify-between font-medium text-zinc-200">
                            <span><strong class="text-accent">E${ep.number}.</strong> ${escapeHtml(ep.title)}</span>
                            <span class="text-xs text-zinc-400 font-normal">${ep.duration} min</span>
                          </div>
                          ${ep.overview ? `<p class="text-xs text-zinc-400 leading-relaxed">${escapeHtml(ep.overview)}</p>` : ''}
                        </div>
                      `).join('') : '<p class="text-xs text-zinc-500 py-2 text-center">Episódios em breve nesta temporada.</p>'}
                    </div>
                  </details>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Recommendations Carousel -->
          ${related.length > 0 ? `
            <div>
              <h2 class="text-xl font-bold text-white mb-4">Títulos Semelhantes</h2>
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                ${related.map(card).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Action Box Sidebar -->
        <aside class="h-fit space-y-4">
          <div class="rounded-2xl border border-white/10 bg-panel p-5 shadow-xl">
            <h2 class="font-semibold text-white mb-4">Sua Experiência</h2>
            <div class="grid gap-3">
              <button 
                data-action="watchlist" 
                data-id="${item.id}" 
                class="flex w-full items-center justify-center gap-2 rounded-xl ${list ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'bg-white/10 text-zinc-200 hover:bg-white/15'} px-4 py-3 text-sm font-semibold transition"
              >
                <span>${list ? icon.check : icon.plus}</span>
                <span>${list ? 'Na Minha Lista' : 'Adicionar à Minha Lista'}</span>
              </button>

              <button 
                data-action="favorite" 
                data-id="${item.id}" 
                class="flex w-full items-center justify-center gap-2 rounded-xl ${fav ? 'bg-accent text-white shadow-lg shadow-red-900/30' : 'bg-white/10 text-zinc-200 hover:bg-white/15'} px-4 py-3 text-sm font-semibold transition"
              >
                <span>${fav ? icon.heartFilled : icon.heartEmpty}</span>
                <span>${fav ? 'Favoritado' : 'Adicionar aos Favoritos'}</span>
              </button>

              <button 
                data-action="watched" 
                data-id="${item.id}" 
                class="flex w-full items-center justify-center gap-2 rounded-xl ${watched ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-900/40' : 'bg-white/10 text-zinc-200 hover:bg-white/15'} px-4 py-3 text-sm font-semibold transition"
              >
                <span>${watched ? icon.check : '✓'}</span>
                <span>${watched ? 'Marcado como Assistido' : 'Marcar como Assistido'}</span>
              </button>
            </div>
          </div>
        </aside>
      </section>
    </main>
  `;
}

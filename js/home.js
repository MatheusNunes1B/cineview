import { card, icon } from './ui.js';
import { inWatchlist, isFavorite } from './storage.js';
import { escapeHtml, formatRating } from './utils.js';

/* ====================================================
   HOME PAGE – Hero + Carousel Rows with Nav Buttons
   ==================================================== */
export function homePage(all) {
  const featured = all.find(x => x.featured) || all[0];
  const fav  = isFavorite(featured.id);
  const list = inWatchlist(featured.id);

  const fallback = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=85';

  /* --- Carousel Row --- */
  const row = (rowId, name, items, linkUrl = 'movies.html') => `
    <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6" data-reveal>
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="h-5 w-1 rounded-full bg-accent"></span>
          <h2 class="text-xl font-bold text-white">${name}</h2>
          <span class="rounded-full bg-white/6 px-2 py-0.5 text-xs font-medium text-zinc-400">${items.length}</span>
        </div>
        <a class="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-sm font-semibold text-accent transition hover:bg-accent hover:text-white" href="${linkUrl}">
          <span>Ver tudo</span>
          <span class="text-base leading-none">›</span>
        </a>
      </div>

      <!-- Row wrapper with nav buttons -->
      <div class="row-wrapper" data-row="${rowId}">
        <button class="row-nav prev" aria-label="Anterior" data-nav="prev" data-target="${rowId}">‹</button>
        <div id="${rowId}" class="scroll-row flex gap-3 overflow-x-auto pb-4 pt-1" style="scroll-behavior: smooth;">
          ${items.map(card).join('')}
        </div>
        <button class="row-nav next" aria-label="Próximo" data-nav="next" data-target="${rowId}">›</button>
      </div>
    </section>
  `;

  return `
    <!-- =================== HERO =================== -->
    <section class="hero relative min-h-[560px] flex items-end"
      style="background-image: url('${featured.backdrop || fallback}')">
      <div class="relative z-10 mx-auto flex min-h-[560px] w-full max-w-7xl items-end px-4 pb-16 pt-24 sm:px-6">
        <div class="hero-content max-w-2xl">
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <span class="rounded-md bg-accent px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40">Destaque</span>
            <span class="text-xs font-bold text-amber-300">★ ${formatRating(featured.rating)}</span>
            <span class="text-xs text-zinc-400">${featured.year}</span>
            ${featured.genres ? featured.genres.slice(0, 3).map(g =>
              `<span class="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-zinc-300">${g}</span>`
            ).join('') : ''}
          </div>

          <h1 class="display text-4xl font-bold leading-tight text-white sm:text-6xl drop-shadow-2xl">
            ${escapeHtml(featured.title)}
          </h1>

          <p class="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base line-clamp-3 max-w-lg">
            ${escapeHtml(featured.description)}
          </p>

          <div class="mt-6 flex flex-wrap items-center gap-3">
            <a class="flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-red-900/30 transition hover:bg-red-600 hover:scale-105 active:scale-95"
               href="details.html?id=${featured.id}">
              ▶ Ver detalhes
            </a>

            <button data-action="watchlist" data-id="${featured.id}"
              class="flex items-center gap-2 rounded-xl ${list ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'} px-5 py-3.5 text-sm font-semibold backdrop-blur-md border border-white/10 transition hover:scale-105 active:scale-95">
              <span>${list ? icon.check : icon.plus}</span>
              <span>${list ? 'Na Minha Lista' : 'Minha Lista'}</span>
            </button>

            <button data-action="favorite" data-id="${featured.id}"
              class="flex items-center justify-center rounded-xl ${fav ? 'bg-accent text-white' : 'bg-white/10 text-white hover:bg-white/20'} p-3.5 text-base backdrop-blur-md border border-white/10 transition hover:scale-110 active:scale-95"
              title="${fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
              ${fav ? icon.heartFilled : icon.heartEmpty}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ================== ROWS ================== -->
    <div class="space-y-2 py-6">
      ${row('row-featured', 'Em Destaque',          all.filter(x => x.featured),                       'movies.html')}
      ${row('row-movies',   'Filmes Populares',      all.filter(x => x.type === 'movie'),               'movies.html')}
      ${row('row-series',   'Séries Populares',      all.filter(x => x.type === 'series'),              'series.html')}
      ${row('row-top',      'Mais Bem Avaliados',     [...all].sort((a,b) => b.rating - a.rating).slice(0, 20), 'movies.html')}
    </div>
  `;
}

/* ====================================================
   ATTACH HOME – bind carousel nav + scroll reveal
   ==================================================== */
export function attachHome() {
  /* Carousel nav buttons */
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-nav]');
    if (!btn) return;

    const dir    = btn.dataset.nav;        // 'prev' | 'next'
    const target = btn.dataset.target;
    const row    = document.getElementById(target);
    if (!row) return;

    const cardW = row.querySelector('.card')?.offsetWidth || 200;
    const step  = (cardW + 12) * 3; // 3 cards per click
    row.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' });
  });

  /* Scroll reveal – Intersection Observer */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => obs.observe(el));
  }
}

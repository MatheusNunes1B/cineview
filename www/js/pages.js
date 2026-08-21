import { controls, filterItems } from './filters.js';
import { card, empty } from './ui.js';
import { getFavorites, getWatchlist, getWatched } from './storage.js';

/* ====================================================
   PAGINATION HELPER
   ==================================================== */
const PAGE_SIZE = 18;

function paginationHTML(current, total) {
  if (total <= 1) return '';

  const pages = [];

  // Prev button
  pages.push(`<button class="page-btn" data-page="${current - 1}" ${current <= 1 ? 'disabled' : ''} aria-label="Página anterior">‹</button>`);

  // Page numbers (window of 5)
  const start = Math.max(1, current - 2);
  const end   = Math.min(total, current + 2);

  if (start > 1) {
    pages.push(`<button class="page-btn" data-page="1">1</button>`);
    if (start > 2) pages.push(`<span class="page-btn" style="cursor:default;background:none;border:none;color:#52525b">…</span>`);
  }

  for (let i = start; i <= end; i++) {
    pages.push(`<button class="page-btn ${i === current ? 'active' : ''}" data-page="${i}">${i}</button>`);
  }

  if (end < total) {
    if (end < total - 1) pages.push(`<span class="page-btn" style="cursor:default;background:none;border:none;color:#52525b">…</span>`);
    pages.push(`<button class="page-btn" data-page="${total}">${total}</button>`);
  }

  // Next button
  pages.push(`<button class="page-btn" data-page="${current + 1}" ${current >= total ? 'disabled' : ''} aria-label="Próxima página">›</button>`);

  return `<nav class="pagination mt-8 mb-2" aria-label="Paginação">${pages.join('')}</nav>`;
}

/* ====================================================
   CATALOG PAGE (Movies / Series)
   ==================================================== */
export function catalogPage(items, name) {
  return `
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div class="mb-6" data-reveal>
        <p class="text-xs font-bold uppercase tracking-widest text-accent">Catálogo CineView</p>
        <h1 class="display mt-1 text-3xl font-bold text-white sm:text-5xl">${name}</h1>
        <p class="mt-2 max-w-xl text-sm text-zinc-400">
          Explore nossa seleção completa de ${name.toLowerCase()} e descubra grandes histórias.
        </p>
      </div>

      <div class="mt-6">${controls(items)}</div>

      <div class="mt-6 flex items-center justify-between">
        <p data-count class="text-sm font-medium text-zinc-400"></p>
      </div>

      <div data-grid class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" data-reveal-group></div>

      <div data-pagination></div>
    </main>
  `;
}

/* ====================================================
   ATTACH CATALOG – filtering + pagination + reveal
   ==================================================== */
export function attachCatalog(items) {
  let state = { q: '', genre: 'all', year: 'all', rating: 'all', status: 'all', sort: 'recent' };
  let currentPage = 1;

  const countEl      = document.querySelector('[data-count]');
  const gridEl       = document.querySelector('[data-grid]');
  const paginationEl = document.querySelector('[data-pagination]');
  const clearBtn     = document.querySelector('[data-clear-filters]');

  /* Scroll-reveal for grid cards */
  let revealObserver = null;
  function setupReveal() {
    if (revealObserver) revealObserver.disconnect();
    const cards = gridEl ? gridEl.querySelectorAll('.card') : [];
    if (!cards.length) return;

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          revealObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });

    cards.forEach(c => {
      c.dataset.reveal = '';
      c.classList.remove('revealed');
      revealObserver.observe(c);
    });
  }

  const draw = () => {
    if (!gridEl) return;
    const results = filterItems(items, state.q, state);
    const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const pageItems = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    if (countEl) {
      countEl.textContent = `${results.length} título${results.length === 1 ? '' : 's'} encontrado${results.length === 1 ? '' : 's'}`;
    }

    if (clearBtn) {
      const isFiltered = state.q || state.genre !== 'all' || state.year !== 'all' || state.rating !== 'all' || state.status !== 'all' || state.sort !== 'recent';
      clearBtn.classList.toggle('hidden', !isFiltered);
    }

    gridEl.innerHTML = pageItems.length
      ? pageItems.map(card).join('')
      : empty('Nenhum resultado encontrado', 'Tente ajustar a busca ou limpar os filtros aplicados.', 'Limpar busca', '#');

    if (paginationEl) {
      paginationEl.innerHTML = paginationHTML(currentPage, totalPages);
    }

    // Animate newly rendered cards
    requestAnimationFrame(setupReveal);

    // Scroll to top of grid smoothly
    gridEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  /* Filter change */
  const handleFilterChange = (e) => {
    const filterKey = e.target.dataset.filter;
    if (filterKey) {
      state[filterKey] = e.target.value;
      currentPage = 1;
      draw();
    }
  };

  document.addEventListener('input',  handleFilterChange);
  document.addEventListener('change', handleFilterChange);

  /* Pagination click + clear filters */
  document.addEventListener('click', e => {
    // Pagination
    const pageBtn = e.target.closest('[data-page]');
    if (pageBtn && !pageBtn.disabled && paginationEl?.contains(pageBtn)) {
      currentPage = parseInt(pageBtn.dataset.page, 10);
      draw();
      return;
    }

    // Clear filters
    if (e.target.closest('[data-clear-filters]')) {
      state = { q: '', genre: 'all', year: 'all', rating: 'all', status: 'all', sort: 'recent' };
      document.querySelectorAll('[data-filter]').forEach(input => {
        if (input.tagName === 'SELECT') input.value = input.options[0].value;
        else if (input.tagName === 'INPUT') input.value = '';
      });
      currentPage = 1;
      draw();
    }
  });

  /* Re-draw on storage change */
  window.addEventListener('cineview:storage-change', draw);

  draw();
}

/* ====================================================
   COLLECTION PAGE (Favorites / Watchlist)
   ==================================================== */
export function collectionPage(all, kind) {
  const isFavorites = kind === 'favorites';
  const title    = isFavorites ? 'Favoritos' : 'Minha Lista';
  const subtitle = isFavorites
    ? 'Seus títulos preferidos reunidos em um só lugar.'
    : 'Filmes e séries que você salvou para assistir mais tarde.';

  return `
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div class="mb-6" data-reveal>
        <p class="text-xs font-bold uppercase tracking-widest text-accent">Sua Coleção</p>
        <h1 class="display mt-1 text-3xl font-bold text-white sm:text-5xl">${title}</h1>
        <p class="mt-2 max-w-xl text-sm text-zinc-400">${subtitle}</p>
      </div>

      <!-- Filter Chips -->
      <div class="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4" data-collection-filter>
        <button data-type="all"    class="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-md transition">Todos</button>
        <button data-type="movie"  class="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/15">Filmes</button>
        <button data-type="series" class="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/15">Séries</button>
        ${!isFavorites ? `
          <button data-type="watched"   class="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/15">Assistidos</button>
          <button data-type="unwatched" class="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/15">Quero assistir</button>
        ` : ''}
      </div>

      <div data-collection-grid class="collection-grid mt-6 grid" data-reveal-group></div>

      <div data-collection-pagination></div>
    </main>
  `;
}

/* ====================================================
   ATTACH COLLECTION – filtering + pagination
   ==================================================== */
export function attachCollection(all, kind) {
  const gridEl       = document.querySelector('[data-collection-grid]');
  const paginationEl = document.querySelector('[data-collection-pagination]');
  let currentFilter  = 'all';
  let currentPage    = 1;

  const draw = () => {
    if (!gridEl) return;

    const ids   = kind === 'favorites' ? getFavorites() : getWatchlist();
    let   items = all.filter(x => ids.includes(x.id));

    if      (currentFilter === 'watched')   items = items.filter(x => getWatched().includes(x.id));
    else if (currentFilter === 'unwatched') items = items.filter(x => !getWatched().includes(x.id));
    else if (currentFilter !== 'all')       items = items.filter(x => x.type === currentFilter);

    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    const pageItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    if (pageItems.length > 0) {
      gridEl.innerHTML = pageItems.map(card).join('');
    } else {
      const isFav = kind === 'favorites';
      gridEl.innerHTML = empty(
        currentFilter === 'all'
          ? (isFav ? 'Nenhum favorito adicionado' : 'Sua lista está vazia')
          : 'Nenhum título nesta categoria',
        'Explore o catálogo e adicione títulos para acompanhar seu conteúdo.',
        'Explorar Catálogo',
        'movies.html'
      );
    }

    if (paginationEl) {
      paginationEl.innerHTML = paginationHTML(currentPage, totalPages);
    }

    // Animate cards
    requestAnimationFrame(() => {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); }
        });
      }, { threshold: 0.06 });
      gridEl.querySelectorAll('.card').forEach(c => {
        c.dataset.reveal = '';
        obs.observe(c);
      });
    });
  };

  document.addEventListener('click', e => {
    // Filter chips
    const btn = e.target.closest('[data-type]');
    if (btn && btn.closest('[data-collection-filter]')) {
      currentFilter = btn.dataset.type;
      currentPage   = 1;
      document.querySelectorAll('[data-collection-filter] [data-type]').forEach(b => {
        const isCurrent = b === btn;
        b.className = `rounded-full ${isCurrent ? 'bg-accent text-white shadow-md' : 'bg-white/10 text-zinc-300 hover:bg-white/15'} px-4 py-2 text-xs font-semibold transition`;
      });
      draw();
      return;
    }

    // Pagination
    const pageBtn = e.target.closest('[data-page]');
    if (pageBtn && !pageBtn.disabled && paginationEl?.contains(pageBtn)) {
      currentPage = parseInt(pageBtn.dataset.page, 10);
      draw();
    }
  });

  window.addEventListener('cineview:storage-change', draw);
  draw();
}

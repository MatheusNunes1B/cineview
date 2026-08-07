import { controls, filterItems } from './filters.js';
import { card, empty } from './ui.js';
import { getFavorites, getWatchlist, getWatched } from './storage.js';

export function catalogPage(items, name) {
  const isMovie = name.toLowerCase().includes('filme');
  return `
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div class="mb-6">
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

      <div data-grid class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"></div>
    </main>
  `;
}

export function attachCatalog(items) {
  let state = { q: '', genre: 'all', year: 'all', rating: 'all', status: 'all', sort: 'recent' };
  
  const countEl = document.querySelector('[data-count]');
  const gridEl = document.querySelector('[data-grid]');
  const clearBtn = document.querySelector('[data-clear-filters]');

  const draw = () => {
    if (!gridEl) return;
    const r = filterItems(items, state.q, state);

    if (countEl) {
      countEl.textContent = `${r.length} título${r.length === 1 ? '' : 's'} encontrado${r.length === 1 ? '' : 's'}`;
    }

    if (clearBtn) {
      const isFiltered = state.q || state.genre !== 'all' || state.year !== 'all' || state.rating !== 'all' || state.status !== 'all' || state.sort !== 'recent';
      clearBtn.classList.toggle('hidden', !isFiltered);
    }

    gridEl.innerHTML = r.length 
      ? r.map(card).join('') 
      : empty('Nenhum resultado encontrado', 'Tente ajustar a busca ou limpar os filtros aplicados.', 'Limpar busca', '#');
  };

  const handleFilterChange = (e) => {
    const filterKey = e.target.dataset.filter;
    if (filterKey) {
      state[filterKey] = e.target.value;
      draw();
    }
  };

  document.addEventListener('input', handleFilterChange);
  document.addEventListener('change', handleFilterChange);

  document.addEventListener('click', e => {
    if (e.target.closest('[data-clear-filters]')) {
      state = { q: '', genre: 'all', year: 'all', rating: 'all', status: 'all', sort: 'recent' };
      const inputs = document.querySelectorAll('[data-filter]');
      inputs.forEach(input => {
        if (input.tagName === 'SELECT') input.value = input.options[0].value;
        else if (input.tagName === 'INPUT') input.value = '';
      });
      draw();
    }
  });

  // Re-draw when local storage changes (e.g. favorited an item in catalog)
  window.addEventListener('cineview:storage-change', draw);

  draw();
}

export function collectionPage(all, kind) {
  const isFavorites = kind === 'favorites';
  const title = isFavorites ? 'Favoritos' : 'Minha Lista';
  const subtitle = isFavorites 
    ? 'Seus títulos preferidos reunidos em um só lugar.' 
    : 'Filmes e séries que você salvou para assistir mais tarde.';

  return `
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div class="mb-6">
        <p class="text-xs font-bold uppercase tracking-widest text-accent">Sua Coleção</p>
        <h1 class="display mt-1 text-3xl font-bold text-white sm:text-5xl">${title}</h1>
        <p class="mt-2 max-w-xl text-sm text-zinc-400">${subtitle}</p>
      </div>

      <!-- Filter Chips -->
      <div class="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4" data-collection-filter>
        <button data-type="all" class="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-md transition">Todos</button>
        <button data-type="movie" class="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/15">Filmes</button>
        <button data-type="series" class="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/15">Séries</button>
        ${!isFavorites ? `
          <button data-type="watched" class="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/15">Assistidos</button>
          <button data-type="unwatched" class="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/15">Quero assistir</button>
        ` : ''}
      </div>

      <div data-collection-grid class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"></div>
    </main>
  `;
}

export function attachCollection(all, kind) {
  const gridEl = document.querySelector('[data-collection-grid]');
  let currentFilter = 'all';

  const draw = () => {
    if (!gridEl) return;

    const ids = kind === 'favorites' ? getFavorites() : getWatchlist();
    let items = all.filter(x => ids.includes(x.id));

    if (currentFilter === 'watched') {
      items = items.filter(x => getWatched().includes(x.id));
    } else if (currentFilter === 'unwatched') {
      items = items.filter(x => !getWatched().includes(x.id));
    } else if (currentFilter !== 'all') {
      items = items.filter(x => x.type === currentFilter);
    }

    if (items.length > 0) {
      gridEl.innerHTML = items.map(card).join('');
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
  };

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-type]');
    if (btn && btn.closest('[data-collection-filter]')) {
      currentFilter = btn.dataset.type;
      document.querySelectorAll('[data-collection-filter] [data-type]').forEach(b => {
        const isCurrent = b === btn;
        b.className = `rounded-full ${isCurrent ? 'bg-accent text-white shadow-md' : 'bg-white/10 text-zinc-300 hover:bg-white/15'} px-4 py-2 text-xs font-semibold transition`;
      });
      draw();
    }
  });

  window.addEventListener('cineview:storage-change', draw);

  draw();
}

import { isWatched, inWatchlist } from './storage.js';

export function filterItems(items, q, { genre = 'all', year = 'all', rating = 'all', status = 'all', sort = 'recent' } = {}) {
  q = (q || '').toLowerCase().trim();

  let result = items.filter(x => {
    // Search query matches title, original title, description, genres, director, cast
    const textCorpus = [
      x.title,
      x.originalTitle || '',
      x.description || '',
      ...(x.genres || []),
      x.director || '',
      ...(x.cast || [])
    ].join(' ').toLowerCase();

    const matchesQuery = !q || textCorpus.includes(q);
    const matchesGenre = genre === 'all' || (x.genres && x.genres.includes(genre));
    const matchesYear = year === 'all' || x.year === Number(year);
    const matchesRating = rating === 'all' || x.rating >= Number(rating);

    let matchesStatus = true;
    if (status === 'watched') matchesStatus = isWatched(x.id);
    else if (status === 'unwatched') matchesStatus = !isWatched(x.id);
    else if (status === 'watchlist') matchesStatus = inWatchlist(x.id);

    return matchesQuery && matchesGenre && matchesYear && matchesRating && matchesStatus;
  });

  return result.sort((a, b) => {
    if (sort === 'old') return a.year - b.year;
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'az') return a.title.localeCompare(b.title);
    if (sort === 'za') return b.title.localeCompare(a.title);
    return b.year - a.year; // 'recent' by default
  });
}

export function controls(items) {
  const genres = [...new Set(items.flatMap(x => x.genres || []))].sort();
  const years = [...new Set(items.map(x => x.year))].sort((a, b) => b - a);

  return `
    <div class="grid gap-3 rounded-2xl border border-white/10 bg-panel p-4 sm:grid-cols-2 lg:grid-cols-6">
      <!-- Search Input -->
      <div class="sm:col-span-2 lg:col-span-2">
        <label class="sr-only" for="catalog-search">Pesquisar</label>
        <div class="relative flex items-center">
          <span class="absolute left-3 text-zinc-500">⌕</span>
          <input 
            id="catalog-search" 
            data-filter="q" 
            type="text"
            class="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-accent" 
            placeholder="Buscar por título, gênero, pessoa..."
          >
        </div>
      </div>

      <!-- Genre Filter -->
      <div>
        <label class="sr-only" for="filter-genre">Gênero</label>
        <select id="filter-genre" data-filter="genre" class="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-accent">
          <option value="all">Todos os gêneros</option>
          ${genres.map(g => `<option value="${g}">${g}</option>`).join('')}
        </select>
      </div>

      <!-- Year Filter -->
      <div>
        <label class="sr-only" for="filter-year">Ano</label>
        <select id="filter-year" data-filter="year" class="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-accent">
          <option value="all">Todos os anos</option>
          ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
        </select>
      </div>

      <!-- Rating Filter -->
      <div>
        <label class="sr-only" for="filter-rating">Avaliação</label>
        <select id="filter-rating" data-filter="rating" class="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-accent">
          <option value="all">Qualquer nota</option>
          <option value="9">9+ ★</option>
          <option value="8">8+ ★</option>
          <option value="7">7+ ★</option>
        </select>
      </div>

      <!-- Status Filter -->
      <div>
        <label class="sr-only" for="filter-status">Status</label>
        <select id="filter-status" data-filter="status" class="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-accent">
          <option value="all">Todos os status</option>
          <option value="watched">Assistidos</option>
          <option value="unwatched">Não assistidos</option>
          <option value="watchlist">Na Minha Lista</option>
        </select>
      </div>

      <!-- Sort Order -->
      <div class="sm:col-span-2 lg:col-span-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
        <div class="flex items-center gap-2 text-xs text-zinc-400">
          <span>Ordenar por:</span>
          <select data-filter="sort" class="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-accent">
            <option value="recent">Mais recentes</option>
            <option value="old">Mais antigos</option>
            <option value="rating">Melhor avaliação</option>
            <option value="az">Título A-Z</option>
            <option value="za">Título Z-A</option>
          </select>
        </div>

        <button 
          data-clear-filters 
          class="hidden text-xs font-semibold text-accent hover:underline"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  `;
}

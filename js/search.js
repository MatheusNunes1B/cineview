import { card } from './ui.js';

export function attachSearch(all) {
  const modal = document.querySelector('[data-search-modal]');
  if (!modal) return;

  const searchInput = document.querySelector('[data-global-search]');
  const resultsContainer = document.querySelector('[data-search-results]');

  const renderResults = (query) => {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      resultsContainer.innerHTML = '<p class="py-8 text-center text-sm text-zinc-500">Digite para pesquisar por título, gênero, elenco ou diretor...</p>';
      return;
    }

    const matches = all.filter(x => {
      const corpus = [
        x.title,
        x.originalTitle || '',
        x.description || '',
        ...(x.genres || []),
        x.director || '',
        ...(x.cast || [])
      ].join(' ').toLowerCase();

      return corpus.includes(q);
    });

    if (matches.length > 0) {
      resultsContainer.innerHTML = `
        <div class="mb-3 px-1 text-xs text-zinc-400">
          Encontrado${matches.length > 1 ? 's' : ''} ${matches.length} resultado${matches.length > 1 ? 's' : ''}:
        </div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          ${matches.map(card).join('')}
        </div>
      `;
    } else {
      resultsContainer.innerHTML = `
        <div class="py-8 text-center">
          <p class="text-base font-semibold text-zinc-300">Nenhum resultado para "${query}"</p>
          <p class="mt-1 text-xs text-zinc-500">Tente buscar por termos diferentes ou navegue pelos catálogos.</p>
        </div>
      `;
    }
  };

  const openSearch = () => {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      if (searchInput) searchInput.focus();
    }, 50);
  };

  const closeSearch = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  };

  document.addEventListener('click', e => {
    if (e.target.closest('[data-open-search]')) {
      openSearch();
    }
    if (e.target.closest('[data-close-search]') || e.target === modal) {
      closeSearch();
    }
  });

  document.addEventListener('input', e => {
    if (e.target.matches('[data-global-search]')) {
      renderResults(e.target.value);
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeSearch();
    }
  });

  window.addEventListener('cineview:storage-change', () => {
    if (!modal.classList.contains('hidden') && searchInput && searchInput.value) {
      renderResults(searchInput.value);
    }
  });
}

import { card, icon } from './ui.js';
import { inWatchlist, isFavorite } from './storage.js';
import { escapeHtml, formatRating } from './utils.js';

const HERO_INTERVAL = 10000;
const HERO_COUNT = 5;

/* ====================================================
   HOME PAGE – Hero + Carousel Rows with Nav Buttons
   ==================================================== */
export function homePage(all) {
  const markedFeatured = all.filter(x => x.featured);
  const remaining = all
    .filter(x => !markedFeatured.some(featured => featured.id === x.id))
    .sort((a, b) => b.rating - a.rating);
  const heroItems = [...markedFeatured, ...remaining].slice(0, HERO_COUNT);

  const fallback = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=85';

  const heroSlide = (item, index) => {
    const fav = isFavorite(item.id);
    const list = inWatchlist(item.id);

    return `
      <article
        class="hero hero-slide ${index === 0 ? 'is-active' : ''}"
        data-hero-slide
        data-index="${index}"
        aria-hidden="${index === 0 ? 'false' : 'true'}"
        ${index === 0 ? '' : 'inert'}
        style="background-image: url('${item.backdrop || item.poster || fallback}')"
      >
        <div class="relative z-10 mx-auto flex min-h-[560px] w-full max-w-7xl items-end px-4 pb-20 pt-24 sm:px-6 sm:pb-16">
          <div class="hero-content max-w-2xl">
            <div class="mb-3 flex flex-wrap items-center gap-2">
              <span class="rounded-md bg-accent px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40">Destaque</span>
              <span class="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-200">${item.type === 'series' ? 'Série' : 'Filme'}</span>
              <span class="text-xs font-bold text-amber-300">★ ${formatRating(item.rating)}</span>
              <span class="text-xs text-zinc-400">${item.year}</span>
              ${item.genres ? item.genres.slice(0, 3).map(genre =>
                `<span class="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-zinc-300">${escapeHtml(genre)}</span>`
              ).join('') : ''}
            </div>

            <h1 class="display text-4xl font-bold leading-tight text-white drop-shadow-2xl sm:text-6xl">
              ${escapeHtml(item.title)}
            </h1>

            <p class="mt-4 max-w-lg line-clamp-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
              ${escapeHtml(item.description)}
            </p>

            <div class="mt-6 flex flex-wrap items-center gap-3">
              <a class="flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-red-900/30 transition hover:scale-105 hover:bg-red-600 active:scale-95"
                 href="details.html?id=${item.id}">
                ▶ Ver detalhes
              </a>

              <button data-action="watchlist" data-id="${item.id}"
                class="flex items-center gap-2 rounded-xl ${list ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'} border border-white/10 px-5 py-3.5 text-sm font-semibold backdrop-blur-md transition hover:scale-105 active:scale-95">
                <span>${list ? icon.check : icon.plus}</span>
                <span>${list ? 'Na Minha Lista' : 'Minha Lista'}</span>
              </button>

              <button data-action="favorite" data-id="${item.id}"
                class="flex items-center justify-center rounded-xl ${fav ? 'bg-accent text-white' : 'bg-white/10 text-white hover:bg-white/20'} border border-white/10 p-3.5 text-base backdrop-blur-md transition hover:scale-110 active:scale-95"
                title="${fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                ${fav ? icon.heartFilled : icon.heartEmpty}
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  };

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
    <!-- =================== HERO CAROUSEL =================== -->
    <section
      class="hero-carousel"
      data-hero-carousel
      aria-roledescription="carrossel"
      aria-label="Destaques do CineView"
    >
      <div class="hero-slides">
        ${heroItems.map(heroSlide).join('')}
      </div>

      <button class="hero-arrow hero-arrow-prev" data-hero-nav="prev" aria-label="Destaque anterior">‹</button>
      <button class="hero-arrow hero-arrow-next" data-hero-nav="next" aria-label="Próximo destaque">›</button>

      <div class="hero-pagination" role="tablist" aria-label="Escolher destaque">
        ${heroItems.map((item, index) => `
          <button
            class="hero-dot ${index === 0 ? 'is-active' : ''}"
            data-hero-dot="${index}"
            role="tab"
            aria-selected="${index === 0 ? 'true' : 'false'}"
            aria-label="Mostrar ${escapeHtml(item.title)}"
          ></button>
        `).join('')}
      </div>

      <p class="hero-drag-hint" aria-hidden="true">Arraste para navegar</p>
    </section>

    <!-- ================== ROWS ================== -->
    <div class="space-y-2 py-6">
      ${row('row-featured', 'Em Destaque',          markedFeatured,                                   'movies.html')}
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
  const hero = document.querySelector('[data-hero-carousel]');

  if (hero) {
    const slides = [...hero.querySelectorAll('[data-hero-slide]')];
    const dots = [...hero.querySelectorAll('[data-hero-dot]')];
    const slidesArea = hero.querySelector('.hero-slides');
    const previousButton = hero.querySelector('[data-hero-nav="prev"]');
    const nextButton = hero.querySelector('[data-hero-nav="next"]');
    let current = 0;
    let intervalId = null;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let dragX = 0;
    let dragging = false;

    const stopAutoPlay = () => {
      window.clearInterval(intervalId);
      intervalId = null;
    };

    const startAutoPlay = () => {
      stopAutoPlay();
      intervalId = window.setInterval(() => {
        showSlide(current + 1);
      }, HERO_INTERVAL);
    };

    const showSlide = (index, restartTimer = false) => {
      const next = (index + slides.length) % slides.length;
      current = next;

      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === next;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.inert = !active;
        slide.style.removeProperty('transform');
      });

      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === next;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', String(active));
      });

      if (restartTimer) startAutoPlay();
    };

    previousButton?.addEventListener('click', event => {
      event.stopPropagation();
      showSlide(current - 1, true);
    });

    nextButton?.addEventListener('click', event => {
      event.stopPropagation();
      showSlide(current + 1, true);
    });

    dots.forEach(dot => {
      dot.addEventListener('click', event => {
        event.stopPropagation();
        showSlide(Number(dot.dataset.heroDot), true);
      });
    });

    slidesArea?.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      if (event.target.closest('a, button')) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      dragX = 0;
      dragging = false;
      stopAutoPlay();
      slidesArea.setPointerCapture(pointerId);
    });

    slidesArea?.addEventListener('pointermove', event => {
      if (event.pointerId !== pointerId) return;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;

      if (!dragging && Math.abs(deltaY) > Math.abs(deltaX)) return;
      if (Math.abs(deltaX) > 8) dragging = true;
      if (!dragging) return;

      event.preventDefault();
      dragX = deltaX;
      hero.classList.add('is-dragging');
      slides[current].style.transform = `translateX(${Math.max(-90, Math.min(90, dragX * 0.18))}px) scale(1.01)`;
    });

    const finishDrag = event => {
      if (event.pointerId !== pointerId) return;
      if (slidesArea.hasPointerCapture(pointerId)) slidesArea.releasePointerCapture(pointerId);
      slides[current].style.removeProperty('transform');
      hero.classList.remove('is-dragging');

      if (dragging && Math.abs(dragX) >= 50) {
        showSlide(current + (dragX < 0 ? 1 : -1), true);
      } else {
        startAutoPlay();
      }

      pointerId = null;
      dragging = false;
      dragX = 0;
    };

    slidesArea?.addEventListener('pointerup', finishDrag);
    slidesArea?.addEventListener('pointercancel', finishDrag);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAutoPlay();
      else startAutoPlay();
    });

    startAutoPlay();
  }

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

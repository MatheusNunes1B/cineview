const key = 'cineview:';

const read = n => {
  try {
    return JSON.parse(localStorage.getItem(key + n) || '[]');
  } catch (e) {
    console.error(`Erro ao ler ${n} do LocalStorage`, e);
    return [];
  }
};

const write = (n, v) => {
  try {
    localStorage.setItem(key + n, JSON.stringify(v));
    window.dispatchEvent(new CustomEvent('cineview:storage-change', { detail: { key: n, value: v } }));
  } catch (e) {
    console.error(`Erro ao gravar ${n} no LocalStorage`, e);
  }
};

const toggle = (n, id) => {
  const v = read(n);
  const exists = v.includes(id);
  const updated = exists ? v.filter(x => x !== id) : [...v, id];
  write(n, updated);
  return !exists;
};

// Favorites API
export const getFavorites = () => read('favorites');
export const isFavorite = id => getFavorites().includes(id);
export const addFavorite = id => toggle('favorites', id);
export const removeFavorite = id => toggle('favorites', id);

// Watchlist API
export const getWatchlist = () => read('watchlist');
export const inWatchlist = id => getWatchlist().includes(id);
export const addToWatchlist = id => toggle('watchlist', id);
export const removeFromWatchlist = id => toggle('watchlist', id);

// Watched API
export const getWatched = () => read('watched');
export const isWatched = id => getWatched().includes(id);
export const markAsWatched = id => toggle('watched', id);

// Stats API
export const getStats = () => ({
  favorites: getFavorites().length,
  watchlist: getWatchlist().length,
  watched: getWatched().length
});

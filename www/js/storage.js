import { getClient } from './backend.js';

const kinds = ['favorites', 'watchlist', 'watched'];
let client = null;
let user = null;
let ready = false;
let cache = { favorites: [], watchlist: [], watched: [] };
let queue = Promise.resolve();
export const getCurrentUser = () => user;
const read = kind => [...cache[kind]];
function emit(kind, value) {
  window.dispatchEvent(new CustomEvent('cineview:storage-change', { detail: { key: kind, value } }));
}

export async function initializeStorage() {
  client = await getClient();
  if (!client) throw new Error('Supabase não configurado.');
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  user = data.session?.user || null;
  client.auth.onAuthStateChange((_event, session) => {
    if ((session?.user?.id || null) !== (user?.id || null)) window.location.reload();
  });
  if (user) await loadCollections();
  ready = true;
}
async function loadCollections() {
  const next = { favorites: [], watchlist: [], watched: [] };
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from('user_collections')
      .select('kind,title_id').eq('user_id', user.id)
      .order('kind').order('title_id').range(offset, offset + 499);
    if (error) throw error;
    for (const row of data) next[row.kind]?.push(row.title_id);
    if (data.length < 500) break;
  }
  cache = next;
}
function change(kind, id, mode = 'toggle') {
  const task = queue.then(async () => {
    if (!ready) throw new Error('Não foi possível carregar sua conta. Recarregue a página.');
    if (!user) throw new Error('Entre na sua conta para salvar filmes e séries.');
    if (typeof id !== 'string' || !id) throw new Error('Título inválido.');
    const current = read(kind);
    const exists = current.includes(id);
    const added = mode === 'remove' ? false : !exists;
    const query = added
      ? client.from('user_collections').upsert({ user_id: user.id, title_id: id, kind },
          { onConflict: 'user_id,title_id,kind' })
      : client.from('user_collections').delete().eq('user_id', user.id).eq('title_id', id).eq('kind', kind);
    const { error } = await query;
    if (error) throw new Error('Não foi possível salvar no Supabase. Verifique sua conexão.');
    const updated = added ? [...current.filter(value => value !== id), id] : current.filter(value => value !== id);
    cache[kind] = updated;
    emit(kind, updated);
    return added;
  });
  queue = task.catch(() => {});
  return task;
}
export const getFavorites = () => read('favorites');
export const isFavorite = id => getFavorites().includes(id);
export const addFavorite = id => change('favorites', id);
export const removeFavorite = id => change('favorites', id, 'remove');
export const getWatchlist = () => read('watchlist');
export const inWatchlist = id => getWatchlist().includes(id);
export const addToWatchlist = id => change('watchlist', id);
export const removeFromWatchlist = id => change('watchlist', id, 'remove');
export const getWatched = () => read('watched');
export const isWatched = id => getWatched().includes(id);
export const markAsWatched = id => change('watched', id);
export const getStats = () => ({
  favorites: getFavorites().length, watchlist: getWatchlist().length, watched: getWatched().length
});

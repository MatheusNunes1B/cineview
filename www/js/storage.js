import { getClient } from './backend.js';
let client = null, user = null, ready = false, generation = 0;
let cache = { favorites: [], watchlist: [], watched: [] };
let queue = Promise.resolve();
export const getCurrentUser = () => user;
const read = kind => [...cache[kind]];
function emit(kind, value) {
  window.dispatchEvent(new CustomEvent('cineview:storage-change', { detail: { key: kind, value } }));
}
export function resetStorage() {
  generation++;
  user = null;
  ready = false;
  cache = { favorites: [], watchlist: [], watched: [] };
  emit('reset', []);
}
// AuthProvider restores the session before collections can load.
export async function initializeStorage(session, signal) {
  resetStorage();
  const version = generation;
  const nextClient = await getClient();
  if (version !== generation || signal?.aborted) return;
  client = nextClient;
  user = session?.user || null;
  if (user) {
    if (!client) throw new Error('Supabase não configurado.');
    const owner = user.id;
    const next = { favorites: [], watchlist: [], watched: [] };
    for (let offset = 0; ; offset += 500) {
      let query = client.from('user_collections').select('kind,title_id').eq('user_id', owner)
        .order('kind').order('title_id').range(offset, offset + 499);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query;
      if (version !== generation || signal?.aborted) return;
      if (error) throw new Error('Não foi possível carregar suas coleções. Tente novamente.');
      for (const row of data) next[row.kind]?.push(row.title_id);
      if (data.length < 500) break;
    }
    cache = next;
  }
  ready = true;
}
function change(kind, id, mode = 'toggle') {
  const version = generation, owner = user?.id;
  const task = queue.then(async () => {
    if (version !== generation) throw new Error('A conta mudou. Tente novamente.');
    if (!ready) throw new Error('Não foi possível carregar sua conta. Tente novamente.');
    if (!owner) throw new Error('Entre na sua conta para salvar filmes e séries.');
    if (typeof id !== 'string' || !id) throw new Error('Título inválido.');
    const current = read(kind);
    const added = mode === 'remove' ? false : !current.includes(id);
    const query = added
      ? client.from('user_collections').upsert({ user_id: owner, title_id: id, kind }, { onConflict: 'user_id,title_id,kind' })
      : client.from('user_collections').delete().eq('user_id', owner).eq('title_id', id).eq('kind', kind);
    const { error } = await query;
    if (version !== generation) throw new Error('A conta mudou. Tente novamente.');
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
export const getStats = () => ({ favorites: getFavorites().length, watchlist: getWatchlist().length, watched: getWatched().length });

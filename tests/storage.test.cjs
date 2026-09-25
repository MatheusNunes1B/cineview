const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup({ user = null, rows = [], fail = false } = {}) {
  const calls = [], events = [], state = { fail, rows };
  let authCallback;
  const client = {
    auth: {
      getSession: async () => ({ data: { session: user ? { user } : null }, error: null }),
      onAuthStateChange: callback => { authCallback = callback; }
    },
    from(table) {
      const call = { table, filters: [] }; calls.push(call);
      const query = {
        select() { call.op = 'select'; return this; },
        upsert(value, options) { call.op = 'upsert'; call.value = value; call.options = options; return this; },
        delete() { call.op = 'delete'; return this; },
        eq(key, value) { call.filters.push([key, value]); return this; },
        order() { return this; },
        range(start, end) { call.range = [start, end]; return this; },
        then(resolve, reject) {
          return Promise.resolve(state.fail ? { error: new Error('network') } : {
            error: null, data: call.op === 'select' ? state.rows.slice(call.range[0], call.range[1] + 1) : null
          }).then(resolve, reject);
        }
      };
      return query;
    }
  };
  let reloads = 0;
  const context = {
    getClient: async () => client,
    window: { dispatchEvent: event => events.push(event), location: { reload: () => reloads++ } },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }
  };
  const source = fs.readFileSync('www/js/storage.js', 'utf8')
    .replace(/^import .*;\r?\n/, '').replace(/export /g, '');
  const names = ['initializeStorage', 'getFavorites', 'getWatchlist', 'addFavorite',
    'removeFavorite', 'addToWatchlist', 'getCurrentUser'];
  vm.runInNewContext(source + '\nglobalThis.api = {' + names.join(',') + '};', context);
  return { ...context.api, calls, events, state, auth: session => authCallback('SIGNED_IN', session),
    reloads: () => reloads };
}

test('visitante não pode salvar e nenhuma coleção local é criada', async () => {
  const api = setup();
  await api.initializeStorage();
  await assert.rejects(api.addFavorite('m1'), /Entre na sua conta/);
  assert.equal(api.getFavorites().length, 0);
  assert.equal(api.calls.length, 0);
});
test('conta carrega coleções remotas e grava apenas depois de confirmação', async () => {
  const api = setup({ user: { id: 'A' }, rows: [{ kind: 'favorites', title_id: 'm2' }] });
  await api.initializeStorage();
  assert.equal(JSON.stringify(api.getFavorites()), '["m2"]');
  assert.deepEqual(api.calls[0].filters, [['user_id', 'A']]);
  await api.addToWatchlist('m3');
  assert.equal(JSON.stringify(api.calls[1].value), '{"user_id":"A","title_id":"m3","kind":"watchlist"}');
});
test('falha de gravação não altera cache nem emite sucesso', async () => {
  const api = setup({ user: { id: 'A' } });
  await api.initializeStorage();
  api.state.fail = true;
  await assert.rejects(api.addFavorite('m1'), /salvar/);
  assert.equal(api.getFavorites().length, 0);
  assert.equal(api.events.length, 0);
});
test('falha ao carregar conta bloqueia escrita', async () => {
  const api = setup({ user: { id: 'A' }, fail: true });
  await assert.rejects(api.initializeStorage());
  api.state.fail = false;
  await assert.rejects(api.addFavorite('m1'), /carregar/);
});
test('cliques concorrentes são serializados', async () => {
  const api = setup({ user: { id: 'A' } });
  await api.initializeStorage();
  const result = await Promise.all([api.addFavorite('m1'), api.addFavorite('m1')]);
  assert.deepEqual(result, [true, false]);
  assert.equal(api.getFavorites().length, 0);
  assert.equal(api.calls[2].op, 'delete');
});
test('troca de conta recarrega a página', async () => {
  const api = setup({ user: { id: 'A' } });
  await api.initializeStorage();
  api.auth({ user: { id: 'A' } });
  assert.equal(api.reloads(), 0);
  api.auth({ user: { id: 'B' } });
  assert.equal(api.reloads(), 1);
});
test('coleções com mais de 500 registros são carregadas integralmente', async () => {
  const rows = Array.from({ length: 501 }, (_, i) => ({ kind: 'favorites', title_id: 'm' + i }));
  const api = setup({ user: { id: 'A' }, rows });
  await api.initializeStorage();
  assert.equal(api.getFavorites().length, 501);
  assert.equal(api.calls.length, 2);
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { resolve } = require('node:path');

const modulePromise = import(pathToFileURL(resolve('src/services/catalog.js')).href);
function client(rows, failed = false) {
  return {
    from(name) {
      assert.equal(name, 'titles');
      let start = 0, end = 0;
      const query = {
        select(columns) {
          assert.equal(columns, 'id,type,title,details');
          return this;
        },
        order() { return this; },
        range(a, b) { start = a; end = b; return this; },
        abortSignal() {
          return Promise.resolve(failed ? { error: Error('offline') } :
            { data: rows.slice(start, end + 1), error: null });
        }
      };
      return query;
    }
  };
}
test('sem cliente, sem rede ou sem registros não há catálogo', async () => {
  const { loadCatalog } = await modulePromise;
  await assert.rejects(loadCatalog(null), /Configure/);
  await assert.rejects(loadCatalog(client([], true)), /consultar/);
  await assert.rejects(loadCatalog(client([])), /vazio/);
});
test('registros incompletos exigem novo seed', async () => {
  const { loadCatalog } = await modulePromise;
  await assert.rejects(loadCatalog(client([{ id: 'm1', type: 'movie', title: 'Filme', details: {} }])), /detalhes/);
});
test('catálogo completo vem do banco e usa campos principais do banco', async () => {
  const { loadCatalog } = await modulePromise;
  const items = await loadCatalog(client([{ id: 'm1', type: 'movie', title: 'Novo nome',
    details: { year: 2020, poster: './img/x.jpg', title: 'Nome antigo' } }]));
  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'Novo nome');
  assert.equal(items[0].poster, './img/x.jpg');
});
test('consulta pagina além de 500 títulos', async () => {
  const { loadCatalog } = await modulePromise;
  const rows = Array.from({ length: 501 }, (_, i) => ({
    id: 'm' + i, type: 'movie', title: 'Filme ' + i, details: { year: 2020, poster: 'poster.jpg' }
  }));
  assert.equal((await loadCatalog(client(rows))).length, 501);
});

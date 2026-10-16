const { test } = require('node:test');
const assert = require('node:assert/strict');
const modulePromise = import('../src/services/fetchWithTimeout.js');
const waitingFetch = async (_, { signal }) => new Promise((resolve, reject) => {
  if (signal.aborted) return reject(new Error('aborted'));
  signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
});
test('fetch interrompe rede parada sem AbortSignal.timeout/any', async () => {
  const { fetchWithTimeout } = await modulePromise;
  await assert.rejects(fetchWithTimeout('test', {}, 5, waitingFetch), /aborted/);
});
test('fetch propaga cancelamento da tela e sinal já cancelado', async () => {
  const { fetchWithTimeout } = await modulePromise;
  const controller = new AbortController();
  const pending = fetchWithTimeout('test', { signal: controller.signal }, 1000, waitingFetch);
  controller.abort(); await assert.rejects(pending, /aborted/);
  await assert.rejects(fetchWithTimeout('test', { signal: controller.signal }, 1000, waitingFetch), /aborted/);
});
test('fetch preserva resposta e remove listener após sucesso', async () => {
  const { fetchWithTimeout } = await modulePromise;
  let added = 0, removed = 0;
  const signal = { aborted: false, addEventListener() { added++; }, removeEventListener() { removed++; } };
  const result = await fetchWithTimeout('test', { signal }, 1000, async () => 'response');
  assert.equal(result, 'response'); assert.equal(added, 1); assert.equal(removed, 1);
});

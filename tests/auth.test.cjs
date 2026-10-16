const { test } = require('node:test');
const assert = require('node:assert/strict');
const modulePromise = import('../src/services/authPersistence.js');
const tick = () => new Promise(resolve => setImmediate(resolve));
const session = (id = 'A', token = 'fresh') => ({ user: { id, email: id + '@example.test' }, access_token: token, refresh_token: 'refresh-' + token });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
async function setup(options = {}) {
  const { createAuthController } = await modulePromise;
  let callback, inCallback = false, memory = null;
  const disk = { value: options.saved === undefined ? null : options.saved, calls: [], failRead: false, failWrite: false, failRemove: false };
  const stats = { restores: 0, subscriptions: 0, unsubscribes: 0 };
  const emit = (event, value) => { memory = value; inCallback = true; callback?.(event, value); inCallback = false; };
  const guard = () => assert.equal(inCallback, false, 'SDK auth must not run inside callback');
  const client = { auth: {
    onAuthStateChange(fn) { callback = fn; stats.subscriptions++; return { data: { subscription: { unsubscribe() { callback = null; stats.unsubscribes++; } } } }; },
    async getSession() { guard(); return { data: { session: memory }, error: null }; },
    async setSession(tokens) { guard(); stats.restores++; stats.tokens = tokens; await options.restoreDelay;
      if (options.restoreError) return { error: options.restoreError };
      emit('SIGNED_IN', options.restored || session()); return { data: { session: memory } }; },
    async signInWithPassword() { guard(); emit('SIGNED_IN', session()); return { data: { session: memory } }; },
    async signUp() { guard(); return { data: { session: null } }; },
    async signOut() { guard(); emit('SIGNED_OUT', null); return { error: null }; }
  } };
  const preferences = {
    async get({ key }) { assert.equal(key, 'supabase_session'); if (disk.failRead) throw Error(); return { value: disk.value }; },
    async set({ key, value }) { assert.equal(key, 'supabase_session'); await options.writeDelay;
      if (disk.failWrite) throw Error(); disk.value = value; disk.calls.push('set'); },
    async remove({ key }) { assert.equal(key, 'supabase_session'); if (disk.failRemove) throw Error(); disk.value = null; disk.calls.push('remove'); }
  };
  return { auth: createAuthController(options.noClient ? null : client, preferences, { timeoutMs: options.timeoutMs || 1000 }), disk, stats, emit, options };
}
test('ausência da chave e Supabase ausente terminam como visitante', async () => {
  for (const noClient of [false, true]) { const { auth, stats } = await setup({ noClient }); await auth.start(); assert.equal(auth.getSnapshot().loading, false); assert.equal(auth.getSnapshot().user, null); assert.equal(stats.restores, 0); auth.stop(); }
});
test('restaura tokens e reconstrói user; refresh expirado recebe sessão nova', async () => {
  const { auth, disk, stats } = await setup({ saved: JSON.stringify(session('A','expired')) });
  await auth.start(); assert.equal(auth.getSnapshot().user.id, 'A'); assert.equal(stats.tokens.access_token, 'expired'); assert.equal(JSON.parse(disk.value).access_token, 'fresh'); auth.stop();
});
test('SIGNED_IN e TOKEN_REFRESHED persistem antes de concluir', async () => {
  const { auth, disk, emit } = await setup(); await auth.start(); await auth.signIn({});
  assert.equal(JSON.parse(disk.value).user.id, 'A'); emit('TOKEN_REFRESHED', session('A','rotated')); await auth.flush();
  assert.equal(JSON.parse(disk.value).refresh_token, 'refresh-rotated'); auth.stop();
});
test('logout remove a chave e novo processo não restaura', async () => {
  const { auth, disk } = await setup(); await auth.start(); await auth.signIn({}); await auth.signOut();
  assert.equal(disk.value, null); assert.equal(auth.getSnapshot().user, null);
  const reopened = await setup({ saved: disk.value }); await reopened.auth.start(); assert.equal(reopened.stats.restores, 0); auth.stop(); reopened.auth.stop();
});
test('JSON corrompido, null e tokens incompletos são removidos', async () => {
  for(const saved of ['{broken','null','{}','{"access_token":1,"refresh_token":"r"}']) {
    const { auth,disk,stats }=await setup({saved}); await auth.start(); assert.equal(disk.value,null); assert.equal(stats.restores,0); auth.stop();
  }
});
test('token revogado é descartado; falha de rede preserva e permite retry', async () => {
  const saved=JSON.stringify(session());
  const invalid=await setup({saved,restoreError:{code:'refresh_token_not_found',status:400}});
  await invalid.auth.start(); assert.equal(invalid.disk.value,null); invalid.auth.stop();
  const offline=await setup({saved,restoreError:{name:'AuthRetryableFetchError',status:0}});
  await assert.rejects(offline.auth.start(),/preservada/); assert.equal(offline.disk.value,saved); assert.equal(offline.auth.getSnapshot().loading,false);
  offline.options.restoreError=null; await offline.auth.retry(); assert.equal(offline.auth.getSnapshot().user.id,'A'); offline.auth.stop();
});
test('erro de leitura e escrita tem retry sem rejeição não tratada', async () => {
  const api=await setup(); api.disk.failRead=true; await assert.rejects(api.auth.start(),/armazenamento/);
  api.disk.failRead=false; await api.auth.retry(); api.disk.failWrite=true;
  await assert.rejects(api.auth.signIn({}),/armazenamento/); api.disk.failWrite=false;
  await api.auth.retry(); assert.equal(JSON.parse(api.disk.value).user.id,'A'); api.auth.stop();
});
test('logout com falha de remoção só conclui após retry', async () => {
  const api=await setup(); await api.auth.start(); await api.auth.signIn({}); api.disk.failRemove=true;
  await assert.rejects(api.auth.signOut(),/armazenamento/); assert.equal(api.auth.getSnapshot().user,null);
  api.disk.failRemove=false; await api.auth.retry(); assert.equal(api.disk.value,null); assert.equal(api.auth.getSnapshot().error,null); api.auth.stop();
});
test('gravação antiga atrasada nunca passa à frente da remoção', async () => {
  const gate=deferred(), api=await setup({writeDelay:gate.promise}); await api.auth.start();
  api.emit('SIGNED_IN',session()); await tick(); const logout=api.auth.signOut(); await tick();
  assert.deepEqual(api.disk.calls,[]); gate.resolve(); await logout;
  assert.equal(api.disk.calls.at(-1),'remove'); assert.equal(api.disk.value,null); api.auth.stop();
});
test('bootstrap duplicado compartilha operação; logout espera bootstrap antigo', async () => {
  const gate=deferred(),api=await setup({saved:JSON.stringify(session()),restoreDelay:gate.promise});
  const a=api.auth.start(), b=api.auth.start(); assert.equal(a,b); await tick();
  const logout=api.auth.signOut(); gate.resolve(); await Promise.all([a,b,logout]);
  assert.equal(api.stats.restores,1); assert.equal(api.disk.value,null); assert.equal(api.auth.getSnapshot().user,null); api.auth.stop();
});
test('timeout libera loading; retry não cria outro bootstrap; cleanup remove listener', async () => {
  const gate=deferred(),api=await setup({saved:JSON.stringify(session()),restoreDelay:gate.promise,timeoutMs:10});
  const a=api.auth.start(); await new Promise(resolve=>setTimeout(resolve,30));
  assert.equal(api.auth.getSnapshot().loading,false); assert.match(api.auth.getSnapshot().error,/demorou/);
  assert.equal(api.auth.retry(),a); gate.resolve(); await a; assert.equal(api.auth.getSnapshot().error,null);
  api.auth.stop(); assert.equal(api.stats.unsubscribes,1); await api.auth.start(); assert.equal(api.stats.subscriptions,2); api.auth.stop();
});

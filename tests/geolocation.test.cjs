const { test } = require('node:test');
const assert = require('node:assert/strict');
const modulePromise = import('../src/services/geolocation.js');

const position = { coords: { latitude: -23.55, longitude: -46.63, accuracy: 8 }, timestamp: 1761800000000 };

test('captura coordenadas reais com alta precisão e descreve permissão precisa', async () => {
  const { createGeolocationService } = await modulePromise;
  let requestedOptions;
  const service = createGeolocationService({
    plugin: { checkPermissions: async () => ({ location: 'granted', coarseLocation: 'granted' }), getCurrentPosition: async options => { requestedOptions = options; return position; } },
    capacitor: { isNativePlatform: () => true }
  });
  assert.deepEqual(await service.getCurrentLocation(), { latitude: -23.55, longitude: -46.63, accuracy: 8, timestamp: position.timestamp, permission: { state: 'precise', precise: true } });
  assert.equal(requestedOptions.enableHighAccuracy, true);
  assert.equal(requestedOptions.timeout, 20000);
  assert.equal(requestedOptions.maximumAge, 0);
  assert.equal(requestedOptions.enableLocationFallback, true);
});

test('Android pede permissão ao usuário e identifica a permissão aproximada', async () => {
  const { createGeolocationService } = await modulePromise;
  let requested;
  const service = createGeolocationService({
    plugin: { checkPermissions: async () => ({ location: 'prompt', coarseLocation: 'prompt' }), requestPermissions: async value => { requested = value; return { location: 'denied', coarseLocation: 'granted' }; }, getCurrentPosition: async () => position },
    capacitor: { isNativePlatform: () => true }
  });
  const result = await service.getCurrentLocation();
  assert.deepEqual(requested, { permissions: ['location', 'coarseLocation'] });
  assert.deepEqual(result.permission, { state: 'approximate', precise: false });
});

test('permissão nativa negada não captura posição e permite erro específico', async () => {
  const { createGeolocationService, geolocationErrorMessage } = await modulePromise;
  let captured = false;
  const service = createGeolocationService({ plugin: { checkPermissions: async () => ({ location: 'denied', coarseLocation: 'denied' }), requestPermissions: async () => ({ location: 'denied', coarseLocation: 'denied' }), getCurrentPosition: async () => { captured = true; return position; } }, capacitor: { isNativePlatform: () => true } });
  await assert.rejects(service.getCurrentLocation(), error => error.code === 'permission-denied');
  assert.equal(captured, false);
  assert.match(geolocationErrorMessage({ code: 'permission-denied' }), /permissão.*negada/i);
  assert.match(geolocationErrorMessage({ code: 'OS-PLUG-GLOC-0003' }), /permissão.*negada/i);
  assert.match(geolocationErrorMessage({ code: 'OS-PLUG-GLOC-0007' }), /serviços de localização.*desativados/i);
  assert.match(geolocationErrorMessage({ code: 'OS-PLUG-GLOC-0010' }), /demorou/i);
});

test('Web usa o prompt do navegador sem chamar requestPermissions', async () => {
  const { createGeolocationService } = await modulePromise;
  let requested = false;
  const service = createGeolocationService({ plugin: { checkPermissions: async () => ({ location: 'prompt' }), requestPermissions: async () => { requested = true; }, getCurrentPosition: async options => { assert.equal(options.enableHighAccuracy, true); return position; } }, capacitor: { isNativePlatform: () => false } });
  const result = await service.getCurrentLocation();
  assert.equal(requested, false);
  assert.deepEqual(result.permission, { state: 'granted', precise: false });
});

test('Google Maps recebe coordenadas obtidas e usa Browser nativo', async () => {
  const { createGeolocationService } = await modulePromise;
  let opened;
  const service = createGeolocationService({ capacitor: { isNativePlatform: () => true }, browser: { open: async value => { opened = value; } } });
  await service.openMaps({ latitude: position.coords.latitude, longitude: position.coords.longitude });
  assert.equal(opened.url, 'https://www.google.com/maps/search/?api=1&query=-23.55,-46.63');
});

test('Google Maps na Web abre URL segura em nova aba', async () => {
  const { createGeolocationService } = await modulePromise;
  let opened;
  const service = createGeolocationService({ capacitor: { isNativePlatform: () => false }, web: { open: (...args) => { opened = args; return {}; } } });
  await service.openMaps({ latitude: position.coords.latitude, longitude: position.coords.longitude });
  assert.deepEqual(opened, ['https://www.google.com/maps/search/?api=1&query=-23.55,-46.63', '_blank', 'noopener,noreferrer']);
});

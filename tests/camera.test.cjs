const { test } = require('node:test');
const assert = require('node:assert/strict');
const modulePromise = import('../src/services/cameraErrors.js');

test('cancelamento do getPhoto no Android (mensagem sem code) não é tratado como falha', async () => {
  const { classifyCameraError, cameraMessages } = await modulePromise;
  const result = classifyCameraError(new Error('User cancelled photos app'));
  assert.equal(result.kind, 'cancelled');
  assert.equal(result.message, cameraMessages.cancelled);
});

test('códigos oficiais CameraErrorCode de cancelamento também são reconhecidos', async () => {
  const { classifyCameraError } = await modulePromise;
  const { CameraErrorCode } = await import('@capacitor/camera');
  for (const code of [CameraErrorCode.TakePhotoCancelled, CameraErrorCode.ChooseMediaCancelled]) {
    assert.equal(classifyCameraError({ code, message: 'texto qualquer' }).kind, 'cancelled');
  }
});

test('permissões negadas e falta de câmera ou galeria geram mensagens específicas', async () => {
  const { classifyCameraError } = await modulePromise;
  const { CameraErrorCode } = await import('@capacitor/camera');
  assert.equal(classifyCameraError(new Error('User denied access to camera')).kind, 'camera-denied');
  assert.equal(classifyCameraError(new Error('User denied access to photos')).kind, 'photos-denied');
  assert.equal(classifyCameraError({ code: CameraErrorCode.CameraPermissionDenied }).kind, 'camera-denied');
  assert.equal(classifyCameraError({ code: CameraErrorCode.GalleryPermissionDenied }).kind, 'photos-denied');
  assert.equal(classifyCameraError(new Error("Device doesn't have a camera available")).kind, 'no-camera');
  assert.equal(classifyCameraError(new Error('Unable to resolve camera activity')).kind, 'no-camera');
  assert.equal(classifyCameraError(new Error('Unable to resolve photo activity')).kind, 'no-gallery');
});

test('plugin não sincronizado na plataforma é identificado sem expor detalhes técnicos', async () => {
  const { classifyCameraError } = await modulePromise;
  const { CapacitorException, ExceptionCode } = await import('@capacitor/core');
  const result = classifyCameraError(new CapacitorException('"Camera" plugin is not implemented on android', ExceptionCode.Unimplemented));
  assert.equal(result.kind, 'unavailable');
  assert.doesNotMatch(result.message, /not implemented/);
});

test('falhas desconhecidas viram mensagem amigável sem vazar o texto original', async () => {
  const { classifyCameraError, cameraMessages } = await modulePromise;
  for (const error of [new Error('Unable to process image /data/user/0/com.cineview/cache/foto.jpg'), null, undefined, 42, {}]) {
    const result = classifyCameraError(error);
    assert.equal(result.kind, 'failed');
    assert.equal(result.message, cameraMessages.failed);
  }
});

test('somente o estado "denied" bloqueia o acesso; prompt e limited permitem continuar', async () => {
  const { isPermissionBlocked } = await modulePromise;
  assert.equal(isPermissionBlocked('denied'), true);
  for (const state of ['granted', 'prompt', 'prompt-with-rationale', 'limited', undefined]) {
    assert.equal(isPermissionBlocked(state), false);
  }
});

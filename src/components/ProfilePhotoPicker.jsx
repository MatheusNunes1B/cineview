import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { cameraMessages, classifyCameraError, isPermissionBlocked } from '../services/cameraErrors.js';
import { loadWebCameraUi } from '../services/webCameraUi.js';
import { uploadPhotoToStorage } from '../services/photoStorage.js';

const LOG_PREFIX = '[CineView][Câmera]';
const native = Capacitor.isNativePlatform();

// Camera.getPhoto() continua disponível no @capacitor/camera 8.x (marcado como deprecated em favor de
// takePhoto/chooseFromGallery) e é a chamada que abre a escolha entre câmera e galeria.
const PHOTO_OPTIONS = {
  source: CameraSource.Prompt,
  resultType: CameraResultType.Uri, // devolve path/webPath, sem trafegar base64 pela ponte nativa
  quality: 80,
  width: 1600, // limita o maior lado da imagem; o plugin preserva a proporção
  height: 1600,
  correctOrientation: true,
  allowEditing: false,
  saveToGallery: false, // não grava na galeria, por isso não exige permissões de armazenamento
  promptLabelHeader: 'Sua foto',
  promptLabelPhoto: 'Escolher da galeria',
  promptLabelPicture: 'Tirar foto',
  promptLabelCancel: 'Cancelar'
};

// No navegador o plugin não implementa requestPermissions(): o próprio navegador controla o acesso.
async function readPermissions() {
  if (!native) return null;
  try {
    return await Camera.checkPermissions();
  } catch (error) {
    console.warn(LOG_PREFIX, 'Não foi possível consultar as permissões:', error?.message);
    return null;
  }
}

const CameraIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <path d="M14.5 4h-5L7.5 6.5H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2.5z" /><circle cx="12" cy="13" r="3.5" />
</svg>;

// Botão flutuante visível em todas as páginas + painel NÃO modal com a pré-visualização.
// O painel não pode ser um <dialog> modal: a interface do plugin no navegador é inserida no <body>
// e ficaria bloqueada atrás de um modal.
export default function ProfilePhotoPicker({ userId }) {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [open, setOpen] = useState(false);
  const pending = useRef(false);
  const fab = useRef(null);
  const restoreFocus = useRef(false);

  // Prepara a interface Web antes do primeiro clique (no Android não faz nada).
  useEffect(() => { if (!native) void loadWebCameraUi(); }, []);

  // A versão Web devolve URLs blob:, que precisam ser liberadas ao trocar ou remover a foto.
  useEffect(() => {
    const url = photo?.webPath;
    return () => { if (url?.startsWith('blob:')) URL.revokeObjectURL(url); };
  }, [photo?.webPath]);

  // Se o Android encerrar o CineView enquanto a câmera estiver aberta, o resultado chega ao reabrir o app.
  useEffect(() => {
    if (!native) return undefined;
    let active = true, handle;
    App.addListener('appRestoredResult', event => {
      if (!active || event.pluginId !== 'Camera' || event.methodName !== 'getPhoto') return;
      if (event.success && event.data?.webPath) {
        void uploadPhotoToStorage({ ...event.data, userId }).then(uploaded => {
          setPhoto({ ...event.data, ...uploaded });
          setFeedback({ tone: 'success', text: 'Foto enviada para o Supabase.' });
        }).catch(error => {
          console.error(LOG_PREFIX, 'Não foi possível enviar a foto recuperada.', error?.message);
          setPhoto({ webPath: event.data.webPath, format: event.data.format });
          setFeedback({ tone: 'error', text: `A foto foi capturada, mas o envio falhou: ${error.message}` });
        });
        setFeedback(null);
        setOpen(true);
      } else if (!event.success && classifyCameraError(event.error).kind !== 'cancelled') {
        console.error(LOG_PREFIX, 'A foto não pôde ser recuperada após o Android reabrir o app.');
      }
    }).then(listener => { if (active) handle = listener; else void listener.remove(); })
      .catch(error => console.warn(LOG_PREFIX, 'appRestoredResult indisponível:', error?.message));
    return () => { active = false; void handle?.remove(); };
  }, []);

  // Esc fecha o painel (exceto durante a captura ou com outro diálogo aberto).
  useEffect(() => {
    if (!open) return undefined;
    const onKey = event => {
      if (event.key === 'Escape' && !pending.current && !document.querySelector('dialog[open]')) close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open && restoreFocus.current) { restoreFocus.current = false; fab.current?.focus(); }
  }, [open]);

  function close() {
    restoreFocus.current = true;
    setOpen(false);
  }

  async function choosePhoto() {
    if (pending.current) return; // ignora toques repetidos enquanto a câmera ou a galeria está aberta
    pending.current = true;
    setOpen(true);
    setLoading(true);
    setFeedback(null);
    const hadPhoto = Boolean(photo);
    try {
      const permissions = await readPermissions();
      if (permissions && isPermissionBlocked(permissions.camera) && isPermissionBlocked(permissions.photos)) {
        console.warn(LOG_PREFIX, 'Câmera e fotos bloqueadas pelo sistema.', permissions);
        setFeedback({ tone: 'error', text: cameraMessages['all-blocked'] });
        return;
      }
      // Android: escolha nativa (o próprio plugin pede a permissão da câmera quando ela é necessária).
      // Navegador: interface Web oficial do plugin; se ela não carregar, o seletor de arquivos do plugin.
      const options = native ? PHOTO_OPTIONS : { ...PHOTO_OPTIONS, webUseInput: !(await loadWebCameraUi()) };
      const result = await Camera.getPhoto(options);
      if (!result?.webPath) {
        console.error(LOG_PREFIX, 'O plugin não retornou webPath para a imagem.');
        setFeedback({ tone: 'error', text: cameraMessages['invalid-photo'] });
        return;
      }
      setPhoto({ webPath: result.webPath, format: result.format });
      setFeedback({ tone: 'info', text: 'Foto capturada. Enviando para o Supabase…' });
      try {
        const uploaded = await uploadPhotoToStorage({ ...result, userId });
        setPhoto({ webPath: result.webPath, format: result.format, ...uploaded });
        setFeedback({ tone: 'success', text: 'Foto enviada para o Supabase.' });
      } catch (uploadError) {
        console.error(LOG_PREFIX, 'A foto foi capturada, mas o envio falhou.', uploadError?.message);
        setFeedback({ tone: 'error', text: `A foto foi capturada, mas o envio falhou: ${uploadError.message}` });
      }
      setOpen(true);
    } catch (error) {
      const failure = classifyCameraError(error);
      if (failure.kind === 'cancelled') {
        console.info(LOG_PREFIX, 'Operação cancelada pelo usuário.');
        setFeedback({ tone: 'info', text: hadPhoto ? cameraMessages['cancelled-keep'] : failure.message });
        return;
      }
      console.error(LOG_PREFIX, 'Não foi possível obter a foto.', { kind: failure.kind, code: error?.code, message: error?.message });
      let text = failure.message;
      if (failure.kind === 'camera-denied' && isPermissionBlocked((await readPermissions())?.camera)) {
        text = cameraMessages['camera-blocked'];
      }
      setFeedback({ tone: 'error', text });
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }

  function removePhoto() {
    setPhoto(null);
    setFeedback(null);
  }

  function handleImageError() {
    console.error(LOG_PREFIX, 'A WebView não conseguiu exibir a imagem retornada pelo plugin.');
    setPhoto(null);
    setFeedback({ tone: 'error', text: cameraMessages['invalid-photo'] });
  }

  if (!open) {
    return <button type="button" ref={fab} className="photo-fab" data-photo-fab
      aria-label={photo ? 'Ver sua foto' : undefined}
      onClick={() => { if (photo || pending.current) setOpen(true); else void choosePhoto(); }}>
      {photo ? <><img className="photo-fab-thumb" src={photo.publicUrl || photo.webPath} alt="" />Sua foto</> : <><CameraIcon />Tirar Foto / Galeria</>}
    </button>;
  }

  return <aside className="photo-panel" data-photo-panel aria-labelledby="photo-panel-title">
    <div className="photo-panel-head">
      <div>
        <h2 id="photo-panel-title">Sua foto</h2>
        <p>Tire uma foto com a câmera ou escolha uma imagem da galeria do aparelho.</p>
      </div>
      <button type="button" className="photo-panel-close" aria-label="Fechar painel da foto" disabled={loading} onClick={close}>×</button>
    </div>
    <div className="photo-frame" data-state={photo ? 'photo' : loading ? 'loading' : 'empty'} aria-busy={loading}>
      {photo
        ? <img className="photo-image" src={photo.webPath} alt="Foto selecionada" decoding="async" onError={handleImageError} />
        : <div className={loading ? 'photo-empty skeleton' : 'photo-empty'}>
          <span className="photo-icon"><CameraIcon /></span>
          <span>{loading ? 'Aguardando a câmera ou a galeria…' : 'Nenhuma foto selecionada'}</span>
        </div>}
      {photo && loading && <div className="photo-overlay">Aguardando a câmera ou a galeria…</div>}
    </div>
    {photo && <p className="photo-caption">Imagem armazenada no Supabase Storage. Bucket: user-photos.</p>}
    {feedback && <p className="photo-feedback" data-tone={feedback.tone} role={feedback.tone === 'error' ? 'alert' : 'status'}>{feedback.text}</p>}
    <div className="photo-actions">
      <button type="button" className="photo-primary" disabled={loading} aria-busy={loading} onClick={() => { void choosePhoto(); }}>
        {loading ? <><span className="photo-spinner" aria-hidden="true" />Abrindo câmera ou galeria…</> : photo ? 'Trocar foto' : 'Tirar Foto / Galeria'}
      </button>
      {photo && <button type="button" className="photo-secondary" disabled={loading} onClick={removePhoto}>Remover foto</button>}
    </div>
  </aside>;
}

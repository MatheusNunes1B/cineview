import { ExceptionCode } from '@capacitor/core';
import { CameraErrorCode } from '@capacitor/camera';

// Mensagens para o usuário: nunca exibem caminhos, conteúdo da imagem ou detalhes internos.
// No Android, Camera.getPhoto() (LegacyCameraFlow do @capacitor/camera 8.x) rejeita apenas com
// as mensagens fixas abaixo, sem `code`. Os códigos CameraErrorCode (8.2+) também são aceitos.
const NATIVE_MESSAGES = {
  'User cancelled photos app': 'cancelled',
  'User denied access to camera': 'camera-denied',
  'User denied access to photos': 'photos-denied',
  "Device doesn't have a camera available": 'no-camera',
  'Unable to resolve camera activity': 'no-camera',
  'Unable to resolve photo activity': 'no-gallery'
};

const ERROR_CODES = {
  [CameraErrorCode.TakePhotoCancelled]: 'cancelled',
  [CameraErrorCode.ChooseMediaCancelled]: 'cancelled',
  [CameraErrorCode.CameraPermissionDenied]: 'camera-denied',
  [CameraErrorCode.GalleryPermissionDenied]: 'photos-denied',
  [CameraErrorCode.NoCameraAvailable]: 'no-camera',
  [ExceptionCode.Unimplemented]: 'unavailable',
  [ExceptionCode.Unavailable]: 'unavailable'
};

export const cameraMessages = {
  cancelled: 'Nenhuma foto foi selecionada. Quando quiser, é só tentar de novo.',
  'cancelled-keep': 'Nenhuma nova foto foi escolhida. A foto atual foi mantida.',
  'camera-denied': 'O CineView não recebeu permissão para usar a câmera. Tente de novo e toque em “Permitir”, ou escolha uma imagem da galeria.',
  'camera-blocked': 'O acesso à câmera está bloqueado. Para tirar fotos, libere a permissão em Configurações › Apps › CineView › Permissões. A galeria continua disponível.',
  'photos-denied': 'O CineView não recebeu permissão para acessar suas fotos. Libere o acesso nas configurações do aparelho ou tire uma foto com a câmera.',
  'all-blocked': 'O acesso à câmera e às fotos está bloqueado. Libere as permissões do CineView nas configurações do aparelho para continuar.',
  'no-camera': 'Não encontramos um aplicativo de câmera disponível neste aparelho. Escolha uma imagem da galeria.',
  'no-gallery': 'Não foi possível abrir a galeria deste aparelho. Tente tirar uma foto com a câmera.',
  unavailable: 'A câmera e a galeria não estão disponíveis nesta versão do CineView.',
  'invalid-photo': 'Não foi possível exibir a imagem escolhida. Tente outra foto.',
  failed: 'Não foi possível carregar a foto. Tente novamente.'
};

// Diferencia o cancelamento voluntário de falhas reais (permissão, hardware ou processamento).
export function classifyCameraError(error) {
  const code = typeof error?.code === 'string' ? error.code : '';
  const text = typeof error === 'string' ? error : typeof error?.message === 'string' ? error.message : '';
  const kind = ERROR_CODES[code] || NATIVE_MESSAGES[text.trim()] || 'failed';
  return { kind, message: cameraMessages[kind] };
}

// "denied" = negada de forma definitiva ("não perguntar novamente" no Android; negada ou restrita no iOS).
// "prompt", "prompt-with-rationale" e "limited" ainda permitem continuar.
export function isPermissionBlocked(state) {
  return state === 'denied';
}

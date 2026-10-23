import { Capacitor } from '@capacitor/core';

// Só no navegador: carrega a interface Web oficial do @capacitor/camera (PWA Elements), com a folha
// "Tirar foto / Escolher da galeria" e a câmera do computador ou celular. No app Android ela nunca é
// carregada: lá o próprio plugin abre a interface nativa do sistema.
// Usa o build ESM moderno do pacote (o mesmo defineCustomElements de '@ionic/pwa-elements/loader',
// sem os polyfills ES5, desnecessários para o alvo es2019 do projeto).
let loading = null;

export function loadWebCameraUi() {
  if (Capacitor.isNativePlatform() || typeof window === 'undefined' || !window.customElements) return Promise.resolve(false);
  return loading ??= import('@ionic/pwa-elements/dist/esm/loader.js')
    .then(({ defineCustomElements }) => defineCustomElements(window))
    .then(() => Boolean(customElements.get('pwa-action-sheet') && customElements.get('pwa-camera-modal')))
    .catch(error => {
      console.warn('[CineView][Câmera] Interface Web da câmera indisponível; usando o seletor de arquivos do plugin.', error?.message);
      return false;
    });
}

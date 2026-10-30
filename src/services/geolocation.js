import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Geolocation } from '@capacitor/geolocation';

const options = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 0,
  enableLocationFallback: true
};

export function createGeolocationService({ plugin = Geolocation, capacitor = Capacitor, browser = Browser, web = globalThis.window } = {}) {
  async function permissions() {
    let status = await plugin.checkPermissions();
    if (capacitor.isNativePlatform() && status.location !== 'granted' && status.coarseLocation !== 'granted') {
      status = await plugin.requestPermissions({ permissions: ['location', 'coarseLocation'] });
    }
    return {
      state: status.location === 'granted' ? 'precise' : status.coarseLocation === 'granted' ? 'approximate' : status.location,
      precise: status.location === 'granted'
    };
  }

  async function getCurrentLocation() {
    const permission = await permissions();
    if (permission.state === 'denied' || (capacitor.isNativePlatform() && permission.state !== 'precise' && permission.state !== 'approximate')) {
      const error = new Error(permission.state === 'denied' ? 'permission-denied' : 'permission-required');
      error.code = permission.state === 'denied' ? 'permission-denied' : 'permission-required';
      throw error;
    }
    const position = await plugin.getCurrentPosition(options);
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
      permission: permission.state === 'prompt' ? { state: 'granted', precise: false } : permission
    };
  }

  async function openMaps({ latitude, longitude }) {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    if (capacitor.isNativePlatform()) return browser.open({ url });
    web?.open(url, '_blank', 'noopener,noreferrer');
  }

  return { permissions, getCurrentLocation, openMaps };
}

export const geolocation = createGeolocationService();

export function geolocationErrorMessage(error) {
  const code = error?.code || error?.message;
  if (code === 'permission-denied' || code === 'denied' || code === 'OS-PLUG-GLOC-0003' || code === 1 || error?.name === 'NotAllowedError') return 'A permissão de localização foi negada. Libere o acesso à localização nas configurações do aparelho ou navegador e tente novamente.';
  if (code === 'permission-required' || code === 'prompt' || code === 'prompt-with-rationale') return 'Permita o acesso à localização para obter suas coordenadas.';
  if (['OS-PLUG-GLOC-0007', 'OS-PLUG-GLOC-0009', 'OS-PLUG-GLOC-0014', 'OS-PLUG-GLOC-0016', 'OS-PLUG-GLOC-0017'].includes(code)) return 'Os serviços de localização estão desativados ou indisponíveis. Ative a localização nas configurações do aparelho e tente novamente.';
  if (code === 'POSITION_UNAVAILABLE' || code === 'OS-PLUG-GLOC-0002' || code === 'OS-PLUG-GLOC-0015' || code === 2 || error?.name === 'PositionUnavailableError') return 'Não foi possível obter a localização. Confira o sinal e se os serviços de localização estão ativados.';
  if (code === 'TIMEOUT' || code === 'OS-PLUG-GLOC-0010' || code === 3 || error?.name === 'TimeoutError') return 'A localização demorou para responder. Vá para um local com melhor sinal e tente novamente.';
  return 'Não foi possível obter a localização. Confira as permissões e tente novamente.';
}

import { useState } from 'react';
import { geolocation, geolocationErrorMessage } from '../services/geolocation.js';

const permissionLabel = state => ({
  'not-requested': 'ainda não solicitada',
  precise: 'precisa',
  approximate: 'aproximada',
  granted: 'concedida pelo navegador (precisão informada pelo navegador)',
  denied: 'negada',
  prompt: 'aguardando decisão no navegador',
  'permission-required': 'aguardando autorização'
}[state] || state);

export default function LocationSection() {
  const [location, setLocation] = useState(null);
  const [permission, setPermission] = useState('not-requested');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function capture() {
    if (loading) return;
    setLoading(true); setError(''); setMessage('');
    try {
      const result = await geolocation.getCurrentLocation();
      setLocation(result); setPermission(result.permission.state);
      setMessage(result.permission.state === 'precise' ? 'Localização precisa obtida.' : result.permission.state === 'approximate' ? 'Localização aproximada obtida. O aparelho não concedeu precisão de GPS.' : 'Localização obtida; a precisão foi informada pelo navegador.');
    } catch (failure) {
      setError(geolocationErrorMessage(failure));
      if (['permission-denied', 'OS-PLUG-GLOC-0003', 1].includes(failure?.code) || failure?.name === 'NotAllowedError') setPermission('denied');
    } finally { setLoading(false); }
  }

  return <section className="location-section" aria-labelledby="location-title">
    <h3 id="location-title">Localização</h3>
    <p>Obtenha suas coordenadas quando quiser. Elas não serão salvas nem enviadas.</p>
    <button type="button" disabled={loading} onClick={() => { void capture(); }}>
      {loading ? 'Obtendo localização…' : 'Obter minha localização'}
    </button>
    <p>Permissão: <strong>{permissionLabel(permission)}</strong></p>
    {loading && <p role="status">Buscando sinal de localização…</p>}
    {error && <p className="location-error" role="alert">{error}</p>}
    {message && <p className="location-message" role="status">{message}</p>}
    {location && <div className="location-result">
      <p>Latitude: <strong>{location.latitude.toFixed(6)}</strong></p>
      <p>Longitude: <strong>{location.longitude.toFixed(6)}</strong></p>
      <p>Precisão: <strong>{Math.round(location.accuracy)} m ({permissionLabel(location.permission.state)})</strong></p>
      <p>Capturada: <strong><time dateTime={new Date(location.timestamp).toISOString()}>{new Date(location.timestamp).toLocaleString()}</time></strong></p>
      <button type="button" onClick={() => { void geolocation.openMaps(location).catch(failure => setError(geolocationErrorMessage(failure))); }}>Ver localização no Google Maps</button>
    </div>}
    {error && <button type="button" onClick={() => { void capture(); }}>Tentar novamente</button>}
  </section>;
}

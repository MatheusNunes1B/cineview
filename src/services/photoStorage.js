import { supabase } from './supabaseClient.js';

const BUCKET = 'user-photos';

function contentTypeFor(blob, format) {
  if (blob.type?.startsWith('image/')) return blob.type;
  const normalized = String(format || 'jpeg').toLowerCase().replace(/^\./, '');
  const subtype = normalized === 'jpg' ? 'jpeg' : normalized;
  return `image/${subtype}`;
}

function extensionFor(contentType) {
  const subtype = contentType.split('/')[1]?.split(';')[0] || 'jpeg';
  return subtype === 'jpeg' ? 'jpg' : subtype;
}

export async function uploadPhotoToStorage(photo) {
  if (!supabase) throw new Error('Supabase não está configurado neste aplicativo.');
  if (!photo?.webPath) throw new Error('O plugin da câmera não retornou o endereço da imagem.');
  if (!photo.userId) throw new Error('Entre na sua conta para enviar a foto.');

  // webPath funciona tanto para o URI servido pelo Capacitor quanto para blob: no navegador.
  const response = await fetch(photo.webPath);
  if (!response.ok) throw new Error('Não foi possível ler a imagem capturada.');
  const blob = await response.blob();
  if (!blob.size) throw new Error('A imagem capturada está vazia.');

  const contentType = contentTypeFor(blob, photo.format);
  const path = `${photo.userId}/${crypto.randomUUID()}.${extensionFor(contentType)}`;
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType,
    cacheControl: '3600',
    upsert: false
  });
  if (error) throw error;

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  if (!publicData?.publicUrl) throw new Error('O Supabase não retornou a URL pública da foto.');
  return { storagePath: data.path, publicUrl: publicData.publicUrl };
}

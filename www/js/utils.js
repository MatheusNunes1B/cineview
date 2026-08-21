export const params = () => new URLSearchParams(location.search);

export const detailUrl = id => `details.html?id=${encodeURIComponent(id)}`;

export const escapeHtml = str => {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
};

export const formatDuration = (min, type = 'movie') => {
  if (!min) return 'N/I';
  if (type === 'series') return `${min} min/ep`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m < 10 ? '0' : ''}${m}m` : `${h}h`;
};

export const formatRating = rating => {
  if (rating === undefined || rating === null) return 'N/A';
  return Number(rating).toFixed(1);
};

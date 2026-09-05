export function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatTime(timeStr) {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

export function formatPrice(price) {
  if (!price && price !== 0) return '';
  return `$${Number(price).toFixed(0)}`;
}

export function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function generateTimeSlots(startTime, endTime, duration) {
  const slots = [];
  let [h, m] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  while (h < eh || (h === eh && m < em)) {
    const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const totalMin = h * 60 + m + duration;
    const endH = Math.floor(totalMin / 60);
    const endM = totalMin % 60;
    if (endH > eh || (endH === eh && endM > em)) break;
    const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    slots.push({ start, end });
    h = endH;
    m = endM;
  }
  return slots;
}

export function statusColor(status) {
  const colors = {
    pending: 'badge-pending',
    confirmed: 'badge-confirmed',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    rejected: 'badge-rejected',
  };
  return colors[status] || 'badge-pending';
}

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

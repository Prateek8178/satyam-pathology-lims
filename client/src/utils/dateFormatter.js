/**
 * Universal Date and Time Formatter with AM/PM (12-hour format)
 */

export const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatAMPM = (timeStr) => {
  if (!timeStr) return '';
  if (typeof timeStr !== 'string') {
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return '';
  }
  if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = parts[1].slice(0, 2);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};

export const formatDateTimeAMPM = (dateVal, timeStr) => {
  if (!dateVal && !timeStr) return '—';
  const datePart = dateVal ? formatDate(dateVal) : '';
  const timePart = timeStr ? formatAMPM(timeStr) : (dateVal ? formatAMPM(new Date(dateVal).toTimeString().slice(0, 5)) : '');
  return [datePart, timePart].filter(Boolean).join(' · ') || '—';
};

export const getNowTimeAMPM = () => {
  const n = new Date();
  let h = n.getHours();
  const m = String(n.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};

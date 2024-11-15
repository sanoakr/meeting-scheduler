export function formatDateWithWeekday(dateString) {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleString('ja-JP', options);
}

export function formatTime(dateString) {
  const options = {
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleTimeString('ja-JP', options);
}
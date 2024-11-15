export function getColorByUserName(name) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#3498DB', '#1ABC9C', '#F1C40F',
    '#E74C3C', '#2ECC71', '#E67E22', '#7F8C8D', '#C0392B',
    '#8E44AD', '#F39C12', '#16A085', '#D35400', '#27AE60',
    '#2980B9', '#E84393', '#6C5CE7', '#00B894', '#00CEC9',
    '#FD79A8', '#6C5CE7', '#FDA7DF', '#A8E6CF', '#DCEDC1',
    '#FFD3B6', '#FF8B94', '#B83B5E', '#6A2C70', '#08D9D6'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

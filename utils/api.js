// API URLを生成する関数
export function getApiUrl(endpoint) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  // endpointが既にスラッシュで始まっているか確認
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${basePath}${path}`;
}
// Socket.IO URLを生成する関数を追加
export function getSocketUrl() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${basePath}`;
  }
  
  return '';
}
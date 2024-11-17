// pages/_app.js
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  useEffect(() => {
    // 他の設定が必要な場合に追加
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // basePath が設定されている場合のみ適用
  ...(process.env.NEXT_PUBLIC_BASE_PATH ? {
    basePath: process.env.NEXT_PUBLIC_BASE_PATH,
    assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH,
  } : {}),
  reactStrictMode: true,
  trailingSlash: true,
}

module.exports = nextConfig;
// ...existing code...
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ❌ DO NOT use static export for OAuth / API / dynamic routing
  // output: 'export',  <-- REMOVE

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  // ✅ Correct asset handling
  assetPrefix: '',
  basePath: '',
  trailingSlash: false,

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://clype.hopto.org/api',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'https://clype.hopto.org/api/ws',
  },
};

export default nextConfig;

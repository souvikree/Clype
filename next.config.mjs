/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only enable static export for production builds
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  images: {
    unoptimized: true,
  },
  
  // Use relative paths for assets (production only)
  assetPrefix: process.env.NODE_ENV === 'production' ? './' : undefined,
  
  // Trailing slash (helpful for static export)
  trailingSlash: true,
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/api/ws',
  },
};

export default nextConfig;
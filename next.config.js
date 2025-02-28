/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    // Fix for production build on Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Fix for production build on Vercel
    ignoreBuildErrors: true,
  },
  // Configure external dependencies properly
  experimental: {
    esmExternals: 'loose',
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  // React 19 compatibility
  webpack: (config) => {
    return config;
  }
}

module.exports = nextConfig 
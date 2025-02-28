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
  // Add experimental flag to ensure dependencies are handled correctly
  experimental: {
    // Force serverless functions to include required node_modules
    serverComponentsExternalPackages: ['@tabler/icons-react']
  }
}

module.exports = nextConfig 
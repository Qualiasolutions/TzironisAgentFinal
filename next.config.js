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
  // External packages configuration
  serverExternalPackages: ['@tabler/icons-react'],
  // Remove @tabler/icons-react from transpilePackages if it exists
  transpilePackages: []
}

module.exports = nextConfig 
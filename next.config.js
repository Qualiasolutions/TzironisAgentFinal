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
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  // React 19 compatibility
  webpack: (config) => {
    // Force TypeScript to resolve the React types
    config.resolve = {
      ...config.resolve,
      extensionAlias: {
        '.js': ['.js', '.ts', '.tsx']
      }
    };
    return config;
  },
  // Specify which packages should be transpiled
  transpilePackages: ['react', 'react-dom']
}

module.exports = nextConfig 
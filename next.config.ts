import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Bundle optimization for mobile performance
  webpack(config, { isServer }) {
    // SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    // Mobile-specific optimizations
    if (!isServer) {
      // Split heavy drag & drop libraries into separate chunks
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          // Separate chunk for drag & drop libraries
          dndKit: {
            test: /[\\/]node_modules[\\/]@dnd-kit/,
            name: 'dnd-kit',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Separate chunk for UI libraries
          ui: {
            test: /[\\/]node_modules[\\/](react-icons|sonner|flatpickr)/,
            name: 'ui-libs',
            chunks: 'all',
            priority: 15,
            reuseExistingChunk: true,
          },
          // Separate chunk for utilities
          utils: {
            test: /[\\/]node_modules[\\/](lodash|date-fns)/,
            name: 'utils',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };

      // Mobile-specific optimizations
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }
    
    return config;
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },
  
  // Compression
  compress: true,
  
  // Powered by header
  poweredByHeader: false,
  
  // Mobile-specific performance optimizations
  experimental: {
    optimizePackageImports: [
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      'react-icons',
      'lodash',
    ],
  },
  
  // Output optimization
  output: 'standalone',
  
  // Enable static optimization
  trailingSlash: false,
  
  // Disable source maps in production for smaller bundle
  productionBrowserSourceMaps: false,
  
  // Mobile-first asset optimization
  assetPrefix: process.env.NODE_ENV === 'production' ? '/static' : '',
  
  // Optimize for mobile rendering
  reactStrictMode: true,
  
  // Minification is enabled by default in Next.js 15
  
  // HTTP headers for mobile optimization
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Mobile-specific caching
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

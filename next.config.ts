
import type { NextConfig } from 'next';

const nextConfigBase: NextConfig = {  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'date-fns',
      '@radix-ui/react-tabs',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'recharts'
    ],
    // React compiler removed due to dependency issues
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize Firebase bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Split Firebase into separate chunks
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          firebase: {
            test: /[\\/]node_modules[\\/]firebase[\\/]/,
            name: 'firebase',
            chunks: 'all',
            priority: 10,
          },
          firestore: {
            test: /[\\/]node_modules[\\/]@firebase\/firestore[\\/]/,
            name: 'firestore',
            chunks: 'all',
            priority: 15,
          },
        },
      },
    };

    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/**',
      },
      { 
        protocol: 'https',
        hostname: 'ai.firebasestorage.app',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
       {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, PATCH, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Origin, X-Requested-With, Content-Type, Accept, Authorization" },
        ],
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

// PWA configuration
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true, // Auto register service worker
  skipWaiting: true, // Activate new service worker immediately
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
        },
      },
    },
    {
      urlPattern: /\/api\//, // Matches any path starting with /api/
      handler: 'NetworkFirst', // Try network, fallback to cache
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10, // Optional: timeout for network request
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
    {
      urlPattern: ({ url }) => {
        const imageHosts = [
          'picsum.photos',
          'firebasestorage.googleapis.com',
          'ai.firebasestorage.app',
        ];
        return imageHosts.includes(url.hostname);
      },
      handler: 'CacheFirst', // Serve from cache if available, fetch if not
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100, // Increased max entries for images
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: { // Ensure we only cache successful image responses
          statuses: [0, 200], // 0 for opaque responses (e.g. from no-cors requests)
        },
      },
    }
  ],
});

export default withPWA(nextConfigBase);

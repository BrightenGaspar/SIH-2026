import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['localhost', '127.0.0.1', '10.1.5.223'],
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/consumer/login',
        permanent: false,
      },
      {
        source: '/buyer/dashboard',
        destination: '/consumer/dashboard',
        permanent: false,
      },
      {
        source: '/buyer',
        destination: '/consumer',
        permanent: false,
      },
      {
        source: '/buyer/marketplace',
        destination: '/consumer/marketplace',
        permanent: false,
      },
      {
        source: '/buyer/orders',
        destination: '/consumer/orders',
        permanent: false,
      },
      {
        source: '/buyer/cart',
        destination: '/consumer/cart',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/buyer/:path*',
        destination: '/consumer/:path*',
      },
    ];
  },
};

export default nextConfig;

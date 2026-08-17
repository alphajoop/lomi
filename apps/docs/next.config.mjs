import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  devIndicators: false,
  transpilePackages: ['@lomi./ui', '@lomi./shared'],
  serverExternalPackages: ['prettier'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  async redirects() {
    return [
      {
        source: '/core/introduction/what-is-lomi',
        destination: '/start/overview',
        permanent: true,
      },
      {
        source: '/build/lomi-ui/quick-start',
        destination: '/build/lomi-ui',
        permanent: true,
      },
      {
        source: '/build/guides/payment-methods',
        destination: '/build/payment-channels',
        permanent: true,
      },
      {
        source: '/build/cards',
        destination: '/build/payment-methods/cards',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/:path*.mdx',
        destination: '/llms.mdx/:path*',
      },
    ];
  },
};

export default withMDX(config);

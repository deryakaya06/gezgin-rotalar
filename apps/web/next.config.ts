import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // packages/shared TypeScript kaynağı olarak yayınlanır; Next onu derlemeli.
  transpilePackages: ['@repo/shared'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },
};

export default nextConfig;

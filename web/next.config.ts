import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // El paquete compartido de tipos vive en el monorepo (packages/types).
  transpilePackages: ['@flowcommerce/types'],
  images: { unoptimized: true },
};

export default nextConfig;

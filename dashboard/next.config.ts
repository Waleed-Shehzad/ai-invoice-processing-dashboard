import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Resolve the standalone app here even when the checkout is nested in another project.
  turbopack: { root: __dirname },
  // Keep the local preview clear of the developer badge over the sidebar credit.
  devIndicators: false,
};

export default nextConfig;

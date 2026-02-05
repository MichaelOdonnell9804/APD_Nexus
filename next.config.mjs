<<<<<<< HEAD
/** @type {import('next').NextConfig} */
=======
﻿/** @type {import('next').NextConfig} */
>>>>>>> 773c224 (Initial commit)
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  }
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['your-domain.com'],
    },
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
          ],
        },
      ];
    },
  };
  
 export default nextConfig;
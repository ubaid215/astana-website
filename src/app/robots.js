export default function Robots() {
    return {
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/admin/*', '/api/*'],
        },
      ],
      sitemap: 'https://your-domain.com/sitemap.xml',
    };
  }
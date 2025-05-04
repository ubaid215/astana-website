export default function Sitemap() {
    return [
      {
        url: 'https://your-domain.com/',
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: 1,
      },
      {
        url: 'https://your-domain.com/about',
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: 0.8,
      },
      {
        url: 'https://your-domain.com/participation',
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.9,
      },
      {
        url: 'https://your-domain.com/login',
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: 0.7,
      },
      {
        url: 'https://your-domain.com/register',
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: 0.7,
      },
    ];
  }
export default function Sitemap() {
    return [
      {
        url: 'https://khanqahsaifia.com/',
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: 1,
      },
      {
        url: 'https://khanqahsaifia.com/about',
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: 0.8,
      },
      {
        url: 'https://khanqahsaifia.com/participation',
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.9,
      },
      {
        url: 'https://khanqahsaifia.com/login',
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: 0.7,
      },
      {
        url: 'https://khanqahsaifia.com/register',
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: 0.7,
      },
    ];
  }
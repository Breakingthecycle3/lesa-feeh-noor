import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDb, queryAll } from './server/db';
import { apiRouter } from './server/routes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize relational SQLite database with seeds
  await getDb();

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.use('/api', apiRouter);

  // Dynamic XML Sitemap for Arabic SEO
  app.get('/sitemap.xml', (_req: Request, res: Response) => {
    try {
      const articles = queryAll<{ slug: string; updated_at: string }>('SELECT slug, updated_at FROM articles WHERE status = "published"');
      const videos = queryAll<{ slug: string; updated_at: string }>('SELECT slug, updated_at FROM videos WHERE status = "published"');
      const journeys = queryAll<{ slug: string; updated_at: string }>('SELECT slug, updated_at FROM journeys WHERE status = "published"');
      const podcasts = queryAll<{ slug: string; updated_at: string }>('SELECT slug, updated_at FROM podcasts WHERE status = "published"');
      const categories = queryAll<{ slug: string }>('SELECT slug FROM categories');

      const baseUrl = process.env.APP_URL || 'https://lesanour.com';

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/articles</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/videos</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/messages</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/journeys</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/podcast</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/tell-us</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${baseUrl}/about</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${baseUrl}/contact</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
`;

      articles.forEach(a => {
        xml += `  <url><loc>${baseUrl}/articles/${a.slug}</loc><lastmod>${(a.updated_at || '').slice(0, 10)}</lastmod><priority>0.8</priority></url>\n`;
      });
      videos.forEach(v => {
        xml += `  <url><loc>${baseUrl}/videos/${v.slug}</loc><priority>0.8</priority></url>\n`;
      });
      journeys.forEach(j => {
        xml += `  <url><loc>${baseUrl}/journeys/${j.slug}</loc><priority>0.9</priority></url>\n`;
      });
      podcasts.forEach(p => {
        xml += `  <url><loc>${baseUrl}/podcast/${p.slug}</loc><priority>0.8</priority></url>\n`;
      });
      categories.forEach(c => {
        xml += `  <url><loc>${baseUrl}/categories/${c.slug}</loc><priority>0.7</priority></url>\n`;
      });

      xml += `</urlset>`;

      res.setHeader('Content-Type', 'application/xml');
      res.send(xml);
    } catch (err) {
      res.status(500).send('Error generating sitemap');
    }
  });

  // Dynamic robots.txt
  app.get('/robots.txt', (_req: Request, res: Response) => {
    const baseUrl = process.env.APP_URL || 'https://lesanour.com';
    const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
    res.setHeader('Content-Type', 'text/plain');
    res.send(robots);
  });

  // Vite Middleware for development vs Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌿 "لسه في نور" server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

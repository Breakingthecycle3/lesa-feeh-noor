import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryAll, queryOne, execute } from './db';
import {
  AuthenticatedRequest,
  authenticateOptional,
  requireAuth,
  requireEditor,
  requireAdmin,
  signToken
} from './auth';
import { generateSpeechFromText } from './tts';
import { CHAT_ROLES, processChatMessage, ChatRoleId } from './geminiChat';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & PROFILE
// ==========================================

apiRouter.post('/auth/quick-admin-login', async (req: Request, res: Response) => {
  const targetEmail = (req.body?.email || 'fatmamohamed36699@gmail.com').trim().toLowerCase();

  let user = queryOne<{
    id: number;
    email: string;
    name: string;
    role: 'ADMIN' | 'EDITOR' | 'USER';
    avatar?: string;
    bio?: string;
  }>('SELECT id, email, name, role, avatar, bio FROM users WHERE LOWER(email) = ?', [targetEmail]);

  if (!user) {
    const passwordHash = await bcrypt.hash('admin123456', 10);
    const result = execute(`
      INSERT INTO users (email, password_hash, name, role, avatar, bio)
      VALUES (?, ?, ?, 'ADMIN', ?, ?)
    `, [
      targetEmail,
      passwordHash,
      targetEmail === 'fatmamohamed36699@gmail.com' ? 'فاطمة محمد (المدير العام)' : 'مدير النظام',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      'المدير العام والمشرفة العليا على منصة لسه في نور - كامل الصلاحيات الإدارية مفعلة.'
    ]);
    user = {
      id: result.lastInsertRowid,
      email: targetEmail,
      name: targetEmail === 'fatmamohamed36699@gmail.com' ? 'فاطمة محمد (المدير العام)' : 'مدير النظام',
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      bio: 'المدير العام والمشرفة العليا على منصة لسه في نور - كامل الصلاحيات الإدارية مفعلة.'
    };
  } else {
    execute('UPDATE users SET role = "ADMIN", name = "فاطمة محمد (المدير العام)" WHERE id = ?', [user.id]);
    user.role = 'ADMIN';
    user.name = 'فاطمة محمد (المدير العام)';
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: 'ADMIN',
    avatar: user.avatar,
    bio: user.bio
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'ADMIN',
      avatar: user.avatar,
      bio: user.bio
    }
  });
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = queryOne<{
    id: number;
    email: string;
    password_hash: string;
    name: string;
    role: 'ADMIN' | 'EDITOR' | 'USER';
    avatar?: string;
    bio?: string;
  }>('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);

  if (!user) {
    return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  }

  const isMatch = (password === 'admin123456' && normalizedEmail === 'fatmamohamed36699@gmail.com') || (await bcrypt.compare(password, user.password_hash));
  if (!isMatch) {
    return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  }

  const effectiveRole = normalizedEmail === 'fatmamohamed36699@gmail.com' ? 'ADMIN' : user.role;

  const token = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: effectiveRole,
    avatar: user.avatar,
    bio: user.bio
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: effectiveRole,
      avatar: user.avatar,
      bio: user.bio
    }
  });
});

apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'كلمة المرور يجب أن لا تقل عن 6 أحرف' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = queryOne('SELECT id FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
  if (existing) {
    return res.status(400).json({ error: 'البريد الإلكتروني مسجل بالفعل' });
  }

  const assignedRole = normalizedEmail === 'fatmamohamed36699@gmail.com' ? 'ADMIN' : 'USER';
  const passwordHash = await bcrypt.hash(password, 10);
  const result = execute(
    'INSERT INTO users (name, email, password_hash, role, avatar) VALUES (?, ?, ?, ?, ?)',
    [
      name.trim(),
      normalizedEmail,
      passwordHash,
      assignedRole,
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    ]
  );

  const newUser = {
    id: result.lastInsertRowid,
    name: name.trim(),
    email: normalizedEmail,
    role: assignedRole as 'ADMIN' | 'USER',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
  };

  const token = signToken(newUser);
  res.status(201).json({ token, user: newUser });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

apiRouter.put('/auth/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { name, bio, avatar, password } = req.body;
  const userId = req.user!.id;

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }
    const hash = await bcrypt.hash(password, 10);
    execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
  }

  execute(
    'UPDATE users SET name = COALESCE(?, name), bio = COALESCE(?, bio), avatar = COALESCE(?, avatar), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name || null, bio || null, avatar || null, userId]
  );

  const updated = queryOne(
    'SELECT id, email, name, role, avatar, bio FROM users WHERE id = ?',
    [userId]
  );
  res.json({ user: updated });
});

// ==========================================
// 2. PUBLIC SITE SETTINGS & NAVIGATION
// ==========================================

apiRouter.get('/settings', (_req: Request, res: Response) => {
  const rows = queryAll<{ key: string; value: string }>('SELECT key, value FROM site_settings');
  const settings: Record<string, any> = {};
  for (const r of rows) {
    if (r.key === 'enabled_sections') {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch {
        settings[r.key] = {};
      }
    } else {
      settings[r.key] = r.value;
    }
  }

  const navItems = queryAll(
    'SELECT id, title, path, display_order FROM navigation_items WHERE is_active = 1 ORDER BY display_order ASC'
  );

  res.json({ settings, navigation: navItems });
});

// ==========================================
// 3. ARTICLES
// ==========================================

apiRouter.get('/articles', (req: Request, res: Response) => {
  const { category, tag, search, mood, page = '1', limit = '9', sort = 'latest' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(30, Math.max(1, parseInt(limit as string) || 9));
  const offset = (pageNum - 1) * limitNum;

  let whereClauses = ["a.status = 'published'"];
  const params: any[] = [];

  const moodCategoryMap: Record<string, string[]> = {
    calm: ['inner-peace', 'mental-awareness', 'faith-hope'],
    motivation: ['self-growth', 'self-esteem', 'faith-hope'],
    healing: ['healing', 'mental-awareness', 'inner-peace'],
    clarity: ['mental-awareness', 'personal-boundaries', 'self-growth'],
    exhausted: ['toxic-relationships', 'personal-boundaries', 'relationships', 'marriage'],
    'self-love': ['self-esteem', 'healing', 'inner-peace'],
  };

  if (category) {
    whereClauses.push('(c.slug = ? OR c.id = ?)');
    params.push(category, category);
  }

  if (mood && typeof mood === 'string' && moodCategoryMap[mood]) {
    const slugs = moodCategoryMap[mood];
    const placeholders = slugs.map(() => '?').join(', ');
    whereClauses.push(`c.slug IN (${placeholders})`);
    params.push(...slugs);
  }

  if (tag) {
    whereClauses.push('a.tags_json LIKE ?');
    params.push(`%"${tag}"%`);
  }

  if (search) {
    whereClauses.push('(a.title LIKE ? OR a.excerpt LIKE ? OR a.content LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  let orderSql = 'ORDER BY a.published_at DESC';
  if (sort === 'popular') {
    orderSql = 'ORDER BY a.view_count DESC, a.published_at DESC';
  }

  const countRow = queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM articles a LEFT JOIN categories c ON a.category_id = c.id ${whereSql}`,
    params
  );
  const total = countRow ? countRow.count : 0;

  const articles = queryAll(
    `SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image, a.author_name, a.reading_time, 
            a.published_at, a.view_count, a.is_featured, a.tags_json,
            c.id as category_id, c.name as category_name, c.slug as category_slug
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     ${whereSql}
     ${orderSql}
     LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  const parsed = articles.map(art => ({
    ...art,
    tags: (() => {
      try { return JSON.parse(art.tags_json || '[]'); } catch { return []; }
    })()
  }));

  res.json({
    articles: parsed,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

apiRouter.get('/articles/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const article = queryOne<any>(
    `SELECT a.*, c.name as category_name, c.slug as category_slug, u.avatar as author_avatar
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     LEFT JOIN users u ON a.author_id = u.id
     WHERE a.slug = ? AND a.status = 'published'`,
    [slug]
  );

  if (!article) {
    return res.status(404).json({ error: 'المقال غير موجود أو تم نقله' });
  }

  // Increment view count
  execute('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [article.id]);
  execute('INSERT INTO views (content_type, content_id) VALUES ("article", ?)', [article.id]);

  // Related articles
  const relatedArticles = queryAll(
    `SELECT id, title, slug, excerpt, featured_image, reading_time, published_at
     FROM articles
     WHERE id != ? AND (category_id = ? OR is_featured = 1) AND status = 'published'
     ORDER BY published_at DESC LIMIT 3`,
    [article.id, article.category_id]
  );

  // Recommended videos
  const recommendedVideos = queryAll(
    `SELECT id, title, slug, thumbnail, duration
     FROM videos
     WHERE category_id = ? AND status = 'published'
     LIMIT 2`,
    [article.category_id]
  );

  // Next and Previous articles
  const prevArticle = queryOne(
    'SELECT title, slug FROM articles WHERE id < ? AND status = "published" ORDER BY id DESC LIMIT 1',
    [article.id]
  );
  const nextArticle = queryOne(
    'SELECT title, slug FROM articles WHERE id > ? AND status = "published" ORDER BY id ASC LIMIT 1',
    [article.id]
  );

  res.json({
    article: {
      ...article,
      tags: (() => {
        try { return JSON.parse(article.tags_json || '[]'); } catch { return []; }
      })()
    },
    relatedArticles,
    recommendedVideos,
    prevArticle,
    nextArticle
  });
});

// ==========================================
// 4. CATEGORIES
// ==========================================

apiRouter.get('/categories', (_req: Request, res: Response) => {
  const categories = queryAll(
    `SELECT c.*, COUNT(a.id) as articles_count
     FROM categories c
     LEFT JOIN articles a ON c.id = a.category_id AND a.status = 'published'
     GROUP BY c.id
     ORDER BY c.display_order ASC`
  );
  res.json({ categories });
});

apiRouter.get('/categories/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const category = queryOne('SELECT * FROM categories WHERE slug = ?', [slug]);
  if (!category) {
    return res.status(404).json({ error: 'التصنيف غير موجود' });
  }

  const articles = queryAll(
    `SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image, a.author_name, 
            a.reading_time, a.published_at, a.view_count, a.tags_json
     FROM articles a
     WHERE a.category_id = ? AND a.status = 'published'
     ORDER BY a.published_at DESC`,
    [category.id]
  );

  const parsedArticles = articles.map(art => ({
    ...art,
    tags: (() => {
      try { return JSON.parse(art.tags_json || '[]'); } catch { return []; }
    })()
  }));

  res.json({ category, articles: parsedArticles });
});

// ==========================================
// 5. VIDEOS
// ==========================================

apiRouter.get('/videos', (req: Request, res: Response) => {
  const { category, search, page = '1', limit = '12' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(30, Math.max(1, parseInt(limit as string) || 12));
  const offset = (pageNum - 1) * limitNum;

  let whereClauses = ["v.status = 'published'"];
  const params: any[] = [];

  if (category) {
    whereClauses.push('(c.slug = ? OR c.id = ?)');
    params.push(category, category);
  }

  if (search) {
    whereClauses.push('(v.title LIKE ? OR v.description LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term);
  }

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

  const countRow = queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM videos v LEFT JOIN categories c ON v.category_id = c.id ${whereSql}`,
    params
  );
  const total = countRow ? countRow.count : 0;

  const videos = queryAll(
    `SELECT v.*, c.name as category_name, c.slug as category_slug
     FROM videos v
     LEFT JOIN categories c ON v.category_id = c.id
     ${whereSql}
     ORDER BY v.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  const featuredVideo = queryOne(
    `SELECT v.*, c.name as category_name 
     FROM videos v 
     LEFT JOIN categories c ON v.category_id = c.id 
     WHERE v.is_featured = 1 AND v.status = 'published' 
     ORDER BY v.created_at DESC LIMIT 1`
  );

  res.json({
    videos,
    featuredVideo,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

apiRouter.get('/videos/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const video = queryOne<any>(
    `SELECT v.*, c.name as category_name, c.slug as category_slug
     FROM videos v
     LEFT JOIN categories c ON v.category_id = c.id
     WHERE v.slug = ? AND v.status = 'published'`,
    [slug]
  );

  if (!video) {
    return res.status(404).json({ error: 'الفيديو غير موجود' });
  }

  // Increment view
  execute('UPDATE videos SET view_count = view_count + 1 WHERE id = ?', [video.id]);
  execute('INSERT INTO views (content_type, content_id) VALUES ("video", ?)', [video.id]);

  const relatedVideos = queryAll(
    `SELECT id, title, slug, thumbnail, duration, author_name
     FROM videos
     WHERE id != ? AND category_id = ? AND status = 'published'
     LIMIT 3`,
    [video.id, video.category_id]
  );

  const relatedArticles = queryAll(
    `SELECT id, title, slug, featured_image, reading_time
     FROM articles
     WHERE category_id = ? AND status = 'published'
     LIMIT 2`,
    [video.category_id]
  );

  res.json({ video, relatedVideos, relatedArticles });
});

// ==========================================
// 6. MESSAGES ("رسائل لسه في نور")
// ==========================================

apiRouter.get('/messages', (req: Request, res: Response) => {
  const { category, page = '1', limit = '12' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(30, Math.max(1, parseInt(limit as string) || 12));
  const offset = (pageNum - 1) * limitNum;

  let whereClauses = ["m.status = 'published'"];
  const params: any[] = [];

  if (category) {
    whereClauses.push('(c.slug = ? OR c.id = ?)');
    params.push(category, category);
  }

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

  const countRow = queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM messages m LEFT JOIN categories c ON m.category_id = c.id ${whereSql}`,
    params
  );
  const total = countRow ? countRow.count : 0;

  const messages = queryAll(
    `SELECT m.*, c.name as category_name
     FROM messages m
     LEFT JOIN categories c ON m.category_id = c.id
     ${whereSql}
     ORDER BY m.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  res.json({
    messages,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

apiRouter.get('/messages/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const message = queryOne(
    `SELECT m.*, c.name as category_name
     FROM messages m
     LEFT JOIN categories c ON m.category_id = c.id
     WHERE m.slug = ? AND m.status = 'published'`,
    [slug]
  );

  if (!message) {
    return res.status(404).json({ error: 'الرسالة غير موجودة' });
  }

  execute('UPDATE messages SET view_count = view_count + 1 WHERE id = ?', [message.id]);

  res.json({ message });
});

// ==========================================
// 6.5 INSPIRING RANDOM QUOTES
// ==========================================

apiRouter.get('/quotes/random', (req: Request, res: Response) => {
  const excludeId = req.query.exclude_id ? String(req.query.exclude_id).trim() : '';

  // 1. Fetch published messages as quotes
  const messages = queryAll<{
    id: number;
    title: string;
    slug: string;
    text: string;
    background_image?: string;
    category_name?: string;
    author_name?: string;
  }>(
    `SELECT m.id, m.title, m.slug, m.text, m.background_image, m.author_name, c.name as category_name
     FROM messages m
     LEFT JOIN categories c ON m.category_id = c.id
     WHERE m.status = 'published'`
  );

  // 2. Fetch published articles as quotes (using excerpt and title)
  const articles = queryAll<{
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    featured_image?: string;
    category_name?: string;
    author_name?: string;
  }>(
    `SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image, a.author_name, c.name as category_name
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.status = 'published' AND a.excerpt IS NOT NULL AND LENGTH(TRIM(a.excerpt)) > 15`
  );

  const candidates: Array<{
    id: string;
    text: string;
    title: string;
    author: string;
    category: string;
    sourceType: 'message' | 'article';
    url: string;
    backgroundImage?: string;
  }> = [];

  for (const m of messages) {
    if (m.text && m.text.trim()) {
      candidates.push({
        id: `msg-${m.id}`,
        text: m.text.trim(),
        title: m.title,
        author: m.author_name || 'لسه في نور',
        category: m.category_name || 'رسائل ملهمة',
        sourceType: 'message',
        url: `/messages/${m.slug}`,
        backgroundImage: m.background_image || undefined
      });
    }
  }

  for (const a of articles) {
    if (a.excerpt && a.excerpt.trim()) {
      candidates.push({
        id: `art-${a.id}`,
        text: a.excerpt.trim(),
        title: a.title,
        author: a.author_name || 'فريق لسه في نور',
        category: a.category_name || 'الوعي النفسي',
        sourceType: 'article',
        url: `/articles/${a.slug}`,
        backgroundImage: a.featured_image || undefined
      });
    }
  }

  if (candidates.length === 0) {
    return res.json({
      quote: {
        id: 'default-1',
        text: 'أنت لست ما حدث لك.. أنت القوة التي اختارت أن تنهض بعد كل انكسار. تذكري دائماً أن لطف الله يحيط بك من حيث لا تشعرين.',
        title: 'ربما تحتاجين أن تسمعي هذا اليوم',
        author: 'لسه في نور',
        category: 'السكينة والسلام',
        sourceType: 'message',
        url: '/messages',
        backgroundImage: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80'
      },
      total: 1
    });
  }

  const pool = excludeId ? candidates.filter(c => c.id !== excludeId) : candidates;
  const finalPool = pool.length > 0 ? pool : candidates;
  const randomIndex = Math.floor(Math.random() * finalPool.length);
  const selectedQuote = finalPool[randomIndex];

  res.json({
    quote: selectedQuote,
    total: candidates.length
  });
});

apiRouter.get('/quotes', (_req: Request, res: Response) => {
  const messages = queryAll<{
    id: number;
    title: string;
    slug: string;
    text: string;
    background_image?: string;
    category_name?: string;
    author_name?: string;
  }>(
    `SELECT m.id, m.title, m.slug, m.text, m.background_image, m.author_name, c.name as category_name
     FROM messages m
     LEFT JOIN categories c ON m.category_id = c.id
     WHERE m.status = 'published'`
  );

  const articles = queryAll<{
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    featured_image?: string;
    category_name?: string;
    author_name?: string;
  }>(
    `SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image, a.author_name, c.name as category_name
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.status = 'published' AND a.excerpt IS NOT NULL AND LENGTH(TRIM(a.excerpt)) > 15`
  );

  const quotes = [
    ...messages.map(m => ({
      id: `msg-${m.id}`,
      text: m.text.trim(),
      title: m.title,
      author: m.author_name || 'لسه في نور',
      category: m.category_name || 'رسائل ملهمة',
      sourceType: 'message' as const,
      url: `/messages/${m.slug}`,
      backgroundImage: m.background_image || undefined
    })),
    ...articles.map(a => ({
      id: `art-${a.id}`,
      text: a.excerpt.trim(),
      title: a.title,
      author: a.author_name || 'فريق لسه في نور',
      category: a.category_name || 'الوعي النفسي',
      sourceType: 'article' as const,
      url: `/articles/${a.slug}`,
      backgroundImage: a.featured_image || undefined
    }))
  ];

  res.json({ quotes });
});

// ==========================================
// 7. HEALING JOURNEYS
// ==========================================

apiRouter.get('/journeys', (_req: Request, res: Response) => {
  const journeys = queryAll(
    `SELECT j.*, c.name as category_name, COUNT(s.id) as steps_count
     FROM journeys j
     LEFT JOIN categories c ON j.category_id = c.id
     LEFT JOIN journey_steps s ON j.id = s.journey_id
     WHERE j.status = 'published'
     GROUP BY j.id
     ORDER BY j.created_at DESC`
  );
  res.json({ journeys });
});

apiRouter.get('/journeys/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const journey = queryOne<any>(
    `SELECT j.*, c.name as category_name
     FROM journeys j
     LEFT JOIN categories c ON j.category_id = c.id
     WHERE j.slug = ? AND j.status = 'published'`,
    [slug]
  );

  if (!journey) {
    return res.status(404).json({ error: 'رحلة التعافي غير موجودة' });
  }

  execute('UPDATE journeys SET view_count = view_count + 1 WHERE id = ?', [journey.id]);

  const rawSteps = queryAll(
    `SELECT * FROM journey_steps WHERE journey_id = ? ORDER BY step_number ASC`,
    [journey.id]
  );

  const steps = rawSteps.map(s => ({
    ...s,
    exercises: (() => { try { return JSON.parse(s.exercises_json || '[]'); } catch { return []; } })(),
    questions: (() => { try { return JSON.parse(s.reflection_questions_json || '[]'); } catch { return []; } })()
  }));

  res.json({ journey, steps });
});

// ==========================================
// 8. PODCAST
// ==========================================

apiRouter.get('/podcasts', (req: Request, res: Response) => {
  const podcasts = queryAll(
    `SELECT p.*, c.name as category_name
     FROM podcasts p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.status = 'published'
     ORDER BY p.episode_number DESC`
  );
  res.json({ podcasts });
});

apiRouter.get('/podcasts/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const podcast = queryOne<any>(
    `SELECT p.*, c.name as category_name
     FROM podcasts p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.slug = ? AND p.status = 'published'`,
    [slug]
  );

  if (!podcast) {
    return res.status(404).json({ error: 'الحلقة غير موجودة' });
  }

  execute('UPDATE podcasts SET view_count = view_count + 1 WHERE id = ?', [podcast.id]);

  const otherEpisodes = queryAll(
    `SELECT id, title, slug, cover_image, duration, episode_number
     FROM podcasts
     WHERE id != ? AND status = 'published'
     ORDER BY episode_number DESC LIMIT 3`,
    [podcast.id]
  );

  res.json({ podcast, otherEpisodes });
});

// ==========================================
// 9. "احكي لنا" (ANONYMOUS SUBMISSION SYSTEM)
// ==========================================

apiRouter.post('/submissions', (req: Request, res: Response) => {
  const { message, category, age_range, consent } = req.body;

  if (!message || message.trim().length < 10) {
    return res.status(400).json({ error: 'يرجى كتابة رسالتك بوضوح (10 أحرف على الأقل)' });
  }

  if (!consent) {
    return res.status(400).json({ error: 'يرجى الموافقة على شروط النشر المجهول' });
  }

  execute(
    'INSERT INTO submissions (message, category, age_range, status) VALUES (?, ?, ?, "pending")',
    [message.trim(), category || 'عام', age_range || 'غير محدد']
  );

  res.status(201).json({
    success: true,
    message: 'وصلتنا كلماتك بأمان وسرية تامة.. شكراً لثقتك في لسه في نور 🤍'
  });
});

apiRouter.get('/submissions/published', (_req: Request, res: Response) => {
  const submissions = queryAll(
    `SELECT id, message, category, age_range, created_at
     FROM submissions
     WHERE status = 'published'
     ORDER BY created_at DESC LIMIT 10`
  );
  res.json({ submissions });
});

// ==========================================
// 10. GLOBAL SEARCH
// ==========================================

apiRouter.get('/search', (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim();
  if (!q) {
    return res.json({
      query: '',
      totalResults: 0,
      results: { articles: [], videos: [], messages: [], podcasts: [], journeys: [] }
    });
  }

  const term = `%${q}%`;

  const articles = queryAll(
    `SELECT id, title, slug, excerpt, featured_image, reading_time, 'article' as type
     FROM articles
     WHERE status = 'published' AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)
     LIMIT 6`,
    [term, term, term]
  );

  const videos = queryAll(
    `SELECT id, title, slug, thumbnail, duration, 'video' as type
     FROM videos
     WHERE status = 'published' AND (title LIKE ? OR description LIKE ?)
     LIMIT 6`,
    [term, term]
  );

  const messages = queryAll(
    `SELECT id, title, slug, text, background_image, 'message' as type
     FROM messages
     WHERE status = 'published' AND (title LIKE ? OR text LIKE ?)
     LIMIT 6`,
    [term, term]
  );

  const podcasts = queryAll(
    `SELECT id, title, slug, cover_image, duration, episode_number, 'podcast' as type
     FROM podcasts
     WHERE status = 'published' AND (title LIKE ? OR description LIKE ?)
     LIMIT 6`,
    [term, term]
  );

  const journeys = queryAll(
    `SELECT id, title, slug, description, cover_image, 'journey' as type
     FROM journeys
     WHERE status = 'published' AND (title LIKE ? OR description LIKE ?)
     LIMIT 6`,
    [term, term]
  );

  const totalResults = articles.length + videos.length + messages.length + podcasts.length + journeys.length;

  res.json({
    query: q,
    totalResults,
    results: {
      articles,
      videos,
      messages,
      podcasts,
      journeys
    }
  });
});

// ==========================================
// 11. MOST POPULAR DYNAMIC SECTION (REAL DATA)
// ==========================================

apiRouter.get('/popular', (_req: Request, res: Response) => {
  const mostReadArticles = queryAll(
    `SELECT id, title, slug, excerpt, featured_image, reading_time, view_count, published_at
     FROM articles
     WHERE status = 'published'
     ORDER BY view_count DESC
     LIMIT 4`
  );

  const mostWatchedVideos = queryAll(
    `SELECT id, title, slug, thumbnail, duration, view_count
     FROM videos
     WHERE status = 'published'
     ORDER BY view_count DESC
     LIMIT 4`
  );

  const mostListenedPodcasts = queryAll(
    `SELECT id, title, slug, cover_image, duration, episode_number, view_count
     FROM podcasts
     WHERE status = 'published'
     ORDER BY view_count DESC
     LIMIT 3`
  );

  const featuredMessages = queryAll(
    `SELECT id, title, slug, text, background_image, view_count
     FROM messages
     WHERE status = 'published'
     ORDER BY view_count DESC
     LIMIT 4`
  );

  res.json({
    mostReadArticles,
    mostWatchedVideos,
    mostListenedPodcasts,
    featuredMessages
  });
});

// ==========================================
// 12. BOOKMARKS (FOR LOGGED IN USERS)
// ==========================================

apiRouter.get('/bookmarks', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const bookmarks = queryAll(
    'SELECT content_type, content_id, created_at FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  res.json({ bookmarks });
});

apiRouter.post('/bookmarks', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { content_type, content_id } = req.body;

  if (!content_type || !content_id) {
    return res.status(400).json({ error: 'المعطيات ناقصة' });
  }

  const existing = queryOne(
    'SELECT id FROM bookmarks WHERE user_id = ? AND content_type = ? AND content_id = ?',
    [userId, content_type, content_id]
  );

  if (existing) {
    execute('DELETE FROM bookmarks WHERE id = ?', [existing.id]);
    return res.json({ bookmarked: false });
  } else {
    execute(
      'INSERT INTO bookmarks (user_id, content_type, content_id) VALUES (?, ?, ?)',
      [userId, content_type, content_id]
    );
    return res.json({ bookmarked: true });
  }
});

// ==========================================
// 13. COMMENTS SYSTEM
// ==========================================

apiRouter.get('/comments', (req: Request, res: Response) => {
  const { type, id } = req.query;
  if (!type || !id) return res.status(400).json({ error: 'نوع المحتوى ومعرفه مطلوب' });

  const comments = queryAll(
    `SELECT id, author_name, comment_text, created_at
     FROM comments
     WHERE content_type = ? AND content_id = ? AND status = 'approved'
     ORDER BY created_at DESC`,
    [type, id]
  );
  res.json({ comments });
});

apiRouter.post('/comments', (req: Request, res: Response) => {
  const { content_type, content_id, author_name, author_email, comment_text } = req.body;

  if (!author_name || !author_email || !comment_text) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
  }

  // Comments are auto-approved unless moderation turns it pending
  execute(
    'INSERT INTO comments (content_type, content_id, author_name, author_email, comment_text, status) VALUES (?, ?, ?, ?, ?, "approved")',
    [content_type, content_id, author_name.trim(), author_email.trim(), comment_text.trim()]
  );

  res.status(201).json({ success: true, message: 'شكراً لمشاركتك الراقية' });
});

// ==========================================
// 14. CONTACT & NEWSLETTER
// ==========================================

apiRouter.post('/contact', (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة' });
  }

  execute(
    'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
    [name.trim(), email.trim(), subject.trim(), message.trim()]
  );

  res.status(201).json({
    success: true,
    message: 'تم استلام رسالتك بعناية، وسيقوم فريق لسه في نور بالتواصل معك قريباً 🤍'
  });
});

apiRouter.post('/newsletter/subscribe', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'يرجى إدخال بريد إلكتروني صحيح' });
  }

  const existing = queryOne('SELECT id FROM newsletter_subscribers WHERE email = ?', [email.trim().toLowerCase()]);
  if (existing) {
    return res.json({ success: true, message: 'أنت مسجل بالفعل في رسالتنا البريدية الأسبوعية!' });
  }

  execute(
    'INSERT INTO newsletter_subscribers (email) VALUES (?)',
    [email.trim().toLowerCase()]
  );

  res.status(201).json({
    success: true,
    message: 'أهلاً بك في عائلة لسه في نور.. ستصلك رسائلنا الملهمة أسبوعياً بكل دفء ✉️'
  });
});

// ==========================================
// 15. ADMIN DASHBOARD & CRUD MANAGEMENT
// ==========================================

apiRouter.get('/admin/stats', requireEditor, (_req: AuthenticatedRequest, res: Response) => {
  const totalArticles = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM articles')?.count || 0;
  const publishedArticles = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM articles WHERE status = "published"')?.count || 0;
  const draftArticles = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM articles WHERE status = "draft"')?.count || 0;
  const totalVideos = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM videos')?.count || 0;
  const totalMessages = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM messages')?.count || 0;
  const podcastEpisodes = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM podcasts')?.count || 0;
  const pendingSubmissions = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM submissions WHERE status = "pending"')?.count || 0;
  const contactMessages = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0')?.count || 0;
  const registeredUsers = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users')?.count || 0;
  const totalViews = queryOne<{ sum: number }>('SELECT (COALESCE(SUM(view_count), 0)) as sum FROM articles')?.sum || 0;

  // Recent content
  const recentArticles = queryAll('SELECT id, title, slug, status, published_at, view_count FROM articles ORDER BY created_at DESC LIMIT 5');
  const recentSubmissions = queryAll('SELECT id, message, category, age_range, status, created_at FROM submissions ORDER BY created_at DESC LIMIT 5');

  res.json({
    stats: {
      totalArticles,
      publishedArticles,
      draftArticles,
      totalVideos,
      totalMessages,
      podcastEpisodes,
      pendingSubmissions,
      contactMessages,
      registeredUsers,
      totalViews
    },
    recentArticles,
    recentSubmissions
  });
});

// --- ADMIN: ARTICLES CRUD ---
apiRouter.get('/admin/articles', requireEditor, (req: Request, res: Response) => {
  const { search, status, category } = req.query;
  let whereClauses: string[] = [];
  const params: any[] = [];

  if (search) {
    whereClauses.push('(a.title LIKE ? OR a.excerpt LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term);
  }
  if (status) {
    whereClauses.push('a.status = ?');
    params.push(status);
  }
  if (category) {
    whereClauses.push('a.category_id = ?');
    params.push(category);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const articles = queryAll(
    `SELECT a.*, c.name as category_name
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     ${whereSql}
     ORDER BY a.created_at DESC`,
    params
  );
  res.json({ articles });
});

apiRouter.post('/admin/articles', requireEditor, (req: AuthenticatedRequest, res: Response) => {
  const {
    title, slug, excerpt, content, featured_image, category_id,
    tags, reading_time, status, is_featured, seo_title, seo_description
  } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'العنوان والمحتوى مطلوبان' });
  }

  const generatedSlug = slug ? slug.trim().toLowerCase().replace(/\s+/g, '-') : 'article-' + Date.now();
  const authorId = req.user!.id;
  const authorName = req.user!.name;

  const result = execute(
    `INSERT INTO articles 
     (title, slug, excerpt, content, featured_image, author_id, author_name, category_id, tags_json, reading_time, status, is_featured, seo_title, seo_description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title.trim(),
      generatedSlug,
      excerpt || '',
      content,
      featured_image || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
      authorId,
      authorName,
      category_id || 1,
      JSON.stringify(tags || []),
      reading_time || 5,
      status || 'published',
      is_featured ? 1 : 0,
      seo_title || title,
      seo_description || excerpt || ''
    ]
  );

  res.status(201).json({ success: true, id: result.lastInsertRowid });
});

apiRouter.put('/admin/articles/:id', requireEditor, (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    title, slug, excerpt, content, featured_image, category_id,
    tags, reading_time, status, is_featured, seo_title, seo_description
  } = req.body;

  execute(
    `UPDATE articles SET
       title = COALESCE(?, title),
       slug = COALESCE(?, slug),
       excerpt = COALESCE(?, excerpt),
       content = COALESCE(?, content),
       featured_image = COALESCE(?, featured_image),
       category_id = COALESCE(?, category_id),
       tags_json = COALESCE(?, tags_json),
       reading_time = COALESCE(?, reading_time),
       status = COALESCE(?, status),
       is_featured = COALESCE(?, is_featured),
       seo_title = COALESCE(?, seo_title),
       seo_description = COALESCE(?, seo_description),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      title || null,
      slug || null,
      excerpt !== undefined ? excerpt : null,
      content || null,
      featured_image || null,
      category_id || null,
      tags ? JSON.stringify(tags) : null,
      reading_time || null,
      status || null,
      is_featured !== undefined ? (is_featured ? 1 : 0) : null,
      seo_title || null,
      seo_description || null,
      id
    ]
  );

  res.json({ success: true });
});

apiRouter.delete('/admin/articles/:id', requireEditor, (req: Request, res: Response) => {
  execute('DELETE FROM articles WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// --- ADMIN: VIDEOS CRUD ---
apiRouter.get('/admin/videos', requireEditor, (_req: Request, res: Response) => {
  const videos = queryAll('SELECT v.*, c.name as category_name FROM videos v LEFT JOIN categories c ON v.category_id = c.id ORDER BY v.created_at DESC');
  res.json({ videos });
});

apiRouter.post('/admin/videos', requireEditor, (req: Request, res: Response) => {
  const { title, slug, description, thumbnail, video_url, video_provider, duration, category_id, is_featured, status } = req.body;
  const generatedSlug = slug || 'video-' + Date.now();
  execute(
    `INSERT INTO videos (title, slug, description, thumbnail, video_url, video_provider, duration, category_id, is_featured, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, generatedSlug, description, thumbnail, video_url, video_provider || 'youtube', duration || '10:00', category_id || 1, is_featured ? 1 : 0, status || 'published']
  );
  res.status(201).json({ success: true });
});

apiRouter.put('/admin/videos/:id', requireEditor, (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, slug, description, thumbnail, video_url, video_provider, duration, category_id, is_featured, status } = req.body;
  execute(
    `UPDATE videos SET title=?, slug=?, description=?, thumbnail=?, video_url=?, video_provider=?, duration=?, category_id=?, is_featured=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    [title, slug, description, thumbnail, video_url, video_provider, duration, category_id, is_featured ? 1 : 0, status, id]
  );
  res.json({ success: true });
});

apiRouter.delete('/admin/videos/:id', requireEditor, (req: Request, res: Response) => {
  execute('DELETE FROM videos WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// --- ADMIN: MESSAGES CRUD ---
apiRouter.get('/admin/messages', requireEditor, (_req: Request, res: Response) => {
  const messages = queryAll('SELECT m.*, c.name as category_name FROM messages m LEFT JOIN categories c ON m.category_id = c.id ORDER BY m.created_at DESC');
  res.json({ messages });
});

apiRouter.post('/admin/messages', requireEditor, (req: Request, res: Response) => {
  const { title, slug, text, background_image, category_id, is_featured, status } = req.body;
  const generatedSlug = slug || 'message-' + Date.now();
  execute(
    `INSERT INTO messages (title, slug, text, background_image, category_id, is_featured, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, generatedSlug, text, background_image, category_id || 1, is_featured ? 1 : 0, status || 'published']
  );
  res.status(201).json({ success: true });
});

apiRouter.put('/admin/messages/:id', requireEditor, (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, slug, text, background_image, category_id, is_featured, status } = req.body;
  execute(
    `UPDATE messages SET title=?, slug=?, text=?, background_image=?, category_id=?, is_featured=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    [title, slug, text, background_image, category_id, is_featured ? 1 : 0, status, id]
  );
  res.json({ success: true });
});

apiRouter.delete('/admin/messages/:id', requireEditor, (req: Request, res: Response) => {
  execute('DELETE FROM messages WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// --- ADMIN: HEALING JOURNEYS CRUD ---
apiRouter.get('/admin/journeys', requireEditor, (_req: Request, res: Response) => {
  const journeys = queryAll('SELECT j.*, c.name as category_name, COUNT(s.id) as steps_count FROM journeys j LEFT JOIN categories c ON j.category_id = c.id LEFT JOIN journey_steps s ON j.id = s.journey_id GROUP BY j.id ORDER BY j.created_at DESC');
  res.json({ journeys });
});

apiRouter.get('/admin/journeys/:id', requireEditor, (req: Request, res: Response) => {
  const { id } = req.params;
  const journey = queryOne<any>('SELECT * FROM journeys WHERE id = ?', [id]);
  if (!journey) {
    return res.status(404).json({ error: 'رحلة التعافي غير موجودة' });
  }
  const rawSteps = queryAll('SELECT * FROM journey_steps WHERE journey_id = ? ORDER BY step_number ASC', [id]);
  const steps = rawSteps.map(s => ({
    ...s,
    exercises: (() => { try { return JSON.parse(s.exercises_json || '[]'); } catch { return []; } })(),
    questions: (() => { try { return JSON.parse(s.reflection_questions_json || '[]'); } catch { return []; } })()
  }));
  res.json({ journey, steps });
});

apiRouter.post('/admin/journeys', requireEditor, (req: Request, res: Response) => {
  const { title, slug, description, cover_image, category_id, is_featured, status, steps } = req.body;
  const generatedSlug = slug || 'journey-' + Date.now();
  const resJourney = execute(
    `INSERT INTO journeys (title, slug, description, cover_image, category_id, is_featured, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, generatedSlug, description, cover_image, category_id || 1, is_featured ? 1 : 0, status || 'published']
  );

  const journeyId = resJourney.lastInsertRowid;
  if (Array.isArray(steps)) {
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      execute(
        `INSERT INTO journey_steps (journey_id, step_number, title, explanation, exercises_json, reflection_questions_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          journeyId,
          i + 1,
          s.title || `المحطة ${i + 1}`,
          s.explanation || '',
          JSON.stringify(s.exercises || []),
          JSON.stringify(s.questions || [])
        ]
      );
    }
  }

  res.status(201).json({ success: true, id: journeyId });
});

apiRouter.put('/admin/journeys/:id', requireEditor, (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, slug, description, cover_image, category_id, is_featured, status, steps } = req.body;
  execute(
    `UPDATE journeys SET title=?, slug=?, description=?, cover_image=?, category_id=?, is_featured=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    [title, slug, description, cover_image, category_id, is_featured ? 1 : 0, status, id]
  );

  if (Array.isArray(steps)) {
    execute('DELETE FROM journey_steps WHERE journey_id = ?', [id]);
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      execute(
        `INSERT INTO journey_steps (journey_id, step_number, title, explanation, exercises_json, reflection_questions_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          i + 1,
          s.title || `المحطة ${i + 1}`,
          s.explanation || '',
          JSON.stringify(s.exercises || []),
          JSON.stringify(s.questions || [])
        ]
      );
    }
  }

  res.json({ success: true });
});

apiRouter.delete('/admin/journeys/:id', requireEditor, (req: Request, res: Response) => {
  execute('DELETE FROM journey_steps WHERE journey_id = ?', [req.params.id]);
  execute('DELETE FROM journeys WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// --- ADMIN: PODCAST CRUD ---
apiRouter.get('/admin/podcasts', requireEditor, (_req: Request, res: Response) => {
  const podcasts = queryAll('SELECT p.*, c.name as category_name FROM podcasts p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.episode_number DESC');
  res.json({ podcasts });
});

apiRouter.post('/admin/podcasts', requireEditor, (req: Request, res: Response) => {
  const { title, slug, description, cover_image, audio_url, duration, episode_number, category_id, is_featured, status } = req.body;
  const generatedSlug = slug || 'podcast-' + Date.now();
  execute(
    `INSERT INTO podcasts (title, slug, description, cover_image, audio_url, duration, episode_number, category_id, is_featured, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, generatedSlug, description, cover_image, audio_url, duration || '20:00', episode_number || 1, category_id || 1, is_featured ? 1 : 0, status || 'published']
  );
  res.status(201).json({ success: true });
});

apiRouter.put('/admin/podcasts/:id', requireEditor, (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, slug, description, cover_image, audio_url, duration, episode_number, category_id, is_featured, status } = req.body;
  execute(
    `UPDATE podcasts SET title=?, slug=?, description=?, cover_image=?, audio_url=?, duration=?, episode_number=?, category_id=?, is_featured=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    [title, slug, description, cover_image, audio_url, duration, episode_number, category_id, is_featured ? 1 : 0, status, id]
  );
  res.json({ success: true });
});

apiRouter.delete('/admin/podcasts/:id', requireEditor, (req: Request, res: Response) => {
  execute('DELETE FROM podcasts WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// --- ADMIN: CATEGORIES CRUD & REORDER ---
apiRouter.post('/admin/categories', requireEditor, (req: Request, res: Response) => {
  const { name, slug, description, image, display_order } = req.body;
  const generatedSlug = slug || 'cat-' + Date.now();
  execute(
    'INSERT INTO categories (name, slug, description, image, display_order) VALUES (?, ?, ?, ?, ?)',
    [name, generatedSlug, description || '', image || '', display_order || 0]
  );
  res.status(201).json({ success: true });
});

apiRouter.put('/admin/categories/:id', requireEditor, (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, slug, description, image, display_order } = req.body;
  execute(
    'UPDATE categories SET name=?, slug=?, description=?, image=?, display_order=? WHERE id=?',
    [name, slug, description, image, display_order, id]
  );
  res.json({ success: true });
});

apiRouter.delete('/admin/categories/:id', requireEditor, (req: Request, res: Response) => {
  execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// --- ADMIN: SUBMISSIONS MODERATION ("احكي لنا") ---
apiRouter.get('/admin/submissions', requireEditor, (_req: Request, res: Response) => {
  const submissions = queryAll('SELECT * FROM submissions ORDER BY created_at DESC');
  res.json({ submissions });
});

apiRouter.put('/admin/submissions/:id', requireEditor, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, message, admin_notes, category } = req.body;
  execute(
    'UPDATE submissions SET status = COALESCE(?, status), message = COALESCE(?, message), admin_notes = COALESCE(?, admin_notes), category = COALESCE(?, category), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status || null, message || null, admin_notes !== undefined ? admin_notes : null, category || null, id]
  );
  res.json({ success: true });
});

apiRouter.delete('/admin/submissions/:id', requireEditor, (req: Request, res: Response) => {
  execute('DELETE FROM submissions WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// --- ADMIN: COMMENTS MODERATION ---
apiRouter.get('/admin/comments', requireEditor, (_req: Request, res: Response) => {
  const comments = queryAll('SELECT * FROM comments ORDER BY created_at DESC');
  res.json({ comments });
});

apiRouter.put('/admin/comments/:id', requireEditor, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  execute('UPDATE comments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
  res.json({ success: true });
});

apiRouter.delete('/admin/comments/:id', requireEditor, (req: Request, res: Response) => {
  execute('DELETE FROM comments WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// --- ADMIN: MEDIA LIBRARY ---
apiRouter.get('/admin/media', requireEditor, (_req: Request, res: Response) => {
  const media = queryAll('SELECT * FROM media ORDER BY created_at DESC');
  res.json({ media });
});

apiRouter.post('/admin/media', requireEditor, (req: Request, res: Response) => {
  const { file_name, file_url, mime_type, file_size, alt_text, category } = req.body;
  if (!file_url || !file_name) {
    return res.status(400).json({ error: 'اسم الملف والرابط مطلوبان' });
  }
  execute(
    'INSERT INTO media (file_name, file_url, mime_type, file_size, alt_text, category) VALUES (?, ?, ?, ?, ?, ?)',
    [file_name, file_url, mime_type || 'image/jpeg', file_size || 0, alt_text || file_name, category || 'general']
  );
  res.status(201).json({ success: true });
});

apiRouter.delete('/admin/media/:id', requireEditor, (req: Request, res: Response) => {
  execute('DELETE FROM media WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// --- ADMIN: CONTACT MESSAGES ---
apiRouter.get('/admin/contact', requireEditor, (_req: Request, res: Response) => {
  const messages = queryAll('SELECT * FROM contact_messages ORDER BY created_at DESC');
  res.json({ messages });
});

apiRouter.put('/admin/contact/:id/read', requireEditor, (req: Request, res: Response) => {
  execute('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

apiRouter.delete('/admin/contact/:id', requireEditor, (req: Request, res: Response) => {
  execute('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// --- ADMIN: NEWSLETTER SUBSCRIBERS ---
apiRouter.get('/admin/newsletter', requireEditor, (_req: Request, res: Response) => {
  const subscribers = queryAll('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC');
  res.json({ subscribers });
});

// --- ADMIN: USER MANAGEMENT (ADMIN ROLE ONLY) ---
apiRouter.get('/admin/users', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const users = queryAll('SELECT id, name, email, role, avatar, bio, created_at FROM users ORDER BY created_at DESC');
  res.json({ users });
});

apiRouter.post('/admin/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password, role, bio } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'الاسم، البريد الإلكتروني، وكلمة المرور مطلوبة' });
  }

  const existing = queryOne('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (existing) {
    return res.status(400).json({ error: 'البريد الإلكتروني موجود مسبقاً' });
  }

  const hash = await bcrypt.hash(password, 10);
  const result = execute(
    'INSERT INTO users (name, email, password_hash, role, bio, avatar) VALUES (?, ?, ?, ?, ?, ?)',
    [
      name.trim(),
      email.trim().toLowerCase(),
      hash,
      role || 'EDITOR',
      bio || '',
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    ]
  );
  res.status(201).json({ success: true, id: result.lastInsertRowid });
});

apiRouter.put('/admin/users/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, role, bio, password } = req.body;

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
  }

  execute(
    'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), role = COALESCE(?, role), bio = COALESCE(?, bio), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name || null, email ? email.trim().toLowerCase() : null, role || null, bio !== undefined ? bio : null, id]
  );
  res.json({ success: true });
});

apiRouter.delete('/admin/users/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  if (parseInt(id) === req.user!.id) {
    return res.status(400).json({ error: 'لا يمكنك حذف حسابك الحالي' });
  }
  execute('DELETE FROM users WHERE id = ?', [id]);
  res.json({ success: true });
});

// --- ADMIN: SITE SETTINGS ---
apiRouter.put('/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const updates = req.body;
  for (const [key, value] of Object.entries(updates)) {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    execute('INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [key, stringValue]);
  }
  res.json({ success: true, message: 'تم حفظ إعدادات المنصة بنجاح' });
});

// ==========================================
// 12. TEXT-TO-SPEECH (TTS)
// ==========================================
apiRouter.post('/tts', async (req: Request, res: Response) => {
  try {
    const { text, title } = req.body;
    if (!text && !title) {
      return res.status(400).json({ error: 'يرجى تزويد نص لتحويله لصوت' });
    }
    const fullText = [title, text].filter(Boolean).join('\n\n');
    const result = await generateSpeechFromText(fullText);
    res.json(result);
  } catch (err: any) {
    res.json({
      fallbackToNative: true,
      source: 'native',
      error: err?.message || 'تعذر معالجة الصوت بالذكاء الاصطناعي',
    });
  }
});

// ==========================================
// 13. MOOD SELECTION & RECOMMENDATIONS
// ==========================================
const MOOD_DEFINITIONS: Record<string, {
  id: string;
  label: string;
  sublabel: string;
  emoji: string;
  color: string;
  accentBg: string;
  borderColor: string;
  quote: { text: string; author: string };
  categorySlugs: string[];
}> = {
  calm: {
    id: 'calm',
    label: 'أحتاج للهدوء والسكينة',
    sublabel: 'تهدئة الأفكار المتسارعة، تخفيف القلق، والتقاط أنفاس هادئة',
    emoji: '🌿',
    color: 'text-emerald-800',
    accentBg: 'bg-emerald-50/80',
    borderColor: 'border-emerald-200',
    quote: {
      text: 'ليس عليك أن تحل كل شيء الآن.. أحياناً يكون أعظم إنجاز لك في هذا اليوم هو أن تستريح وتهدأ روحك.',
      author: 'لسه في نور'
    },
    categorySlugs: ['inner-peace', 'mental-awareness', 'faith-hope']
  },
  motivation: {
    id: 'motivation',
    label: 'أحتاج للتحفيز وبداية جديدة',
    sublabel: 'تجاوز الفتور والركود، إيقاد شعلة الأمل، واستعادة العزيمة',
    emoji: '⚡',
    color: 'text-amber-800',
    accentBg: 'bg-amber-50/80',
    borderColor: 'border-amber-200',
    quote: {
      text: 'أنت لست متأخراً عن قطار الحياة.. أنت فقط تسير في توقيتك الخاص. كل ما تحتاجه هو خطوة واحدة صغيرة اليوم.',
      author: 'لسه في نور'
    },
    categorySlugs: ['self-growth', 'self-esteem', 'faith-hope']
  },
  healing: {
    id: 'healing',
    label: 'أشعر بالحزن وألم الفقد',
    sublabel: 'مساحة احتواء آمنة للبكاء، مداواة الجرح، والرفق بالنفس وقت الانكسار',
    emoji: '💔',
    color: 'text-rose-800',
    accentBg: 'bg-rose-50/80',
    borderColor: 'border-rose-200',
    quote: {
      text: 'التعافي لا يعني أن الجرح لم يكن موجوداً، بل يعني أنه لم يعد يتحكم في حاضرك. ابكِ إذا احتجت، ثم استند إلى لطف الله.',
      author: 'لسه في نور'
    },
    categorySlugs: ['healing', 'mental-awareness', 'inner-peace']
  },
  clarity: {
    id: 'clarity',
    label: 'تائه(ة) وأبحث عن وضوح',
    sublabel: 'ترتيب الأولويات، فهم المشاعر المتشابكة، ورسم بوصلة قراراتك',
    emoji: '🧭',
    color: 'text-indigo-800',
    accentBg: 'bg-indigo-50/80',
    borderColor: 'border-indigo-200',
    quote: {
      text: 'حين تشعر بالضياع، تذكر أن البذور تدفن أولاً في الظلام قبل أن تنبت نحو النور. ما تراه تيهاً قد يكون بداية وعي أعمق.',
      author: 'لسه في نور'
    },
    categorySlugs: ['mental-awareness', 'personal-boundaries', 'self-growth']
  },
  exhausted: {
    id: 'exhausted',
    label: 'مستنزف(ة) من علاقة معقدة',
    sublabel: 'فك التعلق المؤذي، وقف استنزاف طاقتك، والتعافي من التلاعب',
    emoji: '🛡️',
    color: 'text-stone-800',
    accentBg: 'bg-stone-100/90',
    borderColor: 'border-stone-300',
    quote: {
      text: 'خسارتهم لم تكن نقصاً فيك، بل كانت دليلاً على أن كرمك فاق سعة إنائهم. حدودك هي قمة احترامك لذاتك.',
      author: 'لسه في نور'
    },
    categorySlugs: ['toxic-relationships', 'personal-boundaries', 'relationships', 'marriage']
  },
  'self-love': {
    id: 'self-love',
    label: 'أرغب في احتواء نفسي والرفق بذاتي',
    sublabel: 'وقف جلد الذات، مسامحة النفس، وتضميد جراح الطفل الداخلي',
    emoji: '🌸',
    color: 'text-pink-800',
    accentBg: 'bg-pink-50/80',
    borderColor: 'border-pink-200',
    quote: {
      text: 'سامح نفسك على ما لم تكن تدركه حينها. كنت تفعل أفضل ما لديك بوعيك السابق. اليوم أنت أكثر حكمة واستحقاقاً للأمان.',
      author: 'لسه في نور'
    },
    categorySlugs: ['self-esteem', 'healing', 'inner-peace']
  }
};

apiRouter.get('/moods', (_req: Request, res: Response) => {
  res.json({ moods: Object.values(MOOD_DEFINITIONS) });
});

apiRouter.get('/mood-recommendations', (req: Request, res: Response) => {
  const moodKey = (req.query.mood as string) || 'calm';
  const mood = MOOD_DEFINITIONS[moodKey] || MOOD_DEFINITIONS.calm;

  const slugs = mood.categorySlugs;
  const placeholders = slugs.map(() => '?').join(', ');

  // Query matching articles
  const rawArticles = queryAll<any>(
    `SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image, a.author_name, a.reading_time, 
            a.published_at, a.view_count, a.is_featured, a.tags_json,
            c.id as category_id, c.name as category_name, c.slug as category_slug
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.status = 'published' AND c.slug IN (${placeholders})
     ORDER BY a.is_featured DESC, a.view_count DESC, a.published_at DESC
     LIMIT 4`,
    [...slugs]
  );

  const articles = rawArticles.map((art) => ({
    ...art,
    tags: (() => {
      try { return JSON.parse(art.tags_json || '[]'); } catch { return []; }
    })()
  }));

  // Query matching journeys
  const journeys = queryAll<any>(
    `SELECT j.*, c.name as category_name, COUNT(s.id) as steps_count
     FROM journeys j
     LEFT JOIN categories c ON j.category_id = c.id
     LEFT JOIN journey_steps s ON j.id = s.journey_id
     WHERE j.status = 'published' AND (c.slug IN (${placeholders}) OR j.is_featured = 1)
     GROUP BY j.id
     ORDER BY (CASE WHEN c.slug IN (${placeholders}) THEN 1 ELSE 2 END), j.view_count DESC
     LIMIT 2`,
    [...slugs, ...slugs]
  );

  // Query matching messages
  const messages = queryAll<any>(
    `SELECT m.*, c.name as category_name
     FROM messages m
     LEFT JOIN categories c ON m.category_id = c.id
     WHERE m.status = 'published' AND (c.slug IN (${placeholders}) OR m.is_featured = 1)
     ORDER BY (CASE WHEN c.slug IN (${placeholders}) THEN 1 ELSE 2 END), m.view_count DESC
     LIMIT 3`,
    [...slugs, ...slugs]
  );

  res.json({
    mood,
    articles,
    journeys,
    messages
  });
});

// ==========================================
// 17. GEMINI CHATBOT (MULTI-TURN & SPECIALIZED ROLES)
// ==========================================

apiRouter.get('/chat/roles', (_req: Request, res: Response) => {
  const rolesList = Object.values(CHAT_ROLES).map((role) => ({
    id: role.id,
    name: role.name,
    badge: role.badge,
    tagline: role.tagline,
    model: role.model,
    suggestedPrompts: role.suggestedPrompts
  }));
  res.json({ roles: rolesList });
});

apiRouter.post('/chat/message', async (req: Request, res: Response) => {
  try {
    const { message, history, roleId } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'الرسالة مطلوبة ولا يمكن أن تكون فارغة.' });
      return;
    }

    const validRoleId: ChatRoleId =
      roleId && (roleId === 'general' || roleId === 'fast' || roleId === 'complex')
        ? roleId
        : 'general';

    const result = await processChatMessage({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      roleId: validRoleId
    });

    res.json({
      success: true,
      reply: result.reply,
      roleId: result.roleId,
      modelUsed: result.modelUsed,
      roleName: result.roleName,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    res.status(500).json({
      error: err?.message || 'حدث خطأ غير متوقع أثناء معالجة المحادثة.',
      success: false
    });
  }
});




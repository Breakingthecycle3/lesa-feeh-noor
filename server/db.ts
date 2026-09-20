import fs from 'fs';
import path from 'path';
import initSqlJs, { Database } from 'sql.js';
import bcrypt from 'bcryptjs';

let dbInstance: Database | null = null;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'database.sqlite');

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('Error loading existing database, creating new one:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Enable foreign keys
  dbInstance.run('PRAGMA foreign_keys = ON;');

  initSchema(dbInstance);
  await seedInitialData(dbInstance);
  await ensureFatmaAdmin(dbInstance);
  saveDb();

  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to save database to disk:', err);
  }
}

// SQL Query helper methods
export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return rows;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  let row: T | null = null;
  if (stmt.step()) {
    row = stmt.getAsObject() as unknown as T;
  }
  stmt.free();
  return row;
}

export function execute(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  const res = dbInstance.exec('SELECT last_insert_rowid() as id, changes() as changes;');
  const lastInsertRowid = res.length > 0 && res[0].values.length > 0 ? (res[0].values[0][0] as number) : 0;
  const changes = res.length > 0 && res[0].values.length > 0 ? (res[0].values[0][1] as number) : 0;
  saveDb();
  return { lastInsertRowid, changes };
}

function initSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER', -- 'ADMIN', 'EDITOR', 'USER'
      avatar TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image TEXT,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT,
      content TEXT NOT NULL,
      featured_image TEXT,
      author_id INTEGER REFERENCES users(id),
      author_name TEXT NOT NULL DEFAULT 'فريق تحرير لسه في نور',
      category_id INTEGER REFERENCES categories(id),
      tags_json TEXT DEFAULT '[]',
      reading_time INTEGER DEFAULT 5,
      status TEXT NOT NULL DEFAULT 'published', -- 'draft', 'published', 'scheduled', 'archived'
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      view_count INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      seo_title TEXT,
      seo_description TEXT,
      social_image TEXT,
      related_articles_json TEXT DEFAULT '[]',
      related_videos_json TEXT DEFAULT '[]',
      related_messages_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
    CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
    CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      thumbnail TEXT,
      video_url TEXT NOT NULL,
      video_provider TEXT NOT NULL DEFAULT 'youtube', -- 'youtube', 'vimeo', 'direct'
      duration TEXT DEFAULT '10:00',
      category_id INTEGER REFERENCES categories(id),
      tags_json TEXT DEFAULT '[]',
      author_name TEXT NOT NULL DEFAULT 'لسه في نور',
      is_featured INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published',
      seo_title TEXT,
      seo_description TEXT,
      related_articles_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_videos_slug ON videos(slug);

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      text TEXT NOT NULL,
      background_image TEXT,
      category_id INTEGER REFERENCES categories(id),
      author_name TEXT NOT NULL DEFAULT 'لسه في نور',
      is_featured INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS journeys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      cover_image TEXT,
      category_id INTEGER REFERENCES categories(id),
      status TEXT NOT NULL DEFAULT 'published',
      is_featured INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      seo_title TEXT,
      seo_description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS journey_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      journey_id INTEGER NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
      step_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      explanation TEXT NOT NULL,
      articles_json TEXT DEFAULT '[]',
      videos_json TEXT DEFAULT '[]',
      messages_json TEXT DEFAULT '[]',
      exercises_json TEXT DEFAULT '[]',
      reflection_questions_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_journey_steps ON journey_steps(journey_id, step_number);

    CREATE TABLE IF NOT EXISTS podcasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      cover_image TEXT,
      audio_url TEXT NOT NULL,
      duration TEXT DEFAULT '25:00',
      episode_number INTEGER DEFAULT 1,
      category_id INTEGER REFERENCES categories(id),
      is_featured INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published',
      seo_title TEXT,
      seo_description TEXT,
      related_articles_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      category TEXT,
      age_range TEXT,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'published'
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type TEXT NOT NULL, -- 'article', 'video', 'podcast', 'journey'
      content_id INTEGER NOT NULL,
      author_name TEXT NOT NULL,
      author_email TEXT NOT NULL,
      comment_text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'rejected', 'spam'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      alt_text TEXT,
      category TEXT DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content_type TEXT NOT NULL, -- 'article', 'video', 'message', 'podcast', 'journey'
      content_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, content_type, content_id)
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS navigation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      path TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );
  `);
}

async function seedInitialData(db: Database) {
  // Check if users exist
  const res = db.exec('SELECT COUNT(*) as count FROM users');
  const userCount = res[0].values[0][0] as number;
  if (userCount > 0) return; // Already seeded

  console.log('🌱 Seeding initial database records for لسه في نور...');

  const passwordHash = await bcrypt.hash('admin123456', 10);
  const editorHash = await bcrypt.hash('editor123456', 10);
  const userHash = await bcrypt.hash('user123456', 10);

  // 1. Users
  db.run(`
    INSERT INTO users (id, email, password_hash, name, role, avatar, bio)
    VALUES 
    (1, 'admin@lesanour.com', '${passwordHash}', 'د. نور الهدى الشريف', 'ADMIN', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', 'استشارية نفسية ومؤسسة منصة لسه في نور. نؤمن بأن كل ألم يحمل في طياته بذرة وعي جديد.'),
    (2, 'editor@lesanour.com', '${editorHash}', 'أحمد كمال', 'EDITOR', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', 'محرر ومسؤول المحتوى الإنساني والتطوير الذاتي.'),
    (3, 'user@lesanour.com', '${userHash}', 'سارة المنصوري', 'USER', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', 'باحثة عن السلام الداخلي ومتابعة للمنصة.');
  `);

  // 2. Initial Categories (12 requested categories)
  const initialCategories = [
    { name: 'الوعي النفسي', slug: 'mental-awareness', desc: 'فهم المشاعر، التعامل مع القلق والاكتئاب، وتعميق الاتصال مع الذات.', img: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80', order: 1 },
    { name: 'التعافي', slug: 'healing', desc: 'رحلات الشفاء من الصدمات، تجاوز الفقد، واستعادة التوازن الداخلي.', img: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80', order: 2 },
    { name: 'العلاقات المؤذية', slug: 'toxic-relationships', desc: 'التعرف على التلاعب العاطفي، النرجسية، وكيفية التحرر بأمان.', img: 'https://images.unsplash.com/photo-1474418397713-7ede21d49118?auto=format&fit=crop&w=800&q=80', order: 3 },
    { name: 'الحدود الشخصية', slug: 'personal-boundaries', desc: 'كيف تقول "لا" بلطف، حماية طاقتك، واحترام استقلاليتك النفسية.', img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80', order: 4 },
    { name: 'العلاقات', slug: 'relationships', desc: 'بناء روابط إنسانية صادقة قائمة على الأمان المتبادل والاحترام.', img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80', order: 5 },
    { name: 'الزواج', slug: 'marriage', desc: 'المودة والرحمة، حل الخلافات بوعي، وتجديد الميثاق الغليظ.', img: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80', order: 6 },
    { name: 'الأسرة', slug: 'family', desc: 'دفء البيت، الشفاء العائلي بين الأجيال، وترميم صلات الرحم.', img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80', order: 7 },
    { name: 'تربية الأبناء', slug: 'parenting', desc: 'التربية الإيجابية الواعية دون قسوة أو إفراط، وبناء أطفال آمنين.', img: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=800&q=80', order: 8 },
    { name: 'الثقة بالنفس', slug: 'self-esteem', desc: 'إعادة اكتشاف قيمتك الحقيقية، التحرر من مقارنة النفس، وحب الذات.', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80', order: 9 },
    { name: 'السلام الداخلي', slug: 'inner-peace', desc: 'السكينة، الهدوء الروحي، وممارسات التأمل والامتنان اليومي.', img: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&q=80', order: 10 },
    { name: 'تطوير الذات', slug: 'self-growth', desc: 'خطوات عملية لصناعة عادات داعمة، إدارة المشاعر، وتحقيق الأهداف.', img: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80', order: 11 },
    { name: 'الإيمان والأمل', slug: 'faith-hope', desc: 'اليقين بلطف الله، الصبر الجميل، والنور الذي يبدد عتمة كل طريق.', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', order: 12 }
  ];

  for (const cat of initialCategories) {
    db.run(
      'INSERT INTO categories (name, slug, description, image, display_order) VALUES (?, ?, ?, ?, ?)',
      [cat.name, cat.slug, cat.desc, cat.img, cat.order]
    );
  }

  // 3. Navigation items
  const navItems = [
    { title: 'الرئيسية', path: '/', order: 1 },
    { title: 'الموضوعات', path: '/articles', order: 2 },
    { title: 'الفيديوهات', path: '/videos', order: 3 },
    { title: 'رسائل لسه في نور', path: '/messages', order: 4 },
    { title: 'رحلة التعافي', path: '/journeys', order: 5 },
    { title: 'البودكاست', path: '/podcast', order: 6 },
    { title: 'احكي لنا', path: '/tell-us', order: 7 },
    { title: 'من نحن', path: '/about', order: 8 }
  ];

  for (const item of navItems) {
    db.run(
      'INSERT INTO navigation_items (title, path, display_order, is_active) VALUES (?, ?, ?, 1)',
      [item.title, item.path, item.order]
    );
  }

  // 4. Articles (At least 10 realistic, deep editorial articles)
  const articles = [
    {
      title: 'كيف تبدأ التعافي عندما تظن أن كل شيء قد انكسر؟',
      slug: 'how-to-start-healing-when-broken',
      excerpt: 'التعافي لا يعني أن الجرح لم يكن موجوداً، بل يعني أن الجرح لم يعد يتحكم في حياتك اليومية. إليك خريطة البداية الهادئة.',
      content: `<h2>البداية ليست لحظة بطولية، بل نفس عميق</h2>
<p>في كثير من الأحيان، نظن أن التعافي يبدأ بقرار حاسم وصاخب: "من اليوم سأتغير تماماً". لكن الحقيقة التي يخبرنا بها علم النفس وتجارب الحياة الإنسانية، هي أن التعافي الحقيقي يبدأ في اللحظة التي تتوقف فيها عن محاربة حزنك، وتبدأ في الاستماع إليه.</p>
<blockquote>"مهما كان اللي عديت بيه، جروحك لا تحدد مستقبلك... هي فقط تشهد على أنك قاومت ونجوت."</blockquote>
<h2>1. الاعتراف بالألم دون تبريره</h2>
<p>أول خطوات الشفاء هي التسمية. عندما تقول: "أنا متألم لأنني تعرضت للخيانة"، أو "أنا منهك لأنني حملت فوق طاقتي لسنوات"، فإنك تنزع عن مشاعرك صفة الإنكار. الألم الذي يُعترف به يفقد نصف توحشه.</p>
<h2>2. فك الارتباط بين قيمتك وسلوك الآخرين</h2>
<p>عندما يسيء إلينا شخص نحبه، فإن عقولنا تميل تلقائياً لتحميل أنفسنا اللوم: "لو كنت كافياً لما فعل بي ذلك". هذه الخدعة النفسية تجعلنا سجناء لمن أساءوا إلينا. سلوكهم انعكاس لفوضاهم الداخلية، وليس لمقدار استحقاقك ونورك.</p>
<h2>3. مساحة اليوم الواحد</h2>
<p>لا تفكر في كيفية التعافي للسنوات القادمة. اسأل نفسك صباح كل يوم: "ما الشيء الصغير الذي يمكنني فعله اليوم لأكون ألطف بنفسي؟" ربما يكون كوب شاي دافئ، أو اعتذار عن مناسبة ترهقك، أو مجرد النوم لساعة إضافية.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
      category_id: 2, // التعافي
      reading_time: 6,
      is_featured: 1,
      view_count: 1420,
      tags: JSON.stringify(['التعافي', 'السلام الداخلي', 'الوعي النفسي'])
    },
    {
      title: 'علامات الإرهاق العاطفي: عندما تكون المشكلة في العطاء المفرط',
      slug: 'signs-of-emotional-burnout',
      excerpt: 'هل تشعر أن طاقتك مستنزفة دائماً لصالح الآخرين بينما لا يتبقى لنفسك سوى الفتات؟ تعرف على فخ الإرضاء المستمر.',
      content: `<h2>ما هو الاستنزاف النفسي؟</h2>
<p>الاستنزاف لا يحدث فجأة، بل يتسلل كقطرات ماء متتالية على صخرة صلبة حتى يشققها. إنه الحالة التي تجد فيها نفسك عاجزاً عن التعاطف، ليس لقسوة في قلبك، بل لأن خزان عواطفك فرغ تماماً.</p>
<blockquote>"لا يمكنك أن تسقي شجرة وأنت جاف من الداخل. العناية بنفسك ليست أنانية، بل هي أساس كل عطاء سليم."</blockquote>
<h2>علامات تحذيرية لا تتجاهلها:</h2>
<ul>
<li>الشعور بالذنب عند محاولة أخذ قسط من الراحة.</li>
<li>الانزعاج السريع من أصغر الطلبات العائلية أو الاجتماعية.</li>
<li>الإحساس الدائم بأنك المسؤول الوحيد عن مشاعر وسعادة من حولك.</li>
<li>اضطرابات في النوم والشهية دون سبب عضوي مباشر.</li>
</ul>
<h2>كيف تستعيد توازنك؟</h2>
<p>ضع حداً فاصلاً بين "التعاطف" و"تحمل المسؤولية". أنت لست منقذاً للعالم، وأنت لست مسؤولاً عن تصليح حياة أحد على حساب سلامتك العقلية والجسدية.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=80',
      category_id: 1, // الوعي النفسي
      reading_time: 5,
      is_featured: 1,
      view_count: 980,
      tags: JSON.stringify(['الوعي النفسي', 'الحدود الشخصية', 'تطوير الذات'])
    },
    {
      title: 'فن وضع الحدود الشخصية دون شعور بالذنب',
      slug: 'art-of-setting-boundaries-without-guilt',
      excerpt: 'الحدود ليست جدراناً لعزل الناس، بل هي أبواب نختار متى نفتحها ولمن نسمح بالدخول. دليلك لقول "لا" بكرامة وسلام.',
      content: `<h2>لماذا نشعر بالذنب عند قول "لا"؟</h2>
<p>تربى الكثير منا في بيئات تربط بين الطاعة المطلقة وقبول الذات. تعلمنا أن الشخص "الطيب" هو من يضحي دائماً. ولكن عندما تضحي باستمرار، فإن ما تضحي به في النهاية هو احترامك لذاتك.</p>
<blockquote>"الحدود الشخصية هي المسافة التي تسمح لي بأن أحبك وأحترم نفسي في نفس الوقت."</blockquote>
<h2>أنواع الحدود الأساسية:</h2>
<p>1. <strong>الحدود العاطفية:</strong> منع الآخرين من سكب طاقتهم السلبية عليك دون استئذان.<br/>
2. <strong>الحدود الزمنية:</strong> احترام وقت راحتك وعدم الرد على مكالمات العمل أو العلاقات في ساعات سكينتك.<br/>
3. <strong>الحدود الفكرية:</strong> حقك في أن تختلف في الرأي دون أن تتعرض للتقليل أو السخرية.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
      category_id: 4, // الحدود الشخصية
      reading_time: 7,
      is_featured: 1,
      view_count: 1850,
      tags: JSON.stringify(['الحدود الشخصية', 'الثقة بالنفس', 'العلاقات'])
    },
    {
      title: 'كيف تتعرف على شريك الحياة النرجسي قبل فوات الأوان؟',
      slug: 'recognizing-narcissistic-partner',
      excerpt: 'العلاقات المؤذية تبدأ غالباً بالحب المفرط وتتحول تدريجياً إلى قفص من الشك ولوم النفس. إليك تفكيك أدوات التلاعب العاطفي.',
      content: `<h2>فخ الإغداق العاطفي (Love Bombing)</h2>
<p>في البداية، يبدو الأمر كقصة خيالية ساحرة: اهتمام يفوق الوصف، رسائل لا تنقطع، ووعود بمستقبل مثالي. هذا ليس حباً حقيقياً بل هو مرحلة "الصيد العاطفي" لجعل الضحية تعتمد كلياً على وجوده.</p>
<h2>التشكيك بالواقع (Gaslighting)</h2>
<p>عندما تلاحظ تصرفاً خاطئاً وتواجهه به، تنقلب الآية: "أنت تبالغ"، "أنت مريض نفسياً وتتخيل أشياء لم تحدث"، "أنا لم أقل ذلك أبداً". بمرور الوقت، تبدأ بالشك في ذاكرتك وسلامة عقلك.</p>
<blockquote>"الأمان ليس في الكلمات المعسولة، بل في الثبات والاحترام عندما تغضب وعندما تختلف."</blockquote>
<p>الخروج من هذه العلاقة يحتاج إلى دعم وشجاعة وخطط واضحة، وتذكر دائماً: لست مذنباً فيما حدث لك.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1474418397713-7ede21d49118?auto=format&fit=crop&w=1200&q=80',
      category_id: 3, // العلاقات المؤذية
      reading_time: 8,
      is_featured: 0,
      view_count: 2310,
      tags: JSON.stringify(['العلاقات المؤذية', 'الوعي النفسي', 'العلاقات'])
    },
    {
      title: 'السكينة في زمن القلق: ممارسات يومية للسلام الداخلي',
      slug: 'inner-peace-practices-in-anxious-times',
      excerpt: 'عالمنا اليوم مزدحم بالضجيج والمقارنات والأخبار السريعة. كيف نخلق واحة هدوء داخلية لا تهزها عواصف الخارج؟',
      content: `<h2>الصمت كعلاج نفسي</h2>
<p>نحن محاطون بالمؤثرات الصوتية والبصرية طوال اليوم. دماغك في حالة تأهب واستثارة مستمرة. امنح نفسك 15 دقيقة يومياً دون هاتف، دون تلفاز، ودون حديث. فقط راقب تنفسك وسريان الحياة في جسدك.</p>
<h2>قوة الامتنان في إعادة تشكيل الدماغ</h2>
<p>تظهر الدراسات العصبية أن كتابة ثلاثة أشياء تشعر بالامتنان لها يومياً تعيد توجيه مسارات الدماغ للتركيز على النعم وفرص الحياة بدلاً من المخاطر والغيابات.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1200&q=80',
      category_id: 10, // السلام الداخلي
      reading_time: 4,
      is_featured: 0,
      view_count: 750,
      tags: JSON.stringify(['السلام الداخلي', 'الوعي النفسي'])
    },
    {
      title: 'إعادة بناء الثقة بالذات بعد الفشل أو الانفصال',
      slug: 'rebuilding-self-trust-after-failure',
      excerpt: 'أكبر خسارة بعد التجارب القاسية ليست فقدان الأشخاص، بل فقدان ثقتك في أحكامك واختياراتك. كيف تعود لتصدق صوتك الداخلي؟',
      content: `<h2>الانفصال ليس إخفاقاً شخصياً</h2>
<p>نهاية علاقة أو تعثر مشروع لا يعني أنك غير كفء أو غير محبوب. العلاقات تجارب إنسانية تخضع لتوافق نضج الطرفين ومسارات القدر. لا تجعل حدثاً عابراً حكماً نهائياً على هويتك.</p>
<h2>خطوات استرجاع البوصلة الداخلية</h2>
<p>توقف عن استشارة عشرة أشخاص قبل اتخاذ قرار صغير. ابدأ بقرارات يومية بسيطة وتحمل نتائجها بثقة: ما ترتديه، ما تقرؤه، كيف تقضي عطلتك. الصدق مع الذات هو العضلة التي تبني الثقة.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80',
      category_id: 9, // الثقة بالنفس
      reading_time: 6,
      is_featured: 0,
      view_count: 1120,
      tags: JSON.stringify(['الثقة بالنفس', 'تطوير الذات', 'التعافي'])
    },
    {
      title: 'التربية بالحب والحزم: كيف نربي أطفالاً أسوياء نفسياً؟',
      slug: 'parenting-with-love-and-firmness',
      excerpt: 'بين القسوة التي تكسر الطفل والتدليل الذي يفسده، يكمن فن التربية الواعية. كيف تصنع الأمان النفسي في بيتك؟',
      content: `<h2>الطفل لا يحتاج أباً أو أماً مثاليين، بل يحتاج حضوراً حقيقياً</h2>
<p>أعظم هدية تقدمها لطفلك ليست الألعاب الباهظة أو الإنجازات الأكاديمية المبكرة، بل قدرتك على تنظيم مشاعرك حين يغضب، والاستماع لمخاوفه دون استهزاء أو إلقاء محاضرات فورية.</p>
<h2>احتواء المشاعر مع ضبط السلوك</h2>
<p>القاعدة الذهبية في علم نفس الطفل: "جميع المشاعر مقبولة ومرحب بها، لكن ليست كل السلوكيات مقبولة". يحق للطفل أن يشعر بالإحباط أو الغضب، لكن لا يحق له إيذاء نفسه أو الآخرين.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=1200&q=80',
      category_id: 8, // تربية الأبناء
      reading_time: 6,
      is_featured: 0,
      view_count: 890,
      tags: JSON.stringify(['تربية الأبناء', 'الأسرة'])
    },
    {
      title: 'الصبر الجميل واليقين: عندما تتحدث الروح مع بارئها',
      slug: 'beautiful-patience-and-spiritual-healing',
      excerpt: 'في قلب كل محنة رسالة خفية من اللطف الإلهي. كيف يعيد الإيمان ترميم أرواحنا المنهكة ويبعث فيها النور من جديد؟',
      content: `<h2>معنى الصبر الجميل</h2>
<p>الصبر الجميل هو الصبر الذي يخلو من الشكوى للناس ويملؤه الأمل واليقين في حكمة الله. إنه ليس استسلاماً عاجزاً، بل سكون القلب بين يدي ربه مع السعي والعمل.</p>
<blockquote>"إِنَّ مَعَ الْعُسْرِ يُسْرًا... النور ليس بعد العسر، بل يولد من رحمه."</blockquote>
<p>مهما اشتدت الظلمة في قلبك، هناك باب مفتوح للسماء لا يُغلق أبداً.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      category_id: 12, // الإيمان والأمل
      reading_time: 5,
      is_featured: 1,
      view_count: 1650,
      tags: JSON.stringify(['الإيمان والأمل', 'السلام الداخلي'])
    },
    {
      title: 'كيف نصلح لغة الحوار في الزواج قبل أن يبرد القلب؟',
      slug: 'repairing-communication-in-marriage',
      excerpt: 'الخرس الزوجي لا يبدأ في يوم وليلة، بل يبدأ حين يكف الشريكان عن التعبير الحقيقي الصادق خوفاً من النزاع. إليك جسور الوصل.',
      content: `<h2>الفارق بين الشكوى والهجوم</h2>
<p>عندما تقول: "أنت مهمل ولا تهتم بي"، فهذا هجوم يستدعي الدفاع فوراً. أما عندما تقول: "أنا أشعر بالوحدة وأحتاج إلى قضاء وقت معك"، فهذا تعبير عن حاجة إنسانية يدعو للقرب والاحتواء.</p>
<h2>الاستماع للوصول وليس للانتصار</h2>
<p>في الحوار الزوجي الصحي، لا يوجد رابح وخاسر. إذا ربح أحد الشريكين وخسر الآخر، فقد خسرت العلاقة بأكملها. استمع لتفهم وجع شريكك، لا لترد على نقاطه.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
      category_id: 6, // الزواج
      reading_time: 7,
      is_featured: 0,
      view_count: 1340,
      tags: JSON.stringify(['الزواج', 'العلاقات', 'الحدود الشخصية'])
    },
    {
      title: 'شفاء الطفل الداخلي: كيف نتصالح مع ماضينا؟',
      slug: 'healing-the-inner-child',
      excerpt: 'كثير من ردود أفعالنا المبالغ فيها اليوم هي في الحقيقة صرخات لطفل صغير بداخلنا خاف في الماضي ولم يجد من يطمئنه.',
      content: `<h2>من هو طفلك الداخلي؟</h2>
<p>هو مجموع ذكرياتك ومشاعرك وحاجاتك العاطفية التي لم تجد إشباعاً أو تفسيراً في سنوات طفولتك الأولى. عندما تشعر برعب غير مبرر من الرفض أو الهجر، فهذا الطفل هو من يرتجف.</p>
<h2>كيف تصبح الأب الحنون لنفسك؟</h2>
<p>أغمض عينيك، تذكر صورتك وأنت في السابعة من عمرك، وقل له بصدق: "أنا هنا الآن، أنا أراك، وأنا لن أتركك أبداً. أنت في أمان معي."</p>`,
      featured_image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
      category_id: 2, // التعافي
      reading_time: 6,
      is_featured: 0,
      view_count: 1720,
      tags: JSON.stringify(['التعافي', 'الوعي النفسي', 'تطوير الذات'])
    }
  ];

  for (const art of articles) {
    db.run(`
      INSERT INTO articles (title, slug, excerpt, content, featured_image, author_id, author_name, category_id, tags_json, reading_time, is_featured, view_count, status, seo_title, seo_description)
      VALUES (?, ?, ?, ?, ?, 1, 'د. نور الهدى الشريف', ?, ?, ?, ?, ?, 'published', ?, ?)
    `, [art.title, art.slug, art.excerpt, art.content, art.featured_image, art.category_id, art.tags, art.reading_time, art.is_featured, art.view_count, art.title + ' | لسه في نور', art.excerpt]);
  }

  // 5. Messages ("رسائل لسه في نور" - At least 8 emotional cards)
  const messages = [
    {
      title: 'أنت لست متأخراً',
      slug: 'you-are-not-late',
      text: 'أنت لست متأخراً عن قطار الحياة.. أنت تسير في توقيتك الخاص والمقسوم لك بعناية إلهية فائقة. كل نبتة تزهر في موسمها، ونورك سيشرق في وقته التمام.',
      category_id: 12,
      background_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      is_featured: 1,
      view_count: 840
    },
    {
      title: 'خسارتهم لم تكن نقصاً فيك',
      slug: 'their-loss-was-not-your-flaw',
      text: 'حين يخذلك شخص فتحت له أبواب قلبك، تذكر أن الأواني تفيض بما فيها. العيب ليس في كرمك وطيبتك، بل في سعة إنائهم وقدرتهم على الاستيعاب.',
      category_id: 3,
      background_image: 'https://images.unsplash.com/photo-1474418397713-7ede21d49118?auto=format&fit=crop&w=800&q=80',
      is_featured: 1,
      view_count: 1120
    },
    {
      title: 'استرح.. ليس عليك إصلاح كل شيء',
      slug: 'rest-you-dont-have-to-fix-everything',
      text: 'ليس عليك أن تنقذ الجميع، وليس عليك أن تكون قوياً طوال الأربع والعشرين ساعة. يحق لقلبك أن يستريح، ويحق لعينيك أن تدمع، ولروحك أن تستند.',
      category_id: 1,
      background_image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80',
      is_featured: 1,
      view_count: 940
    },
    {
      title: 'النور قادم لا محالة',
      slug: 'light-is-inevitably-coming',
      text: 'مهما طالت عتمة النفق وضاق بك النفس، تذكر أن الفجر لا ينبثق إلا من أشد ساعات الليل ظلمة. اصمد قليلاً.. لسه في نور.',
      category_id: 12,
      background_image: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&q=80',
      is_featured: 1,
      view_count: 1350
    },
    {
      title: 'الحدود هي قمة الاحترام',
      slug: 'boundaries-are-peak-respect',
      text: 'حين تضع حدوداً تحمي بها سلامك، قد يغضب من اعتادوا على انتهاك مساحتك. لا تتراجع، فمن يحبك بصدق سيحترم حدودك قبل أن يطلب ودك.',
      category_id: 4,
      background_image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
      is_featured: 0,
      view_count: 670
    },
    {
      title: 'سامح نفسك أولاً',
      slug: 'forgive-yourself-first',
      text: 'سامح نفسك على القرارات التي اتخذتها وأنت لا تملك الوعي الكافي، سامحها على الأبواب التي طرقتها بحسن نية. أنت فعلت أفضل ما تستطيعه في ذلك الوقت.',
      category_id: 2,
      background_image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
      is_featured: 0,
      view_count: 810
    },
    {
      title: 'أنت لست وحيداً في وجعك',
      slug: 'you-are-not-alone',
      text: 'في هذه اللحظة بالذات، هناك أرواح تشبهك تماماً، تحاول النهوض، وترتب شتاتها بهدوء. لست استثناءً في الألم، ولن تكون استثناءً في المعافاة والنهوض.',
      category_id: 10,
      background_image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
      is_featured: 0,
      view_count: 990
    },
    {
      title: 'دع الأيام تعيد ترتيب ما انفرط',
      slug: 'let-days-reorder',
      text: 'ما فاتك لم يُخلق لك، وما قُدّر لك لن يخطئك ولو كان بين جبلين. سلم أمرك لله ونم قرير العين، فالأمور تدبر في الخفاء بأعظم مما تتخيل.',
      category_id: 12,
      background_image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
      is_featured: 0,
      view_count: 730
    }
  ];

  for (const msg of messages) {
    db.run(`
      INSERT INTO messages (title, slug, text, background_image, category_id, is_featured, view_count, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'published')
    `, [msg.title, msg.slug, msg.text, msg.background_image, msg.category_id, msg.is_featured, msg.view_count]);
  }

  // 6. Videos (At least 6 videos)
  const videos = [
    {
      title: 'كيف تتخلص من عقدة لوم النفس المستمر؟',
      slug: 'overcoming-chronic-self-blame',
      description: 'جلسة إرشادية معمقة حول كيفية تفكيك الصوت الناقد الداخلي وتحويله إلى صوت داعم رحيم بالذات.',
      thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      video_provider: 'youtube',
      duration: '14:25',
      category_id: 9,
      is_featured: 1,
      view_count: 3120
    },
    {
      title: 'علامات الشفاء العاطفي التي لا ينتبه لها أحد',
      slug: 'signs-of-emotional-healing',
      description: 'الشفاء ليس غياب المشاعر الصعبة، بل طريقة استجابتك لها. اكتشف العلامات الخمس للتعافي الحقيقي.',
      thumbnail: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      video_provider: 'youtube',
      duration: '18:10',
      category_id: 2,
      is_featured: 1,
      view_count: 2450
    },
    {
      title: 'كيف تضع حدوداً مع الشخصيات السامة في العائلة؟',
      slug: 'boundaries-with-toxic-family',
      description: 'خطوات عملية لحماية صحتك النفسية دون قطع صلة الرحم أو الدخول في معارك استنزافية.',
      thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      video_provider: 'youtube',
      duration: '22:40',
      category_id: 4,
      is_featured: 0,
      view_count: 1890
    },
    {
      title: 'تمرين التنفس العميق والتأريض لتخفيف نوبات الهلع',
      slug: 'deep-breathing-for-panic-attacks',
      description: 'تطبيق عملي وتأمل موجه يمكنك ممارسته فوراً عندما تشعر بتسارع ضربات قلبك أو ضيق التنفس.',
      thumbnail: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      video_provider: 'youtube',
      duration: '09:15',
      category_id: 10,
      is_featured: 0,
      view_count: 4210
    },
    {
      title: 'لماذا نكرر نفس الأخطاء في اختيار الشريك؟',
      slug: 'why-we-repeat-relationship-mistakes',
      description: 'فهم نمط التعلق غير الآمن وكيف يقودنا اللاوعي لاختيار أشخاص يشبهون جروح طفولتنا الأولى.',
      thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      video_provider: 'youtube',
      duration: '26:00',
      category_id: 5,
      is_featured: 0,
      view_count: 1560
    },
    {
      title: 'رسالة أمل لمن أثقلته هموم الحياة',
      slug: 'message-of-hope-for-heavy-hearts',
      description: 'كلمات من القلب إلى القلب، تذكرك بأن بعد كل عسر يسراً وأن النور قادم مهما طال الانتظار.',
      thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      video_provider: 'youtube',
      duration: '11:50',
      category_id: 12,
      is_featured: 1,
      view_count: 5300
    }
  ];

  for (const vid of videos) {
    db.run(`
      INSERT INTO videos (title, slug, description, thumbnail, video_url, video_provider, duration, category_id, is_featured, view_count, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
    `, [vid.title, vid.slug, vid.description, vid.thumbnail, vid.video_url, vid.video_provider, vid.duration, vid.category_id, vid.is_featured, vid.view_count]);
  }

  // 7. Podcasts (At least 3 episodes)
  const podcasts = [
    {
      title: 'بودكاست لسه في نور | الحلقة 1: عندما يسقط القناع',
      slug: 'podcast-ep-1-when-mask-falls',
      description: 'في هذه الحلقة نتحدث عن الصدمة الأولى لاكتشاف حقيقة العلاقات المؤذية، وكيف نحمي سلامتنا النفسية عند الانهيار الأول.',
      cover_image: 'https://images.unsplash.com/photo-1474418397713-7ede21d49118?auto=format&fit=crop&w=800&q=80',
      audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration: '32:15',
      episode_number: 1,
      category_id: 3,
      is_featured: 1,
      view_count: 2190
    },
    {
      title: 'بودكاست لسه في نور | الحلقة 2: ترميم الثقة بالنفس',
      slug: 'podcast-ep-2-rebuilding-self-confidence',
      description: 'كيف تسترجع صوتك وقيمتك بعد سنوات من التقليل والانتقاد المستمر، وخطوات كتابة قصة جديدة لحياتك.',
      cover_image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
      audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      duration: '28:40',
      episode_number: 2,
      category_id: 9,
      is_featured: 1,
      view_count: 1840
    },
    {
      title: 'بودكاست لسه في نور | الحلقة 3: السلام مع الماضي',
      slug: 'podcast-ep-3-peace-with-the-past',
      description: 'حوار مفتوح حول التسامح المشروط، هل يجب أن نسامح الجميع لكي نشفى؟ وما هو الفرق بين التسامح ووضع الحدود؟',
      cover_image: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&q=80',
      audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      duration: '35:20',
      episode_number: 3,
      category_id: 10,
      is_featured: 0,
      view_count: 1420
    }
  ];

  for (const pod of podcasts) {
    db.run(`
      INSERT INTO podcasts (title, slug, description, cover_image, audio_url, duration, episode_number, category_id, is_featured, view_count, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
    `, [pod.title, pod.slug, pod.description, pod.cover_image, pod.audio_url, pod.duration, pod.episode_number, pod.category_id, pod.is_featured, pod.view_count]);
  }

  // 8. Healing Journeys (Signature feature, multi-step structured journeys)
  // Journey 1: من الوجع إلى السلام (6 steps requested)
  db.run(`
    INSERT INTO journeys (id, title, slug, description, cover_image, category_id, status, is_featured, view_count, seo_title, seo_description)
    VALUES (
      1,
      'من الوجع إلى السلام: رحلة التحرر من العلاقات المؤذية',
      'from-pain-to-peace',
      'رحلة إرشادية متكاملة تأخذ بيدك خطوة بخطوة من حيرة الصدمة إلى بر الأمان واستعادة سلامك الداخلي واستحقاقك الذاتي.',
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80',
      2,
      'published',
      1,
      3850,
      'رحلة من الوجع إلى السلام | لسه في نور',
      'رحلة تعافي متدرجة من 6 محطات للشفاء من العلاقات المؤذية واستعادة الذات.'
    )
  `);

  const journey1Steps = [
    {
      step_number: 1,
      title: 'الاعتراف: نزع قناع الإنكار',
      explanation: 'الخطوة الأولى والأصعب هي التوقف عن تجميل القسوة أو التماس الأعذار لمن يستنزفك. الاعتراف بأنك في علاقة تؤذيك ليس اعترافاً بالضعف، بل هو بداية استرداد قوتك.',
      exercises: JSON.stringify(['كتابة قائمة بالمواقف التي شعرت فيها بانتهاك كرامتك دون تبرير.', 'تسمية المشاعر الحقيقية: خوف، حزن، خيبة، دون محاولة قمعها.']),
      questions: JSON.stringify(['ما الذي أخشى مواجهته لو اعترفت بالحقيقة كاملة؟', 'هل أشعر بالأمان الحقيقي في هذه العلاقة أم بالخوف من الهجر؟'])
    },
    {
      step_number: 2,
      title: 'الفهم: تفكيك آليات السيطرة والتلاعب',
      explanation: 'في هذه المرحلة نتعلم كيف تعمل العلاقات السامة: دورة الإغواء والتقليل والتخلي (Love Bombing & Devaluation)، لتدرك أن ما مررت به كان نمطاً متكرراً وليس عيباً فيك.',
      exercises: JSON.stringify(['رسم خط زمني للعلاقة لتحديد متى بدأت علامات التراجع.', 'ملاحظة الفارق بين ما يقوله الشريك وما يفعله فعلياً.']),
      questions: JSON.stringify(['كم مرة تم التشكيك في ذاكرتك أو عقلك؟', 'هل فقدت صداقات أو اهتمامات كنت تحبها بسبب هذه العلاقة؟'])
    },
    {
      step_number: 3,
      title: 'وضع الحدود: تشييد الحصن الداخلي',
      explanation: 'الحدود ليست هجوماً بل هي حماية. هنا نتدرب على قاعدة "عدم الاتصال" (No Contact) أو "الصخرة الرمادية" (Gray Rock) لمنع تجدد الاستنزاف الطاقي.',
      exercises: JSON.stringify(['صياغة جمل محددة للرفض الحازم دون شرح مطول.', 'إغلاق قنوات التواصل غير الضرورية وحظر مصادر الإزعاج.']),
      questions: JSON.stringify(['ما هي الخطوط الحمراء التي لن أسمح لأحد بتجاوزها بعد اليوم؟', 'كيف أتعامل مع وخز الذنب الذي يعقب قول كلمة "لا"؟'])
    },
    {
      step_number: 4,
      title: 'التحرر: تنظيف الرواسب العاطفية',
      explanation: 'التحرر يعني التوقف عن الرغبة في الانتقام أو انتظار اعتذار لن يأتي أبداً. الاعتذار الحقيقي هو أن تمنح نفسك الإذن بالعيش بكرامة وراحة.',
      exercises: JSON.stringify(['كتابة رسالة وداع غير مرسلة تحرقها أو تمزقها.', 'جلسات تفريغ صوتي أو كتابي لكل العتب والغضب الدفين.']),
      questions: JSON.stringify(['هل أنا مستعد للتخلي عن أمل أن يتغير هذا الشخص؟', 'ما هي الهدية النفسية التي أحصل عليها عندما أتوقف عن متابعة أخباره؟'])
    },
    {
      step_number: 5,
      title: 'التعافي: ترميم الجسد والروح',
      explanation: 'هنا يبدأ الربيع الداخلي. نعتني بالجهاز العصبي الذي كان في حالة استنفار دائم، نستعيد النوم الهادئ، والتغذية السليمة، والاتصال بالطبيعة والأصدقاء الآمنين.',
      exercises: JSON.stringify(['ممارسة التأمل والتنفس الواعي لمدة 15 دقيقة يومياً.', 'الانضمام لمجموعة دعم أو استشارة متخصصة لتعزيز الأمان.']),
      questions: JSON.stringify(['ما هي الأنشطة التي كانت تشعرني بالحياة قبل أن أدخل في هذه الدوامة؟', 'كيف أظهر لنفسي اللطف كلما انتابتني لحظة انتكاس حزينة؟'])
    },
    {
      step_number: 6,
      title: 'البداية الجديدة: شروق النور',
      explanation: 'المحطة الأخيرة ليست نهاية القصة بل مطلع فجر جديد. تنظر في المرآة فترى إنساناً أقوى، أعمق حكمة، وأكثر مناعة ووعياً بروعة وجوده واستحقاقه للأفضل.',
      exercises: JSON.stringify(['كتابة ميثاق العهد مع النفس للسنوات القادمة.', 'الاحتفال بيوم الشفاء مع أشخاص مقربين يحبونك بصدق.']),
      questions: JSON.stringify(['من أنا اليوم بعد هذه التجربة؟', 'ما هي الآفاق الجديدة التي تنتظر نور روحي في قادم الأيام؟'])
    }
  ];

  for (const step of journey1Steps) {
    db.run(`
      INSERT INTO journey_steps (journey_id, step_number, title, explanation, exercises_json, reflection_questions_json)
      VALUES (1, ?, ?, ?, ?, ?)
    `, [step.step_number, step.title, step.explanation, step.exercises, step.questions]);
  }

  // Journey 2: رحلة بناء الاستحقاق الذاتي
  db.run(`
    INSERT INTO journeys (id, title, slug, description, cover_image, category_id, status, is_featured, view_count, seo_title, seo_description)
    VALUES (
      2,
      'رحلة بناء الاستحقاق الذاتي ومحبة النفس',
      'building-self-worth',
      'دليل عملي للتحرر من صوت الناقد الداخلي، ووقف المقارنة، والوصول إلى اليقين بأنك تستحق الخير والأمان دون شروط مسبقة.',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
      9,
      'published',
      1,
      2150,
      'رحلة بناء الاستحقاق الذاتي | لسه في نور',
      'خطوات متسلسلة لترميم حب الذات والثقة بالنفس.'
    )
  `);

  const journey2Steps = [
    {
      step_number: 1,
      title: 'إسكات الناقد الداخلي القاسي',
      explanation: 'التعرف على الصوت الذي يحبطك دائماً وفصله عن حقيقتك الإنسانية المكرمة.',
      exercises: JSON.stringify(['تدوين العبارات السلبية واستبدالها بحقائق واقعية رحيمة.']),
      questions: JSON.stringify(['لمن ينتمي الصوت الذي ينتقدني عندما أخطئ؟ هل هو صوتي أم صوت ترسب من الطفولة؟'])
    },
    {
      step_number: 2,
      title: 'فك فخ المقارنة القاتلة',
      explanation: 'كيف تتوقف عن مقارنة كواليس حياتك بمعارض الآخرين المصقولة على وسائل التواصل الاجتماعي.',
      exercises: JSON.stringify(['ديتوكس رقمي وتقليل متابعة الحسابات التي تثير القلق الداخلي.']),
      questions: JSON.stringify(['ما الذي يجعلني أنسى نعمي الفريدة بمجرد رؤية إنجازات شخص آخر؟'])
    },
    {
      step_number: 3,
      title: 'استحقاق غير مشروط بالإنجاز',
      explanation: 'قيمتك تنبع من كونك إنساناً نفخ الله فيه من روحه، وليست مرهونة بعدد شهاداتك أو وظيفتك أو مظهرك.',
      exercises: JSON.stringify(['قائمة بما تحبه في شخصيتك وصفاتك وطيبتك بعيداً عن العمل والألقاب.']),
      questions: JSON.stringify(['هل أسمح لنفسي بالراحة دون الشعور بالذنب؟'])
    }
  ];

  for (const step of journey2Steps) {
    db.run(`
      INSERT INTO journey_steps (journey_id, step_number, title, explanation, exercises_json, reflection_questions_json)
      VALUES (2, ?, ?, ?, ?, ?)
    `, [step.step_number, step.title, step.explanation, step.exercises, step.questions]);
  }

  // 9. Submissions ("احكي لنا" anonymous samples)
  db.run(`
    INSERT INTO submissions (message, category, age_range, status, admin_notes)
    VALUES 
    ('عشت ٧ سنوات في علاقة كان شريكي يقنعني يومياً أنني سبب كل مصيبة تحدث في البيت. خرجت قبل ٤ أشهر، وما زلت أتعلم كيف أتنفس بحرية بدون خوف من صوت المفاتيح عند الباب.', 'العلاقات المؤذية', '25-34', 'published', 'مؤثر جداً ومجهول الهوية بالكامل'),
    ('أنا في مرحلة اكتشاف نفسي بعد سن الأربعين بعد تربية الأبناء، أشعر بضياع وخوف من الفراغ لكني متمسكة بالأمل.', 'الوعي النفسي', '35-44', 'published', 'رسالة ملهمة تشجع الكثير من الأمهات'),
    ('أجد صعوبة بالغة في قول لا لمديري في العمل ولأقاربي، دائماً أشعر أنني إذا رفضت طلباً سأفقد حب الناس.', 'الحدود الشخصية', '18-24', 'approved', 'مراجعة تمهيداً للنشر في قسم الفضفضة');
  `);

  // 10. Comments
  db.run(`
    INSERT INTO comments (content_type, content_id, author_name, author_email, comment_text, status)
    VALUES 
    ('article', 1, 'هدى عبد الله', 'hoda@example.com', 'المقال لمس قلبي تماماً.. شعرت وكأن الكلمات مكتوبة لي خصيصاً. شكراً لصناع هذا الأثر النبيل.', 'approved'),
    ('article', 3, 'مريم سعيد', 'mariam@example.com', 'خطوة وضع الحدود صعبة في البداية ولكنها منقذة للحياة، شكراً د. نور على هذا الطرح الواعي.', 'approved');
  `);

  // 11. Media Library sample items
  db.run(`
    INSERT INTO media (file_name, file_url, mime_type, file_size, alt_text, category)
    VALUES 
    ('hero-light.jpg', 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80', 'image/jpeg', 245000, 'شروق شمس بين الأشجار يرمز للأمل', 'hero'),
    ('inner-peace.jpg', 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1200&q=80', 'image/jpeg', 189000, 'طبيعة هادئة وبحيرة صافية', 'nature'),
    ('compassion.jpg', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80', 'image/jpeg', 312000, 'تأمل وتصالح مع الذات', 'editorial');
  `);

  // 12. Site Settings
  const settings = {
    site_name: 'لسه في نور',
    tagline: 'مهما كان اللي عديت بيه... لسه في نور.',
    description: 'منصة عربية رائدة للدعم النفسي، الوعي بالعلاقات، وبناء السلام الداخلي.',
    logo_text: 'لسه في نور',
    hero_title: 'مهما كان اللي عديت بيه... لسه في نور.',
    hero_subtitle: 'مساحة إنسانية آمنة ترافقك في رحلة الفهم والتعافي واستعادة توازنك الداخلي وبناء علاقات سوية تشبه نقاء روحك.',
    hero_image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1400&q=85',
    primary_cta_text: 'اكتشفي نورك',
    primary_cta_link: '/journeys',
    secondary_cta_text: 'شاهدي الفيديوهات',
    secondary_cta_link: '/videos',
    daily_quote_title: 'ربما تحتاجين أن تسمعي هذا اليوم',
    daily_quote_text: 'أنت لست ما حدث لك.. أنت القوة التي اختارت أن تنهض بعد كل انكسار. تذكري دائماً أن لطف الله يحيط بك من حيث لا تشعرين.',
    daily_quote_author: 'لسه في نور',
    contact_email: 'salam@lesanour.com',
    social_facebook: 'https://facebook.com/lesanour',
    social_instagram: 'https://instagram.com/lesanour',
    social_twitter: 'https://x.com/lesanour',
    social_youtube: 'https://youtube.com/@lesanour',
    footer_about: 'لسه في نور هي منصة محتوى عربي مخصصة للوعي النفسي والتعافي الإنساني. نؤمن بأن في كل تجربة قاسية بداية جديدة تستحق أن تُعاش بأمان ونور.',
    enabled_sections: JSON.stringify({
      hero: true,
      featured_message: true,
      latest_topics: true,
      featured_topic: true,
      latest_videos: true,
      daily_quote: true,
      healing_journey: true,
      podcast_preview: true,
      most_read: true,
      tell_us_invite: true,
      newsletter: true
    })
  };

  for (const [k, v] of Object.entries(settings)) {
    db.run('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)', [k, v]);
  }

  console.log('✅ Database seeded successfully with real relational records!');
}

async function ensureFatmaAdmin(db: Database) {
  const fatmaEmail = 'fatmamohamed36699@gmail.com';
  try {
    const res = db.exec(`SELECT id, email, role FROM users WHERE LOWER(email) = '${fatmaEmail}'`);
    const passwordHash = await bcrypt.hash('admin123456', 10);

    if (!res.length || !res[0].values.length) {
      db.run(`
        INSERT INTO users (email, password_hash, name, role, avatar, bio)
        VALUES (?, ?, ?, 'ADMIN', ?, ?)
      `, [
        fatmaEmail,
        passwordHash,
        'فاطمة محمد (المدير العام)',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        'المدير العام والمشرفة العليا على منصة لسه في نور - كامل الصلاحيات الإدارية مفعلة.'
      ]);
      console.log(`🛡️ Admin account created for Fatma Mohamed: ${fatmaEmail}`);
    } else {
      db.run(`UPDATE users SET role = 'ADMIN', name = 'فاطمة محمد (المدير العام)' WHERE LOWER(email) = ?`, [fatmaEmail]);
      console.log(`🛡️ Verified full ADMIN permissions for Fatma Mohamed: ${fatmaEmail}`);
    }
  } catch (err) {
    console.error('Error ensuring Fatma admin in database:', err);
  }
}

import {
  Article,
  Category,
  Video,
  Message,
  Journey,
  JourneyStep,
  Podcast,
  Submission,
  Comment,
  MediaItem,
  ContactMessage,
  SiteSettings,
  User,
  MoodConfig,
  MoodRecommendationData,
  InspiringQuote,
  ChatRole
} from '../types';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('lesanour_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'حدث خطأ في الاتصال بالخادم');
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  register: (data: { name: string; email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  logout: () => request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  updateProfile: (data: { name?: string; bio?: string; avatar?: string; password?: string }) =>
    request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Settings & Navigation
  getSettings: () =>
    request<{ settings: SiteSettings; navigation: Array<{ id: number; title: string; path: string }> }>(
      '/api/settings'
    ),

  // Articles
  getArticles: (params?: { category?: string; tag?: string; search?: string; mood?: string; page?: number; limit?: number; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.search) query.set('search', params.search);
    if (params?.mood) query.set('mood', params.mood);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.sort) query.set('sort', params.sort);
    return request<{
      articles: Article[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/articles?${query.toString()}`);
  },

  getArticle: (slug: string) =>
    request<{
      article: Article;
      relatedArticles: Article[];
      recommendedVideos: Video[];
      prevArticle?: { title: string; slug: string };
      nextArticle?: { title: string; slug: string };
    }>(`/api/articles/${slug}`),

  // Categories
  getCategories: () => request<{ categories: Category[] }>('/api/categories'),

  getCategory: (slug: string) =>
    request<{ category: Category; articles: Article[] }>(`/api/categories/${slug}`),

  // Videos
  getVideos: (params?: { category?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return request<{
      videos: Video[];
      featuredVideo?: Video;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/videos?${query.toString()}`);
  },

  getVideo: (slug: string) =>
    request<{ video: Video; relatedVideos: Video[]; relatedArticles: Article[] }>(`/api/videos/${slug}`),

  // Messages ("رسائل لسه في نور")
  getMessages: (params?: { category?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return request<{
      messages: Message[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/messages?${query.toString()}`);
  },

  getMessage: (slug: string) => request<{ message: Message }>(`/api/messages/${slug}`),

  // Inspiring Quotes ("اقتباس عشوائي ملهم")
  getRandomQuote: (excludeId?: string) =>
    request<{ quote: InspiringQuote; total: number }>(
      `/api/quotes/random${excludeId ? `?exclude_id=${encodeURIComponent(excludeId)}` : ''}`
    ),

  getQuotes: () => request<{ quotes: InspiringQuote[] }>('/api/quotes'),

  // Journeys
  getJourneys: () => request<{ journeys: Journey[] }>('/api/journeys'),

  getJourney: (slug: string) =>
    request<{ journey: Journey; steps: JourneyStep[] }>(`/api/journeys/${slug}`),

  // Podcasts
  getPodcasts: () => request<{ podcasts: Podcast[] }>('/api/podcasts'),

  getPodcast: (slug: string) =>
    request<{ podcast: Podcast; otherEpisodes: Podcast[] }>(`/api/podcasts/${slug}`),

  // Submissions ("احكي لنا")
  submitStory: (data: { message: string; category?: string; age_range?: string; consent: boolean }) =>
    request<{ success: boolean; message: string }>('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getPublishedSubmissions: () =>
    request<{ submissions: Submission[] }>('/api/submissions/published'),

  // Search
  search: (q: string) =>
    request<{
      query: string;
      totalResults: number;
      results: {
        articles: Article[];
        videos: Video[];
        messages: Message[];
        podcasts: Podcast[];
        journeys: Journey[];
      };
    }>(`/api/search?q=${encodeURIComponent(q)}`),

  // Popular
  getPopular: () =>
    request<{
      mostReadArticles: Article[];
      mostWatchedVideos: Video[];
      mostListenedPodcasts: Podcast[];
      featuredMessages: Message[];
    }>('/api/popular'),

  // Bookmarks
  getBookmarks: () =>
    request<{ bookmarks: Array<{ content_type: string; content_id: number }> }>('/api/bookmarks'),

  toggleBookmark: (content_type: string, content_id: number) =>
    request<{ bookmarked: boolean }>('/api/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ content_type, content_id })
    }),

  // Gemini Chatbot (Multi-turn & Specialized Roles)
  getChatRoles: () => request<{ roles: ChatRole[] }>('/api/chat/roles'),

  sendChatMessage: (data: {
    message: string;
    history?: Array<{ role: 'user' | 'model' | 'assistant'; content: string }>;
    roleId?: string;
  }) =>
    request<{
      success: boolean;
      reply: string;
      roleId: string;
      modelUsed: string;
      roleName: string;
      timestamp: string;
    }>('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Comments
  getComments: (type: string, id: number) =>
    request<{ comments: Comment[] }>(`/api/comments?type=${type}&id=${id}`),

  addComment: (data: { content_type: string; content_id: number; author_name: string; author_email: string; comment_text: string }) =>
    request<{ success: boolean; message: string }>('/api/comments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Contact & Newsletter
  sendContact: (data: { name: string; email: string; subject: string; message: string }) =>
    request<{ success: boolean; message: string }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  subscribeNewsletter: (email: string) =>
    request<{ success: boolean; message: string }>('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  // Text-To-Speech (TTS)
  generateSpeech: (title: string, text: string) =>
    request<{
      audioUrl?: string;
      fallbackToNative: boolean;
      source: 'gemini' | 'native';
      error?: string;
    }>('/api/tts', {
      method: 'POST',
      body: JSON.stringify({ title, text })
    }),

  // Mood Recommendations
  getMoods: () =>
    request<{ moods: MoodConfig[] }>('/api/moods'),

  getMoodRecommendations: (mood: string) =>
    request<MoodRecommendationData>(`/api/mood-recommendations?mood=${encodeURIComponent(mood)}`),

  // ================= ADMIN API =================
  admin: {
    getStats: () =>
      request<{
        stats: Record<string, number>;
        recentArticles: any[];
        recentSubmissions: any[];
      }>('/api/admin/stats'),

    // Articles
    getArticles: (params?: { search?: string; status?: string; category?: string }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.status) q.set('status', params.status);
      if (params?.category) q.set('category', params.category);
      return request<{ articles: Article[] }>(`/api/admin/articles?${q.toString()}`);
    },
    createArticle: (data: Partial<Article>) =>
      request<{ success: boolean; id: number }>('/api/admin/articles', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateArticle: (id: number, data: Partial<Article>) =>
      request<{ success: boolean }>(`/api/admin/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    deleteArticle: (id: number) =>
      request<{ success: boolean }>(`/api/admin/articles/${id}`, { method: 'DELETE' }),

    // Videos
    getVideos: () => request<{ videos: Video[] }>('/api/admin/videos'),
    createVideo: (data: Partial<Video>) =>
      request<{ success: boolean }>('/api/admin/videos', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateVideo: (id: number, data: Partial<Video>) =>
      request<{ success: boolean }>(`/api/admin/videos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    deleteVideo: (id: number) =>
      request<{ success: boolean }>(`/api/admin/videos/${id}`, { method: 'DELETE' }),

    // Messages
    getMessages: () => request<{ messages: Message[] }>('/api/admin/messages'),
    createMessage: (data: Partial<Message>) =>
      request<{ success: boolean }>('/api/admin/messages', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateMessage: (id: number, data: Partial<Message>) =>
      request<{ success: boolean }>(`/api/admin/messages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    deleteMessage: (id: number) =>
      request<{ success: boolean }>(`/api/admin/messages/${id}`, { method: 'DELETE' }),

    // Journeys
    getJourneys: () => request<{ journeys: Journey[] }>('/api/admin/journeys'),
    getJourneyById: (id: number) =>
      request<{ journey: Journey; steps: JourneyStep[] }>(`/api/admin/journeys/${id}`),
    createJourney: (data: any) =>
      request<{ success: boolean; id: number }>('/api/admin/journeys', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateJourney: (id: number, data: any) =>
      request<{ success: boolean }>(`/api/admin/journeys/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    deleteJourney: (id: number) =>
      request<{ success: boolean }>(`/api/admin/journeys/${id}`, { method: 'DELETE' }),

    // Podcasts
    getPodcasts: () => request<{ podcasts: Podcast[] }>('/api/admin/podcasts'),
    createPodcast: (data: Partial<Podcast>) =>
      request<{ success: boolean }>('/api/admin/podcasts', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updatePodcast: (id: number, data: Partial<Podcast>) =>
      request<{ success: boolean }>(`/api/admin/podcasts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    deletePodcast: (id: number) =>
      request<{ success: boolean }>(`/api/admin/podcasts/${id}`, { method: 'DELETE' }),

    // Categories
    createCategory: (data: Partial<Category>) =>
      request<{ success: boolean }>('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateCategory: (id: number, data: Partial<Category>) =>
      request<{ success: boolean }>(`/api/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    deleteCategory: (id: number) =>
      request<{ success: boolean }>(`/api/admin/categories/${id}`, { method: 'DELETE' }),

    // Submissions ("احكي لنا" moderation)
    getSubmissions: () => request<{ submissions: Submission[] }>('/api/admin/submissions'),
    updateSubmission: (id: number, data: Partial<Submission>) =>
      request<{ success: boolean }>(`/api/admin/submissions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    deleteSubmission: (id: number) =>
      request<{ success: boolean }>(`/api/admin/submissions/${id}`, { method: 'DELETE' }),

    // Comments moderation
    getComments: () => request<{ comments: any[] }>('/api/admin/comments'),
    updateComment: (id: number, status: string) =>
      request<{ success: boolean }>(`/api/admin/comments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      }),
    deleteComment: (id: number) =>
      request<{ success: boolean }>(`/api/admin/comments/${id}`, { method: 'DELETE' }),

    // Media
    getMedia: () => request<{ media: MediaItem[] }>('/api/admin/media'),
    addMedia: (data: Partial<MediaItem>) =>
      request<{ success: boolean }>('/api/admin/media', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    deleteMedia: (id: number) =>
      request<{ success: boolean }>(`/api/admin/media/${id}`, { method: 'DELETE' }),

    // Contact Messages
    getContactMessages: () => request<{ messages: ContactMessage[] }>('/api/admin/contact'),
    markContactRead: (id: number) =>
      request<{ success: boolean }>(`/api/admin/contact/${id}/read`, { method: 'PUT' }),
    deleteContactMessage: (id: number) =>
      request<{ success: boolean }>(`/api/admin/contact/${id}`, { method: 'DELETE' }),

    // Newsletter
    getNewsletterSubscribers: () =>
      request<{ subscribers: any[] }>('/api/admin/newsletter'),

    // Audit Logs
    getAuditLogs: () => request<{ logs: any[] }>('/api/admin/audit-logs'),

    // Roles & Permissions
    getRoles: () => request<{ roles: any[] }>('/api/admin/roles'),
    getPermissions: () => request<{ permissions: any[] }>('/api/admin/permissions'),
    createRole: (data: { name: string; description: string; permissions: string[] }) =>
      request<{ success: boolean; id: number }>('/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateRole: (id: number, data: { name: string; description: string; permissions: string[] }) =>
      request<{ success: boolean }>(`/api/admin/roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    deleteRole: (id: number) =>
      request<{ success: boolean }>(`/api/admin/roles/${id}`, { method: 'DELETE' }),
    updateUserRole: (userId: number, roleId: number | null) =>
      request<{ success: boolean }>(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ roleId })
      }),

    // Users
    getUsers: () => request<{ users: User[] }>('/api/admin/users'),
    createUser: (data: any) =>
      request<{ success: boolean; id: number }>('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateUser: (id: number, data: any) =>
      request<{ success: boolean }>(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    deleteUser: (id: number) =>
      request<{ success: boolean }>(`/api/admin/users/${id}`, { method: 'DELETE' }),

    // Settings
    updateSettings: (settings: Record<string, any>) =>
      request<{ success: boolean; message: string }>('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      }),

    // 2FA
    setup2FA: () => request<{ secret: string; qrCodeUrl: string }>('/api/auth/2fa/setup', { method: 'POST' }),
    verify2FASetup: (token: string) =>
      request<{ success: boolean }>('/api/auth/2fa/verify-setup', {
        method: 'POST',
        body: JSON.stringify({ token })
      }),
    verify2FALogin: (userId: number, token: string) =>
      request<{ token: string; user: User }>('/api/auth/2fa/verify-login', {
        method: 'POST',
        body: JSON.stringify({ userId, token })
      }),
    disable2FA: () => request<{ success: boolean }>('/api/auth/2fa/disable', { method: 'POST' })
  }
};

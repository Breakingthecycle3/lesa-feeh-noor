export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR' | 'USER';
  avatar?: string;
  bio?: string;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image?: string;
  display_order: number;
  articles_count?: number;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  author_id?: number;
  author_name: string;
  author_avatar?: string;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  tags?: string[];
  reading_time: number;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  published_at: string;
  view_count: number;
  is_featured: number;
  seo_title?: string;
  seo_description?: string;
  social_image?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Video {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  video_url: string;
  video_provider: 'youtube' | 'vimeo' | 'direct';
  duration: string;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  author_name: string;
  is_featured: number;
  view_count: number;
  status: 'draft' | 'published';
  created_at: string;
}

export interface Message {
  id: number;
  title: string;
  slug: string;
  text: string;
  background_image?: string;
  category_id: number;
  category_name?: string;
  author_name: string;
  is_featured: number;
  view_count: number;
  status: 'draft' | 'published';
  created_at: string;
}

export interface JourneyStep {
  id?: number;
  journey_id?: number;
  step_number: number;
  title: string;
  explanation: string;
  exercises?: string[];
  questions?: string[];
}

export interface Journey {
  id: number;
  title: string;
  slug: string;
  description: string;
  cover_image: string;
  category_id: number;
  category_name?: string;
  status: 'draft' | 'published';
  is_featured: number;
  view_count: number;
  steps_count?: number;
  created_at: string;
}

export interface Podcast {
  id: number;
  title: string;
  slug: string;
  description: string;
  cover_image: string;
  thumbnail?: string; // For backward compatibility if needed
  audio_url: string;
  duration: string;
  episode_number: number;
  category_id: number;
  category_name?: string;
  is_featured: number;
  view_count: number;
  status: 'draft' | 'published';
  created_at: string;
}

export interface Submission {
  id: number;
  message: string;
  category?: string;
  age_range?: string;
  user_name?: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  admin_notes?: string;
  created_at: string;
}

export interface Comment {
  id: number;
  content_type: 'article' | 'video' | 'podcast' | 'journey';
  content_id: number;
  author_name: string;
  comment_text: string;
  created_at: string;
}

export interface MediaItem {
  id: number;
  file_name: string;
  file_url: string;
  mime_type: string;
  file_size: number;
  alt_text?: string;
  category: string;
  created_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: number;
  is_archived: number;
  created_at: string;
}

export interface SiteSettings {
  site_name: string;
  tagline: string;
  description: string;
  logo_text: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  primary_cta_text: string;
  primary_cta_link: string;
  secondary_cta_text: string;
  secondary_cta_link: string;
  daily_quote_title: string;
  daily_quote_text: string;
  daily_quote_author: string;
  contact_email: string;
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_youtube: string;
  footer_about: string;
  enabled_sections: {
    hero?: boolean;
    featured_message?: boolean;
    latest_topics?: boolean;
    featured_topic?: boolean;
    latest_videos?: boolean;
    daily_quote?: boolean;
    healing_journey?: boolean;
    podcast_preview?: boolean;
    most_read?: boolean;
    tell_us_invite?: boolean;
    newsletter?: boolean;
  };
}

export type MoodKey =
  | 'calm'
  | 'motivation'
  | 'healing'
  | 'clarity'
  | 'exhausted'
  | 'self-love';

export interface MoodConfig {
  id: MoodKey;
  label: string;
  sublabel: string;
  emoji: string;
  color: string;
  accentBg: string;
  borderColor: string;
  quote: {
    text: string;
    author: string;
  };
  categorySlugs: string[];
}

export interface MoodRecommendationData {
  mood: MoodConfig;
  articles: Article[];
  journeys: Journey[];
  messages: Message[];
}

export interface InspiringQuote {
  id: string;
  text: string;
  title: string;
  author: string;
  category: string;
  sourceType: 'message' | 'article';
  url: string;
  backgroundImage?: string;
}

export type ChatRoleId = 'general' | 'fast' | 'complex';

export interface ChatRole {
  id: ChatRoleId;
  name: string;
  badge: string;
  tagline: string;
  model: string;
  suggestedPrompts: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
  roleId?: ChatRoleId;
}



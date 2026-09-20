import { Article } from '../types';

const FAVORITES_STORAGE_KEY = 'lesanour_favorite_articles';

/**
 * Retrieve all favorite articles stored in localStorage
 */
export function getFavoriteArticles(): Article[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.warn('Failed to read favorite articles from localStorage:', error);
    return [];
  }
}

/**
 * Check whether an article is in favorites by ID or slug
 */
export function isArticleFavorite(idOrSlug: number | string | undefined): boolean {
  if (idOrSlug === undefined || idOrSlug === null) return false;
  const favorites = getFavoriteArticles();
  return favorites.some(
    (item) => item.id === idOrSlug || item.slug === String(idOrSlug)
  );
}

/**
 * Save an article into favorites in localStorage
 */
export function addFavoriteArticle(article: Article): void {
  if (typeof window === 'undefined' || !article) return;
  try {
    const current = getFavoriteArticles();
    // Prevent duplicates
    const filtered = current.filter(
      (item) => item.id !== article.id && item.slug !== article.slug
    );
    const updated = [
      {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content || '',
        featured_image: article.featured_image,
        category_id: article.category_id,
        category_name: article.category_name,
        category_slug: article.category_slug,
        reading_time: article.reading_time || 4,
        author_name: article.author_name || 'لسه في نور',
        published_at: article.published_at || new Date().toISOString(),
        view_count: article.view_count || 0,
        is_featured: article.is_featured || 0,
        tags: article.tags || []
      },
      ...filtered
    ];
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    dispatchFavoritesEvent();
  } catch (error) {
    console.error('Failed to save article to localStorage favorites:', error);
  }
}

/**
 * Remove an article from favorites in localStorage
 */
export function removeFavoriteArticle(idOrSlug: number | string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getFavoriteArticles();
    const updated = current.filter(
      (item) => item.id !== idOrSlug && item.slug !== String(idOrSlug)
    );
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    dispatchFavoritesEvent();
  } catch (error) {
    console.error('Failed to remove article from localStorage favorites:', error);
  }
}

/**
 * Toggle favorite status: adds if not present, removes if present
 * Returns true if now favorited, false if removed
 */
export function toggleFavoriteArticle(article: Article): boolean {
  if (!article) return false;
  const isFav = isArticleFavorite(article.id) || isArticleFavorite(article.slug);
  if (isFav) {
    removeFavoriteArticle(article.id);
    return false;
  } else {
    addFavoriteArticle(article);
    return true;
  }
}

/**
 * Get total count of favorite articles
 */
export function getFavoritesCount(): number {
  return getFavoriteArticles().length;
}

/**
 * Dispatch custom event so all open tabs or components update synchronously
 */
function dispatchFavoritesEvent() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('favorites-updated'));
}

/**
 * Subscribe to favorites update events
 */
export function onFavoritesChanged(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => callback();
  window.addEventListener('favorites-updated', handler);
  window.addEventListener('storage', (e) => {
    if (e.key === FAVORITES_STORAGE_KEY) {
      callback();
    }
  });

  return () => {
    window.removeEventListener('favorites-updated', handler);
    window.removeEventListener('storage', handler);
  };
}

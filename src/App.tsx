import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';

// Pages
import { HomePage } from './pages/HomePage';
import { ArticlesPage } from './pages/ArticlesPage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { VideosPage } from './pages/VideosPage';
import { VideoDetailPage } from './pages/VideoDetailPage';
import { MessagesPage } from './pages/MessagesPage';
import { MessageDetailPage } from './pages/MessageDetailPage';
import { JourneysPage } from './pages/JourneysPage';
import { JourneyDetailPage } from './pages/JourneyDetailPage';
import { PodcastPage } from './pages/PodcastPage';
import { PodcastDetailPage } from './pages/PodcastDetailPage';
import { TellUsPage } from './pages/TellUsPage';
import { SearchPage } from './pages/SearchPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { ChatPage } from './pages/ChatPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { EmptyState } from './components/Common';
import { ReadingProgressBar } from './components/ReadingProgressBar';
import { MoodModal } from './components/MoodModal';
import { InspiringQuoteModal } from './components/InspiringQuoteModal';
import { FloatingChatWidget } from './components/FloatingChatWidget';
import { LogoutConfirmModal } from './components/modals/LogoutConfirmModal';

function AppContent() {
  const { isAdmin, isEditor, logout } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return (window.location.pathname || '/') + (window.location.search || '');
  });
  const [moodModalOpen, setMoodModalOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath((window.location.pathname || '/') + (window.location.search || ''));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Note: Inspiring quotes are available on demand via the header and home page buttons
  // without intrusive full-screen blocking modals that hide the website edits.

  const navigate = (path: string) => {
    if (path === currentPath) return;
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route matching helper
  const renderRoute = () => {
    // 1. Home
    if (currentPath === '/' || currentPath === '') {
      return <HomePage onNavigate={navigate} onOpenQuoteModal={() => setQuoteModalOpen(true)} />;
    }

    // 2. Admin
    if (currentPath.startsWith('/admin')) {
      if (isAdmin || isEditor) {
        return <AdminDashboard onNavigate={navigate} />;
      }
      // Fallback for non-admin attempting to access /admin directly
      return (
        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <EmptyState
            title="غير مسموح بالدخول"
            description="عذراً، هذه الصفحة مخصصة لمديري ومحرري المنصة فقط."
            actionLabel="العودة للصفحة الرئيسية"
            onAction={() => navigate('/')}
          />
        </div>
      );
    }

    // 3. Articles (supports /articles and /articles?mood=... or ?category=...)
    if (currentPath === '/articles' || currentPath.startsWith('/articles?')) {
      const queryStr = currentPath.includes('?') ? currentPath.split('?')[1] : '';
      const params = new URLSearchParams(queryStr);
      return (
        <ArticlesPage
          categorySlug={params.get('category') || undefined}
          initialMood={params.get('mood') || undefined}
          onNavigate={navigate}
        />
      );
    }
    if (currentPath.startsWith('/articles/')) {
      const slug = currentPath.replace('/articles/', '');
      return <ArticleDetailPage slug={slug} onNavigate={navigate} />;
    }

    // 4. Videos
    if (currentPath === '/videos') {
      return <VideosPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/videos/')) {
      const slug = currentPath.replace('/videos/', '');
      return <VideoDetailPage slug={slug} onNavigate={navigate} />;
    }

    // 5. Messages
    if (currentPath === '/messages') {
      return <MessagesPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/messages/')) {
      const slug = currentPath.replace('/messages/', '');
      return <MessageDetailPage slug={slug} onNavigate={navigate} />;
    }

    // 6. Journeys
    if (currentPath === '/journeys') {
      return <JourneysPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/journeys/')) {
      const slug = currentPath.replace('/journeys/', '');
      return <JourneyDetailPage slug={slug} onNavigate={navigate} />;
    }

    // 7. Podcasts
    if (currentPath === '/podcast') {
      return <PodcastPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/podcast/')) {
      const slug = currentPath.replace('/podcast/', '');
      return <PodcastDetailPage slug={slug} onNavigate={navigate} />;
    }

    // 8. Tell Us
    if (currentPath === '/tell-us') {
      return <TellUsPage onNavigate={navigate} />;
    }

    // 9. Search
    if (currentPath === '/search') {
      return <SearchPage onNavigate={navigate} />;
    }

    // 10. Bookmarks
    if (currentPath === '/bookmarks') {
      return <BookmarksPage onNavigate={navigate} />;
    }

    // 11. About
    if (currentPath === '/about') {
      return <AboutPage onNavigate={navigate} />;
    }

    // 12. Contact
    if (currentPath === '/contact') {
      return <ContactPage onNavigate={navigate} />;
    }

    // 13. Gemini Chatbot ("رفيق النور")
    if (currentPath === '/chat') {
      return <ChatPage onNavigate={navigate} />;
    }

    // 14. Profile Page ("حسابي")
    if (currentPath === '/profile') {
      return <ProfilePage onNavigate={navigate} />;
    }

    // 14. Categories route shortcut (/categories/:slug)
    if (currentPath.startsWith('/categories/')) {
      return <ArticlesPage onNavigate={navigate} />;
    }

    // 404 Fallback
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <EmptyState
          title="الصفحة المطلوبة غير موجودة"
          description="ربما تم نقل الصفحة أو تغيير عنوانها. يمكنكِ العودة للصفحة الرئيسية دائماً."
          actionLabel="العودة للصفحة الرئيسية"
          onAction={() => navigate('/')}
        />
      </div>
    );
  };

  const isAdminView = currentPath.startsWith('/admin');
  const isReadingDetailPage =
    currentPath.startsWith('/articles/') ||
    currentPath.startsWith('/journeys/');

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-stone-900 selection:bg-[#36533D]/20 font-['Tajawal',sans-serif]">
      {/* Subtle Reading Progress Indicator Bar on Article & Journey detail pages */}
      {isReadingDetailPage && <ReadingProgressBar key={currentPath} />}

      {/* Hide standard header on full-screen admin view for maximum focus */}
      {!isAdminView && (
        <Header
          currentPath={currentPath}
          onNavigate={navigate}
          onOpenMoodModal={() => setMoodModalOpen(true)}
          onOpenQuoteModal={() => setQuoteModalOpen(true)}
        />
      )}

      {/* Main Page Area */}
      <main className="flex-1">
        {renderRoute()}
      </main>

      {/* Footer */}
      {!isAdminView && (
        <Footer onNavigate={navigate} />
      )}

      {/* Inspiring Random Quote Modal (Triggered on opening app and accessible via header/buttons) */}
      <InspiringQuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        onNavigate={navigate}
      />

      {/* Mood Discovery Modal */}
      <MoodModal
        isOpen={moodModalOpen}
        onClose={() => setMoodModalOpen(false)}
        onNavigate={navigate}
      />

      {/* Auth Modal */}
      <AuthModal />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal onConfirm={() => {
        logout();
        navigate('/');
      }} />

      {/* Gemini AI Floating Chatbot Widget */}
      <FloatingChatWidget
        onNavigate={navigate}
        currentPath={currentPath}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

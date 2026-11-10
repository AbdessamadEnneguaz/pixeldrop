import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Wallpaper,
  WallpaperCategory,
  WallpaperOrientation,
  PexelsColorPalette,
  PexelsResolutionRange,
} from './types';
import { fetchAggregatedWallpapers } from './services/multiApiAggregator';
import { useDebounce } from './hooks/useDebounce';
import { useSystemTheme } from './hooks/useSystemTheme';
import { Navbar } from './components/Navbar';
import { PixelDropHero } from './components/PixelDropHero';
import { CategoryPills } from './components/CategoryPills';
import { AdvancedSearchFilters } from './components/AdvancedSearchFilters';
import { MasonryGrid } from './components/MasonryGrid';
import { WallpaperModal } from './components/WallpaperModal';
import { Footer } from './components/Footer';
import { AdSensePlaceholder } from './components/AdSensePlaceholder';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { PrivacyAdSenseModal } from './components/PrivacyAdSenseModal';
import { NextjsInstructionsModal } from './components/NextjsInstructionsModal';
import { Heart, Search, X } from 'lucide-react';

const FAVORITES_STORAGE_KEY = 'pixeldrop_favorites_v3';

export default function App() {
  const {
    themePreference,
    resolvedTheme,
    isDark,
    setThemePreference,
    toggleTheme,
  } = useSystemTheme();

  const [activeTab, setActiveTab] = useState<'wallpapers' | 'favorites'>('wallpapers');
  const [selectedCategory, setSelectedCategory] = useState<WallpaperCategory>('all');
  const [orientation, setOrientation] = useState<WallpaperOrientation>('all');
  const [selectedColor, setSelectedColor] = useState<PexelsColorPalette>('all');
  const [selectedResolution, setSelectedResolution] = useState<PexelsResolutionRange>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Debounced search query (400ms for snappy responsiveness)
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Infinite Scroll & Wallpapers State
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalIndexed, setTotalIndexed] = useState(12000);
  const isFetchingRef = useRef(false);

  // Modals state
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isNextjsModalOpen, setIsNextjsModalOpen] = useState(false);

  // Favorites state with local storage persistence
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync route / tab from URL query params or hash
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'favorites' || window.location.hash === '#favorites') {
        setActiveTab('favorites');
      }
      const wallpaperId = params.get('wallpaper');
      if (wallpaperId && wallpapers.length > 0) {
        const found = wallpapers.find((w) => w.id === wallpaperId);
        if (found) setSelectedWallpaper(found);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [wallpapers]);

  // Initial and Category/Search/Color/Resolution load
  const loadInitialWallpapers = useCallback(async () => {
    isFetchingRef.current = true;
    setIsLoadingMore(true);
    const batchSize = typeof window !== 'undefined' && window.innerWidth < 768 ? 18 : 24;
    try {
      const res = await fetchAggregatedWallpapers(
        1,
        batchSize,
        selectedCategory,
        debouncedSearch,
        selectedColor !== 'all' ? selectedColor : undefined,
        selectedResolution !== 'all' ? selectedResolution : undefined,
        orientation !== 'all' ? orientation : undefined
      );

      setWallpapers(res.wallpapers);
      setPage(1);
      setHasMore(res.hasMore);
      setTotalIndexed(res.total);
    } catch (err) {
      console.error('Failed to load initial wallpapers:', err);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [selectedCategory, debouncedSearch, selectedColor, selectedResolution, orientation]);

  useEffect(() => {
    loadInitialWallpapers();
  }, [loadInitialWallpapers]);

  // High-performance Infinite Scroll Handler (Strict concurrency guard & append-only)
  const handleLoadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const batchSize = typeof window !== 'undefined' && window.innerWidth < 768 ? 18 : 24;

    try {
      const res = await fetchAggregatedWallpapers(
        nextPage,
        batchSize,
        selectedCategory,
        debouncedSearch,
        selectedColor !== 'all' ? selectedColor : undefined,
        selectedResolution !== 'all' ? selectedResolution : undefined,
        orientation !== 'all' ? orientation : undefined
      );

      if (res.wallpapers && res.wallpapers.length > 0) {
        setWallpapers((prev) => {
          const existingIds = new Set(prev.map((w) => w.id));
          const uniqueNext = res.wallpapers.filter((w) => !existingIds.has(w.id));
          return [...prev, ...uniqueNext];
        });
        setPage(nextPage);
        setHasMore(res.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Infinite scroll fetch error:', err);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [hasMore, page, selectedCategory, debouncedSearch, selectedColor, selectedResolution, orientation]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage error handling
      }
      return updated;
    });
  };

  const handleResetFilters = useCallback(() => {
    setSelectedColor('all');
    setSelectedResolution('all');
    setOrientation('all');
  }, []);

  // Filtered Wallpapers computation
  const filteredWallpapers = useMemo(() => {
    let list = wallpapers;

    if (activeTab === 'favorites') {
      list = list.filter((w) => favorites.includes(w.id));
    }

    if (orientation !== 'all') {
      list = list.filter((w) => w.orientation === orientation);
    }

    if (selectedResolution === 'large') {
      list = list.filter((w) => w.width >= 3840 || w.height >= 2160 || (w.width * w.height) >= 8000000);
    } else if (selectedResolution === 'medium') {
      list = list.filter((w) => w.width >= 2560 || w.height >= 1440 || (w.width * w.height) >= 3600000);
    } else if (selectedResolution === 'small') {
      list = list.filter((w) => w.width >= 1920 || w.height >= 1080 || (w.width * w.height) >= 2000000);
    }

    return list;
  }, [wallpapers, activeTab, orientation, favorites, selectedResolution]);

  const handleNextWallpaper = useCallback(() => {
    if (!selectedWallpaper || filteredWallpapers.length === 0) return;
    const currentIndex = filteredWallpapers.findIndex((w) => w.id === selectedWallpaper.id);
    if (currentIndex === -1) {
      setSelectedWallpaper(filteredWallpapers[0]);
    } else {
      const nextIndex = (currentIndex + 1) % filteredWallpapers.length;
      setSelectedWallpaper(filteredWallpapers[nextIndex]);
    }
  }, [selectedWallpaper, filteredWallpapers]);

  const handlePrevWallpaper = useCallback(() => {
    if (!selectedWallpaper || filteredWallpapers.length === 0) return;
    const currentIndex = filteredWallpapers.findIndex((w) => w.id === selectedWallpaper.id);
    if (currentIndex === -1) {
      setSelectedWallpaper(filteredWallpapers[filteredWallpapers.length - 1]);
    } else {
      const prevIndex = (currentIndex - 1 + filteredWallpapers.length) % filteredWallpapers.length;
      setSelectedWallpaper(filteredWallpapers[prevIndex]);
    }
  }, [selectedWallpaper, filteredWallpapers]);

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    setSelectedCategory('all');
    setActiveTab('wallpapers');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`min-h-screen ${
        isDark ? 'bg-[#0a0a0a] text-[#f4f4f5]' : 'bg-[#fafafa] text-zinc-900'
      } flex flex-col font-['Inter',system-ui,sans-serif] selection:bg-[#5e6ad2] selection:text-white transition-colors`}
    >
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.history.replaceState(null, '', window.location.pathname);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        favoritesCount={favorites.length}
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
        onOpenNextjsModal={() => setIsNextjsModalOpen(true)}
        themePreference={themePreference}
        resolvedTheme={resolvedTheme}
        onToggleTheme={toggleTheme}
        onSetThemePreference={setThemePreference}
      />

      {/* Top AdSense Leaderboard 728x90 */}
      <div className="w-full px-4 pt-3 pb-1 relative z-10">
        <AdSensePlaceholder
          format="banner-728x90"
          slotId="top-leaderboard-728x90"
          onLearnMore={() => setIsPrivacyModalOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-4 relative z-10">
        {/* Wallpapers Discovery View */}
        {activeTab === 'wallpapers' && (
          <>
            {/* Studio Hero Section */}
            <PixelDropHero
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setSearchQuery('');
              }}
              totalCount={totalIndexed}
            />

            {/* Category Navigation & Orientation Selector */}
            <CategoryPills
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setSearchQuery('');
              }}
              orientation={orientation}
              onChangeOrientation={setOrientation}
              totalCount={wallpapers.length}
            />

            {/* Advanced Filters (Color & Resolution) */}
            <AdvancedSearchFilters
              selectedColor={selectedColor}
              onChangeColor={(color) => {
                setSelectedColor(color);
                setPage(1);
              }}
              selectedResolution={selectedResolution}
              onChangeResolution={(res) => {
                setSelectedResolution(res);
                setPage(1);
              }}
              onResetFilters={handleResetFilters}
              activeCount={
                (selectedColor !== 'all' ? 1 : 0) + (selectedResolution !== 'all' ? 1 : 0)
              }
              totalResults={filteredWallpapers.length}
              isDark={isDark}
            />

            {/* Active Search Banner */}
            {searchQuery && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-100 dark:bg-[#121212] border border-zinc-200 dark:border-[#1f1f1f] text-xs text-zinc-700 dark:text-zinc-300">
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-[#8b95f6]" />
                  <span>
                    Searching 4K wallpapers for &ldquo;
                    <strong className="text-zinc-900 dark:text-white font-semibold">{searchQuery}</strong>
                    &rdquo;
                  </span>
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#8b95f6] hover:text-[#a5affd] dark:text-[#8b95f6] dark:hover:text-[#a5affd] hover:underline font-semibold cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear search</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Favorites Header View */}
        {activeTab === 'favorites' && (
          <div className="py-4 space-y-3">
            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-[#121212] border border-zinc-200 dark:border-[#1f1f1f] flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-zinc-900 dark:text-white font-semibold text-sm">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>Your Saved Wallpapers ({favorites.length})</span>
              </div>
              <button
                onClick={() => setActiveTab('wallpapers')}
                className="text-xs text-[#8b95f6] hover:text-[#a5affd] hover:underline cursor-pointer font-medium"
              >
                ← Back to Wallpapers
              </button>
            </div>
            {favorites.length === 0 && (
              <div className="py-16 text-center text-zinc-500 text-xs">
                You haven&apos;t saved any wallpapers yet. Hover on any wallpaper and click the heart icon to save it.
              </div>
            )}
          </div>
        )}

        {/* Responsive 60fps Masonry Grid with Bulletproof Infinite Scroll */}
        <MasonryGrid
          wallpapers={filteredWallpapers}
          favorites={favorites}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore && activeTab === 'wallpapers'}
          onSelect={(wp) => setSelectedWallpaper(wp)}
          onToggleFavorite={toggleFavorite}
          onResetSearch={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setSelectedColor('all');
            setSelectedResolution('all');
            setOrientation('all');
          }}
          onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
          onLoadMore={handleLoadMore}
        />
      </main>

      {/* Global Pro Studio Footer */}
      <Footer
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setActiveTab('wallpapers');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenFavorites={() => {
          setActiveTab('favorites');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenLegal={() => setIsPrivacyModalOpen(true)}
      />

      {/* 4K Wallpaper Modal */}
      <WallpaperModal
        wallpaper={selectedWallpaper}
        isFavorite={selectedWallpaper ? favorites.includes(selectedWallpaper.id) : false}
        onClose={() => setSelectedWallpaper(null)}
        onToggleFavorite={toggleFavorite}
        onTagClick={handleTagClick}
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
        onSelectWallpaper={(wp) => setSelectedWallpaper(wp)}
        categoryWallpapers={filteredWallpapers}
        categoryName={selectedCategory}
        onNextWallpaper={handleNextWallpaper}
        onPrevWallpaper={handlePrevWallpaper}
      />

      {/* GDPR / CCPA Cookie Consent Banner */}
      <CookieConsentBanner onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)} />

      {/* Privacy Policy & Google AdSense Modal */}
      <PrivacyAdSenseModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* Next.js & Vercel Stack Architecture Modal */}
      <NextjsInstructionsModal
        isOpen={isNextjsModalOpen}
        onClose={() => setIsNextjsModalOpen(false)}
      />
    </div>
  );
}

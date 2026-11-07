import React, { useEffect, useRef, useCallback } from 'react';
import { WallpaperCard } from './WallpaperCard';
import { AdSensePlaceholder } from './AdSensePlaceholder';
import { Wallpaper } from '../types';
import { Loader2, ArrowDown, Image as ImageIcon } from 'lucide-react';

interface MasonryGridProps {
  wallpapers: Wallpaper[];
  favorites: string[];
  isLoadingMore: boolean;
  hasMore: boolean;
  onSelect: (wallpaper: Wallpaper) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onResetSearch: () => void;
  onOpenPrivacyModal: () => void;
  onLoadMore: () => void;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  wallpapers,
  favorites,
  isLoadingMore,
  hasMore,
  onSelect,
  onToggleFavorite,
  onResetSearch,
  onOpenPrivacyModal,
  onLoadMore,
}) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(isLoadingMore);
  loadingRef.current = isLoadingMore;

  const triggerLoadMore = useCallback(() => {
    if (!loadingRef.current && hasMore) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore]);

  // Primary: Intersection Observer with 800px pre-trigger margin
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          triggerLoadMore();
        }
      },
      {
        root: null,
        rootMargin: isMobile ? '400px 0px' : '800px 0px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, triggerLoadMore]);

  // Secondary Fallback: Window scroll listener to guarantee infinite scroll on all devices
  useEffect(() => {
    if (!hasMore) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!loadingRef.current && hasMore) {
            const scrollY = window.scrollY || window.pageYOffset;
            const viewportHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            if (scrollY + viewportHeight >= documentHeight - 900) {
              triggerLoadMore();
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore, triggerLoadMore]);

  if (wallpapers.length === 0 && !isLoadingMore) {
    return (
      <div className="w-full py-20 px-4 text-center rounded-3xl border border-[#1f1f1f] bg-[#121212] flex flex-col items-center justify-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-[#5e6ad2]/15 border border-[#5e6ad2]/30 flex items-center justify-center text-[#8b95f6]">
          <ImageIcon className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
          No wallpapers found matching this criteria
        </h3>
        <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
          Try picking a different genre or reset your search query to explore the full 4K library.
        </p>
        <button
          onClick={onResetSearch}
          className="px-5 py-2.5 rounded-xl bg-[#5e6ad2] hover:bg-[#6c78e6] text-white text-xs font-semibold shadow-md shadow-[#5e6ad2]/25 transition-all cursor-pointer"
        >
          Reset Filters
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* High-Performance Responsive Masonry Columns (Unsplash Layout) */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
        {wallpapers.map((wallpaper, index) => {
          const isFavorite = favorites.includes(wallpaper.id);
          const showAd = (index + 1) % 15 === 0;

          return (
            <React.Fragment key={wallpaper.id}>
              <WallpaperCard
                wallpaper={wallpaper}
                isFavorite={isFavorite}
                onSelect={onSelect}
                onToggleFavorite={onToggleFavorite}
              />

              {showAd && (
                <div className="mb-4 break-inside-avoid block w-full">
                  <AdSensePlaceholder
                    format="square-250x250"
                    slotId={`feed-ad-${wallpaper.id}`}
                    onLearnMore={onOpenPrivacyModal}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Infinite Scroll Trigger Sentinel & Status */}
      <div
        ref={sentinelRef}
        id="infinite-scroll-sentinel"
        className="w-full py-8 flex flex-col items-center justify-center gap-3 min-h-[90px]"
      >
        {isLoadingMore ? (
          <div className="flex items-center gap-2.5 text-xs font-medium text-zinc-300 bg-[#121212] px-5 py-2.5 rounded-full border border-[#1f1f1f] shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin text-[#8b95f6]" />
            <span>Loading more 4K wallpapers...</span>
          </div>
        ) : hasMore ? (
          <button
            onClick={triggerLoadMore}
            className="group flex items-center gap-2 text-xs font-medium text-zinc-300 hover:text-white bg-[#121212] hover:bg-[#18181b] px-6 py-2.5 rounded-full border border-[#1f1f1f] hover:border-[#2e2e38] transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <span>Load more wallpapers</span>
            <ArrowDown className="w-3.5 h-3.5 text-[#8b95f6] group-hover:translate-y-0.5 transition-transform" />
          </button>
        ) : (
          <div className="text-xs text-zinc-500 py-3 font-mono">
            All wallpapers loaded · Over {wallpapers.length} indexed
          </div>
        )}
      </div>
    </div>
  );
};

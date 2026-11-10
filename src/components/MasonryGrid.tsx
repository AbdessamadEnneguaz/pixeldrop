import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { WallpaperCard } from './WallpaperCard';
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
  onOpenPrivacyModal?: () => void;
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
  onLoadMore,
}) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingLockRef = useRef(false);

  // Responsive column count (Phones: 2 columns, Tablets: 3 columns, Large Desktop: 4 columns)
  const [columnCount, setColumnCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 4;
    const w = window.innerWidth;
    if (w < 480) return 1;
    if (w < 768) return 2;
    if (w < 1080) return 3;
    return 4;
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      let count = 4;
      if (w < 480) count = 1;
      else if (w < 768) count = 2;
      else if (w < 1080) count = 3;
      else count = 4;

      setColumnCount((prev) => (prev !== count ? count : prev));
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Stable Column Buckets (Fixed Top, Append-Only Bottom):
  // Item `i` is permanently assigned to `i % columnCount`.
  // When new wallpapers are appended from infinite scroll, they are ONLY added
  // to the BOTTOM of each column. Existing items NEVER shift, jump, or move.
  const columns = useMemo(() => {
    const cols: Wallpaper[][] = Array.from({ length: columnCount }, () => []);
    for (let i = 0; i < wallpapers.length; i++) {
      cols[i % columnCount].push(wallpapers[i]);
    }
    return cols;
  }, [wallpapers, columnCount]);

  useEffect(() => {
    loadingLockRef.current = isLoadingMore;
  }, [isLoadingMore]);

  const triggerLoadMore = useCallback(() => {
    if (!loadingLockRef.current && hasMore) {
      loadingLockRef.current = true;
      onLoadMore();
    }
  }, [hasMore, onLoadMore]);

  // Robust Intersection Observer on bottom sentinel with 350px margin
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingLockRef.current) {
          triggerLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '350px 0px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, triggerLoadMore]);

  if (wallpapers.length === 0 && !isLoadingMore) {
    return (
      <div className="w-full py-20 px-4 text-center rounded-3xl border border-[#1f1f1f] bg-[#121212] flex flex-col items-center justify-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-[#5e6ad2]/15 border border-[#5e6ad2]/30 flex items-center justify-center text-[#8b95f6]">
          <ImageIcon className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white font-['Inter',system-ui,sans-serif]">
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
    <div className="space-y-6 w-full">
      {/* Stable Multi-Column Masonry (Zero Jump, Zero Shift, Append-Only) */}
      <div className="flex flex-row gap-4 w-full items-start">
        {columns.map((colWallpapers, colIndex) => (
          <div key={colIndex} className="flex-1 flex flex-col gap-4 min-w-0">
            {colWallpapers.map((wallpaper) => (
              <WallpaperCard
                key={wallpaper.id}
                wallpaper={wallpaper}
                isFavorite={favorites.includes(wallpaper.id)}
                onSelect={onSelect}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        ))}
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

export default MasonryGrid;

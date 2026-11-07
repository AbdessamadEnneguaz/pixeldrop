import React, { useState, useEffect } from 'react';
import { Download, Heart, ExternalLink, Check } from 'lucide-react';
import { Wallpaper } from '../types';
import { downloadWallpaperDirectly } from '../utils/downloadHelper';

interface WallpaperCardProps {
  wallpaper: Wallpaper;
  isFavorite: boolean;
  onSelect: (wallpaper: Wallpaper) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const WallpaperCard: React.FC<WallpaperCardProps> = ({
  wallpaper,
  isFavorite,
  onSelect,
  onToggleFavorite,
}) => {
  // Pick lightweight thumbnail (rawSrc.medium or thumbUrl) for 60fps scrolling
  const getThumbnailSrc = (wp: Wallpaper) => {
    return wp?.rawSrc?.medium || wp?.thumbUrl || wp?.imageUrl || wp?.url || '';
  };

  const initialSrc = getThumbnailSrc(wallpaper);
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(!initialSrc);
  const [quickDownloading, setQuickDownloading] = useState(false);

  useEffect(() => {
    const nextSrc = getThumbnailSrc(wallpaper);
    setImgSrc(nextSrc);
    setIsLoaded(false);
    setHasError(!nextSrc);
  }, [wallpaper?.id, wallpaper?.rawSrc?.medium, wallpaper?.thumbUrl, wallpaper?.imageUrl, wallpaper?.url]);

  if (hasError) {
    return null;
  }

  const handleImageError = () => {
    const fallback = wallpaper?.thumbUrl || wallpaper?.imageUrl || wallpaper?.url;
    if (fallback && fallback !== imgSrc) {
      setImgSrc(fallback);
    } else {
      setHasError(true);
    }
  };

  const handleQuickDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickDownloading(true);
    try {
      await downloadWallpaperDirectly(wallpaper, 'original');
    } catch (err) {
      console.error('Quick download failed:', err);
    } finally {
      setTimeout(() => setQuickDownloading(false), 1500);
    }
  };

  // Wallhaven-style resolution badge
  const resolutionBadge =
    wallpaper.width >= 3840 || wallpaper.height >= 2160
      ? '4K UHD'
      : wallpaper.width >= 2560 || wallpaper.height >= 1440
      ? '2K QHD'
      : '1080p';

  const authorInitial = wallpaper.authorName ? wallpaper.authorName.charAt(0).toUpperCase() : 'P';
  const seoAltText = `PixelDrop - 4K Wallpaper ${wallpaper.title} by ${wallpaper.authorName}`;

  return (
    <div
      id={`wallpaper-card-${wallpaper.id}`}
      onClick={() => onSelect(wallpaper)}
      className="group wallpaper-card-contain relative mb-4 break-inside-avoid block w-full cursor-pointer rounded-2xl overflow-hidden bg-[#121212] border border-[#1f1f1f] hover:border-[#5e6ad2]/50 hover:shadow-2xl hover:shadow-[#5e6ad2]/10 transition-all duration-300 active:scale-[0.98] touch-manipulation"
    >
      {/* Container with dynamic aspect-ratio based on image dimensions */}
      <div
        className="relative w-full overflow-hidden bg-[#121212]"
        style={{
          aspectRatio: `${wallpaper.width || 16} / ${wallpaper.height || 9}`,
        }}
      >
        {/* Unsplash-style Smooth Lazy-loading Image Skeleton State */}
        {!isLoaded && (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#121212] via-[#1a1a20] to-[#121212] animate-pulse" />
        )}

        {/* Wallpaper Image */}
        <img
          src={imgSrc}
          alt={seoAltText}
          loading="lazy"
          decoding="async"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03] ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Wallhaven-Inspired Dark Gradient Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10" />

        {/* Wallhaven Top Bar: Resolution Badge (Left) & Favorite Heart (Right) */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-y-1 group-hover:translate-y-0">
          {/* Resolution Badge */}
          <span className="pointer-events-auto px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-black/75 backdrop-blur-md text-white border border-white/10 shadow-lg flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8b95f6]" />
            {resolutionBadge}
          </span>

          {/* Favorite / Heart Icon */}
          <button
            onClick={(e) => onToggleFavorite(wallpaper.id, e)}
            className={`pointer-events-auto w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md border ${
              isFavorite
                ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/25'
                : 'bg-black/60 hover:bg-black/85 text-white hover:text-rose-400 border-white/15'
            }`}
            title={isFavorite ? 'Remove from saved' : 'Save to favorites'}
            aria-label="Save wallpaper"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Wallhaven Bottom Bar: Author Attribution (Left) & Quick Download Button (Right) */}
        <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-between text-white z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
          {/* Photographer Attribution with Avatar */}
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="w-7 h-7 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm">
              {authorInitial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-white drop-shadow-sm truncate">
                  {wallpaper.authorName}
                </span>
                {(wallpaper.authorProfile || wallpaper.authorLink) && (
                  <a
                    href={wallpaper.authorProfile || wallpaper.authorLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-zinc-400 hover:text-white transition-colors"
                    title="View creator"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 drop-shadow-sm truncate capitalize">
                {wallpaper.category || 'wallpaper'}
              </p>
            </div>
          </div>

          {/* Wallhaven-Inspired Quick Download Button */}
          <button
            onClick={handleQuickDownload}
            disabled={quickDownloading}
            className={`shrink-0 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold shadow-lg transition-all cursor-pointer backdrop-blur-md border active:scale-95 ${
              quickDownloading
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-white/15 hover:bg-[#5e6ad2] text-white border-white/20 hover:border-[#5e6ad2] shadow-black/40'
            }`}
            title="Quick Download 4K Master"
            aria-label="Download 4K wallpaper"
          >
            {quickDownloading ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">Saved</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

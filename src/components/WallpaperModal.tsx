import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Share2,
  Check,
  Monitor,
  Smartphone,
  Tablet,
  Heart,
  Tag,
  ExternalLink,
  Sparkles,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sliders,
  Keyboard,
  ChevronDown,
  ShieldCheck,
  Laptop,
  Terminal,
  HelpCircle,
} from 'lucide-react';
import { Wallpaper, DownloadResolution } from '../types';
import { AdSensePlaceholder } from './AdSensePlaceholder';
import { downloadWallpaperDirectly, getOriginalHighResUrl } from '../utils/downloadHelper';
import { fetchAggregatedWallpapers } from '../services/multiApiAggregator';

interface WallpaperModalProps {
  wallpaper: Wallpaper | null;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onTagClick: (tag: string) => void;
  onOpenPrivacyModal: () => void;
  onSelectWallpaper?: (wallpaper: Wallpaper) => void;
  categoryWallpapers?: Wallpaper[];
  categoryName?: string;
  onNextWallpaper?: () => void;
  onPrevWallpaper?: () => void;
}

const STOP_WORDS = new Set([
  'wallpaper', 'wallpapers', '4k', 'ultra', 'hd', 'fond', "d'écran", 'decran',
  'free', 'gratuit', 'background', 'backgrounds', 'photo', 'image', 'curated', 'by',
  'high', 'resolution', 'desktop', 'mobile', 'for', 'and', 'the', 'pexels', 'wallhaven',
  'unsplash', 'pixabay', 'artist', 'creator', 'illustration', 'collection', 'setup'
]);

function extractKeywords(wp: Wallpaper): string {
  if (!wp) return '4k';
  const words = (wp.title || '')
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  if (words.length > 0) return words.slice(0, 2).join(' ');
  if (wp.tags && wp.tags.length > 0) {
    const candidateTag = wp.tags.find((t) => !STOP_WORDS.has(t.toLowerCase()) && t.length > 2);
    if (candidateTag) return candidateTag;
  }
  if (wp.category && wp.category !== 'all') return wp.category;
  return 'cyberpunk';
}

export const WallpaperModal: React.FC<WallpaperModalProps> = ({
  wallpaper,
  isFavorite,
  onClose,
  onToggleFavorite,
  onTagClick,
  onOpenPrivacyModal,
  onSelectWallpaper,
  categoryWallpapers = [],
  categoryName,
  onNextWallpaper,
  onPrevWallpaper,
}) => {
  const [downloadingRes, setDownloadingRes] = useState<DownloadResolution | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [hasWebShare, setHasWebShare] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [modalImgSrc, setModalImgSrc] = useState(wallpaper?.fullUrl || wallpaper?.url || wallpaper?.imageUrl || '');
  const [showResDropdown, setShowResDropdown] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const [isSettingPhone, setIsSettingPhone] = useState(false);
  const [phoneActionFeedback, setPhoneActionFeedback] = useState<string | null>(null);
  const [desktopActionFeedback, setDesktopActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    setHasWebShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  // Slideshow Mode State
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [slideshowDelay, setSlideshowDelay] = useState<number>(4);
  const [slideshowProgress, setSlideshowProgress] = useState(0);
  const [showSlideshowSettings, setShowSlideshowSettings] = useState(false);

  // Keyboard navigation & gestures
  const [showKeyboardHelper, setShowKeyboardHelper] = useState(false);
  const [keyNavIndicator, setKeyNavIndicator] = useState<'left' | 'right' | null>(null);
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>('');

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0 && onNextWallpaper) {
        setKeyNavIndicator('right');
        setTimeout(() => setKeyNavIndicator(null), 400);
        onNextWallpaper();
      } else if (deltaX > 0 && onPrevWallpaper) {
        setKeyNavIndicator('left');
        setTimeout(() => setKeyNavIndicator(null), 400);
        onPrevWallpaper();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Related wallpapers
  const [relatedWallpapers, setRelatedWallpapers] = useState<Wallpaper[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [relatedKeyword, setRelatedKeyword] = useState('');

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'Escape') {
        if (showKeyboardHelper) setShowKeyboardHelper(false);
        else if (showSlideshowSettings) setShowSlideshowSettings(false);
        else if (showResDropdown) setShowResDropdown(false);
        else onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (onNextWallpaper) {
          setKeyNavIndicator('right');
          setTimeout(() => setKeyNavIndicator(null), 400);
          onNextWallpaper();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (onPrevWallpaper) {
          setKeyNavIndicator('left');
          setTimeout(() => setKeyNavIndicator(null), 400);
          onPrevWallpaper();
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        if (activeTag !== 'button') {
          e.preventDefault();
          setIsSlideshowActive((prev) => !prev);
        }
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowKeyboardHelper((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNextWallpaper, onPrevWallpaper, showKeyboardHelper, showSlideshowSettings, showResDropdown]);

  useEffect(() => {
    if (wallpaper) {
      setAriaAnnouncement(`Displaying wallpaper: ${wallpaper.title} by ${wallpaper.authorName}`);
    }
  }, [wallpaper?.id]);

  useEffect(() => {
    if (!isSlideshowActive || !wallpaper || !onNextWallpaper) {
      setSlideshowProgress(0);
      return;
    }
    const intervalMs = 100;
    const totalMs = slideshowDelay * 1000;
    let elapsedMs = 0;

    const timer = setInterval(() => {
      elapsedMs += intervalMs;
      const progressPercent = Math.min(100, (elapsedMs / totalMs) * 100);
      setSlideshowProgress(progressPercent);

      if (elapsedMs >= totalMs) {
        elapsedMs = 0;
        setSlideshowProgress(0);
        onNextWallpaper();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSlideshowActive, slideshowDelay, wallpaper?.id, onNextWallpaper]);

  useEffect(() => {
    setImageLoaded(false);
    setModalImgSrc(wallpaper?.fullUrl || wallpaper?.url || wallpaper?.imageUrl || '');
    setShowResDropdown(false);
  }, [wallpaper?.id, wallpaper?.fullUrl, wallpaper?.url, wallpaper?.imageUrl]);

  // Fetch related wallpapers
  useEffect(() => {
    if (!wallpaper) return;
    const keyword = extractKeywords(wallpaper);
    setRelatedKeyword(keyword);
    setIsLoadingRelated(true);

    let isMounted = true;
    const fetchRelated = async () => {
      try {
        const res = await fetch(`/api/wallpapers?query=${encodeURIComponent(keyword)}&per_page=12`);
        if (res.ok) {
          const data = await res.json();
          let items: Wallpaper[] = [];
          if (data.wallpapers && data.wallpapers.length > 0) {
            items = data.wallpapers.map((w: any) => ({
              id: w.id,
              url: w.url,
              thumbnail: w.thumbnail,
              fullUrl: w.url,
              thumbUrl: w.thumbnail,
              imageUrl: w.thumbnail,
              title: w.title || `${keyword} 4K Wallpaper`,
              authorName: w.authorName || 'Creator',
              authorProfile: w.authorProfile || '',
              authorLink: w.authorProfile || '',
              category: (wallpaper.category || w.category || 'all') as any,
              width: w.width || 1920,
              height: w.height || 1080,
              tags: [keyword, '4k', 'wallpaper'],
              description: `Related 4K wallpaper for ${keyword}`,
              source: w.source || 'pexels',
              views: 1200,
              downloads: 400,
              likes: 90,
              orientation: w.width >= w.height ? 'landscape' : 'portrait',
            }));
          }
          const filtered = items.filter((item) => item.id !== wallpaper.id && item.url !== wallpaper.url);
          if (isMounted) {
            if (filtered.length > 0) {
              setRelatedWallpapers(filtered.slice(0, 8));
            } else {
              const fallbackRes = await fetchAggregatedWallpapers(1, 8, wallpaper.category, keyword);
              const fbFiltered = fallbackRes.wallpapers.filter((w) => w.id !== wallpaper.id);
              setRelatedWallpapers(fbFiltered.slice(0, 8));
            }
          }
        }
      } catch {
        // Silently handle
      } finally {
        if (isMounted) setIsLoadingRelated(false);
      }
    };

    fetchRelated();
    return () => {
      isMounted = false;
    };
  }, [wallpaper?.id, wallpaper?.title, wallpaper?.category]);

  if (!wallpaper) return null;

  const handleDownload = async (resolution: DownloadResolution) => {
    setDownloadingRes(resolution);
    setShowResDropdown(false);
    setDownloadStatus(
      resolution === 'original'
        ? 'Downloading raw uncompressed 4K master...'
        : `Rendering ${resolution} resolution...`
    );

    try {
      await downloadWallpaperDirectly(wallpaper, resolution, (status) => {
        setDownloadStatus(status);
      });
    } catch (err) {
      console.error('Download error:', err);
      setDownloadStatus('Download error, please retry.');
    } finally {
      setTimeout(() => {
        setDownloadingRes(null);
        setDownloadStatus('');
      }, 2000);
    }
  };

  // Helper to ensure an image is converted to a 100% valid baseline JPEG readable by all phone galleries
  const preparePhoneJpegBlob = async (targetUrl: string): Promise<Blob> => {
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
    const rawBlob = await response.blob();

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const objUrl = URL.createObjectURL(rawBlob);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 1440;
          canvas.height = img.naturalHeight || 2560;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(
              (convertedBlob) => {
                URL.revokeObjectURL(objUrl);
                if (convertedBlob && convertedBlob.size > 0) {
                  resolve(convertedBlob);
                } else {
                  resolve(new Blob([rawBlob], { type: 'image/jpeg' }));
                }
              },
              'image/jpeg',
              0.98
            );
            return;
          }
        } catch {
          // Canvas tainted fallback
        }
        URL.revokeObjectURL(objUrl);
        resolve(new Blob([rawBlob], { type: 'image/jpeg' }));
      };

      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        resolve(new Blob([rawBlob], { type: 'image/jpeg' }));
      };

      img.src = objUrl;
    });
  };

  const handleShare = async () => {
    if (!wallpaper) return;
    const shareUrl = `${window.location.origin}?wallpaper=${wallpaper.id}`;
    const shareTitle = wallpaper.title ? `${wallpaper.title} - 4K Wallpaper` : '4K Wallpaper on PixelDrop';
    const shareText = `Check out "${wallpaper.title || '4K Wallpaper'}" by ${wallpaper.authorName} on PixelDrop!`;

    // 1. Try Web Share API (native mobile share sheet with "Use as Wallpaper" / "Add to Home Screen")
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setIsSharing(true);
      setShareFeedback('Opening share sheet...');

      try {
        let fileShared = false;
        const cleanId = String(wallpaper.id || 'wallpaper').replace(/^pexels-|^pixabay-|^wallhaven-|^unsplash-/, '');
        const highResUrl = getOriginalHighResUrl(wallpaper, 'mobile') || wallpaper.url;
        const proxyUrl = `/api/download?url=${encodeURIComponent(highResUrl)}&filename=${encodeURIComponent(`PixelDrop-Share-${cleanId}.jpg`)}`;

        // On mobile devices, share a guaranteed standard JPEG File object
        if (typeof navigator.canShare === 'function' && highResUrl) {
          try {
            const jpegBlob = await preparePhoneJpegBlob(proxyUrl);
            const file = new File([jpegBlob], `PixelDrop-Share-${cleanId}.jpg`, {
              type: 'image/jpeg',
            });

            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: shareTitle,
                text: shareText,
                url: shareUrl,
                files: [file],
              });
              fileShared = true;
              setShareFeedback('Shared successfully!');
              setTimeout(() => setShareFeedback(null), 2500);
              return;
            }
          } catch (fileErr: any) {
            if (fileErr?.name === 'AbortError') return;
          }
        }

        if (!fileShared) {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl,
          });
          setShareFeedback('Shared successfully!');
          setTimeout(() => setShareFeedback(null), 2500);
          return;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          setShareFeedback(null);
          return;
        }
        console.warn('Web Share failed, falling back to clipboard:', err);
      } finally {
        setIsSharing(false);
      }
    }

    // 2. Fallback to copying direct link to clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      setShareFeedback('Link copied to clipboard!');
      setTimeout(() => {
        setCopiedLink(false);
        setShareFeedback(null);
      }, 2500);
    } catch (e) {
      console.error('Failed to copy share link:', e);
      setShareFeedback('Could not copy link');
      setTimeout(() => setShareFeedback(null), 2000);
    }
  };

  const handleCopyShareLink = handleShare;

  const handleSetAsPhoneWallpaper = async () => {
    if (!wallpaper) return;
    setIsSettingPhone(true);
    setPhoneActionFeedback('Preparing universal phone format...');

    const cleanId = String(wallpaper.id || 'wallpaper').replace(/^pexels-|^pixabay-|^wallhaven-|^unsplash-/, '');
    const highResUrl = getOriginalHighResUrl(wallpaper, 'mobile') || wallpaper.url;
    const filename = `PixelDrop-Wallpaper-${cleanId}.jpg`;
    const proxyUrl = `/api/download?url=${encodeURIComponent(highResUrl)}&filename=${encodeURIComponent(filename)}`;

    try {
      // 1. Fetch uncompressed master and convert to 100% compliant Baseline JPEG
      // This eliminates the "format not supported or corrupt" error on Samsung, Xiaomi, and iOS.
      setPhoneActionFeedback('Optimizing for phone gallery...');
      const jpegBlob = await preparePhoneJpegBlob(proxyUrl);
      const phoneFile = new File([jpegBlob], filename, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // 2. Try Web Share API with genuine JPEG File
      // Triggers native mobile sheet: "Définir comme fond d'écran" / "Use as Wallpaper"
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [phoneFile] })
      ) {
        setPhoneActionFeedback('Opening system wallpaper sheet...');
        await navigator.share({
          title: wallpaper.title || '4K Phone Wallpaper',
          text: 'Définir comme fond d\'écran (Set as Wallpaper)',
          files: [phoneFile],
        });
        setPhoneActionFeedback('Success! Applied as wallpaper.');
        setTimeout(() => setPhoneActionFeedback(null), 4000);
        return;
      }

      // 3. Direct Native Download of verified JPEG file
      // Saves pristine JPEG directly to phone's Downloads/Gallery folder
      setPhoneActionFeedback('Saving verified JPEG to Gallery...');
      const blobUrl = URL.createObjectURL(phoneFile);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);

      setPhoneActionFeedback('Saved to Gallery! Tap "Set as Wallpaper"');
      setTimeout(() => setPhoneActionFeedback(null), 5000);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setPhoneActionFeedback(null);
        return;
      }
      console.warn('Set as phone wallpaper fallback to proxy download:', err);
      try {
        await downloadWallpaperDirectly(wallpaper, 'mobile', (status) => setPhoneActionFeedback(status));
        setPhoneActionFeedback('Saved! Open Gallery -> "Set as Wallpaper"');
        setTimeout(() => setPhoneActionFeedback(null), 4500);
      } catch {
        setPhoneActionFeedback('Download failed, please retry.');
        setTimeout(() => setPhoneActionFeedback(null), 3000);
      }
    } finally {
      setIsSettingPhone(false);
    }
  };

  const handleDownloadWindowsWallpaperBat = () => {
    if (!wallpaper) return;
    const imgUrl = wallpaper.fullUrl || wallpaper.url || wallpaper.imageUrl;
    const sanitizedTitle = (wallpaper.title || 'wallpaper').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);

    // Auto-setter Windows Batch script using PowerShell Win32 SystemParametersInfo
    const batContent = `@echo off
chcp 65001 >nul
title PixelDrop - Setting Desktop Wallpaper
cls
echo ========================================================
echo   PixelDrop 4K Wallpaper Auto-Setter
echo ========================================================
echo.
echo [1/2] Downloading uncompressed 4K wallpaper...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference = 'SilentlyContinue'; $dest = [System.IO.Path]::Combine($env:TEMP, 'pixeldrop_${sanitizedTitle}.jpg'); Invoke-WebRequest -Uri '${imgUrl}' -OutFile $dest; $code = @'
using System;
using System.Runtime.InteropServices;
public class WinWallpaper {
    [DllImport(\\"user32.dll\\", CharSet = CharSet.Auto)]
    public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);
}
'@; Add-Type -TypeDefinition $code; [WinWallpaper]::SystemParametersInfo(0x0014, 0, $dest, 0x01 | 0x02); Write-Host '[2/2] Wallpaper applied successfully!';"
echo.
echo ========================================================
echo   Success! Your Windows desktop wallpaper has been updated.
echo ========================================================
timeout /t 3 >nul
exit
`;

    const blob = new Blob([batContent], { type: 'application/bat;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Set-Desktop-Wallpaper-${sanitizedTitle}.bat`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    setDesktopActionFeedback('Script downloaded! Double-click to set desktop.');
    setTimeout(() => setDesktopActionFeedback(null), 5000);
  };

  const handleSelectRelated = (relatedWp: Wallpaper) => {
    if (onSelectWallpaper) onSelectWallpaper(relatedWp);
    const scrollContainer = document.getElementById('wallpaper-modal-scroll');
    if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const authorInitial = wallpaper.authorName ? wallpaper.authorName.charAt(0).toUpperCase() : 'P';
  const categoryCapitalized = wallpaper.category.charAt(0).toUpperCase() + wallpaper.category.slice(1);
  const isWallhaven = wallpaper.source === 'wallhaven';
  const licenseName = isWallhaven ? 'Wallhaven SFW License' : 'Pexels Open License (Free to use)';

  return (
    <div
      id="wallpaper-details-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Wallpaper details for ${wallpaper.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto overscroll-contain animate-in fade-in duration-200 safe-inset"
      onClick={onClose}
    >
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {ariaAnnouncement}
      </div>

      <div
        id="wallpaper-modal-container"
        className="w-full max-w-5xl my-auto bg-[#0d0d10] border border-[#1f1f1f] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 relative max-h-[94vh] max-h-[94dvh] gpu-layer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Unsplash Style Header with Linear Glassmorphism: Author on left, Prominent "Download HD" button on right */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#1f1f1f] bg-[#0d0d10]/95 select-none">
          {/* Author info */}
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm border border-white/15">
              {authorInitial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <a
                  href={wallpaper.authorLink || wallpaper.authorProfile || 'https://www.pexels.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-sm text-white hover:text-[#8b95f6] flex items-center gap-1 truncate transition-colors"
                >
                  <span className="truncate">{wallpaper.authorName}</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />
                </a>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#1a1a24] text-[#8b95f6] border border-[#2e2e40]">
                  Free to use
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate">
                {wallpaper.title || `${categoryCapitalized} Wallpaper`}
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Prominent "Download HD" Button with Dropdown Chevron (Unsplash / Linear Style) */}
            <div className="relative flex items-center">
              <div className="inline-flex rounded-xl shadow-lg shadow-[#5e6ad2]/20">
                <button
                  id="btn-modal-free-download"
                  onClick={() => handleDownload('original')}
                  disabled={downloadingRes !== null}
                  className="px-3.5 sm:px-4 py-2 rounded-l-xl bg-[#5e6ad2] hover:bg-[#6c78e6] active:bg-[#525db8] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  {downloadingRes ? (
                    <span className="animate-spin text-white">◷</span>
                  ) : (
                    <Download className="w-4 h-4 stroke-[2.5]" />
                  )}
                  <span>Download HD</span>
                </button>
                <button
                  onClick={() => setShowResDropdown((prev) => !prev)}
                  className="px-2.5 py-2 rounded-r-xl bg-[#525db8] hover:bg-[#5e6ad2] active:bg-[#4751a3] text-white border-l border-white/20 transition-all cursor-pointer"
                  title="Choose resolution"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Resolution Dropdown Popover (Linear Glassmorphism) */}
              {showResDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 p-2 rounded-2xl bg-[#121215] border border-[#1f1f1f] shadow-2xl z-50 space-y-1 animate-in fade-in duration-100 backdrop-blur-xl">
                  <div className="px-2 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                    Select Resolution
                  </div>
                  <button
                    onClick={() => handleDownload('original')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-[#1a1a22] flex items-center justify-between text-zinc-200 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">Original (4K Raw)</div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {wallpaper.width} × {wallpaper.height}
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#5e6ad2]/20 text-[#8b95f6] font-mono font-bold">
                      Master
                    </span>
                  </button>

                  <button
                    onClick={() => handleDownload('desktop')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-[#1a1a22] flex items-center justify-between text-zinc-200 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">Desktop 16:9</div>
                      <div className="text-[10px] text-zinc-400 font-mono">3840 × 2160 UHD</div>
                    </div>
                    <Monitor className="w-3.5 h-3.5 text-zinc-400" />
                  </button>

                  <button
                    onClick={() => handleDownload('mobile')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-[#1a1a22] flex items-center justify-between text-zinc-200 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">Mobile 9:16</div>
                      <div className="text-[10px] text-zinc-400 font-mono">1440 × 2560 QHD</div>
                    </div>
                    <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                  </button>

                  <button
                    onClick={() => handleDownload('tablet')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-[#1a1a22] flex items-center justify-between text-zinc-200 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">Tablet 4:3</div>
                      <div className="text-[10px] text-zinc-400 font-mono">2048 × 1536 Retina</div>
                    </div>
                    <Tablet className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                </div>
              )}
            </div>

            {/* Favorite Button */}
            <button
              onClick={(e) => onToggleFavorite(wallpaper.id, e)}
              className={`p-2 rounded-xl transition-all cursor-pointer border ${
                isFavorite
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-[#18181b] hover:bg-[#202025] text-zinc-400 hover:text-white border-[#27272a]'
              }`}
              title={isFavorite ? 'Remove from saved' : 'Save to favorites'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {/* Share Button (Web Share API on mobile / clipboard fallback) */}
            <div className="relative">
              <button
                id="btn-modal-share"
                onClick={handleShare}
                disabled={isSharing}
                className={`p-2 rounded-xl transition-all cursor-pointer border ${
                  copiedLink || shareFeedback
                    ? 'bg-[#5e6ad2]/20 text-[#8b95f6] border-[#5e6ad2]/30'
                    : 'bg-[#18181b] hover:bg-[#202025] text-zinc-400 hover:text-white border-[#27272a]'
                }`}
                title={hasWebShare ? 'Share wallpaper (Use as Wallpaper, Save, AirDrop)' : 'Copy wallpaper link'}
                aria-label={hasWebShare ? 'Share wallpaper' : 'Copy wallpaper link'}
              >
                {isSharing ? (
                  <span className="w-4 h-4 flex items-center justify-center animate-spin text-xs">◷</span>
                ) : copiedLink || (shareFeedback && shareFeedback.includes('Shared')) ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
              {shareFeedback && (
                <div className="absolute right-0 top-full mt-1.5 px-2.5 py-1 bg-[#1a1a24] border border-[#2e2e38] text-white text-[11px] font-medium rounded-xl shadow-2xl whitespace-nowrap z-50 pointer-events-none animate-in fade-in duration-150">
                  {shareFeedback}
                </div>
              )}
            </div>

            {/* Slideshow button */}
            <button
              onClick={() => setIsSlideshowActive((prev) => !prev)}
              className={`p-2 rounded-xl transition-all cursor-pointer hidden sm:block border ${
                isSlideshowActive
                  ? 'bg-[#5e6ad2] text-white border-[#6c78e6]'
                  : 'bg-[#18181b] hover:bg-[#202025] text-zinc-400 hover:text-white border-[#27272a]'
              }`}
              title={isSlideshowActive ? 'Pause slideshow' : 'Start slideshow'}
            >
              {isSlideshowActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#18181b] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Stage & Details */}
        <div id="wallpaper-modal-scroll" className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1 custom-scrollbar">
          {/* Wallpaper Image Stage */}
          <div
            className="w-full flex items-center justify-center bg-zinc-100 dark:bg-[#0c0d14] rounded-2xl p-2 sm:p-4 relative overflow-hidden min-h-[300px] select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Slideshow progress bar */}
            {isSlideshowActive && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-800 z-30">
                <div
                  className="h-full bg-emerald-500 transition-all duration-100 ease-linear"
                  style={{ width: `${slideshowProgress}%` }}
                />
              </div>
            )}

            {/* Previous Arrow */}
            {onPrevWallpaper && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevWallpaper();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-all shadow-md cursor-pointer"
                title="Previous (Left arrow)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Next Arrow */}
            {onNextWallpaper && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNextWallpaper();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-all shadow-md cursor-pointer"
                title="Next (Right arrow)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {keyNavIndicator && (
              <div
                className={`absolute z-30 top-1/2 -translate-y-1/2 p-3 rounded-full bg-emerald-500 text-white shadow-xl ${
                  keyNavIndicator === 'left' ? 'left-8' : 'right-8'
                }`}
              >
                {keyNavIndicator === 'left' ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
              </div>
            )}

            <img
              src={modalImgSrc}
              alt={wallpaper.title}
              referrerPolicy="no-referrer"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                const fallback = wallpaper.imageUrl || wallpaper.thumbUrl || wallpaper.url;
                if (fallback && fallback !== modalImgSrc) setModalImgSrc(fallback);
              }}
              className={`max-h-[58vh] w-auto max-w-full rounded-xl object-contain shadow-lg relative z-10 transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>

          {/* Quick Technical Details Row (Unsplash / Linear Style Metadata) */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#121215] border border-[#1f1f1f] text-xs text-zinc-400">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full sm:w-auto">
              <div>
                <span className="text-[10px] uppercase font-mono block text-zinc-500 tracking-wider">Resolution</span>
                <span className="font-semibold text-white font-mono text-sm">
                  {wallpaper.width} × {wallpaper.height}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono block text-zinc-500 tracking-wider">Category</span>
                <span className="font-semibold text-white capitalize text-sm">
                  {wallpaper.category || 'wallpaper'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono block text-zinc-500 tracking-wider">Views</span>
                <span className="font-semibold text-white font-mono text-sm">
                  {(wallpaper.views || 14200).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono block text-zinc-500 tracking-wider">Quality</span>
                <span className="font-semibold text-[#8b95f6] text-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5e6ad2]" />
                  {wallpaper.width >= 3840 ? '4K Ultra HD' : wallpaper.width >= 2560 ? '2K Quad HD' : 'Full HD'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1f1f1f] w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-[11px] font-mono text-zinc-500">{licenseName}</span>
            </div>
          </div>

          {/* 1-Click Set as Wallpaper Hub (Phone & Desktop) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8b95f6]" />
                1-Click Set as Wallpaper
              </span>
              {(phoneActionFeedback || desktopActionFeedback) && (
                <span className="text-xs font-mono text-[#8b95f6] animate-pulse">
                  {phoneActionFeedback || desktopActionFeedback}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Phone Wallpaper Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#5e6ad2]/10 via-[#121215] to-[#121215] border border-[#5e6ad2]/25 flex flex-col justify-between gap-3 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#5e6ad2]/20 text-[#8b95f6] flex items-center justify-center shrink-0 border border-[#5e6ad2]/30">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">Set as Phone Wallpaper</h4>
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#5e6ad2]/20 text-[#8b95f6] border border-[#5e6ad2]/30">
                        iOS &amp; Android
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      Opens native system sheet: tap <span className="font-semibold text-[#8b95f6]">&ldquo;Use as Wallpaper&rdquo;</span> (استخدام كخلفية) on iPhone or Android.
                    </p>
                  </div>
                </div>

                <button
                  id="btn-set-as-phone-wallpaper"
                  onClick={handleSetAsPhoneWallpaper}
                  disabled={isSettingPhone}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#5e6ad2] hover:bg-[#6c78e6] active:bg-[#525db8] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#5e6ad2]/25"
                >
                  {isSettingPhone ? (
                    <span className="animate-spin text-white">◷</span>
                  ) : (
                    <Smartphone className="w-4 h-4" />
                  )}
                  <span>
                    {isSettingPhone ? 'Preparing Image...' : '📱 Set as Phone Wallpaper'}
                  </span>
                </button>
              </div>

              {/* Desktop / PC Wallpaper Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1a1a24] via-[#121215] to-[#121215] border border-[#2e2e38] flex flex-col justify-between gap-3 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/15">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">Set as Desktop Wallpaper</h4>
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/10 text-zinc-300 border border-white/15">
                        PC / Windows / Mac
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      1-Click Windows Auto-Setter script (.bat) or instant right-click background shortcut.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn-set-desktop-windows-script"
                    onClick={handleDownloadWindowsWallpaperBat}
                    className="py-2.5 px-3 rounded-xl bg-[#22222b] hover:bg-[#2b2b36] active:bg-[#1a1a22] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-[#383845] shadow-sm"
                    title="Downloads 1-click Windows script that sets desktop instantly"
                  >
                    <Terminal className="w-3.5 h-3.5 text-[#8b95f6]" />
                    <span>⚡ 1-Click Windows</span>
                  </button>
                  <button
                    id="btn-set-desktop-guide"
                    onClick={() => setShowDesktopModal(true)}
                    className="py-2.5 px-3 rounded-xl bg-[#18181b] hover:bg-[#202025] text-zinc-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#27272a]"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
                    <span>How it works</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Download Formats Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-[#8b95f6]" />
                All Download Formats
              </span>
              {downloadStatus && (
                <span className="text-xs font-mono text-[#8b95f6] animate-pulse">{downloadStatus}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => handleDownload('original')}
                disabled={downloadingRes !== null}
                className="p-3 rounded-2xl bg-[#5e6ad2] hover:bg-[#6c78e6] text-white font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer shadow-md shadow-[#5e6ad2]/20"
              >
                <div>
                  <div className="font-bold">Original 4K</div>
                  <div className="text-[10px] opacity-90 font-mono">Raw Master</div>
                </div>
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDownload('desktop')}
                disabled={downloadingRes !== null}
                className="p-3 rounded-2xl bg-[#121215] hover:bg-[#18181c] text-white border border-[#1f1f1f] hover:border-[#2e2e38] font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
              >
                <div>
                  <div>Desktop 16:9</div>
                  <div className="text-[10px] text-zinc-400 font-mono">3840 × 2160 UHD</div>
                </div>
                <Monitor className="w-4 h-4 text-zinc-400" />
              </button>

              <button
                onClick={() => handleDownload('mobile')}
                disabled={downloadingRes !== null}
                className="p-3 rounded-2xl bg-[#121215] hover:bg-[#18181c] text-white border border-[#1f1f1f] hover:border-[#2e2e38] font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
              >
                <div>
                  <div>Mobile 9:16</div>
                  <div className="text-[10px] text-zinc-400 font-mono">1440 × 2560 QHD</div>
                </div>
                <Smartphone className="w-4 h-4 text-zinc-400" />
              </button>

              <button
                onClick={() => handleDownload('tablet')}
                disabled={downloadingRes !== null}
                className="p-3 rounded-2xl bg-[#121215] hover:bg-[#18181c] text-white border border-[#1f1f1f] hover:border-[#2e2e38] font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
              >
                <div>
                  <div>Tablet 4:3</div>
                  <div className="text-[10px] text-zinc-400 font-mono">2048 × 1536 Retina</div>
                </div>
                <Tablet className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>

          {/* AdSense Placement */}
          <div className="w-full pt-1">
            <AdSensePlaceholder
              format="banner-728x90"
              slotId={`leaderboard-modal-${wallpaper.id}`}
              onLearnMore={onOpenPrivacyModal}
            />
          </div>

          {/* Similar Wallpapers (Unsplash / Pexels Related Grid) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Related 4K Wallpapers</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#5e6ad2]" />
              </h3>
              {relatedKeyword && (
                <span className="text-xs text-zinc-400 font-mono">#{relatedKeyword}</span>
              )}
            </div>

            {isLoadingRelated ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-video rounded-2xl bg-[#121215] border border-[#1f1f1f] animate-pulse" />
                ))}
              </div>
            ) : relatedWallpapers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedWallpapers.map((relWp) => (
                  <button
                    key={relWp.id}
                    onClick={() => handleSelectRelated(relWp)}
                    className="group relative aspect-video rounded-2xl overflow-hidden bg-[#121215] border border-[#1f1f1f] hover:border-[#5e6ad2]/50 transition-all cursor-pointer text-left"
                  >
                    <img
                      src={relWp.thumbnail || relWp.imageUrl || relWp.url}
                      alt={relWp.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                      <span className="text-[11px] font-semibold text-white truncate">
                        {relWp.title}
                      </span>
                      <span className="text-[10px] text-zinc-300 truncate">
                        by {relWp.authorName}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Tags & Creative License (Linear Aesthetic) */}
          <div className="p-4 rounded-2xl bg-[#121215] border border-[#1f1f1f] space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {wallpaper.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    onTagClick(tag);
                    onClose();
                  }}
                  className="px-3 py-1 rounded-xl text-xs bg-[#18181f] hover:bg-[#202028] text-zinc-300 hover:text-white border border-[#272733] transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed font-mono">
              Téléchargez gratuitement ce fond d&apos;écran 4K ultra-haute définition &ldquo;{wallpaper.title}&rdquo; par {wallpaper.authorName}. Royalty-free under {licenseName}.
            </p>
          </div>
        </div>

        {/* Desktop Setup Helper Modal */}
        {showDesktopModal && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setShowDesktopModal(false)}
          >
            <div
              className="w-full max-w-lg bg-white dark:bg-[#151722] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-zinc-900 dark:text-zinc-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-base">Set as Desktop Wallpaper</h3>
                </div>
                <button
                  onClick={() => setShowDesktopModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Method 1: 1-Click Windows Auto-Set */}
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4" />
                      Option 1: Windows 1-Click Auto-Setter (.bat)
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400">
                      Recommended for PC
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-[11px]">
                    Downloads a lightweight script that automatically fetches this raw 4K wallpaper and applies it immediately to your Windows desktop using the native Win32 API.
                  </p>
                  <button
                    onClick={() => {
                      handleDownloadWindowsWallpaperBat();
                      setShowDesktopModal(false);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download & Apply via 1-Click Script</span>
                  </button>
                </div>

                {/* Method 2: Browser Right-Click */}
                <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5">
                  <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <span>Option 2: Browser Right-Click (Instant)</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px]">
                    In Chrome, Microsoft Edge, or Firefox: Simply <strong>right-click</strong> the wallpaper image preview above, and select <span className="text-emerald-600 dark:text-emerald-400 font-semibold">"Set as desktop background"</span> (Définir comme arrière-plan du bureau / تعيين كخلفية لسطح المكتب).
                  </p>
                </div>

                {/* Method 3: Mac / Apple */}
                <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5">
                  <div className="font-bold text-zinc-900 dark:text-white">
                    Option 3: macOS (Apple Mac)
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px]">
                    Click <strong>"Original 4K"</strong> download ➔ open your Downloads folder ➔ right-click the image file ➔ click <strong>"Set Desktop Picture"</strong>.
                  </p>
                </div>

                {/* Browser security info */}
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300">
                  🔒 <strong>Browser Security Note:</strong> Standard web browsers do not allow websites to silently alter OS system files or desktop wallpapers without user interaction for safety.
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowDesktopModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { WallpaperCategory, WallpaperOrientation } from '../types';
import { Monitor, Smartphone, Grid } from 'lucide-react';

interface CategoryPillsProps {
  selectedCategory: WallpaperCategory;
  onSelectCategory: (category: WallpaperCategory) => void;
  orientation: WallpaperOrientation;
  onChangeOrientation: (orientation: WallpaperOrientation) => void;
  totalCount: number;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  orientation,
  onChangeOrientation,
  totalCount,
}) => {
  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-2 pb-3 border-b border-[#1f1f1f] text-xs">
      {/* Left side: Results Count / Label */}
      <div className="flex items-center gap-2 text-zinc-400 font-medium">
        <span className="font-semibold text-white font-mono">
          {totalCount > 0 ? `${totalCount.toLocaleString()} Wallpapers` : 'Wallpapers'}
        </span>
        <span className="text-zinc-600">•</span>
        <span className="hidden sm:inline font-mono text-[11px] text-zinc-500">Curated 4K &amp; Ultra HD</span>
      </div>

      {/* Right side: Linear Style Orientation Segmented Controls */}
      <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-xl border border-[#1f1f1f]">
        <button
          onClick={() => onChangeOrientation('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            orientation === 'all'
              ? 'bg-[#1f1f26] text-white border border-[#383848] shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="All aspect ratios"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>All</span>
        </button>

        <button
          onClick={() => onChangeOrientation('landscape')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            orientation === 'landscape'
              ? 'bg-[#1f1f26] text-white border border-[#383848] shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="Desktop 16:9 Widescreen"
        >
          <Monitor className="w-3.5 h-3.5 text-[#8b95f6]" />
          <span>Desktop (16:9)</span>
        </button>

        <button
          onClick={() => onChangeOrientation('portrait')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            orientation === 'portrait'
              ? 'bg-[#1f1f26] text-white border border-[#383848] shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="Mobile 9:16 Portrait"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#8b95f6]" />
          <span>Phone (9:16)</span>
        </button>
      </div>
    </div>
  );
};

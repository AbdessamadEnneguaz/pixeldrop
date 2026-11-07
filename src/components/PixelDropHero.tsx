import React, { useState } from 'react';
import { Search, X, Sparkles, TrendingUp, SlidersHorizontal } from 'lucide-react';
import { WallpaperCategory } from '../types';

interface PixelDropHeroProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: WallpaperCategory;
  onSelectCategory: (category: WallpaperCategory) => void;
  totalCount: number;
}

// User-specified priority tags + core curated genres
const DYNAMIC_TAGS: {
  id: WallpaperCategory | string;
  label: string;
  queryValue?: string;
  categoryValue?: WallpaperCategory;
}[] = [
  { id: '4k', label: '#4K', queryValue: '4k', categoryValue: 'all' },
  { id: 'cyberpunk', label: '#Cyberpunk', categoryValue: 'cyberpunk' },
  { id: 'minimalist', label: '#Minimalist', categoryValue: 'minimalist' },
  { id: 'nature', label: '#Nature', categoryValue: 'nature' },
  { id: 'anime', label: '#Anime', categoryValue: 'anime' },
  { id: 'abstract', label: '#Abstract', categoryValue: 'abstract' },
  { id: 'amoled', label: '#Dark AMOLED', categoryValue: 'amoled' },
  { id: 'space', label: '#Space', categoryValue: 'space' },
  { id: 'cars', label: '#Cars', categoryValue: 'cars' },
  { id: 'fantasy', label: '#Fantasy', categoryValue: 'fantasy' },
];

export const PixelDropHero: React.FC<PixelDropHeroProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  totalCount,
}) => {
  const [localInput, setLocalInput] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localInput.trim());
  };

  const handleClear = () => {
    setLocalInput('');
    onSearchChange('');
  };

  const handleTagClick = (tag: typeof DYNAMIC_TAGS[0]) => {
    if (tag.queryValue) {
      setLocalInput(tag.queryValue);
      onSearchChange(tag.queryValue);
      if (tag.categoryValue) onSelectCategory(tag.categoryValue);
    } else if (tag.categoryValue) {
      setLocalInput('');
      onSearchChange('');
      onSelectCategory(tag.categoryValue);
    }
  };

  return (
    <section className="relative w-full pt-8 pb-6 select-none overflow-hidden">
      {/* Linear Ambient Glow Light Beam */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-56 pointer-events-none opacity-40 blur-3xl -z-10"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(94, 106, 210, 0.25), transparent 70%)',
        }}
      />

      <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
        {/* Sleek Linear Pill Kicker */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121217] border border-[#272733] text-[11px] font-medium text-zinc-300 shadow-sm shadow-[#5e6ad2]/10 animate-in fade-in duration-300">
          <Sparkles className="w-3.5 h-3.5 text-[#8b95f6]" />
          <span>Curated Ultra-HD Archive · Free Personal &amp; Commercial</span>
        </div>

        {/* Centered High-Contrast Editorial Headline */}
        <div className="space-y-2.5">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Drop into <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#8b95f6]">Stunning 4K</span> Wallpapers
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            The world&apos;s highest fidelity repository for desktop and mobile screens. Over {totalCount > 0 ? totalCount.toLocaleString() : '12,000+'} master raw renders in true 3840×2160 resolution.
          </p>
        </div>

        {/* Pexels Inspired Centered Glowing Search Bar */}
        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
          <div
            className={`relative flex items-center rounded-2xl bg-[#121212] border transition-all duration-300 shadow-2xl ${
              isFocused
                ? 'border-[#5e6ad2] ring-4 ring-[#5e6ad2]/20 shadow-[#5e6ad2]/15'
                : 'border-[#1f1f1f] hover:border-[#2e2e38] shadow-black/80'
            }`}
          >
            <div className="pl-4.5 pr-2 text-zinc-500">
              <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-[#8b95f6]' : 'text-zinc-500'}`} />
            </div>

            <input
              id="hero-search-input"
              type="text"
              placeholder="Search 4K wallpapers by theme, mood, or style (e.g. Cyberpunk, Minimalist)..."
              value={localInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => setLocalInput(e.target.value)}
              className="w-full bg-transparent py-4 text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none font-medium"
            />

            <div className="flex items-center gap-1.5 pr-2.5">
              {localInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1a1a20] transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#5e6ad2] hover:bg-[#6c78e6] active:bg-[#525db8] text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-[#5e6ad2]/25 shrink-0"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {/* Dynamic Tag Pills Below Search Bar */}
        <div className="pt-1 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1 mr-1">
            <TrendingUp className="w-3 h-3 text-zinc-400" />
            Popular:
          </span>
          {DYNAMIC_TAGS.map((tag) => {
            const isActive =
              (tag.queryValue && searchQuery.toLowerCase() === tag.queryValue.toLowerCase()) ||
              (!searchQuery && selectedCategory === tag.categoryValue);

            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagClick(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? 'bg-[#1f1f26] text-white border-[#5e6ad2] shadow-sm shadow-[#5e6ad2]/20 font-semibold'
                    : 'bg-[#121212] hover:bg-[#18181b] text-zinc-400 hover:text-white border-[#1f1f1f] hover:border-[#2e2e38]'
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

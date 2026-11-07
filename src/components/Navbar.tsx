import React, { useState, useEffect } from 'react';
import {
  Search,
  Heart,
  ShieldCheck,
  Code2,
  X,
  Sun,
  Moon,
  Monitor,
  Compass,
  Sparkles,
  Command,
} from 'lucide-react';
import { ThemePreference, ActiveTheme } from '../hooks/useSystemTheme';

interface NavbarProps {
  activeTab: 'wallpapers' | 'favorites';
  setActiveTab: (tab: 'wallpapers' | 'favorites') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  favoritesCount: number;
  onOpenPrivacyModal: () => void;
  onOpenNextjsModal: () => void;
  themePreference?: ThemePreference;
  resolvedTheme?: ActiveTheme;
  onToggleTheme?: () => void;
  onSetThemePreference?: (pref: ThemePreference) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  favoritesCount,
  onOpenPrivacyModal,
  onOpenNextjsModal,
  themePreference = 'dark',
  resolvedTheme = 'dark',
  onToggleTheme,
  onSetThemePreference,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Keyboard shortcut '/' or 'Cmd+K' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        const heroInput = document.getElementById('hero-search-input');
        const navInput = document.getElementById('search-wallpapers-input');
        if (heroInput && window.scrollY < 300) {
          heroInput.focus();
        } else if (navInput) {
          navInput.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header
      id="main-navigation-header"
      className="sticky top-0 z-40 w-full border-b border-[#1f1f1f] bg-[#0a0a0a]/80 backdrop-blur-xl transition-colors duration-200 safe-top"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Linear.app Inspired Brand Lockup */}
        <div
          onClick={() => {
            setActiveTab('wallpapers');
            setSearchQuery('');
          }}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0 select-none"
        >
          {/* Glowing Minimalist Icon Box */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1c1c24] to-[#121217] border border-[#2e2e38] flex items-center justify-center text-[#5e6ad2] shadow-sm shadow-[#5e6ad2]/20 group-hover:border-[#5e6ad2]/60 group-hover:shadow-[#5e6ad2]/30 transition-all">
            <Sparkles className="w-4 h-4 stroke-[2.2] group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
              Pixel<span className="text-[#8b95f6]">Drop</span>
            </span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-[#18181b] text-zinc-400 border border-[#27272a]">
              4K
            </span>
          </div>
        </div>

        {/* Linear Inspired Glowing Navbar Search */}
        <div className="flex-1 max-w-xl hidden md:block">
          <div
            className={`relative flex items-center rounded-xl transition-all duration-200 ${
              isSearchFocused
                ? 'bg-[#121212] ring-2 ring-[#5e6ad2]/40 border border-[#5e6ad2]/60 shadow-lg shadow-[#5e6ad2]/10'
                : 'bg-[#121212]/80 border border-[#1f1f1f] hover:border-[#2e2e38]'
            }`}
          >
            <Search className="w-4 h-4 text-zinc-500 ml-3.5 shrink-0" />
            <input
              id="search-wallpapers-input"
              type="text"
              placeholder="Search 4K wallpapers by keyword, genre, theme..."
              value={searchQuery}
              onFocus={() => {
                setIsSearchFocused(true);
                if (activeTab !== 'wallpapers') setActiveTab('wallpapers');
              }}
              onBlur={() => setIsSearchFocused(false)}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="mr-3 p-1 rounded-md text-zinc-400 hover:text-white transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="mr-3 flex items-center gap-0.5 text-[10px] font-mono text-zinc-500 border border-[#27272a] px-1.5 py-0.5 rounded-md bg-[#18181b]">
                <Command className="w-2.5 h-2.5" />
                <span>K</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Explore / Wallpapers Tab */}
          <button
            id="nav-tab-wallpapers"
            onClick={() => setActiveTab('wallpapers')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'wallpapers'
                ? 'bg-[#1f1f26] text-white border border-[#32323e] shadow-sm shadow-[#5e6ad2]/10'
                : 'text-zinc-400 hover:text-white hover:bg-[#151518]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore</span>
          </button>

          {/* Favorites Tab */}
          <button
            id="nav-tab-favorites"
            onClick={() => setActiveTab('favorites')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all relative cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-[#1f1f26] text-white border border-[#32323e] shadow-sm shadow-rose-500/10'
                : 'text-zinc-400 hover:text-white hover:bg-[#151518]'
            }`}
            title="Saved Wallpapers"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                favoritesCount > 0 ? 'text-rose-500 fill-rose-500' : ''
              }`}
            />
            <span className="hidden sm:inline">Saved</span>
            {favoritesCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500 text-white font-bold">
                {favoritesCount}
              </span>
            )}
          </button>

          <div className="w-px h-4 bg-[#1f1f1f] mx-1 hidden sm:block" />

          {/* Theme Switcher */}
          <div className="relative">
            <button
              id="btn-theme-toggle"
              onClick={() => onToggleTheme?.()}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowThemeMenu((prev) => !prev);
              }}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] transition-all cursor-pointer"
              title={`Theme: ${
                themePreference === 'system'
                  ? 'System'
                  : themePreference === 'dark'
                  ? 'Dark'
                  : 'Light'
              }`}
              aria-label="Toggle dark/light mode"
            >
              {resolvedTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-[#8b95f6]" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {showThemeMenu && (
              <div
                className="absolute right-0 mt-2 w-36 py-1 bg-[#121212] border border-[#1f1f1f] rounded-xl shadow-2xl z-50 text-xs text-zinc-300"
                onMouseLeave={() => setShowThemeMenu(false)}
              >
                <button
                  onClick={() => {
                    onSetThemePreference?.('system');
                    setShowThemeMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#1a1a20] transition-colors"
                >
                  <Monitor className="w-3.5 h-3.5 text-zinc-400" />
                  <span>System (OS)</span>
                </button>
                <button
                  onClick={() => {
                    onSetThemePreference?.('dark');
                    setShowThemeMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#1a1a20] transition-colors"
                >
                  <Moon className="w-3.5 h-3.5 text-[#8b95f6]" />
                  <span>Dark Mode</span>
                </button>
                <button
                  onClick={() => {
                    onSetThemePreference?.('light');
                    setShowThemeMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#1a1a20] transition-colors"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </button>
              </div>
            )}
          </div>

          {/* Architecture Modal Button */}
          <button
            onClick={onOpenNextjsModal}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] transition-all cursor-pointer"
            title="App Architecture & Stack"
          >
            <Code2 className="w-4 h-4" />
          </button>

          {/* Privacy & Legal Button */}
          <button
            onClick={onOpenPrivacyModal}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] transition-all cursor-pointer"
            title="Privacy & Legal"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative flex items-center rounded-xl bg-[#121212] border border-[#1f1f1f]">
          <Search className="w-4 h-4 text-zinc-500 ml-3.5 shrink-0" />
          <input
            type="text"
            placeholder="Search 4K wallpapers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeTab !== 'wallpapers') setActiveTab('wallpapers');
            }}
            className="w-full bg-transparent px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mr-3 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


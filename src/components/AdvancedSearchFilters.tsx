import React, { useState } from 'react';
import {
  Palette,
  Maximize2,
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PexelsColorPalette, PexelsResolutionRange } from '../types';

export interface AdvancedSearchFiltersProps {
  selectedColor: PexelsColorPalette;
  onChangeColor: (color: PexelsColorPalette) => void;
  selectedResolution: PexelsResolutionRange;
  onChangeResolution: (size: PexelsResolutionRange) => void;
  onResetFilters: () => void;
  activeCount: number;
  totalResults?: number;
  isDark?: boolean;
}

export const PEXELS_COLOR_PALETTES: {
  id: string;
  name: string;
  hex: string;
  border?: string;
}[] = [
  { id: 'all', name: 'All Colors', hex: 'transparent' },
  { id: 'red', name: 'Red', hex: '#ef4444' },
  { id: 'orange', name: 'Orange', hex: '#f97316' },
  { id: 'yellow', name: 'Yellow', hex: '#eab308' },
  { id: 'green', name: 'Green', hex: '#22c55e' },
  { id: 'turquoise', name: 'Turquoise', hex: '#06b6d4' },
  { id: 'blue', name: 'Blue', hex: '#3b82f6' },
  { id: 'violet', name: 'Violet', hex: '#8b5cf6' },
  { id: 'pink', name: 'Pink', hex: '#ec4899' },
  { id: 'brown', name: 'Brown', hex: '#78350f' },
  { id: 'black', name: 'Black', hex: '#18181b', border: '#3f3f46' },
  { id: 'gray', name: 'Gray', hex: '#71717a' },
  { id: 'white', name: 'White', hex: '#f4f4f5', border: '#d4d4d8' },
];

export const PEXELS_RESOLUTION_RANGES: {
  id: PexelsResolutionRange;
  label: string;
  badge: string;
}[] = [
  { id: 'all', label: 'All Resolutions', badge: 'Standard' },
  { id: 'large', label: '4K UHD & 8K (≥ 3840×2160)', badge: '4K' },
  { id: 'medium', label: '2K Quad HD (≥ 2560×1440)', badge: '2K' },
  { id: 'small', label: 'Full HD 1080p (≥ 1920×1080)', badge: '1080p' },
];

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  selectedColor,
  onChangeColor,
  selectedResolution,
  onChangeResolution,
  onResetFilters,
  activeCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customHexInput, setCustomHexInput] = useState('');
  const [showCustomHexInput, setShowCustomHexInput] = useState(false);

  const hasActiveFilters = selectedColor !== 'all' || selectedResolution !== 'all';
  const currentColorObj = PEXELS_COLOR_PALETTES.find((c) => c.id === selectedColor);
  const currentResolutionObj = PEXELS_RESOLUTION_RANGES.find((r) => r.id === selectedResolution);

  const handleApplyCustomHex = (e: React.FormEvent) => {
    e.preventDefault();
    let hex = customHexInput.trim();
    if (!hex) return;
    if (!hex.startsWith('#')) hex = `#${hex}`;
    if (/^#[0-9A-Fa-f]{3,6}$/.test(hex)) {
      onChangeColor(hex);
      setCustomHexInput('');
      setShowCustomHexInput(false);
    }
  };

  return (
    <div
      id="advanced-search-filters-container"
      className="w-full text-xs select-none"
    >
      {/* Pexels Style Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer border ${
              isOpen || hasActiveFilters
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-transparent shadow-xs font-semibold'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1a1c24] dark:hover:bg-[#222530] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
            }`}
            aria-expanded={isOpen}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Active Filter Chips */}
          {selectedResolution !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#1a1c24] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-xs">
              <Maximize2 className="w-3 h-3 text-emerald-500" />
              <span>{currentResolutionObj?.label.split(' ')[0]} {currentResolutionObj?.badge}</span>
              <button
                onClick={() => onChangeResolution('all')}
                className="hover:text-rose-500 cursor-pointer ml-0.5"
                title="Remove resolution filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedColor !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#1a1c24] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/20"
                style={{ backgroundColor: currentColorObj?.hex || selectedColor }}
              />
              <span className="capitalize">{currentColorObj?.name || selectedColor}</span>
              <button
                onClick={() => onChangeColor('all')}
                className="hover:text-rose-500 cursor-pointer ml-0.5"
                title="Remove color filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Expanded Linear / Pexels Style Clean Filter Options */}
      {isOpen && (
        <div className="mt-3 p-4 rounded-2xl bg-[#121215] border border-[#1f1f1f] space-y-4 animate-in fade-in duration-150 shadow-2xl">
          {/* Resolution Options */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-white flex items-center gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
              <Maximize2 className="w-3.5 h-3.5 text-[#8b95f6]" />
              <span>Resolution Quality</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PEXELS_RESOLUTION_RANGES.map((res) => {
                const isSelected = selectedResolution === res.id;
                return (
                  <button
                    key={res.id}
                    onClick={() => onChangeResolution(res.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#1f1f26] text-white border-[#5e6ad2] shadow-sm shadow-[#5e6ad2]/20 font-semibold'
                        : 'bg-[#18181b] text-zinc-300 border-[#27272a] hover:border-[#383840] hover:text-white'
                    }`}
                  >
                    {res.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Palette Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
                <Palette className="w-3.5 h-3.5 text-[#8b95f6]" />
                <span>Color Palette</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomHexInput(!showCustomHexInput)}
                className="text-[11px] text-[#8b95f6] hover:underline cursor-pointer"
              >
                {showCustomHexInput ? 'Hide Custom Hex' : '+ Custom Hex'}
              </button>
            </div>

            {showCustomHexInput && (
              <form onSubmit={handleApplyCustomHex} className="flex items-center gap-2 pb-1">
                <input
                  type="text"
                  placeholder="#5e6ad2"
                  value={customHexInput}
                  onChange={(e) => setCustomHexInput(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white font-mono w-28 focus:outline-none focus:border-[#5e6ad2]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[#5e6ad2] text-white font-medium text-xs cursor-pointer hover:bg-[#6c78e6]"
                >
                  Apply
                </button>
              </form>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {PEXELS_COLOR_PALETTES.map((color) => {
                const isSelected = selectedColor === color.id;
                return (
                  <button
                    key={color.id}
                    onClick={() => onChangeColor(color.id as PexelsColorPalette)}
                    className={`relative w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                      isSelected ? 'ring-2 ring-[#5e6ad2] ring-offset-2 ring-offset-[#121215]' : ''
                    }`}
                    style={{
                      backgroundColor: color.id === 'all' ? '#a1a1aa' : color.hex,
                      border: color.border ? `1px solid ${color.border}` : '1px solid rgba(255,255,255,0.15)',
                    }}
                    title={color.name}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3 h-3 ${
                          color.id === 'white' || color.id === 'yellow' ? 'text-black' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { ShieldCheck, Heart, Sparkles, Mail, FileText, Scale, DownloadCloud } from 'lucide-react';
import { WallpaperCategory } from '../types';

export type LegalTab = 'privacy' | 'terms' | 'dmca' | 'contact';

interface FooterProps {
  onSelectCategory?: (category: WallpaperCategory) => void;
  onOpenFavorites?: () => void;
  onOpenLegal?: (tab: LegalTab) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenFavorites,
  onOpenLegal,
}) => {
  const currentYear = new Date().getFullYear();

  const handleLegalClick = (tab: LegalTab, fallbackHref: string) => {
    if (onOpenLegal) {
      onOpenLegal(tab);
    } else {
      window.location.href = fallbackHref;
    }
  };

  return (
    <footer
      id="global-footer"
      className="w-full mt-16 border-t border-zinc-200 dark:border-[#1f1f1f] bg-zinc-100 dark:bg-[#0c0c0e] text-zinc-600 dark:text-zinc-400 text-xs relative z-10 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Mission */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#5e6ad2] flex items-center justify-center text-white shadow-xs">
                <DownloadCloud className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="font-bold text-zinc-900 dark:text-white text-base tracking-tight font-['Inter',system-ui,sans-serif]">
                Pixel<span className="text-[#8b95f6]">Drop</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              High quality 4K and Ultra HD wallpapers for desktop, phone and tablet. Download royalty-free backgrounds created by global artists.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-[#141418] dark:border dark:border-[#1f1f1f] text-zinc-800 dark:text-zinc-200 font-semibold">
                Ultra HD 4K
              </span>
              <span className="px-2 py-0.5 rounded bg-[#5e6ad2]/15 text-[#8b95f6] font-semibold border border-[#5e6ad2]/20">
                100% Free
              </span>
            </div>
          </div>

          {/* Col 2: Popular Categories */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-white text-xs mb-3 uppercase tracking-wider">
              Popular Wallpapers
            </h4>
            <ul className="space-y-2 text-[11px]">
              {['nature', 'amoled', 'anime', 'cars', 'space', 'minimalist'].map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => onSelectCategory?.(cat as WallpaperCategory)}
                    className="hover:text-[#5e6ad2] dark:hover:text-[#8b95f6] transition-colors cursor-pointer capitalize"
                  >
                    {cat === 'amoled' ? 'Dark & AMOLED' : `${cat} Wallpapers`}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Explore & Saved */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-white text-xs mb-3 uppercase tracking-wider">
              Explore
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button
                  onClick={() => onSelectCategory?.('trending')}
                  className="hover:text-[#5e6ad2] dark:hover:text-[#8b95f6] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-[#8b95f6]" />
                  Trending Wallpapers
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenFavorites?.()}
                  className="hover:text-[#5e6ad2] dark:hover:text-[#8b95f6] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Heart className="w-3 h-3 text-rose-500" />
                  Saved Wallpapers
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLegalClick('contact', '/contact')}
                  className="hover:text-[#5e6ad2] dark:hover:text-[#8b95f6] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Mail className="w-3 h-3 text-[#8b95f6]" />
                  Contact &amp; Submit
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Policies */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-white text-xs mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8b95f6]" />
              Legal &amp; Policy
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button
                  onClick={() => handleLegalClick('privacy', '/privacy')}
                  className="hover:text-[#5e6ad2] dark:hover:text-[#8b95f6] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <FileText className="w-3 h-3 text-zinc-400" />
                  Privacy Policy (GDPR / CCPA)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLegalClick('terms', '/terms')}
                  className="hover:text-[#5e6ad2] dark:hover:text-[#8b95f6] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Scale className="w-3 h-3 text-zinc-400" />
                  Terms of Service &amp; License
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLegalClick('dmca', '/dmca')}
                  className="hover:text-[#5e6ad2] dark:hover:text-[#8b95f6] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ShieldCheck className="w-3 h-3 text-rose-500" />
                  DMCA Copyright
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-zinc-200 dark:border-[#1f1f1f] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p>© {currentYear} PixelDrop. Free 4K wallpapers for personal use.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => handleLegalClick('privacy', '/privacy')} className="hover:underline">
              Privacy
            </button>
            <span>•</span>
            <button onClick={() => handleLegalClick('terms', '/terms')} className="hover:underline">
              Terms
            </button>
            <span>•</span>
            <button onClick={() => handleLegalClick('dmca', '/dmca')} className="hover:underline">
              DMCA
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

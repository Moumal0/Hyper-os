import React, { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { AppInfo, LauncherSettings } from '../types';
import { INITIAL_APPS } from '../data';
import { toArabicNumerals } from '../utils/calendar';

interface AppDrawerProps {
  settings: LauncherSettings;
  isOpen: boolean;
  onClose: () => void;
  onLaunchApp: (appId: string) => void;
  onAddWidgetFromApp: (appId: string) => void;
  favorites: string[];
  toggleFavorite: (appId: string) => void;
  installedApps: AppInfo[];
  uninstallApp: (appId: string) => void;
}

// Icon mapper to resolve string names safely
export function AppIcon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  const IconComp = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComp size={size} className={className} />;
}

export default function AppDrawer({
  settings,
  isOpen,
  onClose,
  onLaunchApp,
  onAddWidgetFromApp,
  favorites,
  toggleFavorite,
  installedApps,
  uninstallApp
}: AppDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardLang, setKeyboardLang] = useState<'ar' | 'en'>(settings.language);
  const [activeLongPressApp, setActiveLongPressApp] = useState<string | null>(null);

  const isRTL = settings.language === 'ar';
  const showArabic = settings.language === 'ar' && settings.useArabicNumerals;

  // Track recent apps in memory (simulated)
  const [recentAppIds, setRecentAppIds] = useState<string[]>(['terminal', 'browser', 'settings']);

  // Fuzzy Arabic letter normalizer to match e.g. "أ", "إ", "آ" with "ا"
  const normalizeArabic = (str: string) => {
    return str
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .toLowerCase();
  };

  const filteredApps = useMemo(() => {
    const query = normalizeArabic(searchQuery.trim());
    if (!query) {
      // Return alphabetically sorted apps
      return [...installedApps].sort((a, b) => {
        const nameA = isRTL ? a.nameAr : a.nameEn;
        const nameB = isRTL ? b.nameAr : b.nameEn;
        return nameA.localeCompare(nameB, isRTL ? 'ar' : 'en');
      });
    }

    return installedApps.filter(app => {
      const matchAr = normalizeArabic(app.nameAr).includes(query);
      const matchEn = normalizeArabic(app.nameEn).includes(query);
      const matchCat = normalizeArabic(app.category).includes(query);
      return matchAr || matchEn || matchCat;
    });
  }, [installedApps, searchQuery, isRTL]);

  // Keyboard layout rows
  const arKeys = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
    ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
    ['ذ', 'ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ']
  ];

  const enKeys = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  const handleKeyPress = (char: string) => {
    setSearchQuery(prev => prev + char);
  };

  const handleBackspace = () => {
    setSearchQuery(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setSearchQuery('');
  };

  const handleAppLaunch = (appId: string) => {
    // Add to recents
    setRecentAppIds(prev => {
      const filtered = prev.filter(id => id !== appId);
      return [appId, ...filtered].slice(0, 4);
    });
    onLaunchApp(appId);
    onClose();
  };

  const handleAppLongPress = (e: React.MouseEvent, appId: string) => {
    e.preventDefault();
    setActiveLongPressApp(appId === activeLongPressApp ? null : appId);
  };

  if (!isOpen) return null;

  return (
    <div 
      id="app-drawer-overlay"
      className="absolute inset-0 bg-black/40 z-30 flex items-center justify-center p-4 animate-fade-in"
      onClick={() => {
        onClose();
        setActiveLongPressApp(null);
      }}
    >
      {/* Floating Centered Window Drawer */}
      <div 
        id="app-drawer-popup"
        className="w-[90%] h-[72%] max-w-[340px] bg-neutral-900/95 border border-white/10 rounded-[28px] overflow-hidden flex flex-col shadow-hypr blur-backdrop-m animate-pop-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 0 1px ${settings.accentColor}30`,
          borderRadius: `${settings.borderRadius}px`
        }}
      >
        {/* Notch indicator for drag down to close */}
        <div 
          onClick={onClose}
          className="w-full flex justify-center py-2 shrink-0 cursor-pointer hover:bg-white/5 transition"
        >
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Top: Instant Search Panel */}
        <div className="px-4 pt-1 pb-2 shrink-0 space-y-2">
          <div className="relative">
            <input 
              id="app-search-input"
              type="text"
              placeholder={isRTL ? 'ابحث عن تطبيق...' : 'Search apps...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowKeyboard(true)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 pl-8 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition font-sans text-center"
            />
            <div className="absolute left-2.5 top-2.5 text-gray-400">
              <Icons.Search size={14} />
            </div>
            {searchQuery && (
              <button 
                id="search-clear-btn"
                onClick={handleClear}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-white"
              >
                <Icons.X size={14} />
              </button>
            )}
          </div>

          {/* Keyboard Layout Toggle */}
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] text-gray-500 font-semibold uppercase">
              {isRTL ? 'لوحة المفاتيح' : 'Virtual Keyboard'}
            </span>
            <div className="flex gap-2">
              <button 
                id="kbd-toggle-lang"
                onClick={() => setKeyboardLang(prev => prev === 'ar' ? 'en' : 'ar')}
                className="text-[9px] bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-2 py-0.5 rounded-full"
              >
                {keyboardLang === 'ar' ? 'EN' : 'عربي'}
              </button>
              <button 
                id="kbd-toggle-visibility"
                onClick={() => setShowKeyboard(!showKeyboard)}
                className="text-[9px] bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-2 py-0.5 rounded-full"
              >
                {showKeyboard ? (isRTL ? 'إخفاء' : 'Hide') : (isRTL ? 'إظهار' : 'Show')}
              </button>
            </div>
          </div>
        </div>

        {/* Content scrolling list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          
          {/* Virtual On-screen Keyboard Overlay if focused */}
          {showKeyboard && (
            <div className="p-1.5 bg-black/40 rounded-xl border border-white/5 space-y-1 animate-fade-in font-sans">
              {(keyboardLang === 'ar' ? arKeys : enKeys).map((row, rIdx) => (
                <div key={rIdx} className="flex justify-center gap-0.5">
                  {row.map((char) => (
                    <button
                      key={char}
                      onClick={() => handleKeyPress(char)}
                      className="px-1.5 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-gray-200 rounded min-w-[22px] transition active:scale-95 text-center shrink-0"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              ))}
              <div className="flex justify-center gap-1.5 mt-1.5">
                <button
                  id="kbd-btn-space"
                  onClick={() => handleKeyPress(' ')}
                  className="px-6 py-1 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded text-center font-medium flex-1"
                >
                  {isRTL ? 'مسافة' : 'Space'}
                </button>
                <button
                  id="kbd-btn-bksp"
                  onClick={handleBackspace}
                  className="px-3 py-1 text-[10px] bg-red-950/40 hover:bg-red-950/60 text-red-300 rounded font-medium border border-red-900/30 font-sans"
                >
                  {isRTL ? 'حذف' : 'Del'}
                </button>
              </div>
            </div>
          )}

          {/* Recent Apps Rack */}
          {!searchQuery && recentAppIds.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-blue-400 font-bold tracking-wider px-1 inline-block">
                ⭐️ {isRTL ? 'مستخدم مؤخراً' : 'Recents'}
              </span>
              <div className="grid grid-cols-4 gap-2 bg-white/5 p-2 rounded-2xl border border-white/5">
                {recentAppIds.map(id => {
                  const app = installedApps.find(a => a.id === id);
                  if (!app) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => handleAppLaunch(id)}
                      onContextMenu={(e) => handleAppLongPress(e, id)}
                      className="flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-white/5 text-center group active:scale-95 transition"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-neutral-800 to-neutral-700 text-gray-100 flex items-center justify-center shadow border border-white/5 group-hover:scale-110 transition duration-300">
                        <AppIcon name={app.icon} size={20} />
                      </div>
                      <span className="text-[9px] mt-1 text-gray-300 truncate max-w-full font-medium">
                        {isRTL ? app.nameAr : app.nameEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full Sorted App Grid */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-gray-400 font-bold px-1 inline-block">
              📱 {isRTL ? 'كل التطبيقات' : 'All Applications'} ({toArabicNumerals(filteredApps.length, showArabic)})
            </span>
            <div className="grid grid-cols-4 gap-x-2 gap-y-3">
              {filteredApps.map(app => {
                const isFav = favorites.includes(app.id);
                const hasCtx = activeLongPressApp === app.id;

                return (
                  <div key={app.id} className="relative">
                    <button
                      onClick={() => handleAppLaunch(app.id)}
                      onContextMenu={(e) => handleAppLongPress(e, app.id)}
                      className="w-full flex flex-col items-center justify-center p-1 rounded-xl hover:bg-white/5 text-center group active:scale-95 transition relative"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-neutral-800 border border-white/10 text-gray-100 flex items-center justify-center shadow-md relative group-hover:-translate-y-0.5 transition duration-300">
                        <AppIcon name={app.icon} size={22} />
                        {isFav && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center border border-neutral-900">
                            <Icons.Star size={7} className="text-black fill-black" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] mt-1 text-gray-300 truncate w-full font-sans tracking-tight">
                        {isRTL ? app.nameAr : app.nameEn}
                      </span>
                    </button>

                    {/* Long Press context item popup */}
                    {hasCtx && (
                      <div 
                        className="absolute z-50 left-1/2 transform -translate-x-1/2 bottom-12 w-40 bg-zinc-950 border border-white/15 p-1 rounded-xl shadow-hypr animate-fade-in text-[10px] font-sans"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Toggle Favorite */}
                        <button
                          onClick={() => { toggleFavorite(app.id); setActiveLongPressApp(null); }}
                          className="w-full text-left px-2 border-b border-white/5 text-gray-300 flex items-center justify-between py-1.5 rounded hover:bg-white/5 "
                          dir={isRTL ? 'rtl' : 'ltr'}
                        >
                          <span>{isFav ? (isRTL ? 'إزالة المفضلة' : 'Unstar') : (isRTL ? 'إضافة للمفضلة' : 'Favorite')}</span>
                          <Icons.Star size={10} className={isFav ? "fill-yellow-500 text-yellow-500" : ""} />
                        </button>

                        {/* Create Shortcut Widget */}
                        <button
                          onClick={() => { onAddWidgetFromApp(app.id); setActiveLongPressApp(null); }}
                          className="w-full text-left px-2 border-b border-white/5 text-gray-300 flex items-center justify-between py-1.5 rounded hover:bg-white/5"
                          dir={isRTL ? 'rtl' : 'ltr'}
                        >
                          <span>{isRTL ? 'وضع على الشاشة' : 'Add Shortcut'}</span>
                          <Icons.LayoutGrid size={10} />
                        </button>

                        {/* Uninstall app if user-installed */}
                        {['terminal', 'settings', 'files'].includes(app.id) ? (
                          <div className="w-full px-2 py-1.5 text-gray-500 italic text-[8px]" dir={isRTL ? 'rtl' : 'ltr'}>
                            {isRTL ? 'تطبيق محمي بالنظام' : 'System protected'}
                          </div>
                        ) : (
                          <button
                            onClick={() => { uninstallApp(app.id); setActiveLongPressApp(null); }}
                            className="w-full text-left px-2 text-rose-400 font-semibold flex items-center justify-between py-1.5 rounded hover:bg-rose-500/10"
                            dir={isRTL ? 'rtl' : 'ltr'}
                          >
                            <span>{isRTL ? 'إلغاء التثبيت' : 'Uninstall'}</span>
                            <Icons.Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { WidgetInstance, LauncherSettings, WidgetType, TerminalNote } from '../types';
import { toArabicNumerals, getPrayerTimesForCity, getNextPrayer } from '../utils/calendar';

interface WidgetContainerProps {
  settings: LauncherSettings;
  widgets: WidgetInstance[];
  setWidgets: React.Dispatch<React.SetStateAction<WidgetInstance[]>>;
  notes: TerminalNote[];
  onOpenNotes: () => void;
  onOpenSettings: () => void;
  onOpenApp: (appId: string) => void;
  desktopPage: number;
  setDesktopPage: React.Dispatch<React.SetStateAction<number>>;
}

export default function WidgetContainer({
  settings,
  widgets,
  setWidgets,
  notes,
  onOpenNotes,
  onOpenSettings,
  onOpenApp,
  desktopPage,
  setDesktopPage
}: WidgetContainerProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeEditorId, setActiveEditorId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Snapping alignment guides state
  const [snapGuides, setSnapGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });

  const isRTL = settings.language === 'ar';
  const showAr = settings.language === 'ar' && settings.useArabicNumerals;

  // Track system monitor CPU & RAM live ticks
  const [sysStats, setSysStats] = useState({ cpu: 42, ram: 58 });

  useEffect(() => {
    const timer = setInterval(() => {
      setSysStats({
        cpu: Math.floor(25 + Math.random() * 40),
        ram: Math.floor(50 + Math.random() * 12)
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Widget dragging handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, widgetId: string) => {
    e.stopPropagation();
    setActiveEditorId(null);
    const win = widgets.find(w => w.id === widgetId);
    if (!win) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragOffset.current = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    setActiveDragId(widgetId);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!activeDragId || !containerRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Calculate raw local coordinates inside container
      const localX = clientX - containerRect.left - dragOffset.current.x;
      const localY = clientY - containerRect.top - dragOffset.current.y;

      let pctX = (localX / containerRect.width) * 100;
      let pctY = (localY / containerRect.height) * 100;

      // Snapping guide highlights (edges and centers)
      let guideX: number | null = null;
      let guideY: number | null = null;

      // Snap left vertical
      if (pctX < 6) { pctX = 5; guideX = 5; }
      // Snap center vertical
      else if (Math.abs(pctX - 35) < 3.5) { pctX = 35; guideX = 35; }
      // Snap right vertical
      else if (Math.abs(pctX - 65) < 4) { pctX = 64; guideX = 64; }

      // Snap top horizontal
      if (pctY < 8) { pctY = 6; guideY = 6; }
      // Snap center horizontal
      else if (Math.abs(pctY - 45) < 4) { pctY = 45; guideY = 45; }

      // Boundary limits
      pctX = Math.max(1, Math.min(70, pctX));
      pctY = Math.max(1, Math.min(80, pctY));

      setSnapGuides({ x: guideX, y: guideY });

      setWidgets(prev => prev.map(w => {
        if (w.id === activeDragId) {
          return { ...w, x: pctX, y: pctY };
        }
        return w;
      }));
    };

    const handleEnd = () => {
      setActiveDragId(null);
      setSnapGuides({ x: null, y: null });
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [activeDragId]);

  // Adjust specific properties
  const updateWidgetProp = (id: string, field: keyof any, val: any) => {
    setWidgets(prev => prev.map(w => {
      if (w.id === id) {
        return { ...w, [field]: val };
      }
      return w;
    }));
  };

  const handleDeleteWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    setActiveEditorId(null);
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-5 select-none overflow-hidden"
    >
      {/* SNAPPING RED DOTTED GUIDELINE HIGHLIGHTS */}
      {snapGuides.x !== null && (
        <div 
          className="absolute inset-y-0 border-l border-dashed border-red-500/50 z-45"
          style={{ left: `${snapGuides.x}%` }}
        />
      )}
      {snapGuides.y !== null && (
        <div 
          className="absolute inset-x-0 border-t border-dashed border-red-500/50 z-45"
          style={{ top: `${snapGuides.y}%` }}
        />
      )}

      {/* RENDER CURRENT DESKTOP WIDGET INSTANCES */}
      {widgets.map(w => {
        const isEditing = activeEditorId === w.id;
        
        let shadowClass = '';
        if (w.shadowIntensity === 'low') shadowClass = 'shadow-md';
        else if (w.shadowIntensity === 'medium') shadowClass = 'shadow-lg';
        else if (w.shadowIntensity === 'high') shadowClass = 'shadow-hypr';

        return (
          <div
            key={w.id}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setActiveEditorId(isEditing ? null : w.id); }}
            className={`absolute flex flex-col p-4 transition-all duration-300 pointer-events-auto group ${shadowClass}`}
            style={{
              left: `${w.x}%`,
              top: `${w.y}%`,
              width: `${w.w}px`,
              minHeight: `${w.h}px`,
              borderRadius: `${w.borderRadius}px`,
              backgroundColor: `rgba(15, 17, 20, ${(w.opacity / 100) * 0.75})`,
              backdropFilter: w.blur ? `blur(${settings.blurIntensity}px)` : 'none',
              border: `1.2px solid ${isEditing ? settings.accentColor : 'rgba(255,255,255,0.09)'}`,
              zIndex: isEditing ? 30 : 10,
              boxShadow: isEditing 
                ? `0 0 20px rgba(6, 182, 212, 0.25)` 
                : w.shadowIntensity === 'high' 
                ? '0 10px 30px rgba(0, 0, 0, 0.55)' 
                : '0 4px 12px rgba(0, 0, 0, 0.45)'
            }}
          >
            {/* Widget Drag Handle & Option button */}
            <div 
              onMouseDown={(e) => handleDragStart(e, w.id)}
              onTouchStart={(e) => handleDragStart(e, w.id)}
              className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 flex gap-1 z-25 cursor-grab active:cursor-grabbing transition duration-200"
            >
              <button 
                id={`edit-widget-${w.id}`}
                onClick={(e) => { e.stopPropagation(); setActiveEditorId(isEditing ? null : w.id); }}
                className="p-1 bg-black/60 rounded text-gray-300 hover:text-white" 
                title="Edit properties"
              >
                <Icons.Sliders size={8} />
              </button>
              <button 
                id={`del-widget-${w.id}`}
                onClick={(e) => { e.stopPropagation(); handleDeleteWidget(w.id); }}
                className="p-1 bg-red-950/80 rounded text-red-400 hover:text-red-300"
                title="Delete widget"
              >
                <Icons.Trash size={8} />
              </button>
            </div>

            {/* LIVE CONTENT INNER ROUTER */}
            <div className="flex-1 overflow-hidden pointer-events-auto">
              <WidgetContentResolver 
                w={w} 
                settings={settings} 
                notes={notes} 
                sysStats={sysStats}
                onOpenNotes={onOpenNotes}
                onOpenSettings={onOpenSettings}
                onOpenApp={onOpenApp}
              />
            </div>

            {/* WIDGET EDITOR CONTEXT BAR */}
            {isEditing && (
              <div 
                className="absolute z-50 -bottom-24 left-1/2 transform -translate-x-1/2 w-[220px] bg-neutral-900 border border-white/10 p-2 rounded-xl text-[8px] space-y-1.5 shadow-xl font-sans"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center text-gray-400 font-bold uppercase tracking-wide border-b border-white/5 pb-1 select-none">
                  <span>{isRTL ? 'تخصيص الأدوات' : 'Edit Widget'}</span>
                  <button onClick={() => setActiveEditorId(null)} className="text-red-400"><Icons.X size={9} /></button>
                </div>

                {/* Opacity slider */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-gray-400">
                    <span>{isRTL ? 'الشفافية:' : 'Transparency:'}</span>
                    <span>{toArabicNumerals(w.opacity, showAr)}%</span>
                  </div>
                  <input 
                    type="range" min="20" max="100" value={w.opacity}
                    onChange={(e) => updateWidgetProp(w.id, 'opacity', Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-blue-400"
                  />
                </div>

                {/* Rounded border-radius slider */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-gray-400">
                    <span>{isRTL ? 'الانحناء:' : 'Bevel borders:'}</span>
                    <span>{toArabicNumerals(w.borderRadius, showAr)}px</span>
                  </div>
                  <input 
                    type="range" min="0" max="32" value={w.borderRadius}
                    onChange={(e) => updateWidgetProp(w.id, 'borderRadius', Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-blue-400"
                  />
                </div>

                {/* Sizing helpers */}
                <div className="flex gap-2">
                  <button
                    onClick={() => updateWidgetProp(w.id, 'w', Math.max(160, w.w - 15))}
                    className="flex-1 py-0.5 bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 rounded text-center transition"
                  >
                    ◀ -
                  </button>
                  <button
                    onClick={() => updateWidgetProp(w.id, 'w', Math.min(300, w.w + 15))}
                    className="flex-1 py-0.5 bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 rounded text-center transition"
                  >
                    + ▶
                  </button>
                  <button
                    onClick={() => updateWidgetProp(w.id, 'blur', !w.blur)}
                    className={`flex-1 py-0.5 border text-center rounded transition ${w.blur ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-white/5 border-transparent text-gray-400'}`}
                  >
                    {isRTL ? 'تغبيش' : 'Blur'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// WIDGET CONTENT DESIGN FACTORY
// ============================================
interface ContentResolverProps {
  w: WidgetInstance;
  settings: LauncherSettings;
  notes: TerminalNote[];
  sysStats: { cpu: number; ram: number };
  onOpenNotes: () => void;
  onOpenSettings: () => void;
  onOpenApp: (appId: string) => void;
}

function WidgetContentResolver({ w, settings, notes, sysStats, onOpenNotes, onOpenSettings, onOpenApp }: ContentResolverProps) {
  const isRTL = settings.language === 'ar';
  const showAr = settings.language === 'ar' && settings.useArabicNumerals;

  // 1. Clock timer
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  switch (w.type) {
    case 'clock':
      return (
        <div className="w-full h-full flex flex-col justify-center items-center text-center font-sans py-1">
          <div className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-300 to-indigo-200 bg-clip-text text-transparent font-mono mb-1">
            {toArabicNumerals(time.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), showAr)}
          </div>
          <div className="text-[10px] text-gray-400 font-medium">
            ⌛ {toArabicNumerals(time.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour12: false, second: '2-digit' }), showAr)} {isRTL ? 'ثانية' : 'sec'}
          </div>
        </div>
      );

    case 'calendar':
      return (
        <div className="w-full h-full font-sans text-xs space-y-1 py-1 text-center">
          <div className="text-blue-400 font-bold border-b border-white/5 pb-1 flex items-center justify-center gap-1">
            <Icons.Calendar size={11} />
            <span>{isRTL ? 'التقويم المنسق' : 'Dual Calendar'}</span>
          </div>
          <div className="text-[10.5px] text-gray-200 mt-1">{time.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <div className="text-[9.5px] text-emerald-400 font-semibold">
            🌙 {time.toLocaleDateString(isRTL ? 'ar-SA-u-ca-islamic-umalqura-nu-arab' : 'en-US-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      );

    case 'prayer': {
      const city = 'riyadh';
      const times = getPrayerTimesForCity(city);
      const currentTimeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
      const { prayer, countdown } = getNextPrayer(times, currentTimeStr);
      
      return (
        <div className="w-full h-full font-sans text-xs space-y-2 py-1 text-center">
          <div className="text-cyan-400 font-bold border-b border-white/5 pb-1 flex items-center justify-center gap-1.5">
            <Icons.Compass size={11} className="animate-spin-slow text-cyan-400" />
            <span>{isRTL ? 'مواقيت الصلاة - الرياض' : 'Riyadh Prayers'}</span>
          </div>

          <div className="grid grid-cols-5 gap-1 text-[8.5px] px-1 font-semibold text-gray-400">
            {times.map(t => {
              const isMatch = t.nameEn === prayer.nameEn;
              return (
                <div key={t.nameEn} className={`p-1 rounded-lg transition duration-200 ${isMatch ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/25 shadow-[0_0_8px_rgba(6,182,212,0.15)]' : 'bg-black/10 text-gray-400'}`}>
                  <div>{isRTL ? t.nameAr : t.nameEn}</div>
                  <div className="font-mono mt-0.5 text-[8.5px] text-gray-300">{toArabicNumerals(t.time, showAr)}</div>
                </div>
              );
            })}
          </div>

          <div className="text-[9.5px] text-gray-300 font-semibold bg-white/5 py-1 rounded-xl border border-white/5 mt-1">
            {isRTL ? 'الصلاة القادمة:' : 'Next Salat: '} 
            <span className="text-cyan-300 font-bold drop-shadow-[0_0_4px_rgba(6,182,212,0.3)]"> {isRTL ? prayer.nameAr : prayer.nameEn} </span> 
            <span className="text-[8.5px] text-gray-400 ml-1">({toArabicNumerals(countdown, showAr)})</span>
          </div>
        </div>
      );
    }

    case 'weather':
      return (
        <div className="w-full h-full font-sans flex items-center justify-between px-2 py-1 text-center">
          <div className="space-y-0.5 text-left">
            <div className="text-[12px] font-bold text-gray-200">{isRTL ? 'الرياض' : 'Riyadh'}</div>
            <div className="text-[9px] text-gray-400">{isRTL ? 'مشمس وغائم جزئياً' : 'Partly Sunny'}</div>
          </div>
          <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-xl border border-white/5">
            <Icons.CloudSun size={20} className="text-yellow-400" />
            <span className="text-sm font-extrabold font-mono text-white">
              {toArabicNumerals('34', showAr)}°C
            </span>
          </div>
        </div>
      );

    case 'music':
      return (
        <div className="w-full h-full font-sans flex items-center gap-3.5 py-1 px-1">
          <button 
            id="widget-music-btn"
            onClick={() => onOpenApp('music')}
            className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 hover:scale-105 transition"
          >
            <Icons.Music size={15} className="animate-bounce" />
          </button>
          
          <div className="text-left select-none overflow-hidden flex-1 space-y-0.5">
            <h5 className="text-[10px] font-bold text-gray-200 truncate">{isRTL ? 'ألحان الغسق واللوفاي' : 'Sunset Lofi Arab Beats'}</h5>
            <p className="text-[8px] text-gray-500 font-semibold">{isRTL ? 'مشغل الموسيقى' : 'Chill Sounds'}</p>
          </div>
        </div>
      );

    case 'sysmon':
      return (
        <div className="w-full h-full font-sans space-y-3.5 py-1 text-left px-1">
          <div className="text-cyan-400 text-[10px] font-bold border-b border-white/5 pb-1 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Icons.Cpu size={11} className="text-cyan-400" />
              <span>{isRTL ? 'أداء النظام' : 'Hardware Performance'}</span>
            </div>
            <span className="text-[7.5px] font-mono opacity-50 uppercase">v1.1</span>
          </div>

          <div className="space-y-3 pt-0.5 font-sans">
            {/* CPU */}
            <div className="relative">
              <div className="flex justify-between text-[9.5px] mb-1 font-semibold">
                <span className="text-gray-300">{isRTL ? 'المعالج' : 'CPU Core'}</span>
                <span className="text-cyan-400 font-mono font-bold">{toArabicNumerals(sysStats.cpu, showAr)}%</span>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-cyan-400 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(6,182,212,0.4)]" style={{ width: `${sysStats.cpu}%` }}></div>
              </div>
            </div>
            
            {/* RAM */}
            <div className="relative">
              <div className="flex justify-between text-[9.5px] mb-1 font-semibold">
                <span className="text-gray-300">{isRTL ? 'الذاكرة العشوائية' : 'System RAM'}</span>
                <span className="text-purple-400 font-mono font-bold">{toArabicNumerals(sysStats.ram, showAr)}%</span>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-purple-400 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(168,85,247,0.4)]" style={{ width: `${sysStats.ram}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'notes': {
      const latestNote = notes.length > 0 ? notes[0] : null;
      return (
        <div className="w-full h-full font-sans space-y-1.5 py-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-teal-400 border-b border-white/5 pb-1">
            <div className="flex items-center gap-1">
              <Icons.FileText size={11} />
              <span>{isRTL ? 'مفكرة مسودة النظام' : 'Launcher Draft Pad'}</span>
            </div>
            <button id="widget-notes-expand" onClick={onOpenNotes} className="text-gray-500 text-[8px] hover:text-white">✙ Expand</button>
          </div>

          {latestNote ? (
            <div className="space-y-1 cursor-pointer" onClick={onOpenNotes}>
              <div className="text-[9px] font-bold text-gray-300 truncate">{latestNote.title}</div>
              <div className="text-[8px] text-gray-500 truncate max-w-full leading-relaxed">{latestNote.content.substring(0, 50)}...</div>
            </div>
          ) : (
            <div className="text-center text-[8px] text-gray-500 py-1">{isRTL ? 'لا توجد ملاحظات محفوظة.' : 'No active notes saved.'}</div>
          )}
        </div>
      );
    }

    case 'battery':
      return (
        <div className="w-full h-full font-sans flex items-center justify-between px-2 py-1 text-center">
          <div className="text-left space-y-0.5">
            <div className="text-[8.5px] text-gray-400 font-semibold">{isRTL ? 'مستوى الطاقة والبطارية' : 'Power Reserve'}</div>
            <div className="text-[8px] text-gray-600 font-semibold font-mono">{isRTL ? 'متبقي ٢ س و ٤ م' : '2h 15m left'}</div>
          </div>
          <div className="flex items-center gap-1.5 bg-green-500/10 text-green-300 border border-green-500/20 py-1 px-2 rounded-xl">
            <Icons.BatteryCharging size={16} className="text-green-400 animate-pulse" />
            <span className="text-xs font-black font-mono">{toArabicNumerals('88', showAr)}%</span>
          </div>
        </div>
      );

    case 'network':
      return (
        <div className="w-full h-full font-sans flex items-center justify-between px-2 py-1 text-center">
          <div className="space-y-0.5 text-left">
            <div className="text-[9px] font-bold text-gray-200">WiFi-Fiber-Pro</div>
            <div className="text-[8px] text-gray-500 font-semibold">4.8 MB/s download speed</div>
          </div>
          <Icons.Wifi size={18} className="text-emerald-400 bg-white/5 p-1 rounded-full shrink-0 border border-white/5" />
        </div>
      );

    case 'photo':
      return (
        <div className="w-full h-full relative rounded-xl overflow-hidden min-h-[90px] border border-white/5">
          <img 
            src="https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=400&q=80" 
            alt="Scenery" 
            className="w-full h-full object-cover grayscale opacity-90 hover:grayscale-0 transition duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2 pointer-events-none">
            <span className="text-[7.5px] font-mono text-gray-400">{isRTL ? 'لقطة شاشة' : 'Photo Frame Hub'}</span>
          </div>
        </div>
      );

    default:
      return <div className="text-[10px] text-gray-500">Widget element</div>;
  }
}

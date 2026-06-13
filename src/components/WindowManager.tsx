import React, { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { AppWindow, AppInfo, LauncherSettings } from '../types';
import { AppIcon } from './AppDrawer';
import { toArabicNumerals } from '../utils/calendar';

interface WindowManagerProps {
  settings: LauncherSettings;
  setSettings: React.Dispatch<React.SetStateAction<LauncherSettings>>;
  windows: AppWindow[];
  setWindows: React.Dispatch<React.SetStateAction<AppWindow[]>>;
  installedApps: AppInfo[];
  volume: number;
  brightness: number;
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeCall: { number: string; contactName: string; status: 'incoming' | 'calling' | 'active'; duration: number } | null;
  setActiveCall: React.Dispatch<React.SetStateAction<{ number: string; contactName: string; status: 'incoming' | 'calling' | 'active'; duration: number } | null>>;
  mediaPlaying: boolean;
  setMediaPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setScreenshotCaptured: React.Dispatch<React.SetStateAction<{ url: string; time: string } | null>>;
}

export default function WindowManager({
  settings,
  setSettings,
  windows,
  setWindows,
  installedApps,
  volume,
  brightness,
  setIsSettingsOpen,
  activeCall,
  setActiveCall,
  mediaPlaying,
  setMediaPlaying,
  setScreenshotCaptured
}: WindowManagerProps) {
  const [activeWorkspace, setActiveWorkspace] = useState(1);
  const screenRef = useRef<HTMLDivElement>(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);

  // Dragging & Resizing States
  const [dragState, setDragState] = useState<{
    windowId: string;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  const [resizeState, setResizeState] = useState<{
    windowId: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const isRTL = settings.language === 'ar';
  const showArabic = settings.language === 'ar' && settings.useArabicNumerals;

  const handleFocus = (windowId: string) => {
    setWindows(prev => prev.map(w => ({
      ...w,
      focused: w.id === windowId
    })));
  };

  const handleClose = (windowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWindows(prev => prev.filter(w => w.id !== windowId));
  };

  const handleMinimize = (windowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWindows(prev => prev.map(w => {
      if (w.id === windowId) {
        return { ...w, isMinimized: true, focused: false };
      }
      return w;
    }));
  };

  const handleMaximize = (windowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWindows(prev => prev.map(w => {
      if (w.id === windowId) {
        return { ...w, isMaximized: !w.isMaximized };
      }
      return w;
    }));
  };

  // Drag handlings
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, windowId: string, currentX: number, currentY: number) => {
    e.stopPropagation();
    const win = windows.find(w => w.id === windowId);
    if (!win || win.isMaximized) return;

    handleFocus(windowId);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDragState({
      windowId,
      startX: clientX,
      startY: clientY,
      startLeft: win.x,
      startTop: win.y
    });
  };

  // Resize handlings
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, windowId: string) => {
    e.stopPropagation();
    const win = windows.find(w => w.id === windowId);
    if (!win || win.isMaximized) return;

    handleFocus(windowId);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setResizeState({
      windowId,
      startX: clientX,
      startY: clientY,
      startWidth: win.w,
      startHeight: win.h
    });
  };

  // Move tracking
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (dragState && screenRef.current) {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const rect = screenRef.current.getBoundingClientRect();

        const deltaX = ((clientX - dragState.startX) / rect.width) * 100;
        const deltaY = ((clientY - dragState.startY) / rect.height) * 100;

        setWindows(prev => prev.map(w => {
          if (w.id === dragState.windowId) {
            // Constrain 5% to 85% to prevent complete out of bounds
            const rawX = dragState.startLeft + deltaX;
            const rawY = dragState.startTop + deltaY;
            return {
              ...w,
              x: Math.max(-5, Math.min(85, rawX)),
              y: Math.max(0, Math.min(80, rawY)),
              splitLayout: 'none' // reset tile
            };
          }
          return w;
        }));
      }

      if (resizeState && screenRef.current) {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const rect = screenRef.current.getBoundingClientRect();

        const deltaWidth = ((clientX - resizeState.startX) / rect.width) * 100;
        const deltaHeight = ((clientY - resizeState.startY) / rect.height) * 100;

        setWindows(prev => prev.map(w => {
          if (w.id === resizeState.windowId) {
            return {
              ...w,
              w: Math.max(30, Math.min(95, resizeState.startWidth + deltaWidth)),
              h: Math.max(25, Math.min(85, resizeState.startHeight + deltaHeight))
            };
          }
          return w;
        }));
      }
    };

    const handleEnd = () => {
      setDragState(null);
      setResizeState(null);
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
  }, [dragState, resizeState]);

  // Handle split screen layout
  const handleSplitTile = (windowId: string, tile: 'left' | 'right' | 'none') => {
    setWindows(prev => prev.map(w => {
      if (w.id === windowId) {
        if (tile === 'left') {
          return { ...w, splitLayout: 'left', x: 2, y: 5, w: 46, h: 80, isMaximized: false };
        } else if (tile === 'right') {
          return { ...w, splitLayout: 'right', x: 52, y: 5, w: 46, h: 80, isMaximized: false };
        } else {
          return { ...w, splitLayout: 'none', x: 10, y: 15, w: 80, h: 65 };
        }
      }
      return w;
    }));
  };

  const activeWindows = windows.filter(w => !w.isMinimized);

  return (
    <div 
      ref={screenRef}
      className="flex-1 w-full relative overflow-hidden"
    >
      {/* WINDOW CONTAINER */}
      <div className="absolute inset-0 z-10 p-2">
        {activeWindows.map(w => {
          const app = installedApps.find(a => a.id === w.appId);
          if (!app) return null;

          const isFocused = w.focused;
          
          // Style geometry calculations based on states (split / maximize / custom gaps)
          const styleX = w.isMaximized ? 0 : w.x;
          const styleY = w.isMaximized ? 0 : w.y;
          const styleW = w.isMaximized ? 100 : w.w;
          const styleH = w.isMaximized ? 100 : w.h;

          const shadowStyle = isFocused
            ? `0 12px 30px -4px rgba(0,0,0,0.7), 0 0 16px ${settings.shadowColor || 'rgba(59, 130, 246, 0.4)'}`
            : '0 8px 16px -4px rgba(0,0,0,0.6)';

          const activeBorderColor = settings.theme === 'custom' 
            ? settings.customActiveBorderColor 
            : isFocused ? settings.accentColor : 'rgba(255,255,255,0.08)';

          const borderShadowGlow = isFocused 
            ? `0 0 0 1.5px ${activeBorderColor}` 
            : '0 0 0 1px rgba(255,255,255,0.08)';

          return (
            <div
              key={w.id}
              onClick={() => handleFocus(w.id)}
              className="absolute bg-neutral-950/95 flex flex-col overflow-hidden transition-shadow duration-300 pointer-events-auto"
              style={{
                left: `${styleX}%`,
                top: `${styleY}%`,
                width: `${styleW}%`,
                height: `${styleH}%`,
                borderRadius: w.isMaximized ? '0px' : `${settings.borderRadius}px`,
                boxShadow: shadowStyle,
                zIndex: isFocused ? 25 : 20,
                boxShadowColor: isFocused ? settings.shadowColor : 'transparent',
                styleY: `calc(${styleY}% + ${settings.gaps}px)`,
                ...({ boxShadow: shadowStyle, outline: isFocused ? `1.5px solid ${activeBorderColor}` : `1px solid rgba(255,255,255,0.12)` } as any)
              }}
            >
              {/* Floating Hyprland Window Title Bar Decoration */}
              <div
                onMouseDown={(e) => handleDragStart(e, w.id, e.clientX, e.clientY)}
                onTouchStart={(e) => handleDragStart(e, w.id, e.touches[0].clientX, e.touches[0].clientY)}
                className="h-8 shrink-0 bg-neutral-900/90 border-b border-white/5 px-2.5 flex items-center justify-between select-none cursor-move"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                {/* Title and Icon */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-gray-400">
                    <AppIcon name={app.icon} size={11} />
                  </span>
                  <span className="text-[10px] text-gray-200 truncate font-semibold">
                    {isRTL ? app.nameAr : app.nameEn}
                  </span>
                </div>

                {/* Operations */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Split Tiles controllers */}
                  {!w.isMaximized && (
                    <div className="flex gap-0.5 border border-white/5 rounded px-1 scale-90">
                      <button 
                        id={`tile-left-${w.id}`}
                        onClick={(e) => { e.stopPropagation(); handleSplitTile(w.id, w.splitLayout === 'left' ? 'none' : 'left'); }}
                        className={`text-[9px] hover:text-blue-400 p-0.5 ${w.splitLayout === 'left' ? 'text-blue-400' : 'text-gray-500'}`}
                        title="Tile Left"
                      >
                        [|
                      </button>
                      <button 
                        id={`tile-right-${w.id}`}
                        onClick={(e) => { e.stopPropagation(); handleSplitTile(w.id, w.splitLayout === 'right' ? 'none' : 'right'); }}
                        className={`text-[9px] hover:text-blue-400 p-0.5 ${w.splitLayout === 'right' ? 'text-blue-400' : 'text-gray-500'}`}
                        title="Tile Right"
                      >
                        |]
                      </button>
                    </div>
                  )}

                  {/* Window minimizing */}
                  <button
                    id={`win-minimize-${w.id}`}
                    onClick={(e) => handleMinimize(w.id, e)}
                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
                  >
                    <Icons.Minus size={11} />
                  </button>

                  {/* Maximize toggle */}
                  <button
                    id={`win-maximize-${w.id}`}
                    onClick={(e) => handleMaximize(w.id, e)}
                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
                  >
                    <Icons.Square size={9} />
                  </button>

                  {/* Close window */}
                  <button
                    id={`win-close-${w.id}`}
                    onClick={(e) => handleClose(w.id, e)}
                    className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition"
                  >
                    <Icons.X size={11} />
                  </button>
                </div>
              </div>

              {/* Inside Window Application Client Frame */}
              <div className="flex-1 w-full overflow-hidden bg-neutral-950 flex flex-col">
                <AppContentContainer 
                  appId={w.appId} 
                  settings={settings} 
                  setSettings={setSettings}
                  volume={volume}
                  brightness={brightness}
                  setIsSettingsOpen={setIsSettingsOpen}
                  activeCall={activeCall}
                  setActiveCall={setActiveCall}
                  mediaPlaying={mediaPlaying}
                  setMediaPlaying={setMediaPlaying}
                  setScreenshotCaptured={setScreenshotCaptured}
                />
              </div>

              {/* Corner Resize Handler (only when not maximized) */}
              {!w.isMaximized && (
                <div
                  onMouseDown={(e) => handleResizeStart(e, w.id)}
                  onTouchStart={(e) => handleResizeStart(e, w.id)}
                  className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-se-resize flex items-end justify-end pointer-events-auto"
                >
                  {/* Subtle Resize Indicator icon */}
                  <div className="w-1.5 h-1.5 bg-white/20 rounded-tl-sm mr-0.5 mb-0.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* OVERMAP WORKSPACE DOT INDICATOR BAR AT BOTTOM OF DESKTOP SCREEN */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-15 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
        {[1, 2, 3].map(ws => (
          <button
            key={ws}
            onClick={() => setActiveWorkspace(ws)}
            className={`w-2 h-2 rounded-full transition ${ws === activeWorkspace ? 'bg-blue-400 scale-110' : 'bg-white/25 hover:bg-white/40'}`}
            title={`Workspace ${ws}`}
          />
        ))}
        {windows.length > 0 && (
          <button 
            id="ws-overview-btn"
            onClick={() => setIsOverviewOpen(!isOverviewOpen)}
            className="ml-2 text-[9px] bg-white/5 hover:bg-white/10 px-1.5 py-0.5 text-gray-300 rounded border border-white/10 font-bold"
          >
            {isRTL ? 'معاينة' : 'Grid'}
          </button>
        )}
      </div>

      {/* MINIMIZED TASK SWITCHER HUD / GRID OVERVIEW */}
      {isOverviewOpen && (
        <div 
          onClick={() => setIsOverviewOpen(false)}
          className="absolute inset-0 bg-black/75 z-28 flex flex-col justify-center items-center p-4 blur-backdrop-m"
        >
          <h3 className="text-xs font-bold text-gray-400 mb-4 tracking-widest uppercase">
            {isRTL ? 'نظرة عامة على النوافذ' : 'Hyprland Workspace Client Grid'}
          </h3>
          <div className="grid grid-cols-2 gap-3 max-w-[320px]">
            {windows.map(w => {
              const app = installedApps.find(a => a.id === w.appId);
              if (!app) return null;
              return (
                <div
                  key={w.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Unminimize and focus
                    setWindows(prev => prev.map(win => ({
                      ...win,
                      isMinimized: win.id === w.id ? false : win.isMinimized,
                      focused: win.id === w.id ? true : win.focused
                    })));
                    setIsOverviewOpen(false);
                  }}
                  className="bg-neutral-900 border border-white/10 rounded-xl p-3 flex items-center justify-between shadow-lg cursor-pointer hover:border-blue-500/40 transition active:scale-95 text-center"
                >
                  <div className="flex items-center gap-2">
                    <AppIcon name={app.icon} size={16} className="text-blue-400" />
                    <span className="text-[10px] font-sans font-bold text-gray-100">
                      {isRTL ? app.nameAr : app.nameEn}
                    </span>
                  </div>
                  <button
                    id={`overview-close-${w.id}`}
                    onClick={(e) => { e.stopPropagation(); handleClose(w.id, e); }}
                    className="text-gray-500 hover:text-red-400"
                  >
                    <Icons.X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// RESOLVER FOR INTERNAL SIMULATED APPLICATIONS
// ============================================
interface AppContentProps {
  appId: string;
  settings: LauncherSettings;
  setSettings: React.Dispatch<React.SetStateAction<LauncherSettings>>;
  volume: number;
  brightness: number;
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeCall: { number: string; contactName: string; status: 'incoming' | 'calling' | 'active'; duration: number } | null;
  setActiveCall: React.Dispatch<React.SetStateAction<{ number: string; contactName: string; status: 'incoming' | 'calling' | 'active'; duration: number } | null>>;
  mediaPlaying: boolean;
  setMediaPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setScreenshotCaptured: React.Dispatch<React.SetStateAction<{ url: string; time: string } | null>>;
}

function AppContentContainer({ 
  appId, 
  settings, 
  setSettings, 
  volume, 
  brightness, 
  setIsSettingsOpen,
  activeCall,
  setActiveCall,
  mediaPlaying,
  setMediaPlaying,
  setScreenshotCaptured
}: AppContentProps) {
  switch (appId) {
    case 'terminal':
      return <TerminalSimulator settings={settings} />;
    case 'calculator':
      return <ArabicCalculator settings={settings} />;
    case 'camera':
      return <CameraApp settings={settings} />;
    case 'browser':
      return <BrowserApp settings={settings} />;
    case 'music':
      return <MusicPlayerApp settings={settings} volume={volume} mediaPlaying={mediaPlaying} setMediaPlaying={setMediaPlaying} />;
    case 'phone':
      return <PhoneDialerSimulator settings={settings} activeCall={activeCall} setActiveCall={setActiveCall} />;
    case 'files':
      return <FileManagerSimulator settings={settings} />;
    case 'settings':
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <Icons.Settings size={32} className="text-blue-400 mb-2 animate-spin-slow" />
          <p className="text-xs text-gray-300 font-sans">{settings.language === 'ar' ? 'فصل الإعدادات مفعل' : 'Settings system is ready'}</p>
          <button 
            id="open-settings-win-btn"
            onClick={() => setIsSettingsOpen(true)}
            className="mt-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-1 text-[10px] font-bold font-sans transition"
          >
            {settings.language === 'ar' ? 'فتح لوحة الإعدادات الشاملة' : 'Open Settings Panel'}
          </button>
        </div>
      );
    default:
      return (
        <div className="flex-1 p-4 flex flex-col items-center justify-center text-center text-gray-400 font-sans">
          <Icons.AlertCircle size={24} className="text-yellow-400 mb-1" />
          <span className="text-[10px]">App container placeholder</span>
        </div>
      );
  }
}

// 1. TERMINAL SIMULATOR
function TerminalSimulator({ settings }: { settings: LauncherSettings }) {
  const [history, setHistory] = useState<string[]>([
    'Welcome to PinePhone Mobile Shell terminal.',
    'Powered by wlroots and Hyprland compositor with native Arabic RTL rendering.',
    'Type "help" to see available commands.'
  ]);
  const [inputVal, setInputVal] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    const newHistory = [...history, `pine@mobile:~$ ${cmd}`];
    const parts = cmd.split(' ');
    const baseCmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    let reply: string[] = [];

    switch (baseCmd) {
      case 'help':
        reply = [
          'Available commands:',
          '  neofetch       Display system specifications',
          '  ls             List home system directories',
          '  cat [file]     Concatenate and print file contents',
          '  hyprctl        Hyprland developer compositor controller client',
          '  cowsay [msg]   Simulate a talking unix cow',
          '  clear          Clear the screen output'
        ];
        break;
      case 'neofetch':
        reply = [
          '       .---.          pine@mobile-pinephone',
          '      /     \\         ---------------------',
          '      \\  O,O/         OS: postmarketOS v26.06 (Edge)',
          '       \\_   _        Kernel: Linux-rt 6.12-pinephonepro-lp',
          '       //    \\\\       Shell: bash 5.2.21 + wlroots',
          '      ((      ))      WM: Hyprland v0.41 Mobile-Composer',
          '    === `\"\"\"` ===     Memory: 1.45 GiB / 3.82 GiB (37%)',
          '                      Uptime: 2h 44m, CPU: Rockchip RK3399'
        ];
        break;
      case 'ls':
        reply = [
          '📁 ~/',
          '  📄 config.json',
          '  📁 wallpapers/',
          '  📁 notes/'
        ];
        break;
      case 'cat':
        if (arg.toLowerCase() === 'config.json') {
          reply = [
            '{',
            `  "wm": "Hyprland Mobile",`,
            `  "theme": "${settings.theme}",`,
            `  "accent": "${settings.accentColor}",`,
            `  "locale": "${settings.language}",`,
            `  "arabic_nums": ${settings.useArabicNumerals}`,
            '}'
          ];
        } else {
          reply = [`cat: ${arg || 'no file specified'}: No such file or directory`];
        }
        break;
      case 'hyprctl':
        reply = [
          'Hyprland client lists:',
          '  Workspace ID: 1',
          '  Tiled gaps setting: 6px',
          '  Backdrop filter: Dual Kawase 8x blur',
          '  Active window border: 2.0px glow'
        ];
        break;
      case 'cowsay':
        const say = arg || 'Hello Linux PinePhone user!';
        reply = [
          `  ___________________________`,
          ` < ${say} >`,
          `  ---------------------------`,
          `         \\   ^__^`,
          `          \\  (oo)\\_______`,
          `             (__)\\       )\\/\\`,
          `                 ||----w |`,
          `                 ||     ||`
        ];
        break;
      case 'clear':
        setHistory([]);
        setInputVal('');
        return;
      default:
        reply = [`hyprsh: command not found: ${baseCmd}. Type "help" for a list.`];
    }

    setHistory([...newHistory, ...reply]);
    setInputVal('');
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 font-mono text-[10px] p-2 overflow-hidden text-emerald-400">
      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin">
        {history.map((line, idx) => (
          <div key={idx} className="whitespace-pre-wrap">{line}</div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleCommand} className="flex gap-1.5 items-center border-t border-white/5 pt-1.5">
        <span className="text-blue-400 shrink-0">pine@mobile:~$</span>
        <input
          id="terminal-input"
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-white font-mono"
          autoFocus
        />
      </form>
    </div>
  );
}

// 2. ARABIC CALCULATOR PART
function ArabicCalculator({ settings }: { settings: LauncherSettings }) {
  const [val, setVal] = useState('');
  const isRTL = settings.language === 'ar';
  const showAr = settings.language === 'ar' && settings.useArabicNumerals;

  const handlePress = (c: string) => {
    if (c === '=') {
      try {
        const evald = eval(val.replace(/x/g, '*').replace(/÷/g, '/'));
        setVal(String(evald));
      } catch (e) {
        setVal('Error');
      }
    } else if (c === 'C') {
      setVal('');
    } else {
      setVal(prev => prev + c);
    }
  };

  const keys = ['7', '8', '9', '÷', '4', '5', '6', 'x', '1', '2', '3', '-', '0', '.', 'C', '=', '+'];

  return (
    <div className="flex-1 flex flex-col p-2.5 bg-neutral-900 font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full h-12 bg-black/40 rounded-xl px-3 flex items-center justify-end text-xl text-white font-mono mb-2 overflow-x-auto">
        {toArabicNumerals(val || '0', showAr)}
      </div>
      <div className="grid grid-cols-4 gap-1.5 flex-1">
        {keys.map(k => (
          <button
            key={k}
            onClick={() => handlePress(k)}
            className={`p-2 rounded-xl text-xs font-bold font-mono transition active:scale-95 ${
              k === '=' 
                ? 'bg-blue-500 text-white' 
                : k === 'C' 
                ? 'bg-red-500/20 text-red-300' 
                : ['+', '-', 'x', '÷'].includes(k) 
                ? 'bg-orange-500/20 text-orange-300' 
                : 'bg-white/5 text-gray-300'
            }`}
          >
            {toArabicNumerals(k, showAr)}
          </button>
        ))}
      </div>
    </div>
  );
}

// 3. CAMERA SIMULATOR (WITH REAL WEBCAM DRIVER!)
function CameraApp({ settings }: { settings: LauncherSettings }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasStream, setHasStream] = useState(false);
  const [scannedFaces, setScannedFaces] = useState(true);

  useEffect(() => {
    // Attempt real webcam access
    let localStream: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          localStream = stream;
          setHasStream(true);
        }
      })
      .catch(() => {
        setHasStream(false);
      });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex-1 bg-black relative overflow-hidden flex flex-col justify-between p-2">
      <div className="absolute top-2 left-2 z-10 bg-black/60 px-2 py-0.5 rounded text-[8px] font-mono text-red-500 flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        <span>LIVE AUTO-FOCUS</span>
      </div>

      <div className="flex-1 relative rounded-xl overflow-hidden bg-neutral-900 border border-white/5 flex items-center justify-center">
        {hasStream ? (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
        ) : (
          <div className="text-center space-y-2 text-gray-500 flex flex-col items-center">
            <Icons.CameraOff size={24} className="text-neutral-500" />
            <span className="text-[8px] font-mono leading-relaxed">
              {settings.language === 'ar' ? 'فشل تشغيل عدسة الويب كام' : 'Webcam Access Denied'}
              <br />
              {settings.language === 'ar' ? 'جاري محاكاة مستشعر الكاميرا...' : 'Simulating image sensor...'}
            </span>
            <div className="w-20 h-16 bg-neutral-950 border border-dotted border-gray-600 flex items-center justify-center opacity-40 animate-pulse mt-2 pr-1 rounded">
              <Icons.Smile size={18} className="text-green-500" />
            </div>
          </div>
        )}

        {/* HUD gridlines overlay */}
        <div className="absolute inset-0 pointer-events-none border border-white/10 flex items-center justify-center">
          <div className="w-1/3 h-full border-x border-white/10" />
          <div className="h-1/3 w-full border-y border-white/10 absolute" />
        </div>

        {/* Mock Arabic Focus Box */}
        {scannedFaces && (
          <div className="absolute top-1/3 left-1/3 w-20 h-20 border border-emerald-400 rounded animate-pulse z-10 flex items-start justify-start p-1 pointer-events-none">
            <span className="text-[6px] text-emerald-400 font-bold bg-neutral-950/80 px-1 rounded font-sans scale-90">
              {settings.language === 'ar' ? 'وجه مكتشف' : 'FACE'}
            </span>
          </div>
        )}
      </div>

      <div className="h-10 shrink-0 flex items-center justify-center gap-4">
        <button 
          id="camera-photo-btn"
          className="w-8 h-8 rounded-full bg-white border-2 border-neutral-800 hover:bg-neutral-200 transition active:scale-90 flex items-center justify-center" 
          title="Snap"
        >
          <div className="w-4 h-4 rounded-full bg-red-500" />
        </button>
      </div>
    </div>
  );
}

// 4. WEBBROWSER SIMULATOR
function BrowserApp({ settings }: { settings: LauncherSettings }) {
  const [url, setUrl] = useState('https://hyprland.org');
  const [currentView, setCurrentView] = useState('home');

  const websites: Record<string, { title: string; body: string; link: string }> = {
    'https://hyprland.org': {
      title: 'Hyprland (Mobile Portal)',
      body: 'Hyprland is a highly customizable dynamic tiling Wayland compositor that doesn\'t sacrifice on its beautiful looks. It supports smooth custom animations, dual kawase blurs, active glowing window borders, and high-frequency tactile physics loops.',
      link: 'hyprland.org/mobile'
    },
    'https://postmarketos.org': {
      title: 'postmarketOS mobile shell',
      body: 'Real Linux operating system for mobile phone hardware under active development. Bypasses Android stacks to provide a pure Alpine Linux runtime with touch compliance, sandboxing, and PipeWire sound infrastructure.',
      link: 'postmarketos.org/pinephone'
    }
  };

  const currentSite = websites[url] || {
    title: 'Pine64 Wiki Portal',
    body: 'PinePhone Pro is an ARM-based mobile device running mainline Linux kernels. Learn about building custom wlroots shells and setting up Arabic regional parameters natively.',
    link: 'wiki.pine64.org'
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-900 overflow-hidden font-sans p-1.5">
      <div className="flex gap-1 items-center bg-black/40 p-1.5 rounded-lg border border-white/5 shrink-0">
        <Icons.Globe size={11} className="text-gray-400" />
        <input
          id="browser-url-input"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-transparent text-[9px] border-none outline-none text-gray-300 font-mono"
        />
        <button 
          id="browser-go-btn"
          onClick={() => setCurrentView('site')}
          className="text-[8px] bg-blue-500/25 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded"
        >
          Go
        </button>
      </div>

      <div className="flex-1 mt-1 bg-black/30 rounded-lg p-2.5 overflow-y-auto space-y-2 border border-white/5 font-sans leading-relaxed">
        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 pb-1 border-b border-white/5">
          <Icons.Bookmark size={11} />
          <span>{currentSite.title}</span>
        </div>
        <p className="text-[10px] text-gray-400">{currentSite.body}</p>
        <div className="pt-2">
          <span className="text-[8px] text-gray-500 font-mono">Source: https://{currentSite.link}</span>
        </div>
      </div>
    </div>
  );
}

// 5. MUSIC PLAYER SIMULATOR
function MusicPlayerApp({ 
  settings, 
  volume, 
  mediaPlaying, 
  setMediaPlaying 
}: { 
  settings: LauncherSettings; 
  volume: number; 
  mediaPlaying: boolean; 
  setMediaPlaying: React.Dispatch<React.SetStateAction<boolean>>; 
}) {
  const [currentTrack, setCurrentTrack] = useState({
    title: 'Evening Sunset over Cairo',
    artist: 'Arabian Chill Lofi Core',
    duration: '2:40'
  });
  const [ticks, setTicks] = useState(45); // simulated elapsed

  useEffect(() => {
    if (!mediaPlaying) return;
    const interval = setInterval(() => {
      setTicks(t => (t + 1) % 180);
    }, 1000);
    return () => clearInterval(interval);
  }, [mediaPlaying]);

  const elapsedMin = Math.floor(ticks / 60);
  const elapsedSec = String(ticks % 60).padStart(2, '0');
  const elapsedFormatted = `${elapsedMin}:${elapsedSec}`;

  return (
    <div className="flex-1 bg-gradient-to-b from-neutral-900 to-black p-3.5 flex flex-col justify-between font-sans relative">
      
      {/* Decorative Rotating Record */}
      <div className="flex justify-center items-center py-2 shrink-0">
        <div className={`w-20 h-20 rounded-full bg-neutral-800 border-4 border-yellow-500/40 flex items-center justify-center relative ${mediaPlaying ? 'animate-spin-slow' : ''}`}>
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-yellow-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* Track text */}
      <div className="text-center space-y-0.5">
        <h4 className="text-[11px] font-bold text-gray-200 truncate">{currentTrack.title}</h4>
        <p className="text-[9px] text-gray-500 font-semibold">{currentTrack.artist}</p>
      </div>

      {/* Audio Waveform CSS canvas simulator */}
      {mediaPlaying && (
        <div className="flex justify-center items-end gap-[3px] h-6 px-4">
          {[8, 14, 18, 12, 6, 15, 20, 10, 8, 14, 18, 12].map((h, i) => (
            <div 
              key={i} 
              className="w-1 bg-rose-500 rounded-t" 
              style={{ 
                height: `${Math.max(3, Math.min(100, h * (Math.sin((ticks + i) * 0.8) + 1.2)))}px`,
                transition: 'height 0.2s ease-in-out'
              }} 
            />
          ))}
        </div>
      )}

      {/* Track progress */}
      <div className="space-y-1">
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-rose-500" style={{ width: `${(ticks / 160) * 100}%` }} />
        </div>
        <div className="flex justify-between items-center text-[8px] font-mono text-gray-400">
          <span>{elapsedFormatted}</span>
          <span>{currentTrack.duration}</span>
        </div>
      </div>

      {/* Play Controls bar */}
      <div className="flex justify-center items-center gap-4 py-1">
        <button id="music-prev" className="text-gray-400 hover:text-white"><Icons.SkipBack size={14} /></button>
        <button 
          id="music-play-toggle"
          onClick={() => setMediaPlaying(!mediaPlaying)}
          className="w-8 h-8 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center active:scale-95 transition"
        >
          {mediaPlaying ? <Icons.Pause size={14} /> : <Icons.Play size={14} className="ml-0.5" />}
        </button>
        <button id="music-next" className="text-gray-400 hover:text-white"><Icons.SkipForward size={14} /></button>
      </div>

    </div>
  );
}

// 5b. PHONE DIALER SIMULATOR WITH INTEGRATED INCOMING / ACTIVE RING OVERLAYS
interface PhoneDialerSimulatorProps {
  settings: LauncherSettings;
  activeCall: { number: string; contactName: string; status: 'incoming' | 'calling' | 'active'; duration: number } | null;
  setActiveCall: React.Dispatch<React.SetStateAction<{ number: string; contactName: string; status: 'incoming' | 'calling' | 'active'; duration: number } | null>>;
}

function PhoneDialerSimulator({ settings, activeCall, setActiveCall }: PhoneDialerSimulatorProps) {
  const [dialNum, setDialNum] = useState('');
  const [logs, setLogs] = useState<Array<{ number: string; name: string; time: string; type: 'incoming' | 'outgoing' }>>([
    { number: '+966 50 123 4567', name: 'أمي (Mom)', time: '14:20', type: 'outgoing' },
    { number: '+966 55 987 6543', name: 'أبي (Dad)', time: 'Yesterday', type: 'incoming' },
    { number: '+20 100 112 2334', name: 'العمل (Work)', time: '2 Days ago', type: 'incoming' },
  ]);

  const showAr = settings.language === 'ar' && settings.useArabicNumerals;
  const isRTL = settings.language === 'ar';

  const contacts = [
    { name: isRTL ? 'أمي (Mom)' : 'Mom', number: '0501234567' },
    { name: isRTL ? 'أبي (Dad)' : 'Dad', number: '0559876543' },
    { name: isRTL ? 'العمل (Work)' : 'Work', number: '01001122334' },
    { name: isRTL ? 'الطوارئ' : 'Emergency', number: '112' }
  ];

  const handleDialPress = (digit: string) => {
    setDialNum(prev => prev + digit);
  };

  const handleBackspace = () => {
    setDialNum(prev => prev.slice(0, -1));
  };

  const handleTriggerCall = (numberToCall: string, nameToCall?: string) => {
    if (!numberToCall) return;
    const resolvedName = nameToCall || contacts.find(c => c.number === numberToCall)?.name || (isRTL ? 'رقم غير معروف' : 'Unknown');
    
    // Set calling state
    setActiveCall({
      number: numberToCall,
      contactName: resolvedName,
      status: 'calling',
      duration: 0
    });

    // Add log
    setLogs(prev => [
      { number: numberToCall, name: resolvedName, time: 'Now', type: 'outgoing' },
      ...prev
    ]);

    // Transition calling -> active after 1.5 seconds
    setTimeout(() => {
      setActiveCall(prev => prev && prev.status === 'calling' ? { ...prev, status: 'active', duration: 0 } : prev);
    }, 1500);
  };

  const triggerIncomingCallSimulation = () => {
    // Stage an incoming mock call in 2 seconds
    setTimeout(() => {
      setActiveCall({
        number: '0501234567',
        contactName: isRTL ? 'أمي (Mom)' : 'Mom',
        status: 'incoming',
        duration: 0
      });
    }, 1000);
  };

  // If there is an active call (outgoing, incoming, or active)
  if (activeCall) {
    const isIncoming = activeCall.status === 'incoming';
    const isCalling = activeCall.status === 'calling';
    const isActive = activeCall.status === 'active';

    return (
      <div className="flex-1 flex flex-col justify-between p-4 bg-gradient-to-b from-neutral-900 to-zinc-950 font-sans text-center text-white relative">
        <div className="space-y-4 pt-4">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 mx-auto flex items-center justify-center animate-pulse">
            <Icons.User size={32} />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-black tracking-wide">
              {activeCall.contactName}
            </h2>
            <p className="text-[10px] text-gray-400 font-mono">
              {toArabicNumerals(activeCall.number, showAr)}
            </p>
          </div>
          <div className="text-xs font-semibold text-blue-400 animate-pulse mt-4">
            {isIncoming 
              ? (isRTL ? 'مكالمة واردة...' : 'INCOMING CALL...') 
              : isCalling 
              ? (isRTL ? 'جاري الاتصال الرقم...' : 'CALLING NUMBER...') 
              : (isRTL ? 'مكالمة نشطة' : 'ACTIVE CALL')}
          </div>

          {isActive && (
            <div className="text-lg font-mono font-bold text-gray-200 tracking-wider">
              {Math.floor(activeCall.duration / 60)}:{(activeCall.duration % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>

        {/* Call Management buttons Grid */}
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
            {/* Mute button */}
            <button className="flex flex-col items-center justify-center gap-1 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition text-gray-300">
              <Icons.MicOff size={14} />
              <span className="text-[8px] font-bold">{isRTL ? 'كتم' : 'Mute'}</span>
            </button>
            {/* Keypad button */}
            <button className="flex flex-col items-center justify-center gap-1 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition text-gray-300">
              <Icons.Grid size={14} />
              <span className="text-[8px] font-bold">{isRTL ? 'لوحة المفاتيح' : 'Keypad'}</span>
            </button>
            {/* Speaker button */}
            <button className="flex flex-col items-center justify-center gap-1 p-2 bg-white/10 border border-blue-500/30 rounded-xl transition text-blue-400">
              <Icons.Volume2 size={14} />
              <span className="text-[8px] font-bold">{isRTL ? 'مكبر الصوت' : 'Speaker'}</span>
            </button>
          </div>

          <div className="flex justify-center gap-4">
            {isIncoming ? (
              <>
                <button 
                  onClick={() => setActiveCall(p => p ? { ...p, status: 'active', duration: 0 } : null)}
                  className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition active:scale-90"
                  title="Answer"
                >
                  <Icons.Phone size={20} className="text-white" />
                </button>
                <button 
                  onClick={() => setActiveCall(null)}
                  className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition active:scale-95"
                  title="Decline"
                >
                  <Icons.PhoneOff size={20} className="text-white" />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setActiveCall(null)}
                className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition active:scale-95"
                title="End Call"
              >
                <Icons.PhoneOff size={20} className="text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Regular dial pad screen
  return (
    <div className="flex-1 flex flex-col bg-neutral-950 font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Header Selector tabs: Dialer / Contacts / Logs */}
      <div className="flex bg-neutral-900 border-b border-white/5 text-[9px] font-bold text-gray-400 h-8 shrink-0">
        <div className="flex-1 flex items-center justify-center border-b-2 border-blue-500 text-white">
          <Icons.Phone size={10} className="mr-1.5" />
          <span>{isRTL ? 'الطلب' : 'Dialer'}</span>
        </div>
        <div className="flex-1 flex items-center justify-center hover:bg-white/5 cursor-not-allowed">
          <Icons.User size={10} className="mr-1.5" />
          <span>{isRTL ? 'جهات الاتصال' : 'Contacts'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3 flex flex-col justify-between">
        {/* Dial display screen */}
        <div className="space-y-2">
          <div className="h-10 bg-black/40 border border-white/5 rounded-xl px-3 flex items-center justify-between text-yellow-400 font-bold font-mono tracking-wider overflow-x-auto">
            <span className="text-xs text-gray-500">{isRTL ? 'طلب:' : 'Dial:'}</span>
            <span className="text-sm">{toArabicNumerals(dialNum || '', showAr) || '_'}</span>
            {dialNum && (
              <button onClick={handleBackspace} className="text-gray-500 hover:text-white">
                <Icons.Delete size={12} />
              </button>
            )}
          </div>

          {/* Quick contacts grid */}
          <div className="space-y-1">
            <p className="text-[8px] text-gray-500 font-bold tracking-wider">{isRTL ? 'طلب سريع بنقرة واحدة' : 'ONE-CLICK SPEED DIALS'}</p>
            <div className="grid grid-cols-2 gap-1">
              {contacts.map(c => (
                <button
                  key={c.number}
                  onClick={() => handleTriggerCall(c.number, c.name)}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-left text-[9px] border border-white/5 transition flex items-center gap-1 min-w-0"
                >
                  <Icons.User size={8} className="text-blue-400 shrink-0" />
                  <span className="text-gray-200 truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dialpad Matrix keys */}
        <div className="grid grid-cols-3 gap-1 mx-auto max-w-[200px] shrink-0">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(k => (
            <button
              key={k}
              onClick={() => handleDialPress(k)}
              className="w-[58px] h-[34px] bg-white/5 active:bg-white/15 rounded-xl border border-white/5 flex flex-col items-center justify-center transition"
            >
              <span className="text-xs font-black text-gray-200">{k}</span>
              <span className="text-[6px] text-gray-500 tracking-none leading-none scale-75">
                {toArabicNumerals(k, true)}
              </span>
            </button>
          ))}
        </div>

        {/* Call bar & Simulate incoming button */}
        <div className="space-y-1.5 pt-2 border-t border-white/5 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => handleTriggerCall(dialNum)}
              disabled={!dialNum}
              className={`flex-1 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white transition ${dialNum ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
            >
              <Icons.Phone size={12} className="mr-1.5" />
              <span>{isRTL ? 'إجراء مكالمة' : 'Place Call'}</span>
            </button>

            <button
              onClick={triggerIncomingCallSimulation}
              className="px-3 bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 rounded-xl text-[8px] font-bold text-center leading-none"
              title="Test Incoming ring in 2 secs"
            >
              {isRTL ? 'محاكاة مكالمة' : 'Simulate Call'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. FILE MANAGER SIMULATOR
function FileManagerSimulator({ settings }: { settings: LauncherSettings }) {
  const [currentPath, setCurrentPath] = useState('~/.config/launcher');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const files_list = [
    { name: 'config.toml', size: '1.2 KB', isDir: false },
    { name: 'hyprland.conf', size: '2.5 KB', isDir: false },
    { name: 'theme.css', size: '840 B', isDir: false },
    { name: 'wallpapers', size: '3 items', isDir: true },
    { name: 'notes', size: '4 items', isDir: true }
  ];

  return (
    <div className="flex-1 bg-neutral-950 font-mono text-[9px] p-2 flex flex-col justify-between overflow-hidden text-blue-300">
      <div>
        <div className="flex gap-1.5 items-center mb-2 px-1 py-1 bg-white/5 rounded border border-white/10 text-gray-400">
          <Icons.FolderOpen size={10} className="text-yellow-400" />
          <span>{currentPath}</span>
        </div>

        <div className="space-y-1">
          {files_list.map(f => (
            <div 
              key={f.name}
              onClick={() => setSelectedFile(f.name)}
              className="flex items-center justify-between p-1 hover:bg-white/5 rounded cursor-pointer transition border border-transparent hover:border-white/5"
            >
              <div className="flex items-center gap-1.5">
                {f.isDir ? <Icons.Folder size={11} className="text-yellow-500 fill-yellow-500/20" /> : <Icons.FileCode size={11} className="text-blue-400" />}
                <span className="text-gray-200">{f.name}</span>
              </div>
              <span className="text-[8px] text-gray-500">{f.size}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedFile && (
        <div className="bg-black/80 border border-white/10 p-2 rounded-lg text-left relative mt-2 shrink-0">
          <button 
            id="file-close-inspector"
            onClick={() => setSelectedFile(null)} 
            className="absolute right-1 top-1 text-gray-500 hover:text-white"
          >
            <Icons.X size={10} />
          </button>
          <div className="text-[8px] font-bold text-teal-400 mb-1">📄 {selectedFile} Viewer</div>
          <div className="text-[8px] text-gray-400 max-h-[80px] overflow-y-auto font-mono whitespace-pre scrollbar-thin">
            {selectedFile === 'config.toml' 
              ? '[wm]\nname = "hyprland"\nrounded_corners = 28\nblur = true' 
              : selectedFile === 'hyprland.conf'
              ? 'decoration {\n  rounding = 24\n  active_opacity = 0.95\n}'
              : 'Browse directory items to view further configuration metrics.'}
          </div>
        </div>
      )}
    </div>
  );
}

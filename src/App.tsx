import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { 
  LauncherSettings, 
  WidgetInstance, 
  AppWindow, 
  SystemNotification, 
  TerminalNote, 
  WidgetType 
} from './types';
import { 
  INITIAL_APPS, 
  INITIAL_WIDGETS, 
  INITIAL_NOTIFICATIONS, 
  DEFAULT_WALLPAPERS 
} from './data';
import { toArabicNumerals, formatGregorianDate } from './utils/calendar';

import PhoneFrame from './components/PhoneFrame';
import StatusBar from './components/StatusBar';
import AppDrawer, { AppIcon } from './components/AppDrawer';
import NotesTerminal from './components/NotesTerminal';
import WindowManager from './components/WindowManager';
import SettingsPanel from './components/SettingsPanel';
import WidgetContainer from './components/WidgetContainer';

export default function App() {
  // --- launcher settings state ---
  const [settings, setSettings] = useState<LauncherSettings>({
    language: 'ar', // Default Arabic natively
    theme: 'catppuccin', // Premium high-contrast blur theme
    accentColor: '#06b2d4', // Sleek cyan-500 accent color
    customActiveBorderColor: '#06b2d4',
    customInactiveBorderColor: '#1e293b',
    customThemeBg: '#050505', // Deep black
    fontFamily: '"Cairo", sans-serif',
    animationSpeed: 'normal',
    hapticFeedback: true,
    blurIntensity: 18,
    borderRadius: 24,
    gaps: 6,
    shadowColor: 'rgba(6, 182, 212, 0.45)', // Glistening cyan glow
    wallpaperUrl: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=800&q=80',
    wallpaperOpacity: 100,
    wallpaperBlur: 0,
    useArabicNumerals: true,
    statusBarPosition: 'top',
    statusBarHeight: 28,
    statusBarBlur: true,
    statusBarOpacity: 80,
    autoHideStatusBar: false,
    isPortrait: true,
    gestureSensitivity: 6
  });

  // --- other Core States ---
  const [widgets, setWidgets] = useState<WidgetInstance[]>(INITIAL_WIDGETS);
  const [windows, setWindows] = useState<AppWindow[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);
  
  // Persisted notes in simulated storage (localStorage)
  const [notes, setNotes] = useState<TerminalNote[]>(() => {
    const cached = localStorage.getItem('pine_notes_sim');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { /* ignore */ }
    }
    return [
      {
        id: 'n-first',
        title: 'أفكار لمشروع الطرفية',
        content: '# أفكار لمشروع الطرفية\n- دعم ملفات bash مخصصة في Pinephone\n- ضبط ترميز اللغة العربية RTL\n- ربط مستشعر GPS وتحديثات النواة.',
        updatedAt: '18:50',
        isPinned: true
      },
      {
        id: 'n-second',
        title: 'Hyprctl Command List',
        content: '# Hyprland Controller Cheat Sheet\n- Use `hyprctl clients` to list view window layers\n- Adjust rounding using active layout bindings.',
        updatedAt: '18:32',
        isPinned: false
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('pine_notes_sim', JSON.stringify(notes));
  }, [notes]);

  const [activeCall, setActiveCall] = useState<{ number: string; contactName: string; status: 'incoming' | 'calling' | 'active'; duration: number } | null>(null);
  const [mediaPlaying, setMediaPlaying] = useState<boolean>(false);
  const [screenshotCaptured, setScreenshotCaptured] = useState<{ url: string; time: string } | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [desktopPage, setDesktopPage] = useState<number>(1);

  const [favorites, setFavorites] = useState<string[]>(['terminal', 'browser', 'settings', 'camera']);
  const [installedApps, setInstalledApps] = useState(INITIAL_APPS);

  // --- lock / unlock screen ---
  const [isLocked, setIsLocked] = useState(true);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [lockErrorMessage, setLockErrorMessage] = useState(false);

  // --- UI shades open states ---
  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [isWallpaperChangeOpen, setIsWallpaperChangeOpen] = useState(false);

  // --- Long press Desktop empty area states ---
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [desktopMenuPos, setDesktopMenuPos] = useState({ x: 0, y: 0 });

  // Immersive Fullscreen Preview Toggle
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(70);
  const [brightness, setBrightness] = useState(100);

  // Call timer and recording timer ticks simulating OS services
  useEffect(() => {
    let callTimer: NodeJS.Timeout;
    if (activeCall && activeCall.status === 'active') {
      callTimer = setInterval(() => {
        setActiveCall(prev => prev ? { ...prev, duration: prev.duration + 1 } : null);
      }, 1000);
    }
    return () => {
      if (callTimer) clearInterval(callTimer);
    };
  }, [activeCall ? activeCall.status : null]);

  useEffect(() => {
    let recTimer: NodeJS.Timeout;
    if (isRecording) {
      recTimer = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => {
      if (recTimer) clearInterval(recTimer);
    };
  }, [isRecording]);

  // Haptic audio clicker simulation
  const playClickFeedback = () => {
    if (!settings.hapticFeedback) return;
    try {
      const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, actx.currentTime);
      gain.gain.setValueAtTime(0.05, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.1);
    } catch (e) {
      // Audio fallback blocked or not supported, ignore
    }
  };

  const showAr = settings.language === 'ar' && settings.useArabicNumerals;
  const isRTL = settings.language === 'ar';

  // Lockscreen verification code: "1390" or "١٣٩٠"
  const handlePasscodeKey = (no: string) => {
    playClickFeedback();
    setLockErrorMessage(false);
    if (passcodeInput.length >= 4) return;
    const newVal = passcodeInput + no;
    setPasscodeInput(newVal);

    if (newVal === '1390') {
      // success unlock
      setTimeout(() => {
        setIsLocked(false);
        setPasscodeInput('');
      }, 300);
    } else if (newVal.length === 4) {
      // incorrect trigger
      setTimeout(() => {
        setLockErrorMessage(true);
        setPasscodeInput('');
      }, 450);
    }
  };

  // Launch a window app channel
  const handleLaunchApp = (appId: string) => {
    playClickFeedback();
    // Check if app already has open window
    const exists = windows.find(w => w.appId === appId);
    if (exists) {
      // Pull to focus
      setWindows(prev => prev.map(w => ({
        ...w,
        focused: w.appId === appId,
        isMinimized: w.appId === appId ? false : w.isMinimized
      })));
      return;
    }

    const newWin: AppWindow = {
      id: `win-${Date.now()}`,
      appId,
      x: 10 + Math.random() * 8, // slight cascade
      y: 12 + Math.random() * 8,
      w: 80,
      h: 65,
      isMaximized: false,
      isMinimized: false,
      focused: true
    };

    setWindows(prev => prev.map(w => ({ ...w, focused: false })).concat(newWin));
  };

  // Create customized launcher icon shortcut as a dynamic widget
  const handleAddAppShortcutWidget = (appId: string) => {
    const app = installedApps.find(a => a.id === appId);
    if (!app) return;

    // Trigger app launch directly or create shortcut widget
    const newW: WidgetInstance = {
      id: `w-shortcut-${Date.now()}`,
      type: 'music', // dummy custom representation model
      x: 10 + Math.random() * 40,
      y: 40 + Math.random() * 30,
      w: 220,
      h: 80,
      opacity: 80,
      blur: true,
      borderRadius: 16,
      shadowIntensity: 'low',
      themeColor: settings.accentColor,
      customSettings: { shortcutAppId: appId }
    };
    setWidgets(prev => [...prev, newW]);
    playClickFeedback();
  };

  // Add widget from Empty desktop options list clicks
  const handleAddWidget = (type: WidgetType) => {
    playClickFeedback();
    const newW: WidgetInstance = {
      id: `w-${type}-${Date.now()}`,
      type,
      x: 12 + Math.random() * 10,
      y: 15 + Math.random() * 20,
      w: type === 'clock' ? 240 : type === 'prayer' ? 250 : type === 'sysmon' ? 230 : 220,
      h: type === 'clock' ? 90 : type === 'prayer' ? 140 : type === 'sysmon' ? 120 : 100,
      opacity: 85,
      blur: true,
      borderRadius: 24,
      shadowIntensity: 'medium',
      themeColor: settings.accentColor
    };
    setWidgets(prev => [...prev, newW]);
    setIsDesktopMenuOpen(false);
  };

  // Uninstall user application mock
  const handleUninstallApp = (appId: string) => {
    playClickFeedback();
    setInstalledApps(prev => prev.filter(a => a.id !== appId));
    setFavorites(prev => prev.filter(id => id !== appId));
    setWindows(prev => prev.filter(w => w.appId !== appId));
  };

  const handleFavoriteToggle = (appId: string) => {
    playClickFeedback();
    setFavorites(prev => 
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  // Swipe gesture triggers
  const executeLeftEdgeSwipe = () => {
    playClickFeedback();
    setIsNotesOpen(true);
    setIsSettingsOpen(false);
    setIsAppDrawerOpen(false);
  };

  const executeRightEdgeSwipe = () => {
    playClickFeedback();
    setIsSettingsOpen(true);
    setIsNotesOpen(false);
    setIsAppDrawerOpen(false);
  };

  const executeBottomSwipeUp = () => {
    playClickFeedback();
    setIsAppDrawerOpen(true);
    setIsNotesOpen(false);
    setIsSettingsOpen(false);
  };

  const executeTwoFingerWallpaperSwitcher = () => {
    playClickFeedback();
    setIsWallpaperChangeOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 transition-all duration-300">
      
      {/* Outer physical device structure */}
      <PhoneFrame
        settings={settings}
        setSettings={setSettings}
        isLocked={isLocked}
        setIsLocked={setIsLocked}
        isFullscreen={isFullscreen}
        setIsFullscreen={setIsFullscreen}
        volume={volume}
        setVolume={setVolume}
        brightness={brightness}
      >
        {/* INNER SCREEN WORKSPACE CONTAINER */}
        <div 
          id="screen-view-ports"
          className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#050505]"
          style={{
            backgroundImage: `url(${settings.wallpaperUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            fontFamily: settings.fontFamily
          }}
        >
          {/* Ambient Glow Atmosphere (Immersive UI) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] z-0">
            <div className="absolute top-[-20%] left-[-15%] w-[420px] h-[420px] bg-cyan-950/20 rounded-full blur-[90px]" />
            <div className="absolute bottom-[-20%] right-[-15%] w-[420px] h-[420px] bg-purple-950/20 rounded-full blur-[90px]" />
          </div>

          {/* Dim overlay wallpaper */}
          <div className="absolute inset-0 bg-black/45 pointer-events-none z-0" />

          {/* ACTIVE STATUS BAR AT TOP */}
          <StatusBar
            settings={settings}
            setSettings={setSettings}
            notifications={notifications}
            clearNotifications={() => setNotifications([])}
            volume={volume}
            setVolume={setVolume}
            brightness={brightness}
            setBrightness={setBrightness}
            openNotifications={() => { setIsQuickSettingsOpen(false); setIsNotesOpen(false); setIsSettingsOpen(true); }}
            isQuickSettingsOpen={isQuickSettingsOpen}
            setIsQuickSettingsOpen={setIsQuickSettingsOpen}
            activeCall={activeCall}
            setActiveCall={setActiveCall}
            mediaPlaying={mediaPlaying}
            setMediaPlaying={setMediaPlaying}
            screenshotCaptured={screenshotCaptured}
            setScreenshotCaptured={setScreenshotCaptured}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            recordingDuration={recordingDuration}
          />

          {/* =============================================
              SIMULATED BIOMETRIC LOCK SCREEN VIEW LAYER
              ============================================= */}
          {isLocked ? (
            <div 
              id="active-lockscreen-shade"
              className="absolute inset-0 bg-zinc-950/90 z-50 flex flex-col justify-between p-6 animate-fade-in font-sans"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {/* Islamic Pattern Header Decors */}
              <div className="text-center pt-10 select-none">
                <div className="text-[12px] text-zinc-500 font-bold uppercase tracking-widest mb-1 mb-2">
                  🌲 postmarketOS Linux Phone
                </div>
                {/* Big Arabian Clock in Display Typography */}
                <h1 className="text-4xl font-extrabold tracking-tight text-white font-mono leading-none mb-1">
                  {toArabicNumerals(new Date().toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), showAr)}
                </h1>
                
                {/* Unified Calendars with Hijri display */}
                <div className="text-xs text-gray-400 font-medium">
                  {formatGregorianDate(new Date(), settings.language)}
                </div>
                <div className="text-[10px] text-emerald-400 font-bold mt-1 shadow-inner bg-emerald-500/10 px-3 py-1 rounded-full max-w-[200px] mx-auto border border-emerald-500/20">
                  🌙 {new Date().toLocaleDateString(isRTL ? 'ar-SA-u-ca-islamic-umalqura-nu-arab' : 'en-US-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              {/* Pin Code dialer OR Fingerprint Touch indicator */}
              <div className="flex flex-col items-center justify-center space-y-4">
                {lockErrorMessage && (
                  <div className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-3 py-0.5 rounded border border-rose-500/20 animate-shake">
                    ⚠️ {isRTL ? 'الرقم السري خاطئ! حاول مجدداً.' : 'Incorrect passcode. Try again.'}
                  </div>
                )}

                {/* Simulated Passcode Indicator Dot rack */}
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map(pos => (
                    <div 
                      key={pos} 
                      className={`w-3 h-3 rounded-full border border-blue-500/50 transition duration-300 ${passcodeInput.length > pos ? 'bg-blue-400 active-glow' : 'bg-transparent'}`} 
                    />
                  ))}
                </div>

                <div className="text-center select-none opacity-40 hover:opacity-100 transition duration-300 space-y-2">
                  {/* Fingerprint Scanner Interactive Lock button */}
                  <div 
                    id="fingerprint-scan-hud"
                    onClick={() => {
                      playClickFeedback();
                      setIsLocked(false);
                    }}
                    className="w-16 h-16 rounded-full bg-blue-500/10 border-2 border-dashed border-blue-400/50 flex flex-col items-center justify-center text-blue-400 cursor-pointer hover:bg-blue-500/25 active:scale-95 transition mx-auto shadow-indigo-500/30 shadow-md"
                  >
                    <Icons.Fingerprint size={32} className="animate-pulse" />
                  </div>
                  <span className="text-[8px] text-gray-500 block uppercase font-bold tracking-widest font-sans">
                    {isRTL ? 'المستشعر (انقر للمحاكاة)' : 'Biometrics (Tap to unlock)'}
                  </span>
                </div>

                {/* Keypad dial */}
                <div className="grid grid-cols-3 gap-2.5 max-w-[200px] mx-auto text-center font-mono select-none">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
                    <button
                      key={n}
                      id={`lock-key-${n}`}
                      onClick={() => handlePasscodeKey(n)}
                      className="w-11 h-11 rounded-full bg-white/5 border border-white/5 text-gray-300 font-bold hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-sm"
                    >
                      {toArabicNumerals(n, showAr)}
                    </button>
                  ))}
                  <button 
                    id="lock-key-clear"
                    onClick={() => { playClickFeedback(); setPasscodeInput(''); }} 
                    className="text-[9px] text-red-400 flex items-center justify-center active:scale-90"
                  >
                    {isRTL ? 'مسح' : 'Clear'}
                  </button>
                  <button
                    id="lock-key-0"
                    onClick={() => handlePasscodeKey('0')}
                    className="w-11 h-11 rounded-full bg-white/5 border border-white/5 text-gray-300 font-bold hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-sm"
                  >
                    {toArabicNumerals('0', showAr)}
                  </button>
                  <div className="text-[7.5px] text-gray-600 flex items-center justify-center select-none font-bold">
                    PIN: 1390
                  </div>
                </div>
              </div>

              {/* Emergency Contacts simple footer text */}
              <div className="text-center pb-2">
                <span className="text-[9px] text-gray-500 font-sans tracking-tight">
                  📞 {isRTL ? 'مكالمات الطوارئ فقط (Pine-OS)' : 'Emergency calls only'}
                </span>
              </div>
            </div>
          ) : null}

          {/* =============================================
              CORE DESKTOP MAIN WINDOW AREA PORTAL
              ============================================= */}
          <div 
            id="desktop-main-canvas"
            className="flex-1 w-full relative flex flex-col justify-between"
            onDoubleClick={(e) => {
              e.preventDefault();
              // double click empty home screen to lock device
              setIsLocked(true);
            }}
            onClick={() => {
              setIsDesktopMenuOpen(false);
              setIsWallpaperChangeOpen(false);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setDesktopMenuPos({ x: e.clientX, y: e.clientY });
              setIsDesktopMenuOpen(true);
            }}
          >
            {/* Tiling and Floating Windows workspace manager */}
            <WindowManager
              settings={settings}
              setSettings={setSettings}
              windows={windows}
              setWindows={setWindows}
              installedApps={installedApps}
              volume={volume}
              brightness={brightness}
              setIsSettingsOpen={setIsSettingsOpen}
              activeCall={activeCall}
              setActiveCall={setActiveCall}
              mediaPlaying={mediaPlaying}
              setMediaPlaying={setMediaPlaying}
              setScreenshotCaptured={setScreenshotCaptured}
            />

            {/* FREEFORM DRAGGABLE WIDGETS GRAPH FOR THE WORKSPACE */}
            <WidgetContainer
              settings={settings}
              widgets={widgets}
              setWidgets={setWidgets}
              notes={notes}
              onOpenNotes={() => setIsNotesOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenApp={handleLaunchApp}
              desktopPage={desktopPage}
              setDesktopPage={setDesktopPage}
            />

            {/* INTEGRATED GESTURE TRIGGER HOTSPOTS GAUGE (Click actions overlay) */}
            <div className="absolute inset-x-0 bottom-12/12 z-20 flex justify-between pointer-events-none">
              {/* Left Edge Slide notes handler */}
              <button
                id="slide-trigger-left"
                onClick={executeLeftEdgeSwipe}
                className="absolute left-0 top-[220px] w-3 h-24 rounded-r-full bg-blue-500/20 hover:bg-blue-500/50 border-r border-blue-500/30 transition pointer-events-auto cursor-pointer"
                title="Slide Mono Terminal Notes"
              />

              {/* Right Edge Slide adjustments handler */}
              <button
                id="slide-trigger-right"
                onClick={executeRightEdgeSwipe}
                className="absolute right-0 top-[220px] w-3 h-24 rounded-l-full bg-blue-500/20 hover:bg-blue-500/50 border-l border-blue-500/30 transition pointer-events-auto cursor-pointer"
                title="Slide Settings customizer"
              />
            </div>

            {/* DYNAMIC TWO-FINGER WALLPAPER SWIPER TRIGGER BAR */}
            <button
              id="slide-trigger-two-finger-top"
              onClick={executeTwoFingerWallpaperSwitcher}
              className="absolute top-8 left-1/2 transform -translate-x-1/2 w-32 h-1.5 rounded-full bg-white/10 hover:bg-white/30 transition border border-white/5 pointer-events-auto cursor-pointer flex items-center justify-center text-[7px]"
              title="Two-finger slide down: Switch wallpaper"
            >
              <span className="scale-75 text-gray-400">⚡ WALLPAPER</span>
            </button>

            {/* FAVORITES STICKY BOTTOM QUICK LAUNCH RAIL (Empty canvas desktop icons hidden except favorites for easy launch) */}
            <div className="w-full px-4 mb-4 z-10 shrink-0">
              <div 
                className="max-w-[300px] mx-auto bg-black/60 border border-white/10 rounded-2xl md:rounded-3xl p-2 flex justify-around items-center shadow-lg hover:border-white/20 transition duration-300"
                style={{ borderRadius: `${settings.borderRadius}px` }}
              >
                {favorites.slice(0, 4).map(favId => {
                  const app = installedApps.find(a => a.id === favId);
                  if (!app) return null;
                  return (
                    <button
                      key={favId}
                      id={`fav-launch-${favId}`}
                      onClick={() => handleLaunchApp(favId)}
                      className="flex flex-col items-center justify-center p-1 cursor-pointer group active:scale-95 transition"
                      title={app.nameEn}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center text-gray-200 group-hover:scale-110 transition duration-300">
                        <AppIcon name={app.icon} size={18} />
                      </div>
                    </button>
                  );
                })}

                {/* BOTTOM SWIPE-UP DRAWER TRIGGER BUTTON ACCORD */}
                <button
                  id="bottom-swipe-trigger"
                  onClick={executeBottomSwipeUp}
                  className="w-10 h-10 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 flex items-center justify-center active:scale-95 transition"
                  title="App Drawer"
                >
                  <Icons.LayoutGrid size={18} className="animate-pulse" />
                </button>
              </div>
            </div>

            {/* DESKTOP EMPTY CANVAS OPTION MENUS CONTEXT */}
            {isDesktopMenuOpen && (
              <div 
                id="desktop-longpress-menu"
                className="absolute z-45 bg-zinc-950 border border-white/15 p-1 rounded-xl shadow-hypr w-44 text-[10.5px] font-sans"
                style={{
                  left: `${Math.max(5, Math.min(60, (desktopMenuPos.x / 400) * 100))}%`,
                  top: `${Math.max(5, Math.min(60, (desktopMenuPos.y / 800) * 100))}%`
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white/5 px-2 py-1 text-gray-400 font-bold uppercase rounded text-[8px] mb-1 text-center select-none" dir={isRTL ? 'rtl' : 'ltr'}>
                  {isRTL ? 'إضافة ودجة للشاشة' : 'Create Widgets'}
                </div>

                {([
                  { label: isRTL ? 'الساعة الرقمية' : 'Digital Clock', value: 'clock' },
                  { label: isRTL ? 'التقويم المزدوج' : 'Calendar Track', value: 'calendar' },
                  { label: isRTL ? 'رصد مواقيت الصلاة' : 'Islamic Prayers', value: 'prayer' },
                  { label: isRTL ? 'الطقس المباشر' : 'Weather Sky', value: 'weather' },
                  { label: isRTL ? 'مراقب سرعة المعالج' : 'CPU Monitors', value: 'sysmon' },
                  { label: isRTL ? 'مسودة المفكرة' : 'Draft Notes', value: 'notes' },
                  { label: isRTL ? 'مؤشر طاقة البطارية' : 'Power Battery', value: 'battery' },
                  { label: isRTL ? 'إطار الصورة' : 'Scenic Photo', value: 'photo' }
                ] as { label: string; value: WidgetType }[]).map(o => (
                  <button
                    key={o.value}
                    id={`add-widget-btn-${o.value}`}
                    onClick={() => handleAddWidget(o.value)}
                    className="w-full text-left px-2 py-1.5 hover:bg-blue-500/20 hover:text-white text-gray-300 rounded flex justify-between items-center transition"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  >
                    <span>{o.label}</span>
                    <Icons.Plus size={9} />
                  </button>
                ))}
              </div>
            )}

            {/* DYNAMIC WALLPAPER SWAPPER OVERLAY POP */}
            {isWallpaperChangeOpen && (
              <div 
                className="absolute top-12 left-1/2 transform -translate-x-1/2 w-[310px] bg-neutral-900 border border-white/10 rounded-2xl p-3 z-45 animate-fade-in shadow-xl blur-backdrop-m font-sans"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-2.5 pb-1 border-b border-white/5">
                  <span className="text-[10px] font-bold text-gray-300">{isRTL ? 'مبدل الخلفيات السريع' : 'Fast Wallpaper Swap'}</span>
                  <button onClick={() => setIsWallpaperChangeOpen(false)} className="text-gray-500 hover:text-white"><Icons.X size={12} /></button>
                </div>

                {/* Thumbnails row */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {DEFAULT_WALLPAPERS.map(wp => (
                    <button
                      key={wp.name}
                      id={`wallpaper-set-${wp.name.replace(/\s+/g, '')}`}
                      onClick={() => {
                        playClickFeedback();
                        setSettings(prev => ({ ...prev, wallpaperUrl: wp.url }));
                      }}
                      className="h-14 rounded-lg overflow-hidden relative border border-white/5 hover:border-blue-400 active:scale-95 transition"
                    >
                      <img src={wp.url} alt={wp.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-0.5">
                        <span className="text-[7px] text-gray-300 text-center scale-90 block">{wp.name}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Manual Image URL field */}
                <div className="space-y-1">
                  <label className="text-[8px] text-gray-400 block font-bold uppercase">{isRTL ? 'عنوان صورة خارجي:' : 'Custom URL path:'}</label>
                  <div className="flex gap-1">
                    <input 
                      id="wallpaper-url-input"
                      type="text" 
                      placeholder="https://..." 
                      value={settings.wallpaperUrl}
                      onChange={(e) => setSettings(prev => ({ ...prev, wallpaperUrl: e.target.value }))}
                      className="flex-1 bg-black/40 text-[8px] border border-white/10 rounded px-2 py-1 outline-none text-gray-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SWIPE SIDE PANELS COMPROMISE LISTS */}
        <NotesTerminal
          settings={settings}
          isOpen={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
          notes={notes}
          setNotes={setNotes}
        />

        <SettingsPanel
          settings={settings}
          setSettings={setSettings}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        <AppDrawer
          settings={settings}
          isOpen={isAppDrawerOpen}
          onClose={() => setIsAppDrawerOpen(false)}
          onLaunchApp={handleLaunchApp}
          onAddWidgetFromApp={handleAddAppShortcutWidget}
          favorites={favorites}
          toggleFavorite={handleFavoriteToggle}
          installedApps={installedApps}
          uninstallApp={handleUninstallApp}
        />

      </PhoneFrame>

      {/* DETAILED EDUCATIONAL DESIGN FOOTER DETAILS */}
      <div className="text-center mt-6 text-xs text-neutral-500 max-w-xl mx-auto space-y-1 select-none">
        <p>
          💡 <strong>دليل مستخدم المحاكاة السريع:</strong> 
          انقر فوق زر <strong>معاينة ملء الشاشة</strong> لتجربة الشاشة الكاملة.
        </p>
        <p>
          الرقم السري الافتراضي لشاشة القفل هو <strong>١٣٩٠ (1390)</strong> أو انقر رمز البصمة. انقر مرتين لتأمين الشاشة بالأقفال. انقر مع المطالبة بال desktop لإضافة ودجات.
        </p>
      </div>

    </div>
  );
}

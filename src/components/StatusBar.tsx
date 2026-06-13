import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Battery as BatteryIcon, 
  BatteryCharging, 
  Bluetooth, 
  Bell, 
  Clock, 
  Volume2, 
  VolumeX, 
  Sun, 
  RotateCw, 
  Moon, 
  ChevronDown, 
  Globe, 
  Tv, 
  User, 
  Key,
  Shield,
  Fingerprint,
  Phone,
  PhoneOff,
  Play,
  Pause,
  Camera,
  Video,
  Trash,
  Share2,
  Radio,
  FileText
} from 'lucide-react';
import { LauncherSettings, SystemNotification } from '../types';
import { toArabicNumerals, formatGregorianDate, formatHijriDate } from '../utils/calendar';

interface StatusBarProps {
  settings: LauncherSettings;
  setSettings: React.Dispatch<React.SetStateAction<LauncherSettings>>;
  notifications: SystemNotification[];
  clearNotifications: () => void;
  volume: number;
  setVolume: React.Dispatch<React.SetStateAction<number>>;
  brightness: number;
  setBrightness: React.Dispatch<React.SetStateAction<number>>;
  openNotifications: () => void;
  isQuickSettingsOpen: boolean;
  setIsQuickSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeCall: { number: string; contactName: string; status: 'incoming' | 'calling' | 'active'; duration: number } | null;
  setActiveCall: React.Dispatch<React.SetStateAction<{ number: string; contactName: string; status: 'incoming' | 'calling' | 'active'; duration: number } | null>>;
  mediaPlaying: boolean;
  setMediaPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  screenshotCaptured: { url: string; time: string } | null;
  setScreenshotCaptured: React.Dispatch<React.SetStateAction<{ url: string; time: string } | null>>;
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  recordingDuration: number;
}

export default function StatusBar({
  settings,
  setSettings,
  notifications,
  clearNotifications,
  volume,
  setVolume,
  brightness,
  setBrightness,
  openNotifications,
  isQuickSettingsOpen,
  setIsQuickSettingsOpen,
  activeCall,
  setActiveCall,
  mediaPlaying,
  setMediaPlaying,
  screenshotCaptured,
  setScreenshotCaptured,
  isRecording,
  setIsRecording,
  recordingDuration
}: StatusBarProps) {
  const [time, setTime] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [activeWifi, setActiveWifi] = useState(true);
  const [activeBt, setActiveBt] = useState(true);
  const [activeDND, setActiveDND] = useState(false);
  const [activeFlashlight, setActiveFlashlight] = useState(false);
  const [activeVpn, setActiveVpn] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isRTL = settings.language === 'ar';
  const showArabic = settings.language === 'ar' && settings.useArabicNumerals;

  // Format simple clock e.g. 18:59 or ١٨:٥٩
  const formatTime = () => {
    let hours = time.getHours();
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const displayH = String(hours).padStart(2, '0');
    return toArabicNumerals(`${displayH}:${minutes}`, showArabic);
  };

  const dayOfMonth = time.getDate();
  const hijriDayNumber = toArabicNumerals(((dayOfMonth + 15) % 30) || 1, showArabic); // dynamic mock index matching Umm al-Qura

  // Quick settings toggle handler with animation
  const toggleQuickSettings = () => {
    setIsQuickSettingsOpen(prev => !prev);
    if (isCalendarOpen) setIsCalendarOpen(false);
  };

  const toggleCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCalendarOpen(prev => !prev);
    if (isQuickSettingsOpen) setIsQuickSettingsOpen(false);
  };

  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'} 
      className="relative z-40 select-none"
    >
      {/* EXPOSED BAR (3 FLOATING ISLANDS ON THE TOP ROW) */}
      <div className="mx-3 mt-2.5 mb-1.5 flex justify-between items-center gap-1 bg-transparent select-none">
        
        {/* Island 1: Battery Island (Left in LTR) */}
        <div 
          id="island-battery"
          onClick={toggleQuickSettings}
          className="h-9 px-2.5 rounded-full border border-white/10 bg-black/55 backdrop-blur-xl flex items-center gap-1.5 shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:bg-neutral-900/50 cursor-pointer transition-all duration-300"
          style={{ border: '1.2px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-gray-300">{toArabicNumerals(85, showArabic)}٪</span>
            <span className="relative text-cyan-400">
              <span className="w-1 h-1 absolute right-[-2px] top-1 rounded-full bg-cyan-400 animate-pulse" />
              <BatteryCharging size={11} className="text-cyan-400" />
            </span>
          </div>
          {activeVpn && (
            <span className="text-[7.5px] bg-purple-500/25 text-purple-300 border border-purple-500/30 px-1 py-0.5 rounded uppercase font-mono leading-none tracking-wide">
              VPN
            </span>
          )}
        </div>

        {/* Island 2: Calendar Island (Center) */}
        <div 
          id="island-calendar"
          onClick={toggleCalendar}
          className="h-9 px-3 rounded-full border border-white/10 bg-black/55 backdrop-blur-xl flex items-center gap-1.5 shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:bg-neutral-900/50 cursor-pointer transition-all duration-300 mx-auto"
          style={{ border: '1.2px solid rgba(255,255,255,0.08)' }}
        >
          {notifications.length > 0 ? (
            <div 
              onClick={(e) => { e.stopPropagation(); openNotifications(); }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[8px] font-bold animate-pulse"
            >
              <Bell size={9} />
              <span>{toArabicNumerals(notifications.length, showArabic)}</span>
            </div>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          )}
          <span className="text-[10px] text-gray-200 font-semibold max-w-[125px] truncate text-center">
            {time.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' })}
            <span className="text-emerald-400 ml-1 font-bold">🌙{hijriDayNumber}</span>
          </span>
        </div>

        {/* Island 3: Clock Island (Right in LTR) */}
        <div 
          id="island-clock"
          onClick={toggleQuickSettings}
          className="h-9 px-3 rounded-full border border-white/10 bg-black/55 backdrop-blur-xl flex items-center gap-1.5 shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:bg-neutral-900/50 cursor-pointer transition-all duration-300"
          style={{ border: '1.2px solid rgba(255,255,255,0.08)' }}
        >
          {activeWifi && <Wifi size={11} className="text-cyan-400" />}
          {activeBt && <Bluetooth size={11} className="text-purple-400" />}
          <span className="font-mono text-xs font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.30)]">
            {formatTime()}
          </span>
        </div>
      </div>

      {/* CONTEXTUAL SECONDARY FLOATING ISLANDS */}
      <div className="mx-3 mb-1.5 flex flex-col gap-1.5 transition-all duration-300 relative z-30">
        
        {/* Secondary Island 1: Incoming or Active Call simulation */}
        {activeCall && (
          <div 
            id="island-call"
            className="w-full bg-emerald-950/90 border border-emerald-500/30 rounded-2xl p-2 flex items-center justify-between shadow-[0_8px_20px_rgba(0,0,0,0.6)] animate-bounce-slow"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white animate-pulse shrink-0">
                <Phone size={12} />
              </div>
              <div className="text-left font-sans" dir="ltr">
                <div className="text-[8px] font-bold text-emerald-200 leading-none">
                  {activeCall.status === 'incoming' 
                    ? (isRTL ? 'اتصال وارد...' : 'Incoming Call...') 
                    : activeCall.status === 'calling'
                    ? (isRTL ? 'جاري الاتصال...' : 'Calling...')
                    : (isRTL ? 'مكالمة جارية' : 'Active Call')}
                </div>
                <div className="text-[10px] font-black text-white truncate max-w-[130px] mt-0.5">
                  {activeCall.contactName || activeCall.number}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {activeCall.status === 'active' && (
                <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/10">
                  {Math.floor(activeCall.duration / 60)}:{(activeCall.duration % 60).toString().padStart(2, '0')}
                </span>
              )}

              {activeCall.status === 'incoming' ? (
                <>
                  <button 
                    id="island-call-answer"
                    onClick={() => setActiveCall(p => p ? { ...p, status: 'active', duration: 0 } : null)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-2 py-0.5 text-[8px] font-bold transition active:scale-90"
                  >
                    {isRTL ? 'رد' : 'Answer'}
                  </button>
                  <button 
                    id="island-call-decline"
                    onClick={() => setActiveCall(null)}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full px-2 py-0.5 text-[8px] font-bold transition active:scale-90"
                  >
                    {isRTL ? 'رفض' : 'Decline'}
                  </button>
                </>
              ) : (
                <button 
                  id="island-call-hangup"
                  onClick={() => setActiveCall(null)}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 text-[9px] font-bold transition active:scale-90"
                  title="Hang Up"
                >
                  <PhoneOff size={10} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Secondary Island 2: Music Playing simulation */}
        {mediaPlaying && (
          <div 
            id="island-music"
            className="w-full bg-rose-950/80 border border-rose-500/20 rounded-2xl p-1.5 flex items-center justify-between shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center animate-spin-slow shrink-0">
                <Radio size={10} className="text-white" />
              </div>
              <div className="text-left font-sans text-[8px] truncate max-w-[150px]" dir="ltr">
                <p className="text-rose-100 font-bold truncate leading-none mb-0.5">Evening Sunset over Cairo</p>
                <p className="text-rose-400 font-medium truncate leading-none">Arabian Chill Lofi</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button 
                id="island-music-toggle"
                onClick={() => setMediaPlaying(false)}
                className="p-1 hover:bg-white/10 rounded-full text-rose-300"
              >
                <Pause size={9} />
              </button>
            </div>
          </div>
        )}

        {/* Secondary Island 3: Screen Recording simulation */}
        {isRecording && (
          <div 
            id="island-recording"
            className="w-full bg-indigo-950/95 border border-indigo-500/25 rounded-2xl p-1.5 flex items-center justify-between shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-[8.5px] font-mono font-bold text-red-400">
                REC: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <button 
              id="island-recording-stop"
              onClick={() => setIsRecording(false)}
              className="bg-red-500/25 hover:bg-red-500 text-red-200 rounded px-1.5 py-0.5 text-[8px] font-black border border-red-500/30"
            >
              STOP
            </button>
          </div>
        )}

        {/* Secondary Island 4: Screenshot Captured toast */}
        {screenshotCaptured && (
          <div 
            id="island-screenshot"
            className="w-full bg-neutral-900 border border-white/10 rounded-2xl p-1.5 flex items-center gap-2 shadow-[0_8px_20px_rgba(0,0,0,0.65)] animate-slide-in-right"
          >
            <div className="w-6 h-6 rounded bg-neutral-800 border border-white/15 flex items-center justify-center shrink-0 object-cover overflow-hidden">
              <FileText size={11} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0 text-left font-sans select-none">
              <p className="text-[8px] font-bold text-gray-200 leading-none mb-0.5">{isRTL ? 'تم حفظ لقطة الشاشة' : 'Screenshot'}</p>
              <p className="text-[7px] text-gray-500 font-semibold leading-none">{screenshotCaptured.time}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button 
                id="screenshot-share"
                onClick={() => setScreenshotCaptured(null)}
                className="p-1 text-gray-400 hover:text-white bg-white/5 rounded"
              >
                <Share2 size={9} />
              </button>
              <button 
                id="screenshot-delete"
                onClick={() => setScreenshotCaptured(null)}
                className="p-1 text-red-400 hover:text-red-300 bg-red-500/10 rounded"
              >
                <Trash size={9} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* DUAL GREGORIAN / HIJRI CALENDAR DROP SHADE */}
      {isCalendarOpen && (
        <div 
          id="calendar-shade"
          className="absolute left-1/2 transform -translate-x-1/2 mt-1.5 w-[330px] bg-neutral-900/95 border border-white/10 rounded-2xl p-4 shadow-hypr blur-backdrop-m animate-fade-in"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-gray-100">
              {isRTL ? 'التقويم المزدوج' : 'Dual Calendar'}
            </h3>
            <button 
              id="calend-close-btn"
              onClick={() => setIsCalendarOpen(false)} 
              className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 px-2 py-0.5 rounded-md"
            >
              {isRTL ? 'إغلاق' : 'Close'}
            </button>
          </div>

          <div className="space-y-2 mb-3 bg-white/5 p-2.5 rounded-xl border border-white/5">
            <div className="text-xs text-blue-400 font-semibold text-center border-b border-white/5 pb-1">
              📅 {formatGregorianDate(time, settings.language)}
            </div>
            <div className="text-xs text-emerald-400 font-semibold text-center mt-1">
              🌙 {formatHijriDate(time, settings.language)}
            </div>
          </div>

          {/* Simple Month Mock Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, ix) => {
              const weekDaysAr = ['أحد', 'ثن', 'ثلا', 'ربع', 'خم', 'جم', 'سبت'];
              return <div key={ix} className="text-gray-500 font-bold py-1">{isRTL ? weekDaysAr[ix] : day}</div>;
            })}
            
            {Array.from({ length: 30 }).map((_, idx) => {
              const currentDayNo = idx + 1;
              const isToday = currentDayNo === dayOfMonth;
              
              // Map some Hijri day
              const hjDay = (currentDayNo + 15) % 30 || 1;

              return (
                <div 
                  key={idx}
                  className={`relative p-2 rounded-lg flex flex-col justify-between items-center min-h-[38px] border transition ${
                    isToday 
                      ? 'bg-blue-500/25 border-blue-500/50 text-white font-bold' 
                      : 'bg-white/5 border-transparent hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <span className="text-[11px] font-mono leading-none">
                    {toArabicNumerals(currentDayNo, showArabic)}
                  </span>
                  <span className="text-[8px] text-emerald-400 opacity-80 leading-none">
                    {toArabicNumerals(hjDay, showArabic)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUICK SETTINGS DROP SHADE */}
      {isQuickSettingsOpen && (
        <div 
          id="quick-settings-shade"
          className="absolute left-1/2 transform -translate-x-1/2 mt-1.5 w-[350px] bg-neutral-900/95 border border-white/10 rounded-2xl p-4 shadow-hypr blur-backdrop-m animate-slide-down"
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-blue-400" />
              <span className="text-xs font-bold text-gray-200">{formatTime()}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              {/* Language Switch Quick Action */}
              <button 
                id="qs-lang-btn"
                onClick={() => setSettings(prev => ({ ...prev, language: prev.language === 'ar' ? 'en' : 'ar' }))}
                className="flex items-center gap-1 text-[10px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 px-2.5 py-1 rounded-full text-center transition font-semibold"
              >
                <Globe size={11} />
                <span>{settings.language === 'ar' ? 'English' : 'العربية'}</span>
              </button>
              
              <button 
                id="qs-close-btn"
                onClick={() => setIsQuickSettingsOpen(false)} 
                className="text-[10px] text-gray-400 bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md"
              >
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>

          {/* Core Grid Settings Buttons */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {/* WiFi */}
            <button 
              id="qs-wifi"
              onClick={() => setActiveWifi(!activeWifi)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                activeWifi 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                  : 'bg-white/5 border-white/5 text-gray-500'
              }`}
            >
              <Wifi size={18} />
              <span className="text-[9px] mt-1 font-semibold">{isRTL ? 'واي فاي' : 'WiFi'}</span>
            </button>

            {/* Bluetooth */}
            <button 
              id="qs-bt"
              onClick={() => setActiveBt(!activeBt)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                activeBt 
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' 
                  : 'bg-white/5 border-white/5 text-gray-500'
              }`}
            >
              <Bluetooth size={18} />
              <span className="text-[9px] mt-1 font-semibold">{isRTL ? 'بلوتوث' : 'Bluetooth'}</span>
            </button>

            {/* DND */}
            <button 
              id="qs-dnd"
              onClick={() => setActiveDND(!activeDND)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                activeDND 
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' 
                  : 'bg-white/5 border-white/5 text-gray-500'
              }`}
            >
              <Moon size={18} />
              <span className="text-[9px] mt-1 font-semibold">{isRTL ? 'عدم الإزعاج' : 'DND'}</span>
            </button>

            {/* Flashlight */}
            <button 
              id="qs-flash"
              onClick={() => setActiveFlashlight(!activeFlashlight)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                activeFlashlight 
                  ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300' 
                  : 'bg-white/5 border-white/5 text-gray-500'
              }`}
            >
              <Sun size={18} />
              <span className="text-[9px] mt-1 font-semibold">{isRTL ? 'كشاف' : 'Torch'}</span>
            </button>

            {/* Rotation */}
            <button 
              id="qs-rotate"
              onClick={() => setSettings(prev => ({ ...prev, isPortrait: !prev.isPortrait }))}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border bg-white/5 border-white/5 text-teal-300 hover:bg-white/10 transition`}
            >
              <RotateCw size={18} />
              <span className="text-[9px] mt-1 font-semibold">{isRTL ? 'الحركة' : 'Rotate'}</span>
            </button>

            {/* VPN */}
            <button 
              id="qs-vpn"
              onClick={() => setActiveVpn(!activeVpn)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                activeVpn 
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' 
                  : 'bg-white/5 border-white/5 text-gray-500'
              }`}
            >
              <Key size={18} />
              <span className="text-[9px] mt-1 font-semibold">{isRTL ? 'الشبكة الخاصة' : 'VPN'}</span>
            </button>

            {/* Haptics */}
            <button 
              id="qs-haptic"
              onClick={() => setSettings(prev => ({ ...prev, hapticFeedback: !prev.hapticFeedback }))}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                settings.hapticFeedback 
                  ? 'bg-pink-500/20 border-pink-500/40 text-pink-300' 
                  : 'bg-white/5 border-white/5 text-gray-500'
              }`}
            >
              <Fingerprint size={18} />
              <span className="text-[9px] mt-1 font-semibold">{isRTL ? 'الاهتزاز' : 'Haptic'}</span>
            </button>

            {/* Numeral systems */}
            <button 
              id="qs-nums"
              onClick={() => setSettings(prev => ({ ...prev, useArabicNumerals: !prev.useArabicNumerals }))}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                settings.useArabicNumerals 
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                  : 'bg-white/5 border-white/5 text-gray-500'
              }`}
            >
              <span className="text-sm font-bold">١٢٣</span>
              <span className="text-[9px] mt-1 font-semibold">{isRTL ? 'الأرقام' : 'Numerals'}</span>
            </button>

            {/* Simulated Screenshot Tool */}
            <button 
              id="qs-screenshot"
              onClick={() => {
                setScreenshotCaptured({
                  url: 'screenshot',
                  time: new Date().toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })
                });
                setIsQuickSettingsOpen(false);
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border bg-white/5 border-white/5 text-rose-400 hover:bg-white/10 transition`}
            >
              <Camera size={18} />
              <span className="text-[9px] mt-1 font-semibold">{isRTL ? 'لقطة شاشة' : 'Capture'}</span>
            </button>

            {/* Simulated Screen Recording */}
            <button 
              id="qs-recording"
              onClick={() => {
                setIsRecording(!isRecording);
                setIsQuickSettingsOpen(false);
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                isRecording 
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
                  : 'bg-white/5 border-white/5 text-gray-400'
              }`}
            >
              <Video size={18} />
              <span className="text-[9px] mt-1 font-semibold">{isRTL ? 'تسجيل' : 'Record'}</span>
            </button>
          </div>

          {/* Quick Sliders */}
          <div className="space-y-3 bg-white/5 p-3 rounded-2xl border border-white/5">
            {/* Brightness */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] text-gray-400 px-1 font-semibold">
                <span>{isRTL ? 'السطوع' : 'Brightness'}</span>
                <span>{toArabicNumerals(brightness, showArabic)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Sun size={14} className="text-yellow-400" />
                <input 
                  type="range" 
                  min="20" 
                  max="100" 
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Volume */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] text-gray-400 px-1 font-semibold">
                <span>{isRTL ? 'الصوت' : 'Volume'}</span>
                <span>{toArabicNumerals(volume, showArabic)}%</span>
              </div>
              <div className="flex items-center gap-2">
                {volume === 0 ? <VolumeX size={14} className="text-gray-400" /> : <Volume2 size={14} className="text-blue-400" />}
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Bottom simple buttons info */}
          <div className="mt-3 text-center">
            <span className="text-[9px] font-mono text-gray-500">
              Hypr-Shell-Mobile_v1.0.a
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

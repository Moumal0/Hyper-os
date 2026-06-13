import React from 'react';
import { RotateCw, Maximize2, Minimize2, Power, Volume2, VolumeX } from 'lucide-react';
import { LauncherSettings } from '../types';

interface PhoneFrameProps {
  children: React.ReactNode;
  settings: LauncherSettings;
  setSettings: React.Dispatch<React.SetStateAction<LauncherSettings>>;
  isLocked: boolean;
  setIsLocked: React.Dispatch<React.SetStateAction<boolean>>;
  isFullscreen: boolean;
  setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
  volume: number;
  setVolume: React.Dispatch<React.SetStateAction<number>>;
  brightness: number;
}

export default function PhoneFrame({
  children,
  settings,
  setSettings,
  isLocked,
  setIsLocked,
  isFullscreen,
  setIsFullscreen,
  volume,
  setVolume,
  brightness
}: PhoneFrameProps) {
  const toggleOrientation = () => {
    setSettings(prev => ({
      ...prev,
      isPortrait: !prev.isPortrait
    }));
  };

  const handleVolumeUp = () => {
    setVolume(prev => Math.min(prev + 10, 100));
  };

  const handleVolumeDown = () => {
    setVolume(prev => Math.max(prev - 10, 0));
  };

  const handlePowerButton = () => {
    setIsLocked(prev => !prev);
  };

  // If in immersive fullscreen preview, directly output screen contents
  if (isFullscreen) {
    return (
      <div 
        id="immersive-phone-screen"
        className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none"
        style={{ filter: `brightness(${brightness}%)` }}
      >
        {/* Fullscreen Floating Controls panel */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 opacity-30 hover:opacity-100 transition-opacity duration-300">
          <button 
            id="control-rotate"
            onClick={toggleOrientation} 
            className="p-1 text-white hover:text-blue-400 transition" 
            title="Toggle Orientation"
          >
            <RotateCw size={14} />
          </button>
          <button 
            id="control-exit-fullscreen"
            onClick={() => setIsFullscreen(false)} 
            className="p-1 text-white hover:text-red-400 transition" 
            title="Exit Immersive Mode"
          >
            <Minimize2 size={14} />
          </button>
          <span className="text-[10px] text-gray-400 border-l border-white/10 pl-2">
            {settings.isPortrait ? 'Portrait' : 'Landscape'}
          </span>
        </div>
        {children}
      </div>
    );
  }

  // Device sizes
  // Portrait: 400px x 820px, Landscape: 820px x 400px
  const screenStyles = settings.isPortrait
    ? { width: '380px', height: '800px' }
    : { width: '800px', height: '380px' };

  return (
    <div id="device-container" className="flex flex-col items-center justify-center min-h-[92vh] py-6 px-4">
      {/* Simulation Meta Header Options */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6 bg-neutral-900/60 backdrop-blur-md p-3 rounded-2xl border border-neutral-800/80 max-w-xl text-center">
        <h2 className="text-sm font-semibold text-neutral-200">
          🌲 PinePhone Pro / Librem 5 Wayland Shell Simulator
        </h2>
        <div className="flex gap-2">
          <button
            id="btn-toggle-rotate"
            onClick={toggleOrientation}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition font-medium"
          >
            <RotateCw size={13} />
            {settings.isPortrait ? 'تدوير لأفقي (Landscape)' : 'تدوير لعمودي (Portrait)'}
          </button>
          <button
            id="btn-toggle-fullscreen"
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition font-medium"
          >
            <Maximize2 size={13} />
            ملء الشاشة (Immersive)
          </button>
        </div>
      </div>

      {/* Main Physical Phone Wrapper */}
      <div className="relative flex items-center justify-center">
        
        {/* PHYSICAL HARDWARE BUTTONS (positioned on right of vertical phone or top of landscape phone) */}
        {settings.isPortrait ? (
          <>
            {/* Volume Up */}
            <button 
              id="volume-up-btn"
              onClick={handleVolumeUp}
              className="absolute -left-3.5 top-[180px] w-3.5 h-12 bg-neutral-800 border-y border-l border-neutral-700 rounded-l-md hover:bg-neutral-600 transition shadow-inner z-10 cursor-pointer"
              title="Volume Up"
            />
            {/* Volume Down */}
            <button 
              id="volume-down-btn"
              onClick={handleVolumeDown}
              className="absolute -left-3.5 top-[236px] w-3.5 h-12 bg-neutral-800 border-y border-l border-neutral-700 rounded-l-md hover:bg-neutral-600 transition shadow-inner z-10 cursor-pointer"
              title="Volume Down"
            />
            {/* Power Button */}
            <button 
              id="power-btn"
              onClick={handlePowerButton}
              className="absolute -right-3.5 top-[210px] w-3.5 h-16 bg-neutral-800 border-y border-r border-neutral-700 rounded-r-md hover:bg-red-900 transition shadow-inner z-10 cursor-pointer flex items-center justify-center text-red-500"
              title="Power/Lock Switch"
            >
              <Power size={10} />
            </button>
          </>
        ) : (
          <>
            {/* Volume buttons situated at the top-left in landscape */}
            <button 
              id="volume-up-landscape-btn"
              onClick={handleVolumeUp}
              className="absolute top-[-3.5px] left-[180px] w-12 h-3.5 bg-neutral-800 border-x border-t border-neutral-700 rounded-t-md hover:bg-neutral-600 transition shadow-inner z-10 cursor-pointer"
              title="Volume Up"
            />
            <button 
              id="volume-down-landscape-btn"
              onClick={handleVolumeDown}
              className="absolute top-[-3.5px] left-[236px] w-12 h-3.5 bg-neutral-800 border-x border-t border-neutral-700 rounded-t-md hover:bg-neutral-600 transition shadow-inner z-10 cursor-pointer"
              title="Volume Down"
            />
            <button 
              id="power-landscape-btn"
              onClick={handlePowerButton}
              className="absolute bottom-[-3.5px] left-[210px] w-16 h-3.5 bg-neutral-800 border-x border-b border-neutral-700 rounded-b-md hover:bg-red-900 transition shadow-inner z-10 cursor-pointer"
              title="Power/Lock Switch"
            />
          </>
        )}

        {/* Outer Phone Case Ring */}
        <div 
          className="bg-neutral-900 p-3.5 rounded-[44px] border-4 border-neutral-800 shadow-hypr flex items-center justify-center transition-all duration-500 ease-out"
          style={{
            ...screenStyles,
            boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.9), insert 0 0 10px rgba(255,255,255,0.05)'
          }}
        >
          {/* Internal Screen Area */}
          <div 
            id="simulated-phone-screen"
            className="relative w-full h-full bg-black rounded-[30px] overflow-hidden flex flex-col cursor-default select-none border border-neutral-950"
            style={{ filter: `brightness(${brightness}%)` }}
          >
            {/* Camera/Speaker Notch (At top of portrait device) */}
            {settings.isPortrait && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-5 bg-neutral-900 rounded-b-xl z-50 flex items-center justify-center gap-4">
                {/* Speaker grill */}
                <div className="w-12 h-1 bg-neutral-800 rounded-full" />
                {/* Camera Lens */}
                <div className="w-2.5 h-2.5 bg-neutral-950 rounded-full border border-neutral-800 flex items-center justify-center">
                  <div className="w-1 h-1 bg-blue-900 rounded-full" />
                </div>
              </div>
            )}

            {/* Simulated hardware volume HUD overlay */}
            <VolumeHUD volume={volume} />

            {/* Screen Content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline Sub-component for Volume Indicator Hook
function VolumeHUD({ volume }: { volume: number }) {
  const [show, setShow] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setShow(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShow(false), 1500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [volume]);

  if (!show) return null;

  return (
    <div className="absolute top-12 left-4 z-50 bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 flex items-center gap-3 animate-fade-in pointer-events-none">
      {volume === 0 ? <VolumeX className="text-gray-400" size={14} /> : <Volume2 className="text-blue-400" size={14} />}
      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${volume}%` }} />
      </div>
      <span className="text-[10px] text-gray-300 font-mono">{volume}%</span>
    </div>
  );
}

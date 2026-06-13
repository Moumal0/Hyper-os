import React, { useState } from 'react';
import { 
  X, 
  Palette, 
  Sparkles, 
  SlidersHorizontal, 
  Terminal, 
  Download, 
  Check, 
  RefreshCw, 
  Layers, 
  Compass, 
  Cpu, 
  BookOpen,
  Eye,
  Info
} from 'lucide-react';
import { LauncherSettings, ThemeType } from '../types';
import { toArabicNumerals } from '../utils/calendar';

interface SettingsPanelProps {
  settings: LauncherSettings;
  setSettings: React.Dispatch<React.SetStateAction<LauncherSettings>>;
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({
  settings,
  setSettings,
  isOpen,
  onClose
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'appearance' | 'behavior' | 'advanced' | 'export'>('appearance');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [cssInput, setCssInput] = useState('/* Add custom CSS layers */\n#simulated-phone-screen {\n  font-family: "Cairo";\n}');
  const [importConfigInput, setImportConfigInput] = useState('');
  const [showNotification, setShowNotification] = useState(false);

  const isRTL = settings.language === 'ar';
  const showArabic = settings.language === 'ar' && settings.useArabicNumerals;

  const fontOptions = [
    { label: 'Cairo (عربي)', value: '"Cairo", sans-serif' },
    { label: 'Tajawal (عربي)', value: '"Tajawal", sans-serif' },
    { label: 'Amiri Serif (عربي)', value: '"Amiri", serif' },
    { label: 'Inter (English)', value: '"Inter", sans-serif' },
    { label: 'Monospace (JetBrains)', value: '"JetBrains Mono", monospace' }
  ];

  const presets: Record<ThemeType, Partial<LauncherSettings>> = {
    'material-you': {
      accentColor: '#3b82f6',
      customActiveBorderColor: '#3b82f6',
      customInactiveBorderColor: '#1e293b',
      shadowColor: 'rgba(59, 130, 246, 0.40)',
      borderRadius: 24,
      gaps: 8
    },
    'nord': {
      accentColor: '#88c0d0',
      customActiveBorderColor: '#88c0d0',
      customInactiveBorderColor: '#4c566a',
      shadowColor: 'rgba(136, 192, 208, 0.25)',
      borderRadius: 12,
      gaps: 6
    },
    'gruvbox': {
      accentColor: '#fabd2f',
      customActiveBorderColor: '#fabd2f',
      customInactiveBorderColor: '#7c6f64',
      shadowColor: 'rgba(250, 189, 47, 0.30)',
      borderRadius: 4,
      gaps: 4
    },
    'catppuccin': {
      accentColor: '#cba6f7',
      customActiveBorderColor: '#cba6f7',
      customInactiveBorderColor: '#585b70',
      shadowColor: 'rgba(203, 166, 247, 0.35)',
      borderRadius: 16,
      gaps: 10
    },
    'custom': {}
  };

  const handleThemeChange = (t: ThemeType) => {
    const presetVals = presets[t];
    setSettings(prev => ({
      ...prev,
      theme: t,
      ...presetVals
    }));
  };

  // Click copies code triggers
  const handleCopyCode = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const hyprConfigSample = `# Hyprland Wayland Mobile Configuration (~/.config/hypr/hyprland.conf)
# Generated dynamically for Linux mobile phones (PinePhone / Librem 5)

gaps_in = ${settings.gaps}
gaps_out = ${settings.gaps * 2}
border_size = 2
col.active_border = rgb(${settings.accentColor.replace('#', '') || '3b82f6'})
col.inactive_border = rgba(88, 8b, 112, 0.5)

decoration {
  rounding = ${settings.borderRadius}
  blur {
    enabled = true
    size = ${settings.blurIntensity}
    passes = 3
  }
}

gestures {
  workspace_swipe = true
  workspace_swipe_fingers = 3
}

# Bindings for mobile phone shells
bind = SUPER, Q, killactive
bind = SUPER, F, togglefloating
bind = SUPER, H, movefocus, l
bind = SUPER, L, movefocus, r
`;

  const installScriptSample = `#!/bin/bash
# Bootstrap Script to setup Hyprland Mobile UI with Arabic Locale support
# Compatible with postmarketOS, Mobian, and Arch Linux ARM

echo "🌲 Initializing Hyprland Arabic Shell setup..."
sudo apk update || sudo pacman -Syu || sudo apt update

echo "📦 Installing Wayland compositor packages and Arabic fonts..."
if [ -f /etc/alpine-release ]; then
  # postmarketOS
  sudo apk add hyprland wlroots xwayland seatd font-cairo font-tajawal
elif [ -f /etc/arch-release ]; then
  # Arch Linux ARM
  sudo pacman -S --needed hyprland wlroots ttf-cairo ttf-tajawal alsa-utils upower networkmanager
else
  # Debian/Mobian
  sudo apt install -y hyprland wlroots fonts-cairo fonts-tajawal brightnessctl upower
fi

echo "🗄️ Creating configuration files in ~/.config/launcher..."
mkdir -p ~/.config/launcher/notes
mkdir -p ~/.config/launcher/wallpapers

cat <<EOF > ~/.config/launcher/config.toml
[theme]
accent = "${settings.accentColor}"
rounding = ${settings.borderRadius}
gaps = ${settings.gaps}
font = "${settings.fontFamily}"
language = "${settings.language}"
EOF

echo "🌙 Setting up regional Arabic RTL parameters..."
sudo localectl set-locale LANG=ar_SA.UTF-8

echo "🚀 Setup complete! Run 'hyprland' via terminal to launch the mobile shell."
`;

  if (!isOpen) return null;

  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'}
      className="absolute inset-y-0 right-0 w-[92%] max-w-[340px] z-35 flex flex-col border-l border-white/10 shadow-hypr animate-slide-left font-sans text-gray-100"
      style={{
        backgroundColor: 'rgba(12, 15, 18, 0.96)',
        backdropFilter: `blur(${settings.blurIntensity}px)`
      }}
    >
      {/* Panel Sticky Header */}
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40 shrink-0">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-blue-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider">
            {isRTL ? 'إعدادات مخصصة لـ Hyprland' : 'Shell Adjustments'}
          </h2>
        </div>
        <button 
          id="btn-close-settings"
          onClick={onClose} 
          className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition"
        >
          <X size={15} />
        </button>
      </div>

      {/* Internal Tab selectors */}
      <div className="flex bg-black/20 border-b border-white/5 text-[9px] shrink-0 font-sans">
        <button
          id="tab-appearance"
          onClick={() => setActiveTab('appearance')}
          className={`flex-1 py-2 font-bold transition ${activeTab === 'appearance' ? 'bg-white/5 border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
        >
          {isRTL ? 'المظهر' : 'Appearance'}
        </button>
        <button
          id="tab-behavior"
          onClick={() => setActiveTab('behavior')}
          className={`flex-1 py-2 font-bold transition ${activeTab === 'behavior' ? 'bg-white/5 border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
        >
          {isRTL ? 'السلوك' : 'Behavior'}
        </button>
        <button
          id="tab-advanced"
          onClick={() => setActiveTab('advanced')}
          className={`flex-1 py-2 font-bold transition ${activeTab === 'advanced' ? 'bg-white/5 border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
        >
          {isRTL ? 'متقدم' : 'Advanced'}
        </button>
        <button
          id="tab-export"
          onClick={() => setActiveTab('export')}
          className={`flex-1 py-2 font-bold transition ${activeTab === 'export' ? 'bg-white/5 border-b-2 border-emerald-500 text-emerald-400' : 'text-gray-400'}`}
        >
          {isRTL ? 'تصدير' : 'Scripts'}
        </button>
      </div>

      {/* Expandable Tabs content wrapper */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* APPEARANCE CONFIG TAB */}
        {activeTab === 'appearance' && (
          <div className="space-y-4 text-xs">
            {/* Theme selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase">{isRTL ? 'المظهر العام (Presets):' : 'System Theme presets:'}</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['material-you', 'nord', 'gruvbox', 'catppuccin', 'custom'] as ThemeType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => handleThemeChange(t)}
                    className={`py-1.5 px-2.5 rounded-lg border text-center font-bold text-[10px] transition capitalize ${
                      settings.theme === t 
                        ? 'bg-blue-500/25 border-blue-500 text-blue-400' 
                        : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {t.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color pickers */}
            <div className="space-y-1.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-gray-400 font-bold uppercase">{isRTL ? 'لون التأثير الرئيسي (Accent):' : 'Accent Glow Color:'}</label>
                <div className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: settings.accentColor }} />
              </div>
              <input 
                type="color" 
                value={settings.accentColor} 
                onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value, theme: 'custom' }))}
                className="w-full h-8 bg-black/40 border border-white/10 rounded cursor-pointer"
              />
            </div>

            {/* Border glow and rounding styles */}
            <div className="space-y-3 bg-white/5 p-2.5 rounded-xl border border-white/5">
              {/* Corner radius radius */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                  <span>{isRTL ? 'حواف النوافذ (Rounding):' : 'Corner Rounding:'}</span>
                  <span>{toArabicNumerals(settings.borderRadius, showArabic)}px</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="32" 
                  value={settings.borderRadius}
                  onChange={(e) => setSettings(prev => ({ ...prev, borderRadius: Number(e.target.value) }))}
                  className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-blue-400"
                />
              </div>

              {/* Gaps window offset */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                  <span>{isRTL ? 'فراغ تباعد النوافذ (Gaps):' : 'Tiled Layout Gaps:'}</span>
                  <span>{toArabicNumerals(settings.gaps, showArabic)}px</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="20" 
                  value={settings.gaps}
                  onChange={(e) => setSettings(prev => ({ ...prev, gaps: Number(e.target.value) }))}
                  className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-blue-400"
                />
              </div>
            </div>

            {/* Font selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase">{isRTL ? 'نوع الخط الهيكلي:' : 'Typography Face:'}</label>
              <select 
                value={settings.fontFamily}
                onChange={(e) => setSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                className="w-full bg-neutral-900 border border-white/10 rounded-xl py-1.5 px-3 text-[10px] text-gray-200 outline-none focus:border-blue-500"
              >
                {fontOptions.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* BEHAVIOR / GESTURE CONFIG TAB */}
        {activeTab === 'behavior' && (
          <div className="space-y-4 text-xs">
            {/* Gesture list sensitivity */}
            <div className="space-y-1.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
              <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                <span>{isRTL ? 'حساسية الإيماءات باللمس:' : 'Touch Swipe Sensitivity:'}</span>
                <span>{toArabicNumerals(settings.gestureSensitivity, showArabic)}/10</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={settings.gestureSensitivity}
                onChange={(e) => setSettings(prev => ({ ...prev, gestureSensitivity: Number(e.target.value) }))}
                className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-blue-400"
              />
              <div className="text-[8px] text-gray-500 italic mt-1 leading-relaxed">
                {isRTL ? 'يتحكم في سرعة استجابة السحب من الحواف لاستدعاء النوطات واللوحات الجانبية.' : 'Governs edge sliding gestures for notes terminal and notification islands.'}
              </div>
            </div>

            {/* Arabic Localization switches */}
            <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-white/5">
              <div className="text-[10px] text-gray-400 font-bold uppercase border-b border-white/5 pb-1 mb-1">{isRTL ? 'التحكم الإقليمي والتوطين:' : 'Regional & Localization:'}</div>
              
              {/* Force RTL Layout Toggle */}
              <div className="flex justify-between items-center py-1">
                <span className="text-[10.5px] text-gray-300 font-semibold">{isRTL ? 'تفعيل الاتجاه العربي (RTL)' : 'Arabic Direction (RTL)'}</span>
                <input 
                  type="checkbox"
                  checked={settings.language === 'ar'}
                  onChange={() => setSettings(prev => ({ ...prev, language: prev.language === 'ar' ? 'en' : 'ar' }))}
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Force Arabic Indian numerals */}
              <div className="flex justify-between items-center py-1">
                <span className="text-[10.5px] text-gray-300 font-semibold">{isRTL ? 'استخدام الأرقام المشرقية (١٢٣)' : 'Arabic Indian Numerals'}</span>
                <input 
                  type="checkbox"
                  checked={settings.useArabicNumerals}
                  onChange={() => setSettings(prev => ({ ...prev, useArabicNumerals: !prev.useArabicNumerals }))}
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Haptics controller */}
            <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-gray-300 font-semibold">{isRTL ? 'اهتزاز ملمسي عند النقر (Haptic):' : 'In-App Haptic Feedback:'}</span>
              <input 
                type="checkbox"
                checked={settings.hapticFeedback}
                onChange={() => setSettings(prev => ({ ...prev, hapticFeedback: !prev.hapticFeedback }))}
                className="w-4 h-4 accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ADVANCED CUSTOM CSS INJECTION */}
        {activeTab === 'advanced' && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase">{isRTL ? 'حقن ورق جدران وبكسل مخصص CSS:' : 'Custom CSS Injection:'}</label>
              <textarea 
                id="settings-css-area"
                value={cssInput}
                onChange={(e) => setCssInput(e.target.value)}
                className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-2.5 font-mono text-[9px] text-emerald-400 outline-none focus:border-blue-500"
              />
            </div>

            {/* Performance simulation info */}
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 text-[9px] font-mono space-y-1 leading-relaxed text-gray-400">
              <div className="text-blue-400 font-bold uppercase text-[10px] pb-0.5 border-b border-white/5 mb-1 flex items-center gap-1">
                <Cpu size={12} />
                <span>Wayland Debugger</span>
              </div>
              <div>Frame paced: 60.13 FPS (Stable)</div>
              <div>Renderer: GLES v3.2 (Mali-T860 ARM)</div>
              <div>IPC Socket: /run/user/1000/wayland-0</div>
              <div>Launcher Memory: 74 MB / 150 MB limit</div>
            </div>
          </div>
        )}

        {/* EXPORT WORKSPACE TABS */}
        {activeTab === 'export' && (
          <div className="space-y-4 text-xs font-sans">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-[10px] leading-relaxed flex items-start gap-2">
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>
                {isRTL 
                  ? 'هذا القسم يتيح لمطوري لينكس نسخ أكواد وإسكربتات تثبيت حقيقية لتشغيل واجهة Hyprland المخصصة على هواتف PinePhone أو Librem5 بالتوطين العربي الكامل!' 
                  : 'Get real shell bootstrap automation scripts and Hyprland config structures customized with your selected ratios to use on any real ARM device.'}
              </span>
            </div>

            {/* Config Item Exporter */}
            <div className="space-y-1 bg-neutral-900 border border-white/10 p-2.5 rounded-xl">
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-300 pb-1.5 border-b border-white/5">
                <span>📄 hyprland.conf</span>
                <button 
                  id="btn-copy-hypr"
                  onClick={() => handleCopyCode(hyprConfigSample, 'hypr')}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold font-mono flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[8px]"
                >
                  {copiedType === 'hypr' ? <Check size={8} /> : <Download size={8} />}
                  <span>{copiedType === 'hypr' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-[7.5px] text-gray-400 max-h-[85px] overflow-y-auto whitespace-pre font-mono scrollbar-thin pt-2">
                {hyprConfigSample}
              </pre>
            </div>

            {/* Shell Script Exporter */}
            <div className="space-y-1 bg-neutral-900 border border-white/10 p-2.5 rounded-xl">
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-300 pb-1.5 border-b border-white/5">
                <span>🚀 distro-setup.sh</span>
                <button 
                  id="btn-copy-sh"
                  onClick={() => handleCopyCode(installScriptSample, 'sh')}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold font-mono flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[8px]"
                >
                  {copiedType === 'sh' ? <Check size={8} /> : <Download size={8} />}
                  <span>{copiedType === 'sh' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-[7.5px] text-gray-400 max-h-[85px] overflow-y-auto whitespace-pre font-mono scrollbar-thin pt-2">
                {installScriptSample}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export type ThemeType = 'material-you' | 'nord' | 'gruvbox' | 'catppuccin' | 'custom';

export interface LauncherSettings {
  language: 'ar' | 'en';
  theme: ThemeType;
  accentColor: string;
  customActiveBorderColor: string;
  customInactiveBorderColor: string;
  customThemeBg: string;
  fontFamily: string;
  animationSpeed: 'instant' | 'fast' | 'normal' | 'slow';
  hapticFeedback: boolean;
  blurIntensity: number; // in px
  borderRadius: number; // in px
  gaps: number; // gaps in tiles (px)
  shadowColor: string;
  wallpaperUrl: string;
  wallpaperOpacity: number;
  wallpaperBlur: number;
  useArabicNumerals: boolean;
  statusBarPosition: 'top' | 'bottom';
  statusBarHeight: number;
  statusBarBlur: boolean;
  statusBarOpacity: number;
  autoHideStatusBar: boolean;
  isPortrait: boolean;
  gestureSensitivity: number; // 1-10
}

export type WidgetType = 
  | 'clock' 
  | 'calendar' 
  | 'weather' 
  | 'photo' 
  | 'music' 
  | 'sysmon' 
  | 'notes' 
  | 'prayer' 
  | 'battery' 
  | 'network';

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  x: number; // percentage width 0-100
  y: number; // percentage height 0-100
  w: number; // width in px (base resizable)
  h: number; // height in px (base resizable)
  opacity: number; // 0-100
  blur: boolean;
  borderRadius: number;
  shadowIntensity: 'none' | 'low' | 'medium' | 'high';
  themeColor: string;
  customSettings?: Record<string, string | number | boolean>;
}

export interface AppInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string; // Lucide icon identifier
  category: 'system' | 'utilities' | 'office' | 'media' | 'games';
  isFavorite?: boolean;
}

export interface AppWindow {
  id: string;
  appId: string;
  x: number; // percentage
  y: number; // percentage
  w: number; // percentage
  h: number; // percentage
  isMaximized: boolean;
  isMinimized: boolean;
  focused: boolean;
  splitLayout?: 'none' | 'left' | 'right';
}

export interface SystemNotification {
  id: string;
  appId: string;
  title: string;
  body: string;
  timestamp: string;
  pinned: boolean;
}

export interface TerminalNote {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  isPinned: boolean;
}

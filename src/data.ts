import { AppInfo, WidgetInstance, SystemNotification } from './types';

export const INITIAL_APPS: AppInfo[] = [
  { id: 'terminal', nameAr: 'الطرفية', nameEn: 'Terminal', icon: 'Terminal', category: 'system' },
  { id: 'settings', nameAr: 'الإعدادات', nameEn: 'Settings', icon: 'Settings', category: 'system' },
  { id: 'files', nameAr: 'مدير الملفات', nameEn: 'File Manager', icon: 'FolderOpen', category: 'system' },
  { id: 'phone', nameAr: 'الهاتف', nameEn: 'Phone Dialer', icon: 'Phone', category: 'system', isFavorite: true },
  { id: 'camera', nameAr: 'الكاميرا', nameEn: 'Camera', icon: 'Camera', category: 'utilities', isFavorite: true },
  { id: 'calculator', nameAr: 'الحاسبة', nameEn: 'Calculator', icon: 'Calculator', category: 'utilities' },
  { id: 'browser', nameAr: 'المتصفح', nameEn: 'Navigator', icon: 'Globe', category: 'utilities', isFavorite: true },
  { id: 'music', nameAr: 'المشغل الموسيقي', nameEn: 'Music Player', icon: 'Music', category: 'media', isFavorite: true },
  { id: 'securespot', nameAr: 'الملف الآمن', nameEn: 'Secure Vault', icon: 'ShieldAlert', category: 'office' },
  { id: 'weather_app', nameAr: 'الطقس', nameEn: 'Weather Core', icon: 'CloudRain', category: 'utilities' },
];

export const INITIAL_WIDGETS: WidgetInstance[] = [
  {
    id: 'w-clock',
    type: 'clock',
    x: 10,
    y: 8,
    w: 240,
    h: 120,
    opacity: 85,
    blur: true,
    borderRadius: 24,
    shadowIntensity: 'high',
    themeColor: '#3b82f6',
  },
  {
    id: 'w-prayer',
    type: 'prayer',
    x: 10,
    y: 28,
    w: 240,
    h: 180,
    opacity: 75,
    blur: true,
    borderRadius: 24,
    shadowIntensity: 'medium',
    themeColor: '#10b981',
  },
  {
    id: 'w-music',
    type: 'music',
    x: 10,
    y: 60,
    w: 240,
    h: 100,
    opacity: 80,
    blur: true,
    borderRadius: 24,
    shadowIntensity: 'low',
    themeColor: '#f43f5e',
  }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'n-1',
    appId: 'securespot',
    title: 'تحديث أمان ورابط جديد',
    body: 'تم ترقية نواة Wayland إلى الإصدار v1.23.0 بنجاح.',
    timestamp: '18:30',
    pinned: true,
  },
  {
    id: 'n-2',
    appId: 'music',
    title: 'مشغل الموسيقى',
    body: 'الآن يتم تشغيل: Lofi Arab Beats - Evening in Cairo.',
    timestamp: '18:15',
    pinned: false,
  },
  {
    id: 'n-3',
    appId: 'browser',
    title: 'تنبيه البريد الإلكتروني',
    body: 'لقد استلمت رسالة بريد جديدة من Pine64 Community.',
    timestamp: '17:45',
    pinned: false,
  }
];

export const DEFAULT_WALLPAPERS = [
  {
    name: 'Desert Sunset',
    url: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=800&q=80',
    darkUrl: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Hypr Minimalist',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    darkUrl: 'https://images.unsplash.com/photo-1618005198143-e5283464365b?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Cairo Geometry',
    url: 'https://images.unsplash.com/photo-1549490339-b2f516a623e4?auto=format&fit=crop&w=800&q=80',
    darkUrl: 'https://images.unsplash.com/photo-1554483753-fef8c72cfeb1?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Cyberpunk Neon',
    url: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=800&q=80',
    darkUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
  }
];

export const SECTIONS_AR = {
  appearance: 'المظهر',
  behavior: 'السلوك والخيارات',
  gestures: 'الإيماءات',
  widgets: 'الودجات والأدوات',
  apps: 'التطبيقات والتحكم',
  system: 'النظام والمطور',
  about: 'حول Launcher'
};

export const SECTIONS_EN = {
  appearance: 'Appearance',
  behavior: 'Behavior',
  gestures: 'Gestures',
  widgets: 'Widgets',
  apps: 'Apps & Management',
  system: 'System / Advanced',
  about: 'About Launcher'
};

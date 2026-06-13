// Utilities for Arabic translations, Hijri, and dual calendars

export const AR_NUMBERS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toArabicNumerals(num: number | string, useArabic: boolean): string {
  if (!useArabic) return String(num);
  return String(num).replace(/[0-9]/g, (d) => AR_NUMBERS[parseInt(d)]);
}

export function formatGregorianDate(date: Date, locale: 'ar' | 'en'): string {
  if (locale === 'ar') {
    return new Intl.DateTimeFormat('ar-SA-u-nu-arab', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  } else {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }
}

export function formatHijriDate(date: Date, locale: 'ar' | 'en'): string {
  try {
    const calendarLocale = locale === 'ar' ? 'ar-SA-u-ca-islamic-umalqura-nu-arab' : 'en-US-u-ca-islamic-umalqura';
    return new Intl.DateTimeFormat(calendarLocale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  } catch (e) {
    // Fallback if calendar support is missing in environment
    return locale === 'ar' ? '١٥ ذو الحجة ١٤٤٧ هـ' : '15 Dhu al-Hijjah 1447 AH';
  }
}

export interface PrayerTime {
  nameAr: string;
  nameEn: string;
  time: string;
  icon: string;
}

export function getPrayerTimesForCity(city: string): PrayerTime[] {
  // Simulating slightly different prayer times per city
  const baseTimes: Record<string, string[]> = {
    mecca: ['04:12', '12:22', '15:42', '19:04', '20:34'],
    medina: ['04:08', '12:24', '15:48', '19:10', '20:40'],
    cairo: ['03:15', '11:58', '15:35', '18:59', '20:31'],
    riyadh: ['03:36', '11:51', '15:15', '18:36', '20:06'],
    london: ['02:45', '13:05', '17:15', '21:20', '22:50']
  };

  const times = baseTimes[city.toLowerCase()] || baseTimes['riyadh'];

  return [
    { nameAr: 'الفجر', nameEn: 'Fajr', time: times[0], icon: 'Sunrise' },
    { nameAr: 'الظهر', nameEn: 'Dhuhr', time: times[1], icon: 'Sun' },
    { nameAr: 'العصر', nameEn: 'Asr', time: times[2], icon: 'SunDim' },
    { nameAr: 'المغرب', nameEn: 'Maghrib', time: times[3], icon: 'Sunset' },
    { nameAr: 'العشاء', nameEn: 'Isha', time: times[4], icon: 'Moon' }
  ];
}

export function getNextPrayer(times: PrayerTime[], currTimeStr: string): { prayer: PrayerTime; countdown: string } {
  const [currH, currM] = currTimeStr.split(':').map(Number);
  const currMinutes = currH * 60 + currM;

  let nextP = times[0];
  let minDiff = Infinity;

  for (const p of times) {
    const [pH, pM] = p.time.split(':').map(Number);
    const pMinutes = pH * 60 + pM;

    let diff = pMinutes - currMinutes;
    if (diff < 0) {
      diff += 24 * 60; // Next day
    }

    if (diff < minDiff) {
      minDiff = diff;
      nextP = p;
    }
  }

  const hLeft = Math.floor(minDiff / 60);
  const mLeft = minDiff % 60;

  const countdown = hLeft > 0 
    ? `${hLeft}h ${mLeft}m` 
    : `${mLeft}m`;

  return { prayer: nextP, countdown };
}

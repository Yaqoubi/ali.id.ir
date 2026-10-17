/**
 * Shamsi (Jalali) Date & Persian Digit Utilities
 * 100% Offline, Zero external dependencies
 */

const Shamsi = (() => {
  const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  const MONTH_NAMES = [
    'فروردین', 'اردیبهشت', 'خرداد',
    'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر',
    'دی', 'بهمن', 'اسفند'
  ];

  /**
   * Convert Latin digits to Persian digits
   */
  function toPersianDigits(input) {
    if (input === null || input === undefined) return '';
    return String(input).replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w]);
  }

  /**
   * Gregorian to Jalali converter algorithm
   */
  function gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy;
    if (gy > 1600) {
      jy = 979;
      gy -= 1600;
    } else {
      jy = 0;
      gy -= 621;
    }
    const gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
      Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    let jm, jd;
    if (days < 186) {
      jm = 1 + Math.floor(days / 31);
      jd = 1 + (days % 31);
    } else {
      jm = 7 + Math.floor((days - 186) / 30);
      jd = 1 + ((days - 186) % 30);
    }
    return { jy, jm, jd };
  }

  /**
   * Returns today's date formatted in Persian
   * Format example: "۲۶ مهر ۱۴۰۵"
   */
  function getTodayPersian(format = 'text') {
    const now = new Date();
    const { jy, jm, jd } = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    
    if (format === 'slash') {
      const mm = String(jm).padStart(2, '0');
      const dd = String(jd).padStart(2, '0');
      return toPersianDigits(`${jy}/${mm}/${dd}`);
    }

    const monthTitle = MONTH_NAMES[jm - 1] || '';
    return `${toPersianDigits(jd)} ${monthTitle} ${toPersianDigits(jy)}`;
  }

  return {
    toPersianDigits,
    gregorianToJalali,
    getTodayPersian,
    MONTH_NAMES
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Shamsi;
}

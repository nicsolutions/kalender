/**
 * hijri.js — Utilitas formatter & konversi tanggal Hijriah
 *
 * Menyediakan fungsi untuk mendapatkan hari dan nama bulan Hijriah
 * dari objek Date Masehi menggunakan Intl.DateTimeFormat (Umm al-Qura).
 */

const hijriDayFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab', {
  day: 'numeric'
});

const hijriMonthFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
  month: 'long'
});

/**
 * Mengembalikan hari Hijriah dalam angka Arab (٢٣, dsb) untuk tanggal Masehi.
 * @param {Date} date - objek Date Masehi
 * @returns {string} hari Hijriah dalam huruf Arab, atau string kosong jika gagal
 */
function getHijriDay(date) {
  try {
    return hijriDayFormatter.format(date);
  } catch (e) {
    return '';
  }
}

/**
 * Mengembalikan nama bulan Hijriah (محرم, صفر, dsb) untuk tanggal Masehi.
 * @param {Date} date - objek Date Masehi
 * @returns {string} nama bulan Hijriah, atau string kosong jika gagal
 */
function getHijriMonthName(date) {
  try {
    return hijriMonthFormatter.format(date);
  } catch (e) {
    return '';
  }
}

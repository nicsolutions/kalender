/**
 * holidays.js — Logika penghitungan & pengambilan data hari libur nasional
 *
 * Menangani:
 * 1. Libur tetap Masehi (Tahun Baru, Hari Buruh, Pancasila, Kemerdekaan, Natal)
 * 2. Libur Kristen dihitung dari Paskah (Good Friday, Paskah, Kenaikan)
 * 3. Libur Islam dari penelusuran kalender Hijriah Umm al-Qura
 * 4. Nyepi & Waisak (data terverifikasi manual per tahun)
 * 5. Overlay data resmi dari API (jika online)
 */

let holidaysData = {};

/* ── Utilitas tanggal ── */

/**
 * Menghasilkan string kunci tanggal format "YYYY-MM-DD".
 * @param {Date} d
 * @returns {string}
 */
function dateKey(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/* ── 1. Libur Tetap Masehi ── */

function getFixedHolidays(year) {
  return {
    [`${year}-01-01`]: "Tahun Baru Masehi",
    [`${year}-05-01`]: "Hari Buruh Internasional",
    [`${year}-06-01`]: "Hari Lahir Pancasila",
    [`${year}-08-17`]: "Hari Kemerdekaan RI",
    [`${year}-12-25`]: "Hari Raya Natal"
  };
}

/* ── 2a. Libur Kristen (dihitung dari Paskah) ── */

/**
 * Menghitung tanggal Minggu Paskah menggunakan algoritma Meeus/Gregorian.
 * Akurat untuk tahun berapapun, tidak perlu data hardcode.
 */
function computeEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = Maret, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getComputedChristianHolidays(year) {
  const easter = computeEasterSunday(year);
  const goodFriday = new Date(easter); goodFriday.setDate(easter.getDate() - 2);
  const ascension = new Date(easter); ascension.setDate(easter.getDate() + 39);
  return {
    [dateKey(goodFriday)]: "Wafat Yesus Kristus",
    [dateKey(easter)]: "Hari Paskah",
    [dateKey(ascension)]: "Kenaikan Yesus Kristus"
  };
}

/* ── 2b. Libur Islam (penelusuran kalender Hijriah Umm al-Qura) ── */
// Catatan: hasilnya adalah estimasi astronomis (hisab Umm al-Qura) dan
// bisa berbeda ±1 hari dari penetapan resmi pemerintah RI (rukyat),
// terutama untuk Idul Fitri & Idul Adha.

const hijriPartsFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
  day: 'numeric', month: 'numeric', year: 'numeric'
});

function getHijriParts(date) {
  try {
    const parts = hijriPartsFormatter.formatToParts(date);
    const map = {};
    parts.forEach(p => { if (p.type !== 'literal') map[p.type] = parseInt(p.value, 10); });
    return { day: map.day, month: map.month, year: map.year };
  } catch (e) {
    return null;
  }
}

const islamicTargets = [
  { month: 1,  day: 1,  name: "Tahun Baru Islam" },
  { month: 3,  day: 12, name: "Maulid Nabi Muhammad SAW" },
  { month: 7,  day: 27, name: "Isra Mikraj Nabi Muhammad SAW" },
  { month: 10, day: 1,  name: "Hari Raya Idul Fitri" },
  { month: 10, day: 2,  name: "Hari Raya Idul Fitri" },
  { month: 12, day: 10, name: "Hari Raya Idul Adha" }
];

function getComputedIslamicHolidays(year) {
  const result = {};
  // Telusuri sedikit sebelum & sesudah tahun Masehi supaya tanggal Hijriah
  // yang jatuh dekat pergantian tahun tetap tertangkap.
  const start = new Date(year, 0, 1); start.setDate(start.getDate() - 5);
  const end = new Date(year, 11, 31); end.setDate(end.getDate() + 5);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getFullYear() !== year) continue;
    const hijri = getHijriParts(d);
    if (!hijri) continue;
    const match = islamicTargets.find(t => t.month === hijri.month && t.day === hijri.day);
    if (match) result[dateKey(d)] = match.name;
  }
  return result;
}

/* ── 2c. Nyepi (Saka) & Waisak (Buddhis) ── */
// Tidak punya rumus konversi sederhana, jadi hanya tersedia
// untuk tahun yang datanya sudah diverifikasi manual.

const verifiedLunisolarHolidays = {
  2026: {
    "2026-03-19": "Hari Suci Nyepi Saka 1948",
    "2026-05-31": "Hari Raya Waisak 2570 BE"
  },
  2027: {
    "2027-03-09": "Hari Suci Nyepi Saka 1949",
    "2027-05-20": "Hari Raya Waisak 2571 BE"
  }
};

/* ── Fetch & Gabung Semua Data Libur ── */

async function fetchHolidays(year) {
  // Lapisan 1: libur tetap Masehi (selalu akurat)
  // Lapisan 2: libur Kristen hasil hitung Paskah (selalu akurat)
  // Lapisan 3: libur Islam hasil penelusuran kalender Hijriah (estimasi hisab)
  // Lapisan 4: Nyepi & Waisak, hanya jika tahun tsb sudah diverifikasi manual
  holidaysData = {
    ...getFixedHolidays(year),
    ...getComputedChristianHolidays(year),
    ...getComputedIslamicHolidays(year),
    ...(verifiedLunisolarHolidays[year] || {})
  };

  const missingLunisolar = !verifiedLunisolarHolidays[year];
  let apiOk = false;

  // Lapisan 5: timpa/lengkapi dengan data resmi dari API jika tersedia online
  try {
    const response = await fetch(`https://dayoffapi.vercel.app/api?year=${year}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        data.forEach(item => {
          const rawDate = item.tanggal || item.holiday_date;
          if (rawDate) {
            const d = new Date(rawDate);
            if (!isNaN(d)) {
              const key = dateKey(d);
              const name = item.keterangan || item.holiday_name;

              if (name && (item.is_cuti === false || item.is_national_holiday === true)) {
                holidaysData[key] = name;
                apiOk = true;
              }
            }
          }
        });
      }
    }
  } catch (e) {
    console.warn(`Menggunakan data libur hasil perhitungan lokal untuk tahun ${year} (API tidak dapat dihubungi).`);
  }

  showDataWarning(year, missingLunisolar, apiOk);
}

/* ── Peringatan Data ── */

function showDataWarning(year, missingLunisolar, apiOk) {
  const el = document.getElementById("dataWarning");
  const notes = [];

  if (missingLunisolar && !apiOk) {
    notes.push("Tanggal Nyepi &amp; Waisak belum tersedia untuk tahun ini (data resmi belum diverifikasi).");
  }
  if (!apiOk) {
    notes.push("Tanggal Idul Fitri/Idul Adha/hari besar Islam lainnya adalah estimasi hisab (Umm al-Qura) dan dapat berbeda ±1 hari dari penetapan resmi pemerintah.");
  }

  if (notes.length > 0) {
    el.innerHTML = "⚠ " + notes.join(" ");
    el.classList.add("show");
  } else {
    el.innerHTML = "";
    el.classList.remove("show");
  }
}

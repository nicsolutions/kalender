/**
 * calendar.js — Render kalender utama
 *
 * Menggunakan fungsi dari:
 *   - hijri.js   (getHijriDay, getHijriMonthName)
 *   - holidays.js (fetchHolidays, holidaysData, dateKey)
 */

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

/**
 * Render seluruh kalender 12 bulan untuk tahun yang dipilih.
 * Membaca nilai tahun dari input #yearInput, fetch data hari libur,
 * lalu generate month cards ke dalam #monthsContainer.
 */
async function renderFullYear() {
  const year = parseInt(document.getElementById("yearInput").value) || new Date().getFullYear();
  document.getElementById("calendarTitle").innerText = `Kalender ${year}`;

  await fetchHolidays(year);

  const container = document.getElementById("monthsContainer");
  container.innerHTML = "";

  for (let month = 0; month < 12; month++) {
    const monthCard = document.createElement("div");
    monthCard.classList.add("month-card", `hue-${month % 6}`);

    const title = document.createElement("div");
    title.classList.add("month-title");

    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const hijriStart = getHijriMonthName(firstOfMonth);
    const hijriEnd = getHijriMonthName(lastOfMonth);
    const hijriLabel = hijriStart === hijriEnd ? hijriStart : `${hijriStart} / ${hijriEnd}`;

    title.innerHTML = `
      <div class="latin">${monthNames[month]}</div>
      <div class="hijri-month">${hijriLabel}</div>
    `;
    monthCard.appendChild(title);

    const weekdays = document.createElement("div");
    weekdays.classList.add("weekdays");
    weekdays.innerHTML = `<div>M</div><div>S</div><div>S</div><div>R</div><div>K</div><div>J</div><div>S</div>`;
    monthCard.appendChild(weekdays);

    const daysGrid = document.createElement("div");
    daysGrid.classList.add("days-grid");

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = lastOfMonth.getDate();

    for (let i = 0; i < firstDay; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.classList.add("day-cell", "empty");
      daysGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(year, month, day);
      const dateString = dateKey(dateObj);

      const dayCell = document.createElement("div");
      dayCell.classList.add("day-cell");

      if (dateObj.getDay() === 0) dayCell.classList.add("sunday");

      if (holidaysData[dateString]) {
        dayCell.classList.add("holiday");
        dayCell.title = holidaysData[dateString];
      }

      const hijriDay = getHijriDay(dateObj);

      dayCell.innerHTML = `
        <span class="masehi">${day}</span>
        <span class="hijri">${hijriDay}</span>
      `;

      daysGrid.appendChild(dayCell);
    }

    monthCard.appendChild(daysGrid);
    container.appendChild(monthCard);
  }
}

/* ── Auto-render saat halaman dimuat ── */
renderFullYear();

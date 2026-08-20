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

function groupConsecutive(arr) {
  if (!arr || !arr.length) return "";
  const sorted = [...new Set(arr)].sort((a, b) => a - b);
  let res = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    if (i < sorted.length && sorted[i] === prev + 1) {
      prev = sorted[i];
    } else {
      if (start === prev) {
        res.push(start);
      } else if (prev === start + 1) {
        res.push(`${start}, ${prev}`);
      } else {
        res.push(`${start}-${prev}`);
      }
      if (i < sorted.length) {
        start = sorted[i];
        prev = sorted[i];
      }
    }
  }
  return res.join(", ");
}

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
    const monthAgendas = {};

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
        const hName = holidaysData[dateString];
        dayCell.title = hName;
        if (!monthAgendas[hName]) monthAgendas[hName] = [];
        monthAgendas[hName].push(day);
      }

      const hijri = getHijriParts(dateObj);
      let fastingName = null;
      if (hijri) {
        const hm = hijri.month;
        const hd = hijri.day;
        const dw = dateObj.getDay();

        const isHaram = (hm === 10 && hd === 1) || (hm === 12 && hd >= 10 && hd <= 13);
        
        if (!isHaram) {
          let fasts = [];
          if (hm === 9) {
            fasts.push("Puasa Ramadan");
          } else {
            if (hm === 12 && hd === 9) fasts.push("Puasa Arafah");
            if (hm === 1 && hd === 9) fasts.push("Puasa Tasu'a");
            if (hm === 1 && hd === 10) fasts.push("Puasa Asyura");
            if (hm === 10 && hd >= 2 && hd <= 7) fasts.push("Puasa Syawal");
            if (hd === 13 || hd === 14 || hd === 15) fasts.push("Puasa Ayyamul Bidh");
            if (dw === 1 || dw === 4) fasts.push("Puasa Senin-Kamis");
          }
          
          if (fasts.length > 0) {
            fastingName = fasts.join(", ");
            fasts.forEach(f => {
               if (!monthAgendas[f]) monthAgendas[f] = [];
               monthAgendas[f].push(day);
            });
          }
        }
      }

      if (fastingName) {
        dayCell.classList.add("fasting");
        if (dayCell.title) {
          dayCell.title += " | " + fastingName;
        } else {
          dayCell.title = fastingName;
        }
      }

      const hijriDay = getHijriDay(dateObj);

      dayCell.innerHTML = `
        <span class="masehi">${day}</span>
        <span class="hijri">${hijriDay}</span>
      `;

      daysGrid.appendChild(dayCell);
    }

    monthCard.appendChild(daysGrid);

    if (Object.keys(monthAgendas).length > 0) {
      const agendaDiv = document.createElement("div");
      agendaDiv.classList.add("month-agenda");
      
      let agendaHtml = [];
      for (const [name, days] of Object.entries(monthAgendas)) {
         agendaHtml.push(`<span class="agenda-item"><b>${groupConsecutive(days)}</b> ${name}</span>`);
      }
      agendaDiv.innerHTML = agendaHtml.join(" &bull; ");
      monthCard.appendChild(agendaDiv);
    }

    container.appendChild(monthCard);
  }
}

/* ── Auto-render saat halaman dimuat ── */
renderFullYear();

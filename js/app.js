/* ============================================================
   APP — router + rendering
   ============================================================ */

const ICONS = {
  vandaag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>`,
  schema: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h16M4 12h16M4 18h10"/></svg>`,
  progressie: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 17l5-6 4 4 8-10"/><path d="M14 5h7v7"/></svg>`,
  voeding: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2v7a3 3 0 003 3v10M6 2v20M18 2v20M18 2c-2 0-3 2-3 5s1 4 3 4"/></svg>`,
  notitieboek: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h13a2 2 0 012 2v14a2 2 0 01-2 2H4z"/><path d="M4 4v18M8 8h7M8 12h7M8 16h4"/></svg>`,
  instellingen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>`,
};

let currentTab = "vandaag";
let selectedDate = todayISO();
let weekAnchor = mondayOf(todayISO());

/* Inline verwijder-bevestiging — geen native confirm(), want dat kan
   geblokkeerd zijn in sandboxed omgevingen (zoals deze preview). */
function makeRemoveControl(ex) {
  const wrap = el(`<span class="remove-control"></span>`);
  const renderIdle = () => {
    wrap.innerHTML = "";
    const btn = el(`<button class="removeExBtn" title="Oefening verwijderen">✕</button>`);
    btn.addEventListener("click", (e) => { e.stopPropagation(); renderConfirm(); });
    wrap.appendChild(btn);
  };
  const renderConfirm = () => {
    wrap.innerHTML = "";
    const confirmWrap = el(`
      <span style="display:inline-flex;align-items:center;gap:6px">
        <span style="font-size:11px;color:var(--chalk-dim)">Verwijderen?</span>
        <button class="btn small" style="background:var(--danger);border-color:var(--danger);color:#fff;padding:4px 9px">Ja</button>
        <button class="btn ghost small" style="padding:4px 9px">Nee</button>
      </span>
    `);
    const [yesBtn, noBtn] = confirmWrap.querySelectorAll("button");
    yesBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      ex.removed = true;
      persist();
      showToast("Oefening verwijderd — terug te zetten via Schema onderaan");
      render();
    });
    noBtn.addEventListener("click", (e) => { e.stopPropagation(); renderIdle(); });
    wrap.appendChild(confirmWrap);
  };
  renderIdle();
  return wrap;
}

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

function fmtKg(n) {
  return (Math.round(n * 100) / 100).toString().replace(".", ",");
}

function navigate(tab) {
  if (tab === "vandaag" && currentTab !== "vandaag") { selectedDate = todayISO(); weekAnchor = mondayOf(todayISO()); }
  currentTab = tab;
  render();
  window.scrollTo(0, 0);
}

function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  const screens = {
    vandaag: renderVandaag,
    schema: renderSchema,
    progressie: renderProgressie,
    voeding: renderVoeding,
    notitieboek: renderNotitieboek,
    instellingen: renderInstellingen,
  };
  app.appendChild(screens[currentTab]());
  renderTabbar();
}

function renderTabbar() {
  let bar = document.getElementById("tabbar");
  if (!bar) {
    bar = el(`<div class="tabbar" id="tabbar"></div>`);
    document.body.appendChild(bar);
  }
  const tabs = [
    ["vandaag", "Vandaag"], ["schema", "Schema"], ["progressie", "Progressie"],
    ["voeding", "Voeding"], ["notitieboek", "Notitieboek"], ["instellingen", "Instellingen"],
  ];
  bar.innerHTML = "";
  tabs.forEach(([key, label]) => {
    const btn = el(`<button class="${currentTab === key ? "active" : ""}">${ICONS[key]}<span>${label}</span></button>`);
    btn.addEventListener("click", () => navigate(key));
    bar.appendChild(btn);
  });
}

/* ============================================================
   VANDAAG
   ============================================================ */
function mondayOf(iso) {
  const d = new Date(iso + "T12:00:00");
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1; // maandag=0
  d.setDate(d.getDate() - dow);
  return d.toISOString().slice(0, 10);
}

function addDays(iso, n) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const DUTCH_MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function isoWeekNumber(iso) {
  const d = new Date(Date.UTC(...iso.split("-").map((v, i) => i === 1 ? Number(v) - 1 : Number(v))));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function formatWeekLabel(monday, sunday) {
  const dM = new Date(monday + "T12:00:00");
  const dS = new Date(sunday + "T12:00:00");
  const weekNo = isoWeekNumber(monday);
  const startMonth = DUTCH_MONTHS[dM.getMonth()];
  const endMonth = DUTCH_MONTHS[dS.getMonth()];
  const range = startMonth === endMonth
    ? `${dM.getDate()}–${dS.getDate()} ${endMonth}`
    : `${dM.getDate()} ${startMonth} – ${dS.getDate()} ${endMonth}`;
  return `Week ${weekNo} · ${range} ${dS.getFullYear()}`;
}

function renderVandaag() {
  const wrap = el(`<div></div>`);
  const today = todayISO();
  const date = selectedDate;
  const dayName = dayNameFromISO(date);
  const isToday = date === today;

  wrap.appendChild(el(`
    <div class="topbar">
      <div>
        <div class="eyebrow">${isoToNL(date)} · ${currentPhase() === "bulk" ? "Bulk fase" : "Lean fase"}</div>
        <h1>${isToday ? "Vandaag" : date < today ? "Terugkijken" : "Vooruitplannen"}</h1>
      </div>
      <button id="settingsBtn" style="color:var(--chalk-dim)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>
        </svg>
      </button>
    </div>
  `));
  wrap.querySelector("#settingsBtn").addEventListener("click", () => navigate("instellingen"));

  wrap.appendChild(renderWeekStrip(date, today));

  if (!isToday) {
    const backBtn = el(`<button class="btn ghost small" style="margin-bottom:12px">← Terug naar vandaag</button>`);
    backBtn.addEventListener("click", () => { selectedDate = today; weekAnchor = mondayOf(today); render(); });
    wrap.appendChild(backBtn);
  }

  const type = DAY_TYPE[dayName];
  if (type === "strength") {
    wrap.appendChild(renderStrengthDay(dayName, date));
  } else {
    wrap.appendChild(renderCardioDay(dayName, date));
  }

  wrap.appendChild(renderBodyweightCard(date));

  return wrap;
}

function renderWeekStrip(selected, today) {
  const wrap = el(`<div></div>`);

  const nav = el(`
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:8px">
      <button class="btn ghost small" id="prevWeekBtn">‹ Vorige</button>
      <span class="mono" style="font-size:12px;color:var(--chalk-dim);text-align:center;flex:1" id="weekLabel"></span>
      <button class="btn ghost small" id="nextWeekBtn">Volgende ›</button>
    </div>
  `);
  wrap.appendChild(nav);

  const strip = el(`<div class="week-strip"></div>`);
  const monday = weekAnchor;
  const sunday = addDays(monday, 6);
  nav.querySelector("#weekLabel").textContent = formatWeekLabel(monday, sunday);
  nav.querySelector("#prevWeekBtn").addEventListener("click", () => { weekAnchor = addDays(weekAnchor, -7); render(); });
  nav.querySelector("#nextWeekBtn").addEventListener("click", () => { weekAnchor = addDays(weekAnchor, 7); render(); });

  for (let i = 0; i < 7; i++) {
    const iso = addDays(monday, i);
    const dName = DAY_ORDER[i];
    const type = DAY_TYPE[dName];
    const isToday = iso === today;
    const isSelected = iso === selected;
    const hasLog = STATE.logs.some(l => l.date === iso) || STATE.cardioLogs.some(l => l.date === iso);
    const dayEl = el(`
      <button class="day ${type} ${isToday ? "today" : ""} ${hasLog ? "done" : ""} ${isSelected ? "selected" : ""}">
        <span class="d">${dName.slice(0, 2)}</span>
        <span class="mono" style="font-size:13px">${parseInt(iso.slice(8, 10))}</span>
        <span class="dot"></span>
      </button>
    `);
    dayEl.addEventListener("click", () => { selectedDate = iso; render(); });
    strip.appendChild(dayEl);
  }
  wrap.appendChild(strip);
  return wrap;
}

function lastLogFor(exerciseId) {
  const logs = STATE.logs.filter(l => l.exerciseId === exerciseId).sort((a, b) => a.date.localeCompare(b.date));
  return logs[logs.length - 1];
}

/* Schema = vaste structuur die voorwaarts geldt (vandaag + toekomst).
   Verleden dagen tonen daarnaast ook oefeningen die sindsdien uit het
   schema zijn gehaald, mits je er die specifieke dag echt iets voor
   hebt gelogd — zo blijft je geschiedenis kloppen, ook na aanpassingen. */
function exercisesForDayView(dayName, dateISO) {
  const active = STATE.exercises.filter(e => e.day === dayName && !e.removed);
  if (dateISO >= todayISO()) return active.map(ex => ({ ex, historical: false }));
  const loggedIdsThatDate = new Set(STATE.logs.filter(l => l.date === dateISO).map(l => l.exerciseId));
  const removedButLogged = STATE.exercises.filter(e => e.day === dayName && e.removed && loggedIdsThatDate.has(e.id));
  return [
    ...active.map(ex => ({ ex, historical: false })),
    ...removedButLogged.map(ex => ({ ex, historical: true })),
  ];
}

function renderStrengthDay(dayName, dateISO, { readOnly = false } = {}) {
  const card = el(`
    <div class="card">
      <div class="card-title-row">
        <div>
          <span class="pill strength">Kracht</span>
        </div>
      </div>
      <h2>${DAY_LABELS[dayName]}</h2>
    </div>
  `);

  const dayItems = exercisesForDayView(dayName, dateISO);
  const groups = [...new Set(dayItems.map(i => i.ex.group))];

  groups.forEach(group => {
    const groupCard = el(`<div class="card"><h3>${group}</h3></div>`);
    dayItems.filter(i => i.ex.group === group).forEach(({ ex, historical }) => {
      groupCard.appendChild(renderExerciseLogger(ex, dateISO, { readOnly, historical }));
    });
    card.appendChild(groupCard);
  });

  card.appendChild(renderAddExerciseInline(dayName));

  return card;
}

function renderAddExerciseInline(dayName) {
  const wrap = el(`
    <div class="card">
      <button class="btn ghost full toggleAddEx">+ Oefening toevoegen aan ${dayName}</button>
      <div class="addExForm" style="display:none;margin-top:10px">
        <div class="settings-row"><input class="inlineExName" placeholder="Naam oefening"/></div>
        <div class="settings-row"><input class="inlineExGroup" placeholder="Spiergroep (bijv. Rug, Chest, Benen)"/></div>
        <button class="btn primary full inlineExSave">Toevoegen</button>
      </div>
    </div>
  `);
  const form = wrap.querySelector(".addExForm");
  wrap.querySelector(".toggleAddEx").addEventListener("click", () => {
    form.style.display = form.style.display === "none" ? "block" : "none";
  });
  wrap.querySelector(".inlineExSave").addEventListener("click", () => {
    const name = wrap.querySelector(".inlineExName").value.trim();
    const group = wrap.querySelector(".inlineExGroup").value.trim() || "Overig";
    if (!name) return;
    STATE.exercises.push({ id: "custom_" + uid(), name, day: dayName, group, warmup: [], work: [], removed: false });
    persist();
    showToast("Oefening toegevoegd");
    render();
  });
  return wrap;
}

function renderExerciseLogger(ex, dateISO, { readOnly = false, historical = false } = {}) {
  const block = el(`<div class="exercise-block"></div>`);
  const logForThisDate = STATE.logs.find(l => l.exerciseId === ex.id && l.date === dateISO);
  const last = lastLogFor(ex.id);
  const suggestedSets = logForThisDate
    ? logForThisDate.work
    : last
    ? last.work
    : ex.work.flatMap(w => Array(w.sets).fill({ weight: w.weight, reps: w.reps }));

  const nameRow = el(`
    <div class="exercise-name">
      <span style="flex:1">${ex.name}</span>
      ${last ? `<span class="pill mono" style="font-size:10px">laatst ${isoToNL(last.date).slice(0,5)}</span>` : ""}
    </div>
  `);
  if (historical) {
    nameRow.appendChild(el(`<span class="pill" style="font-size:10px">verwijderd uit schema</span>`));
  } else {
    nameRow.appendChild(makeRemoveControl(ex));
  }
  block.appendChild(nameRow);

  const workingSets = suggestedSets.length ? suggestedSets : [{ weight: 0, reps: 8 }];

  if (readOnly) {
    const list = el(`<div class="progress-hint" style="margin-top:2px"></div>`);
    list.textContent = workingSets.map(s => `${fmtKg(s.weight)}kg × ${s.reps}`).join("  ·  ");
    block.appendChild(list);
    return block;
  }

  const setsWrap = el(`<div class="sets-wrap"></div>`);
  const rows = [];
  workingSets.forEach((s, i) => {
    const row = renderSetRow(i + 1, s.weight, s.reps);
    rows.push(row);
    setsWrap.appendChild(row.el);
  });
  block.appendChild(setsWrap);

  const actions = el(`
    <div class="set-actions">
      <button class="btn small">+ Set</button>
      <button class="btn primary small">Opslaan</button>
    </div>
  `);
  actions.children[0].addEventListener("click", () => {
    const row = renderSetRow(rows.length + 1, workingSets[workingSets.length - 1]?.weight || 10, 8);
    rows.push(row);
    setsWrap.appendChild(row.el);
  });
  actions.children[1].addEventListener("click", () => {
    const workData = rows.map(r => ({ weight: r.getWeight(), reps: r.getReps() }));
    const existing = STATE.logs.find(l => l.exerciseId === ex.id && l.date === dateISO);
    if (existing) {
      existing.work = workData;
    } else {
      STATE.logs.push({ id: uid(), date: dateISO, exerciseId: ex.id, warmup: [], work: workData });
    }
    persist();
    const prevBest = last ? Math.max(...last.work.map(w => w.weight)) : 0;
    const newBest = Math.max(...workData.map(w => w.weight));
    if (newBest > prevBest && prevBest > 0) {
      showToast(`💪 PR! ${ex.name} — ${fmtKg(newBest)}kg (was ${fmtKg(prevBest)}kg)`);
    } else {
      showToast("Opgeslagen");
    }
    render();
  });
  block.appendChild(actions);

  return block;
}

function renderSetRow(index, weight, reps) {
  const row = el(`
    <div class="set-row">
      <div class="set-label mono">Set ${index}</div>
      <div class="stepper">
        <button type="button" data-d="-1">–</button>
        <input type="text" inputmode="decimal" value="${weight}" class="mono weightInput"/>
        <span class="unit">kg</span>
        <button type="button" data-d="1">+</button>
      </div>
      <input type="number" value="${reps}" class="reps-input mono repsInput"/>
      <span class="mono" style="font-size:11px;color:var(--chalk-dim)">reps</span>
    </div>
  `);
  const weightInput = row.querySelector(".weightInput");
  const repsInput = row.querySelector(".repsInput");
  row.querySelectorAll("button[data-d]").forEach(btn => {
    btn.addEventListener("click", () => {
      const step = parseFloat(btn.dataset.d) * 1.25;
      weightInput.value = fmtKg(Math.max(0, parseFloat(weightInput.value.replace(",", ".")) + step));
    });
  });
  return {
    el: row,
    getWeight: () => parseFloat(weightInput.value.toString().replace(",", ".")) || 0,
    getReps: () => parseInt(repsInput.value) || 0,
  };
}

function renderCardioActivityBlock(dayName, activityName, dateISO, { readOnly = false } = {}) {
  const block = el(`<div class="exercise-block"></div>`);
  const existing = STATE.cardioLogs.find(l => l.date === dateISO && l.activity === activityName);

  const nameRow = el(`
    <div class="exercise-name">
      <span style="flex:1">${activityName}</span>
      ${existing ? `<span class="pill mono" style="font-size:10px">gedaan ✓</span>` : ""}
    </div>
  `);
  block.appendChild(nameRow);

  if (readOnly) {
    const hint = el(`<div class="progress-hint" style="margin-top:2px"></div>`);
    hint.textContent = existing
      ? [existing.distance ? `${existing.distance}km` : null, existing.duration ? `${existing.duration}min` : null].filter(Boolean).join(" · ") || "genoteerd"
      : "nog niet gedaan";
    block.appendChild(hint);
    return block;
  }

  const row = el(`
    <div class="set-row">
      <input type="number" step="0.1" placeholder="afstand (km)" class="mono distInput" value="${existing?.distance ?? ""}" style="flex:1"/>
      <input type="number" placeholder="tijd (min)" class="mono durInput" value="${existing?.duration ?? ""}" style="flex:1"/>
    </div>
  `);
  block.appendChild(row);

  const actions = el(`<div class="set-actions"><button class="btn primary small">Opslaan</button></div>`);
  actions.children[0].addEventListener("click", () => {
    const distance = parseFloat(row.querySelector(".distInput").value.replace(",", ".")) || null;
    const duration = parseFloat(row.querySelector(".durInput").value) || null;
    const idx = STATE.cardioLogs.findIndex(l => l.date === dateISO && l.activity === activityName);
    const entry = { id: existing?.id || uid(), date: dateISO, day: dayName, activity: activityName, distance, duration };
    if (idx >= 0) STATE.cardioLogs[idx] = entry; else STATE.cardioLogs.push(entry);
    persist();
    showToast("Genoteerd 🏊‍♂️");
    render();
  });
  block.appendChild(actions);

  return block;
}

function renderCardioDay(dayName, dateISO, { readOnly = false } = {}) {
  const cardio = SEED_CARDIO[dayName];
  const card = el(`
    <div class="card">
      <div class="card-title-row"><span class="pill cardio">Conditie</span></div>
      <h2>${DAY_LABELS[dayName]}</h2>
    </div>
  `);

  const groupCard = el(`<div class="card"><h3>${cardio.label}</h3></div>`);
  cardio.options.forEach(opt => groupCard.appendChild(renderCardioActivityBlock(dayName, opt, dateISO, { readOnly })));
  card.appendChild(groupCard);

  const customItems = exercisesForDayView(dayName, dateISO);
  if (customItems.length) {
    const extraCard = el(`<div class="card"><h3>Extra oefeningen</h3></div>`);
    customItems.forEach(({ ex, historical }) => extraCard.appendChild(renderExerciseLogger(ex, dateISO, { readOnly, historical })));
    card.appendChild(extraCard);
  }

  card.appendChild(renderAddExerciseInline(dayName));

  return card;
}

function renderBodyweightCard(dateISO) {
  const sorted = [...STATE.bodyweight].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1];
  const card = el(`
    <div class="card">
      <h3>Lichaamsgewicht${dateISO !== todayISO() ? ` — ${isoToNL(dateISO)}` : ""}</h3>
      <div style="display:flex;gap:8px;align-items:center;margin-top:8px">
        <input type="number" step="0.1" id="bwInput" placeholder="${last ? last.kg : "bijv. 78.5"}" class="mono" style="flex:1"/>
        <button class="btn primary" id="bwSave">Opslaan</button>
      </div>
      ${last ? `<p class="progress-hint">Laatste meting: ${fmtKg(last.kg)}kg op ${isoToNL(last.date)}</p>` : ""}
    </div>
  `);
  card.querySelector("#bwSave").addEventListener("click", () => {
    const val = parseFloat(card.querySelector("#bwInput").value.replace(",", "."));
    if (!val) return;
    const idx = STATE.bodyweight.findIndex(b => b.date === dateISO);
    if (idx >= 0) STATE.bodyweight[idx].kg = val; else STATE.bodyweight.push({ date: dateISO, kg: val });
    if (!STATE.settings.startWeight) STATE.settings.startWeight = val;
    persist();
    showToast("Gewicht opgeslagen");
    render();
  });
  return card;
}

/* ============================================================
   SCHEMA — weekoverzicht + oefeningen beheren
   ============================================================ */
function renderSchemaExerciseRow(ex) {
  const last = lastLogFor(ex.id);
  const summary = last
    ? last.work.map(w => `${fmtKg(w.weight)}×${w.reps}`).join(", ")
    : (ex.work.length ? ex.work.map(w => `${fmtKg(w.weight)}×${w.reps}${w.sets > 1 ? ` (${w.sets})` : ""}`).join(", ") : "nog geen data");
  const row = el(`
    <div class="food-item">
      <span>${ex.name}</span>
      <span style="display:flex;align-items:center;gap:10px">
        <span class="meta">${summary}</span>
      </span>
    </div>
  `);
  row.querySelector("span[style]").appendChild(makeRemoveControl(ex));
  return row;
}

function renderSchema() {
  const wrap = el(`
    <div>
      <div class="topbar"><h1>Schema</h1></div>
    </div>
  `);
  DAY_ORDER.forEach(day => {
    const type = DAY_TYPE[day];
    const card = el(`
      <div class="card">
        <div class="card-title-row">
          <h2 style="text-transform:capitalize">${day}</h2>
          <span class="pill ${type}">${type === "strength" ? "Kracht" : "Conditie"}</span>
        </div>
        <p style="color:var(--chalk-dim);font-size:13px;margin-bottom:8px">${DAY_LABELS[day]}</p>
      </div>
    `);
    if (type === "strength") {
      const exercises = STATE.exercises.filter(e => e.day === day && !e.removed);
      const groups = [...new Set(exercises.map(e => e.group))];
      groups.forEach(g => {
        card.appendChild(el(`<h3 style="margin-top:10px">${g}</h3>`));
        exercises.filter(e => e.group === g).forEach(ex => card.appendChild(renderSchemaExerciseRow(ex)));
      });
    } else {
      const cardio = SEED_CARDIO[day];
      cardio.options.forEach(o => card.appendChild(el(`<div class="food-item"><span>${o}</span></div>`)));
      const customExercises = STATE.exercises.filter(e => e.day === day && !e.removed);
      if (customExercises.length) {
        card.appendChild(el(`<h3 style="margin-top:10px">Extra oefeningen</h3>`));
        customExercises.forEach(ex => card.appendChild(renderSchemaExerciseRow(ex)));
      }
    }
    card.appendChild(renderAddExerciseInline(day));
    wrap.appendChild(card);
  });

  const removedExercises = STATE.exercises.filter(e => e.removed);
  const removedCard = el(`<div class="card"><h3>Verwijderde oefeningen</h3></div>`);
  if (removedExercises.length === 0) {
    removedCard.appendChild(el(`<p class="progress-hint" style="margin-top:8px">Nog niets verwijderd. Als je een oefening weghaalt met ✕, staat 'm hier — dan kan je 'm terugzetten of definitief verwijderen.</p>`));
  } else {
    removedExercises.forEach(ex => {
      const row = el(`
        <div class="food-item">
          <span style="color:var(--chalk-dim)">${ex.name} <span class="meta">· ${ex.day}</span></span>
        </div>
      `);
      const actions = el(`<span style="display:flex;align-items:center;gap:8px"></span>`);

      const restoreBtn = el(`<button class="btn small">Terugzetten</button>`);
      restoreBtn.addEventListener("click", () => {
        ex.removed = false;
        persist();
        showToast("Oefening teruggezet");
        render();
      });
      actions.appendChild(restoreBtn);

      const deleteIdle = () => {
        actions.querySelectorAll(".hard-delete-group").forEach(n => n.remove());
        const del = el(`<button class="hard-delete-group btn ghost small" style="color:var(--danger)">Definitief verwijderen</button>`);
        del.addEventListener("click", () => deleteConfirm());
        actions.appendChild(del);
      };
      const deleteConfirm = () => {
        actions.querySelectorAll(".hard-delete-group").forEach(n => n.remove());
        const group = el(`
          <span class="hard-delete-group" style="display:inline-flex;align-items:center;gap:6px">
            <span style="font-size:11px;color:var(--chalk-dim)">Zeker?</span>
            <button class="btn small" style="background:var(--danger);border-color:var(--danger);color:#fff;padding:4px 9px">Ja</button>
            <button class="btn ghost small" style="padding:4px 9px">Nee</button>
          </span>
        `);
        const [yesBtn, noBtn] = group.querySelectorAll("button");
        yesBtn.addEventListener("click", () => {
          STATE.exercises = STATE.exercises.filter(e => e.id !== ex.id);
          STATE.logs = STATE.logs.filter(l => l.exerciseId !== ex.id);
          persist();
          showToast("Definitief verwijderd, inclusief logs");
          render();
        });
        noBtn.addEventListener("click", deleteIdle);
        actions.appendChild(group);
      };
      deleteIdle();

      row.appendChild(actions);
      removedCard.appendChild(row);
    });
  }
  wrap.appendChild(removedCard);

  return wrap;
}

/* ============================================================
   PROGRESSIE — Oefeningen / Lichaamsgewicht / Overzicht
   ============================================================ */
let progressieTab = "oefeningen";
let progressieDayFilter = "alle";
let progressieSearch = "";
let progressieSelected = null; // { type:'strength', id } | { type:'cardio', day, activity }
let progressieStrengthMetric = "gewicht";
let progressieCardioMetric = "afstand";
let progressiePeriod = "3m";
let progressieWeightPeriod = "3m";
let progressieOverzichtPeriod = "30d";

function periodPillsRow(currentKey, onChange) {
  const row = el(`<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px"></div>`);
  PERIOD_OPTIONS.forEach(opt => {
    const active = currentKey === opt.key;
    const pill = el(`<button class="pill ${active ? "strength" : ""}" style="cursor:pointer;border:1px solid var(--line)">${opt.label}</button>`);
    pill.addEventListener("click", () => onChange(opt.key));
    row.appendChild(pill);
  });
  return row;
}

function renderProgressie() {
  const wrap = el(`<div><div class="topbar"><h1>Progressie</h1></div></div>`);

  const tabs = el(`
    <div style="display:flex;gap:6px;margin-bottom:14px">
      <button class="btn ${progressieTab === "oefeningen" ? "primary" : ""}" style="flex:1" id="tabOef">Oefeningen</button>
      <button class="btn ${progressieTab === "gewicht" ? "primary" : ""}" style="flex:1" id="tabGew">Lichaamsgewicht</button>
      <button class="btn ${progressieTab === "overzicht" ? "primary" : ""}" style="flex:1" id="tabOvz">Overzicht</button>
    </div>
  `);
  tabs.querySelector("#tabOef").addEventListener("click", () => { progressieTab = "oefeningen"; render(); });
  tabs.querySelector("#tabGew").addEventListener("click", () => { progressieTab = "gewicht"; render(); });
  tabs.querySelector("#tabOvz").addEventListener("click", () => { progressieTab = "overzicht"; render(); });
  wrap.appendChild(tabs);

  if (progressieTab === "oefeningen") wrap.appendChild(renderProgressieOefeningen());
  else if (progressieTab === "gewicht") wrap.appendChild(renderProgressieGewicht());
  else wrap.appendChild(renderProgressieOverzicht());

  return wrap;
}

/* ---------- Tab 1: Oefeningen ---------- */
function renderProgressieOefeningen() {
  const wrap = el(`<div></div>`);

  const filterCard = el(`<div class="card"></div>`);
  const dayPillsWrap = el(`<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px"></div>`);
  const daysWithData = [...new Set([
    ...STATE.exercises.filter(ex => STATE.logs.some(l => l.exerciseId === ex.id)).map(ex => ex.day),
    ...STATE.cardioLogs.map(l => l.day),
  ])];
  const dayOptions = ["alle", ...DAY_ORDER.filter(d => daysWithData.includes(d))];
  dayOptions.forEach(d => {
    const active = progressieDayFilter === d;
    const pill = el(`<button class="pill ${active ? "strength" : ""}" style="cursor:pointer;border:1px solid var(--line);text-transform:capitalize">${d === "alle" ? "Alle dagen" : d}</button>`);
    pill.addEventListener("click", () => { progressieDayFilter = d; progressieSelected = null; render(); });
    dayPillsWrap.appendChild(pill);
  });
  filterCard.appendChild(dayPillsWrap);
  const searchInput = el(`<input placeholder="Zoek oefening..." value="${progressieSearch}"/>`);
  searchInput.addEventListener("input", (e) => { progressieSearch = e.target.value; renderProgressieListInto(listCard); });
  filterCard.appendChild(searchInput);
  wrap.appendChild(filterCard);

  const listCard = el(`<div></div>`);
  wrap.appendChild(listCard);
  renderProgressieListInto(listCard);

  const detailWrap = el(`<div></div>`);
  wrap.appendChild(detailWrap);
  renderProgressieDetailInto(detailWrap);

  return wrap;
}

function renderProgressieListInto(container) {
  container.innerHTML = "";
  const term = progressieSearch.trim().toLowerCase();

  const exercisesWithLogs = STATE.exercises.filter(ex =>
    STATE.logs.some(l => l.exerciseId === ex.id) &&
    (progressieDayFilter === "alle" || ex.day === progressieDayFilter) &&
    (!term || ex.name.toLowerCase().includes(term))
  );

  const cardioDaysToShow = progressieDayFilter === "alle" ? Object.keys(SEED_CARDIO) : (SEED_CARDIO[progressieDayFilter] ? [progressieDayFilter] : []);
  const cardioActivities = [];
  cardioDaysToShow.forEach(day => {
    SEED_CARDIO[day].options.forEach(activity => {
      if (term && !activity.toLowerCase().includes(term)) return;
      if (STATE.cardioLogs.some(l => l.day === day && l.activity === activity)) cardioActivities.push({ day, activity });
    });
  });

  if (exercisesWithLogs.length === 0 && cardioActivities.length === 0) {
    const card = el(`<div class="card"></div>`);
    card.appendChild(el(`<p class="empty-hint">Er zijn binnen dit filter geen resultaten gevonden.</p>`));
    container.appendChild(card);
    return;
  }

  if (exercisesWithLogs.length) {
    const strCard = el(`<div class="card"><h3>Krachtoefeningen</h3></div>`);
    exercisesWithLogs.forEach(ex => {
      const pr = strengthPRs(ex.id);
      const selected = progressieSelected?.type === "strength" && progressieSelected.id === ex.id;
      const row = el(`
        <div class="food-item" style="cursor:pointer;${selected ? "color:var(--oxide-bright)" : ""}">
          <span>${ex.name} <span class="meta" style="text-transform:capitalize">· ${ex.day}</span></span>
          <span class="meta pr">${fmtKg(pr.bestWeight)}kg</span>
        </div>
      `);
      row.addEventListener("click", () => {
        progressieSelected = { type: "strength", id: ex.id };
        progressieStrengthMetric = "gewicht";
        render();
      });
      strCard.appendChild(row);
    });
    container.appendChild(strCard);
  }

  if (cardioActivities.length) {
    const cardioCard = el(`<div class="card"><h3>Conditie</h3></div>`);
    cardioActivities.forEach(({ day, activity }) => {
      const selected = progressieSelected?.type === "cardio" && progressieSelected.day === day && progressieSelected.activity === activity;
      const pr = cardioPRs(day, activity);
      const summary = pr.longestDist > -Infinity ? `${pr.longestDist}km` : "—";
      const row = el(`
        <div class="food-item" style="cursor:pointer;${selected ? "color:var(--oxide-bright)" : ""}">
          <span>${activity} <span class="meta" style="text-transform:capitalize">· ${day}</span></span>
          <span class="meta">${summary}</span>
        </div>
      `);
      row.addEventListener("click", () => {
        progressieSelected = { type: "cardio", day, activity };
        progressieCardioMetric = "afstand";
        render();
      });
      cardioCard.appendChild(row);
    });
    container.appendChild(cardioCard);
  }
}

function renderProgressieDetailInto(container) {
  container.innerHTML = "";
  if (!progressieSelected) {
    const card = el(`<div class="card"></div>`);
    card.appendChild(el(`<p class="empty-hint">Kies eerst een dag en oefening hierboven.</p>`));
    container.appendChild(card);
    return;
  }

  const periodRow = periodPillsRow(progressiePeriod, (key) => { progressiePeriod = key; render(); });

  if (progressieSelected.type === "strength") {
    const ex = STATE.exercises.find(e => e.id === progressieSelected.id);
    if (!ex) { progressieSelected = null; return; }
    const allLogs = STATE.logs.filter(l => l.exerciseId === ex.id).sort((a, b) => a.date.localeCompare(b.date));
    if (allLogs.length < 2) {
      const card = el(`<div class="card"><h3>${ex.name}</h3></div>`);
      card.appendChild(el(`<p class="empty-hint">Log ${ex.name} minimaal twee keer om progressie te bekijken.</p>`));
      container.appendChild(card);
      return;
    }
    const periodLogs = filterByPeriod(allLogs, progressiePeriod);
    const pr = strengthPRs(ex.id);
    const lastLog = allLogs[allLogs.length - 1];
    const firstMetricVal = sessionMetricValue(allLogs[0], progressieStrengthMetric);
    const lastMetricVal = sessionMetricValue(lastLog, progressieStrengthMetric);

    const summaryCard = el(`<div class="card"><h3>${ex.name}</h3></div>`);
    const stats = el(`<div class="stat-grid"></div>`);
    stats.appendChild(el(`<div class="stat-item"><div class="num">${fmtKg(lastMetricVal ?? 0)}</div><div class="lbl">Laatste prestatie</div></div>`));
    stats.appendChild(el(`<div class="stat-item"><div class="num">${fmtKg(pr.bestWeight)}kg</div><div class="lbl">Beste gewicht (PR ${pr.weightDate ? isoToNL(pr.weightDate).slice(0, 5) : "—"})</div></div>`));
    stats.appendChild(el(`<div class="stat-item"><div class="num">${allLogs.length}</div><div class="lbl">Trainingen geregistreerd</div></div>`));
    const diff = (lastMetricVal ?? 0) - (firstMetricVal ?? 0);
    stats.appendChild(el(`<div class="stat-item"><div class="num">${diff >= 0 ? "+" : ""}${fmtKg(diff)}</div><div class="lbl">Verschil sinds eerste keer</div></div>`));
    summaryCard.appendChild(stats);
    summaryCard.appendChild(el(`<p class="progress-hint" style="margin-top:10px">Laatste training: ${isoToNL(lastLog.date)}</p>`));
    container.appendChild(summaryCard);

    const chartCard = el(`<div class="card"></div>`);
    const metricTabs = el(`<div class="metric-tabs"></div>`);
    STRENGTH_METRICS.forEach(m => {
      const btn = el(`<button class="${progressieStrengthMetric === m.key ? "active" : ""}">${m.label}</button>`);
      btn.addEventListener("click", () => { progressieStrengthMetric = m.key; render(); });
      metricTabs.appendChild(btn);
    });
    chartCard.appendChild(metricTabs);
    chartCard.appendChild(periodRow);

    if (periodLogs.length < 2) {
      chartCard.appendChild(el(`<p class="empty-hint">Er zijn binnen deze periode geen resultaten gevonden.</p>`));
    } else {
      const metricInfo = STRENGTH_METRICS.find(m => m.key === progressieStrengthMetric);
      const canvas = el(`<canvas class="chart" id="detailChart"></canvas>`);
      chartCard.appendChild(canvas);
      const points = periodLogs.map(l => ({ value: sessionMetricValue(l, progressieStrengthMetric) ?? 0, label: isoToNL(l.date).slice(0, 5) }));
      setTimeout(() => drawLineChart(canvas, points, { color: "#C1552C", unit: metricInfo.unit }), 0);
      if (progressieStrengthMetric === "1rm") {
        chartCard.appendChild(el(`<p class="progress-hint" style="margin-top:6px">Schatting op basis van de zwaarste set per training (Epley-formule).</p>`));
      }
    }
    container.appendChild(chartCard);

    const insightsCard = el(`<div class="card"><h3>Inzichten</h3></div>`);
    strengthInsights(ex.id, ex.name).forEach(line => insightsCard.appendChild(el(`<p class="insight-line">${line}</p>`)));
    container.appendChild(insightsCard);

  } else {
    const { day, activity } = progressieSelected;
    const allLogs = STATE.cardioLogs.filter(l => l.day === day && l.activity === activity).sort((a, b) => a.date.localeCompare(b.date));
    if (allLogs.length < 2) {
      const card = el(`<div class="card"><h3>${activity}</h3></div>`);
      card.appendChild(el(`<p class="empty-hint">Er zijn nog geen genoeg conditieactiviteiten geregistreerd. Log dit minimaal twee keer.</p>`));
      container.appendChild(card);
      return;
    }
    const periodLogs = filterByPeriod(allLogs, progressiePeriod);
    const pr = cardioPRs(day, activity);
    const lastLog = allLogs[allLogs.length - 1];

    const summaryCard = el(`<div class="card"><h3>${activity} <span class="meta" style="text-transform:capitalize">· ${day}</span></h3></div>`);
    const stats = el(`<div class="stat-grid"></div>`);
    stats.appendChild(el(`<div class="stat-item"><div class="num">${lastLog.distance ?? "—"}${lastLog.distance ? "km" : ""}</div><div class="lbl">Laatste afstand</div></div>`));
    stats.appendChild(el(`<div class="stat-item"><div class="num">${pr.longestDist > -Infinity ? pr.longestDist : "—"}km</div><div class="lbl">Langste afstand</div></div>`));
    stats.appendChild(el(`<div class="stat-item"><div class="num">${pr.fastestPace < Infinity ? pr.fastestPace : "—"}</div><div class="lbl">Snelste tempo (min/km)</div></div>`));
    stats.appendChild(el(`<div class="stat-item"><div class="num">${allLogs.length}</div><div class="lbl">Sessies geregistreerd</div></div>`));
    summaryCard.appendChild(stats);
    summaryCard.appendChild(el(`<p class="progress-hint" style="margin-top:10px">Laatste sessie: ${isoToNL(lastLog.date)}</p>`));
    container.appendChild(summaryCard);

    const chartCard = el(`<div class="card"></div>`);
    const metricTabs = el(`<div class="metric-tabs"></div>`);
    CARDIO_METRICS.forEach(m => {
      const btn = el(`<button class="${progressieCardioMetric === m.key ? "active" : ""}">${m.label}</button>`);
      btn.addEventListener("click", () => { progressieCardioMetric = m.key; render(); });
      metricTabs.appendChild(btn);
    });
    chartCard.appendChild(metricTabs);
    chartCard.appendChild(periodRow);

    const validLogs = periodLogs.filter(l => cardioMetricValue(l, progressieCardioMetric) != null);
    if (validLogs.length < 2) {
      chartCard.appendChild(el(`<p class="empty-hint">Er zijn binnen deze periode geen resultaten gevonden.</p>`));
    } else {
      const metricInfo = CARDIO_METRICS.find(m => m.key === progressieCardioMetric);
      const canvas = el(`<canvas class="chart" id="detailChart"></canvas>`);
      chartCard.appendChild(canvas);
      const points = validLogs.map(l => ({ value: cardioMetricValue(l, progressieCardioMetric), label: isoToNL(l.date).slice(0, 5) }));
      setTimeout(() => drawLineChart(canvas, points, { color: "#2E8B82", unit: metricInfo.unit }), 0);
    }
    container.appendChild(chartCard);
  }
}

/* ---------- Tab 2: Lichaamsgewicht ---------- */
function renderProgressieGewicht() {
  const wrap = el(`<div></div>`);
  const allSorted = [...STATE.bodyweight].sort((a, b) => a.date.localeCompare(b.date));

  if (allSorted.length === 0) {
    const card = el(`<div class="card"></div>`);
    card.appendChild(el(`<p class="empty-hint">Voeg meerdere gewichtsmetingen toe om een trend te berekenen.</p>`));
    wrap.appendChild(card);
    return wrap;
  }

  const first = allSorted[0], last = allSorted[allSorted.length - 1];
  const highest = allSorted.reduce((a, b) => (b.kg > a.kg ? b : a));
  const lowest = allSorted.reduce((a, b) => (b.kg < a.kg ? b : a));

  const statsCard = el(`<div class="card"><h3>Overzicht</h3></div>`);
  const stats = el(`<div class="stat-grid"></div>`);
  stats.appendChild(el(`<div class="stat-item"><div class="num">${fmtKg(last.kg)}kg</div><div class="lbl">Laatste meting (${isoToNL(last.date).slice(0, 5)})</div></div>`));
  stats.appendChild(el(`<div class="stat-item"><div class="num">${fmtKg(first.kg)}kg</div><div class="lbl">Eerste meting (${isoToNL(first.date).slice(0, 5)})</div></div>`));
  stats.appendChild(el(`<div class="stat-item"><div class="num">${fmtKg(highest.kg)}kg</div><div class="lbl">Hoogste</div></div>`));
  stats.appendChild(el(`<div class="stat-item"><div class="num">${fmtKg(lowest.kg)}kg</div><div class="lbl">Laagste</div></div>`));
  const diffSinceFirst = last.kg - first.kg;
  stats.appendChild(el(`<div class="stat-item"><div class="num">${diffSinceFirst >= 0 ? "+" : ""}${fmtKg(diffSinceFirst)}kg</div><div class="lbl">Verschil sinds eerste meting</div></div>`));
  const periodEntries = filterByPeriod(allSorted, progressieWeightPeriod);
  const periodChange = periodEntries.length >= 2 ? periodEntries[periodEntries.length - 1].kg - periodEntries[0].kg : null;
  stats.appendChild(el(`<div class="stat-item"><div class="num">${periodChange != null ? (periodChange >= 0 ? "+" : "") + fmtKg(periodChange) + "kg" : "—"}</div><div class="lbl">Verandering in periode</div></div>`));
  statsCard.appendChild(stats);
  wrap.appendChild(statsCard);

  const chartCard = el(`<div class="card"><h3>Verloop</h3></div>`);
  chartCard.appendChild(periodPillsRow(progressieWeightPeriod, (key) => { progressieWeightPeriod = key; render(); }));

  if (periodEntries.length === 0) {
    chartCard.appendChild(el(`<p class="empty-hint">Er zijn binnen deze periode geen metingen gevonden.</p>`));
  } else {
    const canvas = el(`<canvas class="chart" id="bwChart"></canvas>`);
    chartCard.appendChild(canvas);
    chartCard.appendChild(el(`<p class="progress-hint" style="margin-top:6px">Losse punten = individuele metingen · dikke lijn = 7-daags gemiddelde</p>`));
    const avg = rollingAverage(periodEntries);
    setTimeout(() => drawWeightChart(canvas,
      periodEntries.map(b => ({ value: b.kg, label: isoToNL(b.date).slice(0, 5) })),
      avg.map(b => ({ value: b.kg, label: isoToNL(b.date).slice(0, 5) })),
      { color: "#5B7FA6", unit: "kg" }), 0);
  }
  wrap.appendChild(chartCard);

  const insightsCard = el(`<div class="card"><h3>Inzichten</h3></div>`);
  bodyweightInsights().forEach(line => insightsCard.appendChild(el(`<p class="insight-line">${line}</p>`)));
  wrap.appendChild(insightsCard);

  return wrap;
}

/* ---------- Tab 3: Overzicht ---------- */
function renderProgressieOverzicht() {
  const wrap = el(`<div></div>`);
  const filterCard = el(`<div class="card"></div>`);
  filterCard.appendChild(periodPillsRow(progressieOverzichtPeriod, (key) => { progressieOverzichtPeriod = key; render(); }));
  wrap.appendChild(filterCard);

  const s = overzichtStats(progressieOverzichtPeriod);
  if (s.totalSessions === 0) {
    const card = el(`<div class="card"></div>`);
    card.appendChild(el(`<p class="empty-hint">Er zijn binnen deze periode geen resultaten gevonden.</p>`));
    wrap.appendChild(card);
    return wrap;
  }

  const statsCard = el(`<div class="card"></div>`);
  const stats = el(`<div class="stat-grid"></div>`);
  stats.appendChild(el(`<div class="stat-item"><div class="num">${s.totalSessions}</div><div class="lbl">Trainingen totaal</div></div>`));
  stats.appendChild(el(`<div class="stat-item"><div class="num">${s.strengthSessions}</div><div class="lbl">Krachttrainingen</div></div>`));
  stats.appendChild(el(`<div class="stat-item"><div class="num">${s.cardioSessions}</div><div class="lbl">Conditieactiviteiten</div></div>`));
  stats.appendChild(el(`<div class="stat-item"><div class="num">${s.exercisesLogged}</div><div class="lbl">Verschillende oefeningen</div></div>`));
  stats.appendChild(el(`<div class="stat-item"><div class="num">${s.newPRCount}</div><div class="lbl">Nieuwe records</div></div>`));
  stats.appendChild(el(`<div class="stat-item"><div class="num">${s.weightChange != null ? (s.weightChange >= 0 ? "+" : "") + fmtKg(s.weightChange) + "kg" : "—"}</div><div class="lbl">Verandering lichaamsgewicht</div></div>`));
  statsCard.appendChild(stats);
  wrap.appendChild(statsCard);

  const highlightsCard = el(`<div class="card"><h3>Uitgelicht</h3></div>`);
  if (s.mostPerformed) {
    highlightsCard.appendChild(el(`<p class="insight-line">Meest uitgevoerd: <strong style="color:var(--chalk)">${s.mostPerformed.name}</strong> (${s.mostPerformedCount}x)</p>`));
  }
  if (s.strongestExercise && s.strongestPct > -Infinity) {
    highlightsCard.appendChild(el(`<p class="insight-line">Sterkste progressie: <strong style="color:var(--chalk)">${s.strongestExercise.name}</strong> (${s.strongestPct >= 0 ? "+" : ""}${Math.round(s.strongestPct * 100)}% in deze periode)</p>`));
  }
  if (!s.mostPerformed && !s.strongestExercise) {
    highlightsCard.appendChild(el(`<p class="progress-hint">Nog niet genoeg data in deze periode voor een uitgelicht resultaat.</p>`));
  }
  wrap.appendChild(highlightsCard);

  return wrap;
}

/* ============================================================
   VOEDING
   ============================================================ */
function renderVoeding() {
  const today = todayISO();
  const phase = currentPhase();
  const target = STATE.settings.targets[phase];
  const dayEntries = STATE.nutrition.filter(n => n.date === today);
  const totals = dayEntries.reduce((acc, i) => ({
    kcal: acc.kcal + i.kcal, protein: acc.protein + i.protein, carbs: acc.carbs + i.carbs, fat: acc.fat + i.fat,
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  const wrap = el(`
    <div>
      <div class="topbar">
        <div><div class="eyebrow">${phase === "bulk" ? "Lean bulk — richting eind augustus" : "Lean fase — kracht behouden"}</div><h1>Voeding</h1></div>
      </div>
      <div class="card">
        <div class="macro-bar-row">
          <div class="macro-bar-label"><span>Kcal</span><span>${Math.round(totals.kcal)} / ${target.kcal}</span></div>
          <div class="macro-bar kcal"><div style="width:${Math.min(100, totals.kcal / target.kcal * 100)}%"></div></div>
        </div>
        <div class="macro-bar-row">
          <div class="macro-bar-label"><span>Eiwit</span><span>${Math.round(totals.protein)} / ${target.protein}g</span></div>
          <div class="macro-bar protein"><div style="width:${Math.min(100, totals.protein / target.protein * 100)}%"></div></div>
        </div>
        <div class="macro-bar-row">
          <div class="macro-bar-label"><span>Koolhydraten</span><span>${Math.round(totals.carbs)} / ${target.carbs}g</span></div>
          <div class="macro-bar carbs"><div style="width:${Math.min(100, totals.carbs / target.carbs * 100)}%"></div></div>
        </div>
        <div class="macro-bar-row">
          <div class="macro-bar-label"><span>Vet</span><span>${Math.round(totals.fat)} / ${target.fat}g</span></div>
          <div class="macro-bar fat"><div style="width:${Math.min(100, totals.fat / target.fat * 100)}%"></div></div>
        </div>
      </div>

      <div class="card">
        <h3>Toevoegen</h3>
        <div class="settings-row" style="margin-top:10px"><input id="foodName" placeholder="Wat heb je gegeten?"/></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <input id="foodKcal" type="number" placeholder="kcal" style="flex:1;min-width:70px"/>
          <input id="foodProtein" type="number" placeholder="eiwit g" style="flex:1;min-width:70px"/>
          <input id="foodCarbs" type="number" placeholder="koolh. g" style="flex:1;min-width:70px"/>
          <input id="foodFat" type="number" placeholder="vet g" style="flex:1;min-width:70px"/>
        </div>
        <button class="btn primary full" id="addFoodBtn" style="margin-top:10px">Toevoegen aan vandaag</button>
      </div>

      <div class="card">
        <h3>Vandaag gegeten</h3>
        <div id="foodList" style="margin-top:8px">
          ${dayEntries.length === 0 ? '<p class="progress-hint">Nog niets gelogd vandaag.</p>' :
            dayEntries.map(i => `<div class="food-item"><span>${i.name}</span><span class="meta">${i.kcal} kcal</span></div>`).join("")}
        </div>
      </div>
    </div>
  `);

  wrap.querySelector("#addFoodBtn").addEventListener("click", () => {
    const name = wrap.querySelector("#foodName").value.trim();
    const kcal = parseFloat(wrap.querySelector("#foodKcal").value) || 0;
    const protein = parseFloat(wrap.querySelector("#foodProtein").value) || 0;
    const carbs = parseFloat(wrap.querySelector("#foodCarbs").value) || 0;
    const fat = parseFloat(wrap.querySelector("#foodFat").value) || 0;
    if (!name || !kcal) return;
    STATE.nutrition.push({ date: today, name, kcal, protein, carbs, fat });
    persist();
    showToast("Toegevoegd");
    render();
  });

  return wrap;
}

/* ============================================================
   NOTITIEBOEK — vrij schrijven, los op datum, geen AI
   ============================================================ */
function renderNotitieboek() {
  const wrap = el(`<div><div class="topbar"><h1>Notitieboek</h1></div></div>`);

  let selectedNoteDate = todayISO();
  const newCard = el(`
    <div class="card">
      <h3>Nieuwe notitie</h3>
      <div class="settings-row" style="margin-top:10px" id="noteDateSlot"></div>
      <textarea id="noteText" rows="5" placeholder="Schrijf hier je reflectie..." style="resize:vertical"></textarea>
      <button class="btn primary full" id="saveNote" style="margin-top:10px">Opslaan</button>
    </div>
  `);
  newCard.querySelector("#noteDateSlot").appendChild(renderDateSelects(selectedNoteDate, (iso) => { selectedNoteDate = iso; }));
  newCard.querySelector("#saveNote").addEventListener("click", () => {
    const date = selectedNoteDate;
    const text = newCard.querySelector("#noteText").value.trim();
    if (!text) return;
    STATE.notes.push({ id: uid(), date, text, createdAt: Date.now() });
    persist();
    showToast("Notitie opgeslagen");
    render();
  });
  wrap.appendChild(newCard);

  const sorted = [...STATE.notes].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  if (sorted.length === 0) {
    wrap.appendChild(el(`<div class="card"><p class="empty-hint">Nog geen notities. Schrijf hierboven je eerste reflectie.</p></div>`));
  } else {
    sorted.forEach(note => wrap.appendChild(renderNoteCard(note)));
  }

  return wrap;
}

function renderNoteCard(note) {
  const card = el(`
    <div class="card">
      <div class="card-title-row">
        <span class="mono" style="font-size:12px;color:var(--chalk-dim)">${isoToNL(note.date)}</span>
        <span class="note-actions"></span>
      </div>
      <p class="note-body" style="white-space:pre-wrap;line-height:1.5">${escapeHtml(note.text)}</p>
    </div>
  `);
  const actions = card.querySelector(".note-actions");
  const editBtn = el(`<button class="btn ghost small" style="margin-right:6px">Bewerken</button>`);
  editBtn.addEventListener("click", () => startEditNote(card, note));
  actions.appendChild(editBtn);
  actions.appendChild(makeNoteRemoveControl(note));
  return card;
}

function startEditNote(card, note) {
  const bodyEl = card.querySelector(".note-body");
  const textarea = el(`<textarea rows="5" style="resize:vertical">${escapeHtml(note.text)}</textarea>`);
  bodyEl.replaceWith(textarea);
  const actions = card.querySelector(".note-actions");
  actions.innerHTML = "";
  const saveBtn = el(`<button class="btn primary small" style="margin-right:6px">Opslaan</button>`);
  const cancelBtn = el(`<button class="btn ghost small">Annuleren</button>`);
  saveBtn.addEventListener("click", () => {
    const newText = textarea.value.trim();
    if (newText) note.text = newText;
    persist();
    showToast("Notitie bijgewerkt");
    render();
  });
  cancelBtn.addEventListener("click", () => render());
  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
}

function makeNoteRemoveControl(note) {
  const wrap = el(`<span></span>`);
  const renderIdle = () => {
    wrap.innerHTML = "";
    const btn = el(`<button title="Notitie verwijderen" style="color:var(--chalk-dim);font-size:15px;line-height:1;padding:2px 4px">✕</button>`);
    btn.addEventListener("click", (e) => { e.stopPropagation(); renderConfirm(); });
    wrap.appendChild(btn);
  };
  const renderConfirm = () => {
    wrap.innerHTML = "";
    const group = el(`
      <span style="display:inline-flex;align-items:center;gap:6px">
        <span style="font-size:11px;color:var(--chalk-dim)">Verwijderen?</span>
        <button class="btn small" style="background:var(--danger);border-color:var(--danger);color:#fff;padding:4px 9px">Ja</button>
        <button class="btn ghost small" style="padding:4px 9px">Nee</button>
      </span>
    `);
    const [yesBtn, noBtn] = group.querySelectorAll("button");
    yesBtn.addEventListener("click", () => {
      STATE.notes = STATE.notes.filter(n => n.id !== note.id);
      persist();
      showToast("Notitie verwijderd");
      render();
    });
    noBtn.addEventListener("click", () => renderIdle());
    wrap.appendChild(group);
  };
  renderIdle();
  return wrap;
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

/* ============================================================
   INSTELLINGEN
   ============================================================ */
const DUTCH_MONTHS_FULL = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

function renderDateSelects(isoValue, onChange) {
  const [y, m, d] = isoValue.split("-").map(Number);
  const wrap = el(`<div style="display:flex;gap:6px"></div>`);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - 1 + i);

  const daySel = el(`<select style="flex:0.9">${days.map(dd => `<option value="${dd}" ${dd === d ? "selected" : ""}>${dd}</option>`).join("")}</select>`);
  const monthSel = el(`<select style="flex:1.6">${DUTCH_MONTHS_FULL.map((mm, i) => `<option value="${i + 1}" ${i + 1 === m ? "selected" : ""}>${mm}</option>`).join("")}</select>`);
  const yearSel = el(`<select style="flex:1.1">${years.map(yy => `<option value="${yy}" ${yy === y ? "selected" : ""}>${yy}</option>`).join("")}</select>`);

  const emit = () => {
    const dd = String(daySel.value).padStart(2, "0");
    const mm = String(monthSel.value).padStart(2, "0");
    onChange(`${yearSel.value}-${mm}-${dd}`);
  };
  [daySel, monthSel, yearSel].forEach(s => s.addEventListener("change", emit));
  wrap.appendChild(daySel);
  wrap.appendChild(monthSel);
  wrap.appendChild(yearSel);
  return wrap;
}

const TARGET_LABELS = { kcal: "Kcal", protein: "Eiwit (g)", carbs: "Koolhydraten (g)", fat: "Vet (g)" };

function renderInstellingen() {
  const wrap = el(`
    <div>
      <div class="topbar"><h1>Instellingen</h1></div>

      <div class="card">
        <h3>Basisgegevens</h3>
        <p class="progress-hint" style="margin-bottom:10px">Je startgewicht — het uitgangspunt waartegen je progressie wordt afgezet.</p>
        <div class="settings-row">
          <label>Startgewicht (kg)</label>
          <input type="text" inputmode="decimal" id="startWeight" placeholder="bijv. 78.5" value="${STATE.settings.startWeight ?? ""}"/>
        </div>
        <button class="btn primary full" id="saveStartWeight">Opslaan</button>
      </div>

      <div class="card">
        <h3>Fase-planning</h3>
        <div class="settings-row"><label>Bulk t/m</label><div id="bulkEndSlot"></div></div>
      </div>

      <div class="card">
        <h3>Voedingsdoel — Bulk fase</h3>
        <p class="progress-hint" style="margin-bottom:10px">Je dagdoel zolang je in de bulk-fase zit.</p>
        ${["kcal", "protein", "carbs", "fat"].map(k => `
          <div class="settings-row"><label>${TARGET_LABELS[k]}</label><input type="number" id="bulk_${k}" value="${STATE.settings.targets.bulk[k]}"/></div>
        `).join("")}
      </div>

      <div class="card">
        <h3>Voedingsdoel — Lean fase</h3>
        <p class="progress-hint" style="margin-bottom:10px">Je dagdoel zodra de lean-fase ingaat (na de bulk-einddatum hierboven).</p>
        ${["kcal", "protein", "carbs", "fat"].map(k => `
          <div class="settings-row"><label>${TARGET_LABELS[k]}</label><input type="number" id="lean_${k}" value="${STATE.settings.targets.lean[k]}"/></div>
        `).join("")}
        <button class="btn primary full" id="saveTargets">Doelen opslaan</button>
      </div>

      <div class="card">
        <h3>Data</h3>
        <button class="btn full" id="exportBtn">Exporteer back-up (JSON)</button>
      </div>
    </div>
  `);

  wrap.querySelector("#saveStartWeight").addEventListener("click", () => {
    const val = parseFloat(wrap.querySelector("#startWeight").value.replace(",", "."));
    STATE.settings.startWeight = isNaN(val) ? null : val;
    persist();
    showToast("Startgewicht opgeslagen");
  });

  wrap.querySelector("#bulkEndSlot").appendChild(renderDateSelects(STATE.settings.bulkEndDate, (iso) => {
    STATE.settings.bulkEndDate = iso;
    persist();
    showToast("Bulk-einddatum opgeslagen");
  }));

  wrap.querySelector("#saveTargets").addEventListener("click", () => {
    ["kcal", "protein", "carbs", "fat"].forEach(k => {
      STATE.settings.targets.bulk[k] = parseFloat(wrap.querySelector(`#bulk_${k}`).value) || 0;
      STATE.settings.targets.lean[k] = parseFloat(wrap.querySelector(`#lean_${k}`).value) || 0;
    });
    persist();
    showToast("Doelen opgeslagen");
  });

  wrap.querySelector("#exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(STATE, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `training-backup-${todayISO()}.json`;
    a.click();
  });

  return wrap;
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(text) {
  const t = el(`<div class="toast">${text}</div>`);
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 250);
  }, 2000);
}

/* ============================================================
   INIT
   ============================================================ */
window.addEventListener("DOMContentLoaded", () => {
  render();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
});

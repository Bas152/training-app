/* ============================================================
   STORAGE LAYER — alles lokaal in de browser (localStorage)
   ============================================================ */

const STORAGE_KEY = "bascar_training_v1";

function defaultState() {
  return {
    version: 1,
    exercises: SEED_EXERCISES.map(e => ({ ...e })),
    logs: [],           // { id, date, exerciseId, warmup:[{weight,reps}], work:[{weight,reps}], note }
    cardioLogs: [],      // { id, date, day, activity, duration, distance, note }
    bodyweight: [],       // { date, kg }
    nutrition: [],       // { date, items:[{name, kcal, protein, carbs, fat}] }
    notes: [],           // { id, date, text, createdAt }
    settings: {
      bulkEndDate: "2026-08-31",
      targets: {
        bulk: { kcal: 2900, protein: 180, carbs: 320, fat: 90 },
        lean: { kcal: 2400, protein: 200, carbs: 220, fat: 70 },
      },
      startWeight: null,
    },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = defaultState();
      saveState(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw);
    // simpele forward-merge zodat nieuwe velden nooit ontbreken
    const merged = { ...defaultState(), ...parsed };
    merged.settings = { ...defaultState().settings, ...(parsed.settings || {}) };
    merged.settings.targets = { ...defaultState().settings.targets, ...(parsed.settings?.targets || {}) };
    return merged;
  } catch (e) {
    console.error("Kon state niet laden, begin opnieuw", e);
    const fresh = defaultState();
    saveState(fresh);
    return fresh;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Globale in-memory state, opgehaald bij app start
let STATE = loadState();

function persist() {
  saveState(STATE);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function isoToNL(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

function currentPhase() {
  const end = new Date(STATE.settings.bulkEndDate + "T23:59:59");
  return new Date() <= end ? "bulk" : "lean";
}

function dayNameFromISO(iso) {
  const names = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
  return names[new Date(iso + "T12:00:00").getDay()];
}

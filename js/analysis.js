/* ============================================================
   ANALYSIS — herbruikbare berekeningsfuncties voor Progressie
   Alles hier is puur rekenwerk op bestaande STATE-data; niets
   wordt hier opgeslagen. Kies-methodes zijn bewust vastgelegd:
   - "hoofdwaarde per sessie" = de zwaarste voltooide set
   - reps-metric = herhalingen van diezelfde beste set
   - lege/onvolledige sets (gewicht of reps = 0) tellen nergens mee
   ============================================================ */

const PERIOD_OPTIONS = [
  { key: "7d", label: "7 dagen", days: 7 },
  { key: "30d", label: "30 dagen", days: 30 },
  { key: "3m", label: "3 maanden", days: 90 },
  { key: "6m", label: "6 maanden", days: 180 },
  { key: "1y", label: "1 jaar", days: 365 },
  { key: "alles", label: "Alles", days: null },
];

function periodCutoffISO(periodKey) {
  const opt = PERIOD_OPTIONS.find(p => p.key === periodKey);
  if (!opt || opt.days === null) return null;
  return addDays(todayISO(), -opt.days);
}

function filterByPeriod(items, periodKey, dateKey = "date") {
  const cutoff = periodCutoffISO(periodKey);
  if (!cutoff) return items;
  return items.filter(i => i[dateKey] >= cutoff);
}

/* ---------- Kracht: sessie-niveau ---------- */
function validSets(work) {
  return (work || []).filter(w => w.weight > 0 && w.reps > 0);
}

function sessionBestSet(work) {
  const sets = validSets(work);
  if (!sets.length) return null;
  return sets.reduce((best, s) => (s.weight > best.weight ? s : best), sets[0]);
}

function sessionVolume(work) {
  return validSets(work).reduce((sum, s) => sum + s.weight * s.reps, 0);
}

function estimated1RM(weight, reps) {
  return weight * (1 + reps / 30);
}

const STRENGTH_METRICS = [
  { key: "gewicht", label: "Gewicht", unit: "kg" },
  { key: "reps", label: "Herhalingen", unit: "" },
  { key: "volume", label: "Volume", unit: "kg" },
  { key: "1rm", label: "Geschat 1RM", unit: "kg" },
];

function sessionMetricValue(log, metricKey) {
  const best = sessionBestSet(log.work);
  if (!best) return null;
  if (metricKey === "gewicht") return best.weight;
  if (metricKey === "reps") return best.reps;
  if (metricKey === "volume") return sessionVolume(log.work);
  if (metricKey === "1rm") return Math.round(estimated1RM(best.weight, best.reps) * 10) / 10;
  return null;
}

/* ---------- Conditie: sessie-niveau ---------- */
function cardioSpeed(entry) {
  if (!entry.distance || !entry.duration) return null;
  return Math.round((entry.distance / (entry.duration / 60)) * 10) / 10; // km/h
}

function cardioPace(entry) {
  if (!entry.distance || !entry.duration || entry.distance === 0) return null;
  return Math.round((entry.duration / entry.distance) * 10) / 10; // min/km
}

const CARDIO_METRICS = [
  { key: "afstand", label: "Afstand", unit: "km" },
  { key: "tijd", label: "Tijd", unit: "min" },
  { key: "snelheid", label: "Snelheid", unit: "km/u" },
  { key: "tempo", label: "Tempo", unit: "min/km" },
];

function cardioMetricValue(entry, metricKey) {
  if (metricKey === "afstand") return entry.distance ?? null;
  if (metricKey === "tijd") return entry.duration ?? null;
  if (metricKey === "snelheid") return cardioSpeed(entry);
  if (metricKey === "tempo") return cardioPace(entry);
  return null;
}

/* ---------- Persoonlijke records ---------- */
function strengthPRs(exerciseId) {
  const logs = STATE.logs.filter(l => l.exerciseId === exerciseId).sort((a, b) => a.date.localeCompare(b.date));
  let r = { bestWeight: -Infinity, weightDate: null, bestVolume: -Infinity, volumeDate: null, best1RM: -Infinity, rmDate: null, repsRecord: null };
  const repsAtWeight = {};
  logs.forEach(l => {
    const best = sessionBestSet(l.work);
    if (!best) return;
    const vol = sessionVolume(l.work);
    const rm = estimated1RM(best.weight, best.reps);
    if (best.weight > r.bestWeight) { r.bestWeight = best.weight; r.weightDate = l.date; }
    if (vol > r.bestVolume) { r.bestVolume = vol; r.volumeDate = l.date; }
    if (rm > r.best1RM) { r.best1RM = rm; r.rmDate = l.date; }
    if (!(best.weight in repsAtWeight) || best.reps > repsAtWeight[best.weight]) {
      repsAtWeight[best.weight] = best.reps;
      r.repsRecord = { weight: best.weight, reps: best.reps, date: l.date };
    }
  });
  return r;
}

function cardioPRs(day, activity) {
  const logs = STATE.cardioLogs.filter(l => l.day === day && l.activity === activity).sort((a, b) => a.date.localeCompare(b.date));
  let r = { longestDist: -Infinity, distDate: null, longestDur: -Infinity, durDate: null, fastestPace: Infinity, paceDate: null, highestSpeed: -Infinity, speedDate: null };
  logs.forEach(l => {
    if (l.distance != null && l.distance > r.longestDist) { r.longestDist = l.distance; r.distDate = l.date; }
    if (l.duration != null && l.duration > r.longestDur) { r.longestDur = l.duration; r.durDate = l.date; }
    const pace = cardioPace(l);
    if (pace != null && pace < r.fastestPace) { r.fastestPace = pace; r.paceDate = l.date; }
    const speed = cardioSpeed(l);
    if (speed != null && speed > r.highestSpeed) { r.highestSpeed = speed; r.speedDate = l.date; }
  });
  return r;
}

/* ---------- 7-daags gemiddelde (lichaamsgewicht) ---------- */
function rollingAverage(sortedEntries, windowDays = 7) {
  return sortedEntries.map(entry => {
    const windowStart = addDays(entry.date, -(windowDays - 1));
    const windowVals = sortedEntries.filter(e => e.date >= windowStart && e.date <= entry.date);
    const avg = windowVals.reduce((s, e) => s + e.kg, 0) / windowVals.length;
    return { date: entry.date, kg: Math.round(avg * 10) / 10 };
  });
}

/* ---------- Rule-based inzichten (geen AI, vaste regels) ---------- */
function strengthInsights(exerciseId, exerciseName) {
  const logs = STATE.logs.filter(l => l.exerciseId === exerciseId).sort((a, b) => a.date.localeCompare(b.date));
  const withBest = logs.map(l => ({ date: l.date, best: sessionBestSet(l.work) })).filter(x => x.best);
  const lines = [];
  if (withBest.length >= 2) {
    const first = withBest[0].best.weight, last = withBest[withBest.length - 1].best.weight;
    if (last > first) lines.push(`Je gebruikte gewicht bij ${exerciseName} is sinds de eerste registratie gestegen (${fmtKg(first)}kg → ${fmtKg(last)}kg).`);
    else if (last < first) lines.push(`Je gebruikte gewicht bij ${exerciseName} is sinds de eerste registratie gedaald (${fmtKg(first)}kg → ${fmtKg(last)}kg).`);
    else lines.push(`Je gebruikte gewicht bij ${exerciseName} is sinds de eerste registratie ongeveer gelijk gebleven.`);
  } else {
    lines.push(`Log ${exerciseName} minimaal twee keer om een trend te zien.`);
  }
  const last30 = filterByPeriod(logs, "30d");
  lines.push(`Je hebt ${exerciseName} de afgelopen 30 dagen ${last30.length}x uitgevoerd.`);
  const pr = strengthPRs(exerciseId);
  const thisMonth = todayISO().slice(0, 7);
  if (pr.weightDate && pr.weightDate.slice(0, 7) === thisMonth) {
    lines.push(`Je hebt deze maand een nieuw gewicht-record behaald bij ${exerciseName}.`);
  }
  return lines;
}

function bodyweightInsights() {
  const sorted = [...STATE.bodyweight].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 3) return ["Er zijn nog onvoldoende metingen om een trend te bepalen."];
  const avg = arr => arr.reduce((s, x) => s + x.kg, 0) / arr.length;
  const last7 = sorted.filter(b => b.date >= addDays(todayISO(), -7));
  const prev7 = sorted.filter(b => b.date >= addDays(todayISO(), -14) && b.date < addDays(todayISO(), -7));
  if (last7.length && prev7.length) {
    const a1 = avg(last7), a2 = avg(prev7);
    if (Math.abs(a1 - a2) < 0.1) return [`Je 7-daagse gemiddelde lichaamsgewicht is ongeveer gelijk gebleven ten opzichte van vorige week (${fmtKg(a1)}kg).`];
    return [`Je 7-daagse gemiddelde lichaamsgewicht (${fmtKg(a1)}kg) is ${a1 > a2 ? "hoger" : "lager"} dan vorige week (${fmtKg(a2)}kg).`];
  }
  return ["Er zijn nog onvoldoende metingen om een trend te bepalen."];
}

/* ---------- Overzicht (periode-samenvatting) ---------- */
function overzichtStats(periodKey) {
  const cutoff = periodCutoffISO(periodKey);
  const logsInPeriod = STATE.logs.filter(l => !cutoff || l.date >= cutoff);
  const cardioInPeriod = STATE.cardioLogs.filter(l => !cutoff || l.date >= cutoff);
  const strengthDates = new Set(logsInPeriod.map(l => l.date));
  const cardioDates = new Set(cardioInPeriod.map(l => l.date));
  const allDates = new Set([...strengthDates, ...cardioDates]);

  const exerciseCounts = {};
  logsInPeriod.forEach(l => { exerciseCounts[l.exerciseId] = (exerciseCounts[l.exerciseId] || 0) + 1; });
  let mostPerformedId = null, mostPerformedCount = 0;
  Object.entries(exerciseCounts).forEach(([id, count]) => { if (count > mostPerformedCount) { mostPerformedCount = count; mostPerformedId = id; } });
  const mostPerformed = mostPerformedId ? STATE.exercises.find(e => e.id === mostPerformedId) : null;

  const byExercise = {};
  logsInPeriod.forEach(l => { (byExercise[l.exerciseId] = byExercise[l.exerciseId] || []).push(l); });
  let strongestId = null, strongestPct = -Infinity;
  Object.entries(byExercise).forEach(([id, logs]) => {
    if (logs.length < 2) return;
    const sorted = logs.slice().sort((a, b) => a.date.localeCompare(b.date));
    const firstBest = sessionBestSet(sorted[0].work);
    const lastBest = sessionBestSet(sorted[sorted.length - 1].work);
    if (!firstBest || !lastBest || firstBest.weight <= 0) return;
    const pct = (lastBest.weight - firstBest.weight) / firstBest.weight;
    if (pct > strongestPct) { strongestPct = pct; strongestId = id; }
  });
  const strongestExercise = strongestId ? STATE.exercises.find(e => e.id === strongestId) : null;

  let newPRCount = 0;
  const byExerciseAll = {};
  STATE.logs.forEach(l => { (byExerciseAll[l.exerciseId] = byExerciseAll[l.exerciseId] || []).push(l); });
  Object.values(byExerciseAll).forEach(logs => {
    const sorted = logs.slice().sort((a, b) => a.date.localeCompare(b.date));
    let runningBest = -Infinity;
    sorted.forEach(l => {
      const best = sessionBestSet(l.work);
      if (!best) return;
      if (best.weight > runningBest) {
        runningBest = best.weight;
        if (!cutoff || l.date >= cutoff) newPRCount++;
      }
    });
  });

  const bwInPeriod = STATE.bodyweight.filter(b => !cutoff || b.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
  const weightChange = bwInPeriod.length >= 2 ? Math.round((bwInPeriod[bwInPeriod.length - 1].kg - bwInPeriod[0].kg) * 10) / 10 : null;

  return {
    totalSessions: allDates.size,
    strengthSessions: strengthDates.size,
    cardioSessions: cardioInPeriod.length,
    exercisesLogged: Object.keys(exerciseCounts).length,
    newPRCount,
    weightChange,
    mostPerformed,
    mostPerformedCount,
    strongestExercise,
    strongestPct,
  };
}


/* ============================================================
   SEED DATA — Bas's trainingsschema
   Namen, dagen en spiergroepen komen uit je eigen schema.
   Startgewichten zijn bewust leeg — je vult je eigen cijfers in
   zodra je gaat loggen, en de app bouwt vanaf dan je progressie op.
   ============================================================ */

// Elke oefening heeft een vaste id (wijzig deze niet, logs verwijzen ernaar)
const SEED_EXERCISES = [
  // ---- MAANDAG — Rug ----
  { id: "rug_seated_row", name: "Seated row machine wide", day: "maandag", group: "Rug", warmup: [], work: [] },
  { id: "rug_lat_pulldown", name: "Lat pull down", day: "maandag", group: "Rug", warmup: [], work: [] },
  { id: "rug_low_row", name: "Low row machine", day: "maandag", group: "Rug", warmup: [], work: [] },

  // ---- MAANDAG — Bicep ----
  { id: "bicep_preacher_curl", name: "Preacher curl", day: "maandag", group: "Bicep", warmup: [], work: [] },
  { id: "bicep_cable_curl", name: "Cable curl", day: "maandag", group: "Bicep", warmup: [], work: [] },
  { id: "bicep_hammer_curl", name: "Hammer curl (dumbbell)", day: "maandag", group: "Bicep", warmup: [], work: [] },

  // ---- MAANDAG — Benen ----
  { id: "benen_leg_press", name: "Leg press", day: "maandag", group: "Benen", warmup: [], work: [] },
  { id: "benen_calf_raises", name: "Calf raises", day: "maandag", group: "Benen", warmup: [], work: [] },
  { id: "benen_leg_extension", name: "Leg extension", day: "maandag", group: "Benen", warmup: [], work: [] },

  // ---- WOENSDAG — Chest ----
  { id: "chest_flat_db_press", name: "Flat dumbbell press", day: "woensdag", group: "Chest", warmup: [], work: [] },
  { id: "chest_cable_fly", name: "Cable fly machine", day: "woensdag", group: "Chest", warmup: [], work: [] },
  { id: "chest_incline_smith", name: "Incline bench smith machine", day: "woensdag", group: "Chest", warmup: [], work: [] },

  // ---- WOENSDAG — Schouders ----
  { id: "schouders_db_press_machine", name: "Dumbbell schoulder press machine", day: "woensdag", group: "Schouders", warmup: [], work: [] },
  { id: "schouders_cable_lateral", name: "Cable lateral raise", day: "woensdag", group: "Schouders", warmup: [], work: [] },
  { id: "schouders_face_pull", name: "Face pull", day: "woensdag", group: "Schouders", warmup: [], work: [] },

  // ---- WOENSDAG — Triceps ----
  { id: "triceps_cable_pushdown", name: "Cable tricep pushdown", day: "woensdag", group: "Triceps", warmup: [], work: [] },
  { id: "triceps_single_arm_pushdown", name: "Single arm tricep pushdown", day: "woensdag", group: "Triceps", warmup: [], work: [] },

  // ---- ZATERDAG — Full body ----
  { id: "fb_romanian_deadlift", name: "Romanian deadlift", day: "zaterdag", group: "Full Body", warmup: [], work: [] },
  { id: "fb_incline_db_press", name: "Incline dumbbell press", day: "zaterdag", group: "Full Body", warmup: [], work: [] },
  { id: "fb_lat_pulldown", name: "Lat pulldown", day: "zaterdag", group: "Full Body", warmup: [], work: [] },
  { id: "fb_seated_cable_row", name: "Seated cable row", day: "zaterdag", group: "Full Body", warmup: [], work: [] },
  { id: "fb_tricep_pushdown", name: "Tricep pushdown", day: "zaterdag", group: "Full Body", warmup: [], work: [] },
  { id: "fb_cable_hammer_curl", name: "Cable hammer curl", day: "zaterdag", group: "Full Body", warmup: [], work: [] },
  { id: "fb_leg_raises", name: "Leg raises", day: "zaterdag", group: "Full Body", warmup: [], work: [] },
];

// Cardio / conditie dagen — los van de krachtoefeningen, met afstand/tijd te loggen
const SEED_CARDIO = {
  dinsdag: { label: "Conditie", options: ["Zwemmen 1.000–1.500m", "Hardlopen 7km"] },
  donderdag: { label: "Bricktraining", options: ["30km fietsen", "3km hardlopen"] },
  vrijdag: { label: "Zwemtraining", options: ["Zwemmen 7:00–8:00"] },
  zondag: { label: "Fietsen", options: ["50km fietsen"] },
};

const DAY_ORDER = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];

const DAY_LABELS = {
  maandag: "Rug + Bicep + Benen",
  dinsdag: "Conditie",
  woensdag: "Chest + Schouders + Triceps",
  donderdag: "Bricktraining",
  vrijdag: "Zwemtraining",
  zaterdag: "Full Body",
  zondag: "Fietsen",
};

const DAY_TYPE = {
  maandag: "strength", dinsdag: "cardio", woensdag: "strength", donderdag: "cardio",
  vrijdag: "cardio", zaterdag: "strength", zondag: "cardio",
};

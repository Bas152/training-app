/* ============================================================
   MINI CHART — lichte canvas line chart, geen dependencies
   ============================================================ */
function drawWeightChart(canvas, rawPoints, avgPoints, { color = "#5B7FA6", unit = "kg" } = {}) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || 300;
  const h = 180;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  if (!rawPoints || rawPoints.length === 0) {
    ctx.fillStyle = "#9AA0A6";
    ctx.font = "13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Nog geen data", w / 2, h / 2);
    return;
  }

  const padL = 38, padR = 12, padT = 16, padB = 24;
  const values = rawPoints.map(p => p.value);
  let min = Math.min(...values), max = Math.max(...values);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.15;
  min -= pad; max += pad;

  const xFor = i => padL + (i / Math.max(rawPoints.length - 1, 1)) * (w - padL - padR);
  const yFor = v => padT + (1 - (v - min) / (max - min)) * (h - padT - padB);

  ctx.strokeStyle = "#33393F";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 2; i++) {
    const gy = padT + (i / 2) * (h - padT - padB);
    ctx.beginPath();
    ctx.moveTo(padL, gy);
    ctx.lineTo(w - padR, gy);
    ctx.stroke();
  }

  ctx.fillStyle = "#9AA0A6";
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText(Math.round(max) + unit, padL - 6, padT + 4);
  ctx.fillText(Math.round(min) + unit, padL - 6, h - padB + 4);

  // ruwe metingen: subtiele losse punten, geen lijn
  ctx.fillStyle = color + "55";
  rawPoints.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(xFor(i), yFor(p.value), 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 7-daags gemiddelde: dikke, duidelijke trendlijn
  if (avgPoints && avgPoints.length) {
    ctx.beginPath();
    avgPoints.forEach((p, i) => {
      const x = xFor(i), y = yFor(p.value);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  ctx.fillStyle = "#9AA0A6";
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillText(rawPoints[0].label, padL, h - 6);
  ctx.textAlign = "right";
  ctx.fillText(rawPoints[rawPoints.length - 1].label, w - padR, h - 6);
}

function drawLineChart(canvas, points, { color = "#C1552C", unit = "", showDots = true } = {}) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || 300;
  const h = 180;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  if (!points || points.length === 0) {
    ctx.fillStyle = "#9AA0A6";
    ctx.font = "13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Nog geen data", w / 2, h / 2);
    return;
  }

  const padL = 38, padR = 12, padT = 16, padB = 24;
  const values = points.map(p => p.value);
  let min = Math.min(...values), max = Math.max(...values);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.15;
  min -= pad; max += pad;

  const xFor = i => padL + (i / Math.max(points.length - 1, 1)) * (w - padL - padR);
  const yFor = v => padT + (1 - (v - min) / (max - min)) * (h - padT - padB);

  // gridlines
  ctx.strokeStyle = "#33393F";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 2; i++) {
    const gy = padT + (i / 2) * (h - padT - padB);
    ctx.beginPath();
    ctx.moveTo(padL, gy);
    ctx.lineTo(w - padR, gy);
    ctx.stroke();
  }

  // y labels
  ctx.fillStyle = "#9AA0A6";
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText(Math.round(max) + unit, padL - 6, padT + 4);
  ctx.fillText(Math.round(min) + unit, padL - 6, h - padB + 4);

  // line
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = xFor(i), y = yFor(p.value);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.stroke();

  // fill under line
  const grad = ctx.createLinearGradient(0, padT, 0, h - padB);
  grad.addColorStop(0, color + "33");
  grad.addColorStop(1, color + "00");
  ctx.lineTo(xFor(points.length - 1), h - padB);
  ctx.lineTo(xFor(0), h - padB);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // dots
  if (showDots) {
    points.forEach((p, i) => {
      const x = xFor(i), y = yFor(p.value);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  // x labels (first, middle, last)
  ctx.fillStyle = "#9AA0A6";
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillText(points[0].label, padL, h - 6);
  ctx.textAlign = "right";
  ctx.fillText(points[points.length - 1].label, w - padR, h - 6);
}

// Draws a multi-panel GTA-style poster cover onto a canvas. Every panel holds
// one photo (cover-fit, with its own zoom and pan), a colour grade washes over
// the panels, and a bold caption band runs along the foot. All lettering is
// drawn with system fonts and canvas paths: no game artwork, no game fonts.

export const SIZES = {
  square: { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

export const LAYOUTS = {
  trio: { label: 'Vice Trio', panels: 3 },
  hero: { label: 'Hero + Duo', panels: 3 },
  grid: { label: 'Four Corners', panels: 4 },
};

export const GRADES = {
  sunset: {
    label: 'Sunset',
    sky: ['#ff9a3d', '#ff5e7a', '#b83280'],
    tint: ['rgba(255, 122, 60, 0.16)', 'rgba(190, 40, 120, 0.30)'],
    caption: ['#fff3c4', '#ffb347', '#ff5e7a'],
  },
  neon: {
    label: 'Neon Nights',
    sky: ['#00e5c7', '#ff2d95', '#7b2fff'],
    tint: ['rgba(0, 229, 199, 0.12)', 'rgba(255, 45, 149, 0.32)'],
    caption: ['#d8fff8', '#00e5c7', '#ff2d95'],
  },
  dusk: {
    label: 'Palm Dusk',
    sky: ['#ffd166', '#ef476f', '#3a0ca3'],
    tint: ['rgba(255, 209, 102, 0.10)', 'rgba(58, 12, 163, 0.34)'],
    caption: ['#fff8e1', '#ffd166', '#ef476f'],
  },
};

const GUTTER = 10; // white gap between panels, in export pixels at 1080 wide
const FRAME = 14; // white frame around the whole poster

/** Rects for a layout: panel area sits above the caption band. */
export function layoutPanels(layout, w, h) {
  const g = Math.round((GUTTER * w) / 1080);
  const f = Math.round((FRAME * w) / 1080);
  const captionH = Math.round(h * 0.21);
  const area = { x: f, y: f, w: w - f * 2, h: h - captionH - f * 2 };
  const rects = [];
  if (layout === 'trio') {
    const pw = (area.w - g * 2) / 3;
    for (let i = 0; i < 3; i++) {
      rects.push({ x: area.x + i * (pw + g), y: area.y, w: pw, h: area.h });
    }
  } else if (layout === 'hero') {
    const topH = area.h * 0.62;
    const botH = area.h - topH - g;
    const bw = (area.w - g) / 2;
    rects.push({ x: area.x, y: area.y, w: area.w, h: topH });
    rects.push({ x: area.x, y: area.y + topH + g, w: bw, h: botH });
    rects.push({ x: area.x + bw + g, y: area.y + topH + g, w: bw, h: botH });
  } else {
    const cw = (area.w - g) / 2;
    const ch = (area.h - g) / 2;
    rects.push({ x: area.x, y: area.y, w: cw, h: ch });
    rects.push({ x: area.x + cw + g, y: area.y, w: cw, h: ch });
    rects.push({ x: area.x, y: area.y + ch + g, w: cw, h: ch });
    rects.push({ x: area.x + cw + g, y: area.y + ch + g, w: cw, h: ch });
  }
  return { rects, caption: { x: f, y: h - captionH - f, w: w - f * 2, h: captionH } };
}

/** Draws one photo into a panel rect, cover-fit, zoomed and panned. */
function drawPanelPhoto(ctx, rect, panel) {
  const img = panel.img;
  if (!img) return false;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const zoom = panel.zoom ?? 1;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const pw = iw * scale;
  const ph = ih * scale;
  const cx = rect.x + rect.w / 2 + (panel.panX ?? 0) * rect.w;
  const cy = rect.y + rect.h / 2 + (panel.panY ?? 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
  return true;
}

/** A palm silhouette drawn from paths: curved trunk, six drooping fronds. */
function drawPalm(ctx, x, y, s, colour) {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineCap = 'round';
  // trunk
  ctx.lineWidth = 9 * s;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + 6 * s, y - 60 * s, x + 22 * s, y - 118 * s);
  ctx.stroke();
  const topX = x + 22 * s;
  const topY = y - 118 * s;
  // fronds
  for (const [dx, dy, bend] of [
    [-58, -26, 26], [-44, -44, 34], [-16, -52, 30],
    [16, -50, 28], [44, -40, 30], [60, -18, 22],
  ]) {
    ctx.lineWidth = 7 * s;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + dx * 0.55, topY + dy * 0.55 - bend * 0.4,
      topX + dx, topY + dy + bend * 0.55,
    );
    ctx.stroke();
  }
  ctx.restore();
}

/** Centred text with manual letter spacing, drawn letter by letter. */
function drawSpacedText(ctx, text, cx, y, font, spacing) {
  ctx.font = font;
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let x = cx - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    ctx.strokeText(ch, x, y);
    x += widths[i] + spacing;
  });
  ctx.textAlign = prevAlign;
}

/**
 * Draws the whole cover. `state` holds layout, grade, caption, subcaption and
 * panels: [{ img, zoom, panX, panY }]. The canvas is sized to the chosen post
 * size before this runs.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const { rects, caption } = layoutPanels(state.layout, w, h);
  const scale = w / 1080;

  // paper + sky backdrop behind the panels
  ctx.fillStyle = '#fdf6ec';
  ctx.fillRect(0, 0, w, h);
  const sky = ctx.createLinearGradient(0, 0, w, h * 0.8);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(FRAME * scale, FRAME * scale, w - FRAME * 2 * scale, h - FRAME * 2 * scale);

  // panels
  rects.forEach((rect, i) => {
    const panel = state.panels[i] ?? {};
    ctx.fillStyle = '#241533';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    const filled = drawPanelPhoto(ctx, rect, panel);
    if (!filled) {
      // empty panel: sun disc + palms so the poster never looks blank
      ctx.save();
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
      const cx = rect.x + rect.w * 0.72;
      const cy = rect.y + rect.h * 0.42;
      const r = Math.min(rect.w, rect.h) * 0.26;
      ctx.fillStyle = 'rgba(255, 236, 170, 0.95)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      drawPalm(ctx, rect.x + rect.w * 0.16, rect.y + rect.h, Math.min(rect.w, rect.h) / 260, 'rgba(20, 8, 36, 0.9)');
      drawPalm(ctx, rect.x + rect.w * 0.92, rect.y + rect.h, Math.min(rect.w, rect.h) / 340, 'rgba(20, 8, 36, 0.9)');
      ctx.restore();
    }
    // grade wash + vignette over every panel
    const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    wash.addColorStop(0, grade.tint[0]);
    wash.addColorStop(1, grade.tint[1]);
    ctx.fillStyle = wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    const vig = ctx.createRadialGradient(
      rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
      rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(10, 4, 24, 0.28)');
    ctx.fillStyle = vig;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  });

  // caption band
  const band = ctx.createLinearGradient(0, caption.y, 0, caption.y + caption.h);
  band.addColorStop(0, '#1c0b2e');
  band.addColorStop(1, '#0d0518');
  ctx.fillStyle = band;
  ctx.fillRect(caption.x, caption.y, caption.w, caption.h);
  // thin gradient rule above the band
  const rule = ctx.createLinearGradient(caption.x, 0, caption.x + caption.w, 0);
  rule.addColorStop(0, grade.caption[1]);
  rule.addColorStop(0.5, grade.caption[2]);
  rule.addColorStop(1, grade.caption[1]);
  ctx.fillStyle = rule;
  ctx.fillRect(caption.x, caption.y, caption.w, Math.max(3, 4 * scale));

  // palms flanking the caption
  drawPalm(ctx, caption.x + caption.w * 0.055, caption.y + caption.h * 0.98, scale * 0.55, 'rgba(0, 0, 0, 0.55)');
  drawPalm(ctx, caption.x + caption.w * 0.945, caption.y + caption.h * 0.98, scale * 0.55, 'rgba(0, 0, 0, 0.55)');

  // main caption
  const text = (state.caption || '').trim().toUpperCase();
  if (text) {
    let size = caption.h * 0.44;
    const fontFor = (s) => `900 ${s}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
    ctx.font = fontFor(size);
    const spacing = size * 0.06;
    let width = ctx.measureText(text).width + spacing * (text.length - 1);
    while (width > caption.w * 0.86 && size > 20) {
      size -= 4;
      ctx.font = fontFor(size);
      width = ctx.measureText(text).width + size * 0.06 * (text.length - 1);
    }
    const grad = ctx.createLinearGradient(0, caption.y + caption.h * 0.22, 0, caption.y + caption.h * 0.66);
    grad.addColorStop(0, grade.caption[0]);
    grad.addColorStop(0.55, grade.caption[1]);
    grad.addColorStop(1, grade.caption[2]);
    ctx.fillStyle = grad;
    ctx.strokeStyle = 'rgba(10, 4, 20, 0.85)';
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255, 94, 122, 0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.textBaseline = 'middle';
    drawSpacedText(ctx, text, caption.x + caption.w / 2, caption.y + caption.h * 0.44, fontFor(size), size * 0.06);
    ctx.shadowBlur = 0;
  }

  // sub-caption with flanking rules
  const sub = (state.subcaption || '').trim().toUpperCase();
  if (sub) {
    const size = Math.max(13, caption.h * 0.13);
    ctx.font = `700 ${size}px "Helvetica Neue", Arial, sans-serif`;
    const spacing = size * 0.42;
    const width = ctx.measureText(sub).width + spacing * (sub.length - 1);
    const cy = caption.y + caption.h * 0.80;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0)';
    ctx.textBaseline = 'middle';
    drawSpacedText(ctx, sub, caption.x + caption.w / 2, cy, ctx.font, spacing);
    const ruleY = cy;
    const ruleLen = Math.min(caption.w * 0.14, (caption.w - width) / 2 - 24 * scale);
    if (ruleLen > 10) {
      ctx.fillStyle = grade.caption[1];
      ctx.fillRect(caption.x + caption.w / 2 - width / 2 - ruleLen - 16 * scale, ruleY - 1, ruleLen, 2);
      ctx.fillRect(caption.x + caption.w / 2 + width / 2 + 16 * scale, ruleY - 1, ruleLen, 2);
    }
  }
}

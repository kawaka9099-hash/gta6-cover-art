// Vice Cover Studio: wires the editor. Pick photos (from your machine, read
// locally with FileReader, never uploaded), choose a layout, a post size and a
// colour grade, crop and position each panel, edit the caption, export a PNG.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, layoutPanels, SIZES, LAYOUTS, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subInput = document.getElementById('subcaption');
const status = document.getElementById('status');
const panelLabel = document.getElementById('panel-label');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panx');
const panYInput = document.getElementById('pany');
const zoomValue = document.getElementById('zoom-value');

const state = {
  layout: 'trio',
  size: 'square',
  grade: 'sunset',
  caption: 'Sunset Heist',
  subcaption: 'Neon Palms Golden Hour',
  panels: [{}, {}, {}, {}],
};
let selected = 0;

function panelCount() {
  return LAYOUTS[state.layout].panels;
}

function applySize() {
  const size = SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
}

function drawClean() {
  applySize();
  drawCover(canvas, {
    layout: state.layout,
    grade: state.grade,
    caption: state.caption,
    subcaption: state.subcaption,
    panels: state.panels.slice(0, panelCount()),
  });
}

function redraw() {
  drawClean();
  if (!document.body.classList.contains('shot-cover')) highlightSelected();
}

function highlightSelected() {
  const { rects } = layoutPanels(state.layout, canvas.width, canvas.height);
  const rect = rects[selected];
  if (!rect) return;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(3, canvas.width / 360);
  ctx.setLineDash([18, 10]);
  ctx.strokeRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8);
  ctx.restore();
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function readLocalFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      loadImage(reader.result).then(resolve, reject);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function syncPanelControls() {
  const panel = state.panels[selected];
  panelLabel.textContent = `Panel ${selected + 1} of ${panelCount()}${panel.img ? '' : ' — empty'}`;
  zoomInput.value = String((panel.zoom ?? 1) * 100);
  zoomValue.textContent = `${Math.round((panel.zoom ?? 1) * 100)}%`;
  panXInput.value = String(Math.round((panel.panX ?? 0) * 100));
  panYInput.value = String(Math.round((panel.panY ?? 0) * 100));
}

function selectPanel(index) {
  selected = Math.max(0, Math.min(panelCount() - 1, index));
  syncPanelControls();
  redraw();
}

function setLayout(layout) {
  state.layout = layout;
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === layout);
  });
  selected = 0;
  syncPanelControls();
  redraw();
}

function setSize(size) {
  state.size = size;
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === size);
  });
  redraw();
}

function setGrade(grade) {
  state.grade = grade;
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === grade);
  });
  redraw();
}

function loadSample(name) {
  loadImage(`samples/${name}.jpg`).then((img) => {
    state.panels[selected] = { ...state.panels[selected], img };
    syncPanelControls();
    redraw();
    status.textContent = `Sample photo loaded into panel ${selected + 1}.`;
  });
}

// Per-panel photo buttons: one file input per panel, plus a sample picker.
document.querySelectorAll('[data-load-panel]').forEach((button) => {
  button.addEventListener('click', () => {
    document.getElementById(`file-${button.dataset.loadPanel}`).click();
  });
});
document.querySelectorAll('input[type="file"][data-panel]').forEach((input) => {
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const index = Number(input.dataset.panel);
    state.panels[index] = { img: await readLocalFile(file), zoom: 1, panX: 0, panY: 0 };
    selectPanel(index);
    status.textContent = `${file.name} loaded into panel ${index + 1}.`;
  });
});

document.getElementById('fill-all').addEventListener('click', () => {
  const source = state.panels[selected].img;
  if (!source) {
    status.textContent = 'Load a photo into the selected panel first.';
    return;
  }
  for (let i = 0; i < panelCount(); i++) {
    state.panels[i] = { ...state.panels[i], img: source };
  }
  redraw();
  status.textContent = `One photo now fills all ${panelCount()} panels.`;
});

document.getElementById('clear-panel').addEventListener('click', () => {
  state.panels[selected] = {};
  syncPanelControls();
  redraw();
  status.textContent = `Panel ${selected + 1} cleared.`;
});

document.querySelectorAll('[data-sample]').forEach((button) => {
  button.addEventListener('click', () => loadSample(button.dataset.sample));
});

document.querySelectorAll('[data-layout]').forEach((b) => {
  b.addEventListener('click', () => setLayout(b.dataset.layout));
});
document.querySelectorAll('[data-size]').forEach((b) => {
  b.addEventListener('click', () => setSize(b.dataset.size));
});
document.querySelectorAll('[data-grade]').forEach((b) => {
  b.addEventListener('click', () => setGrade(b.dataset.grade));
});

captionInput.addEventListener('input', () => {
  state.caption = captionInput.value;
  redraw();
});
subInput.addEventListener('input', () => {
  state.subcaption = subInput.value;
  redraw();
});

zoomInput.addEventListener('input', () => {
  const panel = state.panels[selected];
  panel.zoom = Number(zoomInput.value) / 100;
  zoomValue.textContent = `${zoomInput.value}%`;
  redraw();
});
panXInput.addEventListener('input', () => {
  state.panels[selected].panX = Number(panXInput.value) / 100;
  redraw();
});
panYInput.addEventListener('input', () => {
  state.panels[selected].panY = Number(panYInput.value) / 100;
  redraw();
});

// Click the preview to pick the panel to crop and position.
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const { rects } = layoutPanels(state.layout, canvas.width, canvas.height);
  const hit = rects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  if (hit >= 0) selectPanel(hit);
});

document.getElementById('export').addEventListener('click', () => {
  drawClean();
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const size = SIZES[state.size];
    a.download = `vice-cover-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved vice-cover-${size.w}x${size.h}.png`;
    redraw();
  }, 'image/png');
});

// The PNG the app writes, for screenshots and tests.
window.__exportPNG = () => {
  drawClean();
  const url = canvas.toDataURL('image/png');
  redraw();
  return url;
};

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  document.body.classList.add('shot-mode');
  runShot(shot, new URLSearchParams(location.search), async (scene) => {
    state.layout = scene.layout;
    state.size = scene.size;
    state.grade = scene.grade;
    state.caption = scene.caption;
    state.subcaption = scene.subcaption;
    captionInput.value = scene.caption;
    subInput.value = scene.subcaption;
    scene.photos.forEach((img, i) => {
      state.panels[i] = { img, zoom: 1, panX: 0, panY: 0 };
    });
    setLayout(scene.layout);
    setSize(scene.size);
    setGrade(scene.grade);
    redraw();
  });
} else {
  redraw();
  syncPanelControls();
}

// Fixed scenes for screenshots: ?shot=editor shows the editor with sample
// photos loaded; ?shot=cover shows the finished cover alone, at the size the
// query names, ready for the app's own PNG export. window.__shotReady is set
// once the cover has been painted, and window.__exportPNG returns the PNG the
// app itself writes.
import { loadImage } from './main.js';

const SAMPLES = ['sunset', 'neon', 'drive'];

export async function runShot(shot, query, setup) {
  const photos = (query.get('photos') ?? query.get('photo') ?? 'sunset').split(',');
  const caption = query.get('caption') ?? 'Sunset Heist';
  const subcaption = query.get('sub') ?? 'Neon Palms Golden Hour';
  const layout = query.get('layout') ?? 'trio';
  const size = query.get('size') ?? 'square';
  const grade = query.get('grade') ?? 'sunset';
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const loaded = [];
  for (const name of photos) {
    const file = SAMPLES.includes(name) ? name : 'sunset';
    loaded.push(await loadImage(`samples/${file}.jpg`));
  }
  await setup({ photos: loaded, caption, subcaption, layout, size, grade });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}

const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
function extractFrom(idx) {
  const start = html.indexOf('{', html.indexOf('=', idx));
  let depth = 0, end = -1, inStr = false, esc = false;
  for (let p = start; p < html.length; p++) {
    const c = html[p];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = p; break; } }
  }
  if (end < 0) return null;
  try { return JSON.parse(html.slice(start, end + 1)); } catch { return null; }
}
let pos = -1, data = null, found = [];
while ((pos = html.indexOf('ytInitialData', pos + 1)) !== -1) {
  const d = extractFrom(pos);
  if (d && typeof d === 'object' && Object.keys(d).length) { found.push(pos); if (!data) data = d; }
}
if (!data) { console.log('NO JSON FOUND'); process.exit(1); }

if (process.argv[3] === 'debug') {
  console.log('occurrences with JSON:', found.length);
  console.log('top keys:', Object.keys(data).join(','));
  const s = JSON.stringify(data);
  console.log('lockupViewModel:', s.indexOf('lockupViewModel'));
  console.log('videoRenderer:', s.indexOf('videoRenderer'));
  process.exit(0);
}

const vids = [];
const walk = (o) => {
  if (!o || typeof o !== 'object') return;
  if (o.lockupViewModel) {
    const l = o.lockupViewModel;
    const id = l.contentId;
    const title = l.metadata?.lockupMetadataViewModel?.title?.content || '';
    const meta = l.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
    const parts = meta.flatMap(r => (r.metadataParts || []).map(p => p.text?.content)).filter(Boolean);
    vids.push({ id, title, meta: parts });
  }
  if (o.richItemRenderer?.content?.videoRenderer) {
    const r = o.richItemRenderer.content.videoRenderer;
    vids.push({ id: r.videoId, title: r.title?.runs?.map(x => x.text).join('') || '', meta: [] });
  }
  Object.values(o).forEach(walk);
};
walk(data);
console.log(JSON.stringify(vids, null, 1));

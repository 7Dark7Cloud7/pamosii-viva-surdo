/* Pesquisa pública no YouTube — usado só para VERIFICAR se existe recurso real
   (ex.: Bíblia em Língua Gestual Angolana). Não é parte da app publicada. */
const q = process.argv[2];
const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
const BS = String.fromCharCode(92); // backslash, para não depender de escapes no ficheiro

fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.6',
    'Cookie': 'CONSENT=YES+cb.20240101-01-p0.en+FX+000; SOCS=CAI',
  },
}).then(r => r.text()).then(html => {
  const vids = [];
  const seen = new Set();
  const push = (id, title, meta) => { if (id && !seen.has(id)) { seen.add(id); vids.push({ id, title, meta }); } };
  const walk = (o) => {
    if (!o || typeof o !== 'object') return;
    if (o.lockupViewModel) {
      const l = o.lockupViewModel;
      const title = l.metadata?.lockupMetadataViewModel?.title?.content || '';
      const meta = (l.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [])
        .flatMap(r => (r.metadataParts || []).map(p => p.text?.content)).filter(Boolean);
      push(l.contentId, title, meta);
    }
    if (o.videoRenderer) {
      const r = o.videoRenderer;
      push(r.videoId, r.title?.runs?.map(x => x.text).join('') || '',
        [r.ownerText?.runs?.[0]?.text || '', r.viewCountText?.simpleText || '', r.publishedTimeText?.simpleText || ''].filter(Boolean));
    }
    Object.values(o).forEach(walk);
  };

  const s = html.indexOf('ytInitialData');
  if (s < 0) { console.log('NO ytInitialData (possível página de consentimento)'); return; }
  const st = html.indexOf('{', html.indexOf('=', s));
  let depth = 0, end = -1, inStr = false, esc = false;
  for (let p = st; p < html.length; p++) {
    const c = html[p];
    if (inStr) {
      if (esc) esc = false;
      else if (c === BS) esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (!depth) { end = p; break; } }
  }
  let data = null;
  try { data = JSON.parse(html.slice(st, end + 1)); } catch (e) { console.log('PARSE FAIL', e.message); return; }
  walk(data);
  console.log('QUERY: ' + q + '  (' + vids.length + ' resultados)');
  vids.slice(0, Number(process.argv[3] || 25)).forEach(v => console.log('- ' + v.id + ' | ' + v.title + ' | ' + v.meta.join(' · ')));
}).catch(e => console.log('ERR', e.message));

'use strict';

/* ────────────────────────────────────────────────────────────────
   IMPORT
──────────────────────────────────────────────────────────────── */
(function setupImport() {

  let importFiles = [];
  let reviewRows  = [];

  const overlay     = document.getElementById('importOverlay');
  const ocrProg     = document.getElementById('ocrProgress');
  const reviewWrap  = document.getElementById('importReviewWrap');
  const reviewBody  = document.getElementById('importReviewBody');
  const reviewTitle = document.getElementById('importReviewTitle');

  /* ── Open / Close ── */
  document.getElementById('openImportBtn').addEventListener('click', () => {
    overlay.classList.remove('hidden');
    resetImport();
  });
  document.getElementById('importCancelBtn').addEventListener('click', closeImport);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeImport(); });
  function closeImport() { overlay.classList.add('hidden'); }

  function resetImport() {
    importFiles = []; reviewRows = [];
    document.getElementById('importThumbs').innerHTML = '';
    document.getElementById('importDropLabel').textContent = 'Drop screenshots here or click to browse';
    document.getElementById('importNameArea').value = '';
    ocrProg.textContent = '';
    const lookupStatus = document.getElementById('importLookupStatus');
    if (lookupStatus) { lookupStatus.textContent = ''; lookupStatus.style.color = ''; }
    reviewWrap.classList.add('hidden');
    const defaultTab = 'names';
    document.querySelectorAll('.import-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === defaultTab));
    document.querySelectorAll('.import-pane').forEach(p => p.classList.toggle('hidden', p.id !== 'import-pane-' + defaultTab));
  }

  /* ── Tab switching ── */
  const importModal = document.getElementById('importOverlay');
  document.querySelectorAll('.import-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      importModal.querySelectorAll('.import-tab-btn').forEach(b => b.classList.remove('active'));
      importModal.querySelectorAll('.import-pane').forEach(p => p.classList.add('hidden'));
      btn.classList.add('active');
      importModal.querySelector('#import-pane-' + btn.dataset.tab).classList.remove('hidden');
    });
  });

  /* ── File input / drag-drop ── */
  const fileInput = document.getElementById('importFileInput');
  const dropzone  = document.getElementById('importDropzone');

  dropzone.addEventListener('click', e => { if (e.target !== fileInput) fileInput.click(); });
  fileInput.addEventListener('change', () => { addFiles(Array.from(fileInput.files)); fileInput.value = ''; });
  dropzone.addEventListener('dragover',  e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault(); dropzone.classList.remove('drag-over');
    addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
  });

  function addFiles(files) {
    const thumbs = document.getElementById('importThumbs');
    files.forEach(f => {
      if (importFiles.find(x => x.name === f.name && x.size === f.size)) return;
      importFiles.push(f);
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;width:80px;height:60px;flex-shrink:0';
      const img = document.createElement('img');
      img.style.cssText = 'width:80px;height:60px;object-fit:cover;border-radius:4px;border:1px solid var(--border)';
      img.src = URL.createObjectURL(f);
      const rm = document.createElement('button');
      rm.textContent = '✕';
      rm.style.cssText = 'position:absolute;top:2px;right:2px;background:rgba(0,0,0,.75);color:#fff;border:none;border-radius:3px;font-size:9px;cursor:pointer;padding:1px 4px;line-height:1.4';
      rm.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); importFiles = importFiles.filter(x => x !== f); wrap.remove(); updateDropLabel(); });
      wrap.append(img, rm);
      thumbs.appendChild(wrap);
    });
    updateDropLabel();
  }

  function updateDropLabel() {
    document.getElementById('importDropLabel').textContent =
      importFiles.length ? `${importFiles.length} image(s) selected — drop more to add` : 'Drop screenshots here or click to browse';
  }

  /* ── Full-image preprocessing: grayscale + contrast stretch ── */
  async function preprocessForChars(file) {
    const bmp = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width  = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    bmp.close();
    const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d  = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
      const v = Math.max(0, Math.min(255, Math.round((g - 70) * 255 / 125)));
      d[i] = d[i+1] = d[i+2] = v;
    }
    ctx.putImageData(id, 0, 0);
    return new Promise(res => canvas.toBlob(res, 'image/png'));
  }

  /* ── Top-right corner crop for world detection (World name e.g. Kronos is in top-right panel) ── */
  async function preprocessForWorld(file) {
    const bmp = await createImageBitmap(file);
    const sx = Math.round(bmp.width  * 0.60);
    const sy = 0;
    const sw = bmp.width  - sx;
    const sh = Math.round(bmp.height * 0.28);
    const canvas = document.createElement('canvas');
    canvas.width  = Math.max(sw * 2, 200);
    canvas.height = Math.max(sh * 2, 80);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    bmp.close();
    return new Promise(res => canvas.toBlob(res, 'image/png'));
  }

  /* ── Table region: tighter crop (ChatGPT "crop panel") then high-contrast (ChatGPT "OCR at high contrast") ── */
  async function preprocessForTable(file) {
    const bmp = await createImageBitmap(file);
    const w = bmp.width, h = bmp.height;
    /* Tighter crop: table modal is usually center; avoid more of left (background chars) and right (detail panel). */
    const marginX = Math.round(w * 0.18);
    const marginY = Math.round(h * 0.20);
    const cw = w - 2 * marginX;
    const ch = h - 2 * marginY;
    const canvas = document.createElement('canvas');
    canvas.width  = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, marginX, marginY, cw, ch, 0, 0, cw, ch);
    bmp.close();
    /* High contrast: grayscale + stretch so text is dark on light for better OCR. */
    const id = ctx.getImageData(0, 0, cw, ch);
    const d = id.data;
    let minV = 255, maxV = 0;
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
      minV = Math.min(minV, g); maxV = Math.max(maxV, g);
    }
    const range = Math.max(maxV - minV, 1);
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
      const v = Math.max(0, Math.min(255, Math.round((g - minV) * 255 / range)));
      d[i] = d[i+1] = d[i+2] = v;
    }
    ctx.putImageData(id, 0, 0);
    return new Promise(res => canvas.toBlob(res, 'image/png'));
  }

  /* ── Match OCR text to an item label for a slot (fuzzy by tokens). ── */
  function matchOCRTextToItem(slot, text) {
    if (!text || typeof SLOT_ITEMS === 'undefined') return 'None';
    const raw = text.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!raw) return 'None';
    const tokens = raw.split(/\s+/).filter(t => t.length > 1);
    const items = SLOT_ITEMS[slot];
    if (!items || !items.length) return 'None';
    let best = null;
    let bestScore = 0;
    for (const it of items) {
      const label = (it.label || '').toLowerCase();
      if (!label) continue;
      let score = 0;
      if (label === raw) { score = 100; }
      else if (label.includes(raw) || raw.includes(label)) { score = 50; }
      else {
        const labelTokens = label.split(/\s+/);
        for (const t of tokens) {
          if (labelTokens.some(lt => lt.includes(t) || t.includes(lt))) score += 10;
          if (label.includes(t)) score += 5;
        }
      }
      if (score > bestScore) { bestScore = score; best = it.label; }
    }
    return best || 'None';
  }

  /* ── Equipment screenshot: OCR full image, assign words to slots by bbox, match to items. ── */
  async function processEquipmentScreenshot(file, worker) {
    const bmp = await createImageBitmap(file);
    const w = bmp.width, h = bmp.height;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    bmp.close();
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    const { data } = await worker.recognize(blob);
    const regions = typeof getEquipmentScreenshotRegions === 'function' ? getEquipmentScreenshotRegions() : [];
    const slotText = {};
    regions.forEach(r => { slotText[r.slot] = []; });
    if (data.words && data.words.length) {
      for (const word of data.words) {
        const b = word.bbox;
        if (!b || b.x0 == null) continue;
        const cx = (b.x0 + b.x1) / 2 / w;
        const cy = (b.y0 + b.y1) / 2 / h;
        const text = (word.text || '').trim();
        if (!text || text.length < 2) continue;
        for (const r of regions) {
          if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) {
            slotText[r.slot].push(text);
            break;
          }
        }
      }
    }
    const gear = {};
    SLOTS.forEach(s => { gear[s] = { item: 'None', stars: 0 }; });
    regions.forEach(r => {
      const text = slotText[r.slot].join(' ');
      const item = matchOCRTextToItem(r.slot, text);
      if (item !== 'None') gear[r.slot] = { item, stars: 0 };
    });
    return { name: 'Imported', level: null, cls: '', world: null, gear };
  }

  /* ── OCR processing ── */
  document.getElementById('importOCRBtn').addEventListener('click', async () => {
    if (!importFiles.length) { ocrProg.textContent = 'Add at least one screenshot first.'; return; }
    ocrProg.textContent = 'Loading OCR engine (requires internet)…';
    try {
      if (!window.Tesseract) await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
    } catch {
      ocrProg.textContent = '❌ Failed to load OCR engine — check internet connection.'; return;
    }
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: m => { if (m.status === 'recognizing text') ocrProg.textContent = `Recognising… ${Math.round(m.progress * 100)}%`; }
    });

    const allParsed = [];
    try {
      for (let i = 0; i < importFiles.length; i++) {
        ocrProg.textContent = `Pre-processing image ${i + 1} / ${importFiles.length}…`;
        const worldBlob = await preprocessForWorld(importFiles[i]);
        await worker.setParameters({ tessedit_pageseg_mode: '11' });
        const { data: wData } = await worker.recognize(worldBlob);
        const world = detectWorldFromText(wData.text);

        const tableBlob = await preprocessForTable(importFiles[i]);
        await worker.setParameters({ tessedit_pageseg_mode: '6' });
        const { data: tableData } = await worker.recognize(tableBlob);

        let rows = parseOCRTable(tableData.words);
        if (!rows.length && tableData.text) {
          rows = parseOCRText(tableData.text);
        }
        if (lastImportDebug) {
          lastImportDebug.rawText = tableData.text || '';
          lastImportDebug.rawWordsSample = (tableData.words || []).slice(0, 100).map(w => ({ text: w.text, x0: w.bbox?.x0, x1: w.bbox?.x1, y0: w.bbox?.y0, y1: w.bbox?.y1 }));
        }
        allParsed.push(...rows.map(r => ({ ...r, world })));
      }
    } catch (err) {
      await worker.terminate();
      ocrProg.textContent = `❌ Error: ${err.message}`;
      return;
    }
    await worker.terminate();
    ocrProg.textContent = `Done — ${allParsed.length} character(s) recognised.`;
    showReview(dedupeRows(allParsed));
  });

  /* ── Search: look up names from Nexon (one name per line), cache, 5s cooldown, parallel lookups ── */
  const importLookupBtn = document.getElementById('importLookupBtn');
  const importLookupRegion = document.getElementById('importLookupRegion');
  const importLookupStatus = document.getElementById('importLookupStatus');
  const importLookupCache = new Map(); // key: region:normalizedName, value: result object or null
  let lastImportSearchEndTime = 0;
  const IMPORT_SEARCH_COOLDOWN_MS = 5000;
  const IMPORT_LOOKUP_CONCURRENCY = 4;

  async function runWithConcurrency(items, fn, updateStatus) {
    const results = [];
    let next = 0;
    async function worker() {
      while (next < items.length) {
        const i = next++;
        const item = items[i];
        if (updateStatus) updateStatus(i + 1, items.length, item.name);
        try {
          results[i] = await fn(item);
        } catch (e) {
          results[i] = null;
        }
      }
    }
    const workers = Array(Math.min(IMPORT_LOOKUP_CONCURRENCY, items.length)).fill(0).map(() => worker());
    await Promise.all(workers);
    return results;
  }

  if (importLookupBtn && importLookupStatus) {
    importLookupBtn.addEventListener('click', async () => {
      const raw = document.getElementById('importNameArea').value.trim();
      const names = raw.split('\n').map(l => l.trim()).filter(Boolean);
      if (!names.length) {
        importLookupStatus.textContent = 'Enter at least one name (one per line).';
        importLookupStatus.style.color = 'var(--danger)';
        return;
      }
      const now = Date.now();
      if (lastImportSearchEndTime && (now - lastImportSearchEndTime < IMPORT_SEARCH_COOLDOWN_MS)) {
        const wait = Math.ceil((IMPORT_SEARCH_COOLDOWN_MS - (now - lastImportSearchEndTime)) / 1000);
        importLookupStatus.textContent = 'Please wait ' + wait + ' second(s) before searching again.';
        importLookupStatus.style.color = 'var(--danger)';
        return;
      }
      const region = (importLookupRegion && importLookupRegion.value) ? importLookupRegion.value : 'gms';
      importLookupBtn.disabled = true;

      const results = new Array(names.length);
      const toFetch = [];
      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const cacheKey = region + ':' + name.toLowerCase();
        const cached = importLookupCache.get(cacheKey);
        if (cached !== undefined) {
          results[i] = cached === null
            ? { name, level: null, cls: null, world: null, imageUrl: null }
            : { name: cached.name || name, level: cached.level ?? null, cls: cached.cls || null, world: cached.world || null, imageUrl: cached.imageUrl || null };
        } else {
          toFetch.push({ index: i, name });
        }
      }

      if (toFetch.length === 0) {
        importLookupStatus.textContent = `Done — ${names.length} row(s) from cache. Wait 5s before searching again.`;
        importLookupStatus.style.color = 'var(--text-muted)';
        importLookupBtn.disabled = false;
        showReview(dedupeRows(results));
        return;
      }

      importLookupStatus.textContent = `Looking up 1–${Math.min(IMPORT_LOOKUP_CONCURRENCY, toFetch.length)} of ${toFetch.length} new…`;
      importLookupStatus.style.color = 'var(--accent)';

      const lookupCharacterFn = typeof lookupCharacter === 'function' ? lookupCharacter : () => null;
      const fetchedResults = await runWithConcurrency(
        toFetch,
        async ({ index, name }) => {
          try {
            const result = await lookupCharacterFn(name, region);
            const cacheKey = region + ':' + name.toLowerCase();
            if (result && typeof result === 'object') {
              const row = { name: result.name || name, level: result.level ?? null, cls: result.cls || null, world: result.world || null, imageUrl: result.imageUrl || null };
              importLookupCache.set(cacheKey, row);
              return { index, row };
            }
            importLookupCache.set(cacheKey, null);
          } catch (_) {}
          return { index, row: { name, level: null, cls: null, world: null, imageUrl: null } };
        },
        (done, total) => {
          importLookupStatus.textContent = `Looking up ${done}/${total}…`;
        }
      );

      let fetched = 0;
      fetchedResults.forEach((r, j) => {
        if (r && r.row) {
          results[toFetch[j].index] = r.row;
          if (r.row.level != null || r.row.cls || r.row.imageUrl) fetched++;
        }
      });

      lastImportSearchEndTime = Date.now();
      importLookupStatus.textContent = `Done — ${results.length} row(s), ${fetched} new lookup(s). Wait 5s before searching again.`;
      importLookupStatus.style.color = 'var(--text-muted)';
      importLookupBtn.disabled = false;
      showReview(dedupeRows(results));
    });
  }

  let lastImportDebug = null;

  /** Normalize common OCR misreads of class names so they match ALL_CLASSES (e.g. (iL) -> (ice, lightning)). */
  function normalizeClassOcr(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/\s*\(\s*i\s*[\/\\lL]\s*l?\s*\)\s*/gi, ' (ice, lightning) ')
      .replace(/\s*\(\s*f\s*[\/\\pP]\s*p?\s*\)\s*/gi, ' (fire, poison) ')
      .replace(/\s*\(\s*f\s*i\s*p\s*[\),]?\s*/gi, ' (fire, poison) ')
      .replace(/\s*\(\s*i\s*\/\s*l\s*\)\s*/gi, ' (ice, lightning) ')
      .replace(/\s*\(\s*f\s*\/\s*p\s*\)\s*/gi, ' (fire, poison) ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Grid-based table parse: find table header (Level / Job / Name), derive column boundaries,
   * assign each word to a column by x-position, then extract level / class / name from the right cells.
   * Fallback: if no header is found, use token-order heuristic.
   */
  function parseOCRTable(words) {
    const debugEnabled = localStorage.getItem('ll_import_debug') === '1';
    const debug = debugEnabled ? {
      wordsCount: 0,
      rowsCount: 0,
      headerRowIdx: null,
      colBounds: null,
      anchorUsed: false,
      rightBound: null,
      mode: null,
      rows: [],
      rawRowTokens: [],
    } : null;

    if (!words || !words.length || typeof ALL_CLASSES === 'undefined') return [];
    const withBox = words.filter(w => w.text && w.bbox && w.bbox.x0 != null);
    if (!withBox.length) return [];
    if (debug) debug.wordsCount = withBox.length;

    const avgHeight = withBox.reduce((s, w) => s + (w.bbox.y1 - w.bbox.y0), 0) / withBox.length;
    const mergeDist = Math.max(avgHeight * 0.55, 8);
    const getCenterX = (w) => (w.bbox.x0 + w.bbox.x1) / 2;

    withBox.sort((a, b) => {
      const ya = (a.bbox.y0 + a.bbox.y1) / 2;
      const yb = (b.bbox.y0 + b.bbox.y1) / 2;
      return ya - yb || a.bbox.x0 - b.bbox.x0;
    });

    const rows = [];
    let currentRow = [];
    let lastCy = -1e9;

    for (const w of withBox) {
      const cy = (w.bbox.y0 + w.bbox.y1) / 2;
      const text = (w.text || '').trim();
      if (!text) continue;
      if (currentRow.length && cy - lastCy > mergeDist) {
        if (currentRow.length) rows.push(currentRow);
        currentRow = [];
      }
      currentRow.push({
        text,
        x0: w.bbox.x0,
        x1: w.bbox.x1,
        cx: getCenterX(w),
      });
      lastCy = cy;
    }
    if (currentRow.length) rows.push(currentRow);

    if (debug) {
      debug.rowsCount = rows.length;
      debug.rawRowTokens = rows.map((row, i) => ({ rowIndex: i, tokens: row.map(c => c.text) }));
    }

    let leftBound = Infinity;
    let rightBound = -Infinity;
    withBox.forEach(w => {
      if (w.bbox.x0 < leftBound) leftBound = w.bbox.x0;
      if (w.bbox.x1 > rightBound) rightBound = w.bbox.x1;
    });
    if (leftBound === Infinity) leftBound = 0;
    if (rightBound === -Infinity) rightBound = leftBound + 1;

    /* Anchor: (i) icon after Favorite is on the RIGHT of the table. Only use candidates in the right half so we don't pick a stray "i" from left. */
    const maxX = rightBound;
    const minY = Math.min(...withBox.map(w => (w.bbox.y0 + w.bbox.y1) / 2));
    const maxY = Math.max(...withBox.map(w => (w.bbox.y0 + w.bbox.y1) / 2));
    const headerZoneTop = minY + (maxY - minY) * 0.25;
    const infoIconCandidates = withBox.filter(w => {
      const cy = (w.bbox.y0 + w.bbox.y1) / 2;
      const t = (w.text || '').trim();
      const inHeaderZone = cy <= headerZoneTop;
      const looksLikeInfo = /^\(?i\)?$/i.test(t);
      const inRightHalf = w.bbox.x0 > maxX * 0.5;
      return inHeaderZone && looksLikeInfo && inRightHalf;
    });
    if (infoIconCandidates.length) {
      const anchor = infoIconCandidates.reduce((best, w) => (w.bbox.x1 > best.bbox.x1 ? w : best));
      rightBound = anchor.bbox.x0;
      if (debug) { debug.anchorUsed = true; debug.rightBound = rightBound; }
    } else if (debug) debug.rightBound = rightBound;

    let headerRowIdx = -1;
    let colBounds = null;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      row.sort((a, b) => a.cx - b.cx);
      const levelWord = row.find(c => /^lev/i.test(c.text) && c.text.length >= 3);
      const jobWord   = row.find(c => /^job$/i.test(c.text));
      const nameWord  = row.find(c => /^nam/i.test(c.text) && c.text.length >= 3);
      if (levelWord && jobWord && nameWord) {
        const xs = [levelWord.cx, jobWord.cx, nameWord.cx].sort((a, b) => a - b);
        colBounds = [
          [leftBound, (xs[0] + xs[1]) / 2],
          [(xs[0] + xs[1]) / 2, (xs[1] + xs[2]) / 2],
          [(xs[1] + xs[2]) / 2, rightBound],
        ];
        headerRowIdx = r;
        break;
      }
    }

    /* If header not found (OCR misread Level/Job/Name), infer column bounds from first row that has a class. */
    if (!colBounds && rightBound > leftBound + 200) {
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        row.sort((a, b) => a.cx - b.cx);
        let clsStartIdx = -1, clsEndIdx = -1, matchedCls = null;
        for (let i = 0; i < row.length; i++) {
          for (let span = 6; span >= 1 && i + span <= row.length; span--) {
            const tNorm = row.slice(i, i + span).map(c => c.text).join(' ').replace(/\s+/g, ' ').trim();
            for (const c of ALL_CLASSES) {
              const cNorm = c.replace(/\s+/g, ' ').toLowerCase();
              if (tNorm.toLowerCase() === cNorm || (tNorm.length >= 4 && (cNorm.includes(tNorm.toLowerCase()) || tNorm.toLowerCase().includes(cNorm)))) {
                matchedCls = c; clsStartIdx = i; clsEndIdx = i + span; break;
              }
            }
            if (matchedCls) break;
          }
          if (matchedCls) break;
        }
        if (clsStartIdx < 0) continue;
        const rowMaxX = row.length ? Math.max(...row.map(c => c.x1)) : 0;
        /* Level column is left of job; use numbers in 15–48% of row width so we skip row index and avoid Position column. */
        const levelCells = row.slice(0, clsStartIdx).filter(c => /^\d{1,3}$/.test(c.text) && c.cx >= rowMaxX * 0.15 && c.cx <= rowMaxX * 0.48);
        const jobCells  = row.slice(clsStartIdx, clsEndIdx);
        const jobRight = jobCells.length ? Math.max(...jobCells.map(c => c.x1)) : 0;
        const jobLeft  = jobCells.length ? Math.min(...jobCells.map(c => c.x0)) : 0;
        /* Name column ends before Position/Favorite; name must be right of job (exclude left-side noise like "JASE"). */
        const nameMaxX = Math.min(rightBound, jobRight + 350);
        const nameCells = row.slice(clsEndIdx).filter(c =>
          c.cx > jobLeft && c.cx < rightBound && c.x1 <= nameMaxX &&
          !/^\d+$/.test(c.text) && !/^[Ll][vV]\.?\d*$/i.test(c.text));
        if (levelCells.length && jobCells.length && nameCells.length) {
          const levelCx = levelCells.reduce((s, c) => s + c.cx, 0) / levelCells.length;
          const jobCx   = jobCells.reduce((s, c) => s + c.cx, 0) / jobCells.length;
          const nameCx = nameCells.reduce((s, c) => s + c.cx, 0) / nameCells.length;
          /* Ensure level < job < name by x so column order is correct. */
          const xs = [levelCx, jobCx, nameCx].sort((a, b) => a - b);
          /* Cap name column at rightmost name token + padding so we don't include Position/Favorite (A, 18, Lv.260, etc.). */
          const maxNameX = Math.max(...nameCells.map(c => c.x1));
          const nameRight = Math.min(maxNameX + 80, rightBound);
          colBounds = [
            [leftBound, (xs[0] + xs[1]) / 2],
            [(xs[0] + xs[1]) / 2, (xs[1] + xs[2]) / 2],
            [(xs[1] + xs[2]) / 2, nameRight],
          ];
          headerRowIdx = -1;
          if (debug) { debug.mode = 'grid'; debug.inferredFromRow = r; debug.colBounds = colBounds; }
          break;
        }
      }
    }

    if (colBounds) {
      if (debug) {
        debug.mode = debug.mode || 'grid';
        debug.rowsCount = rows.length;
        debug.headerRowIdx = headerRowIdx;
        debug.colBounds = colBounds;
      }
      const results = [];
      for (let r = 0; r < rows.length; r++) {
        if (headerRowIdx >= 0 && r === headerRowIdx) continue;
        const row = rows[r];
        const cells = [[], [], []];
        for (const cell of row) {
          for (let c = 0; c < 3; c++) {
            if (cell.cx >= colBounds[c][0] && cell.cx < colBounds[c][1]) {
              cells[c].push(cell.text);
              break;
            }
          }
        }
        const col0Text = cells[0].join(' ').trim();
        const col1Text = cells[1].join(' ').trim();
        const col2Text = cells[2].join(' ').trim();

        const levelNums = (col0Text.match(/\b(\d{1,3})\b/g) || []).map(Number).filter(n => n >= 1 && n <= 300);
        let level = null;
        if (levelNums.length) {
          const maxNum = Math.max(...levelNums);
          const minNum = Math.min(...levelNums);
          level = levelNums.length >= 2 && maxNum >= 200 && minNum <= 20 ? maxNum : levelNums[levelNums.length - 1];
        }

        let cls = null;
        const col1Norm = normalizeClassOcr(col1Text.replace(/\s+/g, ' ').trim()).toLowerCase();
        for (const c of ALL_CLASSES) {
          const cNorm = normalizeClassOcr(c).replace(/\s+/g, ' ').toLowerCase();
          if (col1Norm === cNorm || (col1Norm.length >= 4 && (cNorm.includes(col1Norm) || col1Norm.includes(cNorm)))) {
            cls = c;
            break;
          }
        }
        if (!cls) continue;

        let name = col2Text.replace(/^[\s\(\[]+|[\s\)\]]+$/g, '').trim();
        name = name.replace(/\s+(position|favorite)$/i, '').trim();
        if (debug) debug.rows.push({ rowIndex: r, col0: col0Text, col1: col1Text, col2: col2Text, level, cls, name: name.length >= 2 && !/^\(.*\)$/.test(name) && !/^[\d\s]+$/.test(name) ? name : '(skipped)' });
        if (name.length < 2) continue;
        if (/^\(.*\)$/.test(name) || /^[\d\s]+$/.test(name)) continue;

        results.push({ name, level, cls });
      }
      if (debug) { lastImportDebug = debug; console.log('[Import] parseOCRTable (grid)', debug); }
      return results;
    }

    /* Fallback: token-order heuristic (no header found) */
    if (debug) { debug.mode = 'fallback'; debug.headerRowIdx = -1; debug.colBounds = null; }
    const results = [];
    const skipHeaders = /^(level|job|name|position|favorite|page)$/i;

    for (const row of rows) {
      row.sort((a, b) => a.cx - b.cx);
      const tokens = row.map(r => r.text);

      let cls = null;
      let clsStartIdx = -1;
      let clsEndIdx = -1;
      for (let i = 0; i < tokens.length; i++) {
        if (skipHeaders.test(tokens[i])) break;
        for (let span = 6; span >= 1 && i + span <= tokens.length; span--) {
          const tNorm = tokens.slice(i, i + span).join(' ').replace(/\s+/g, ' ').trim();
          for (const c of ALL_CLASSES) {
            const cNorm = c.replace(/\s+/g, ' ');
            if (tNorm.toLowerCase() === cNorm.toLowerCase()) { cls = c; clsStartIdx = i; clsEndIdx = i + span; break; }
            if (tNorm.length >= 4 && cNorm.toLowerCase().indexOf(tNorm.toLowerCase()) !== -1) { cls = c; clsStartIdx = i; clsEndIdx = i + span; break; }
            if (cNorm.length >= 4 && tNorm.toLowerCase().indexOf(cNorm.toLowerCase()) !== -1) { cls = c; clsStartIdx = i; clsEndIdx = i + span; break; }
          }
          if (cls) break;
        }
        if (cls) break;
      }
      if (!cls || clsStartIdx < 0) continue;

      const beforeTokens = tokens.slice(0, clsStartIdx);
      const levelNums = (beforeTokens.join(' ').match(/\b(\d{1,3})\b/g) || [])
        .map(Number)
        .filter(n => n >= 1 && n <= 300);
      let level = null;
      if (levelNums.length) {
        const maxNum = Math.max(...levelNums);
        const minNum = Math.min(...levelNums);
        if (levelNums.length >= 2 && maxNum >= 200 && minNum <= 20) {
          level = maxNum;
        } else {
          level = levelNums[levelNums.length - 1];
        }
      }

      const afterTokens = tokens.slice(clsEndIdx).filter(t => {
        if (!t || t.length < 1) return false;
        if (/^\d+$/.test(t)) return false;
        if (/^[Ll][vV]\.?\d*$/i.test(t)) return false;
        if (/^(position|favorite|page)$/i.test(t)) return false;
        if (/^[\(\[]/.test(t)) return false;
        if (/[\)\]]$/.test(t) && t.length <= 4) return false;
        return true;
      });
      let nameParts = afterTokens.slice(0, 4).map(t => t.replace(/^[\s\(\[]+|[\s\)\]]+$/g, '')).filter(Boolean);
      if (nameParts.length > 1 && nameParts[nameParts.length - 1].length === 1) nameParts.pop();
      let name = nameParts.join(' ').trim();
      if (debug) debug.rows.push({ rowIndex: debug.rows.length, tokens, level, cls, name: name.length >= 2 && !/^\(.*\)$/.test(name) && !/^[\d\s]+$/.test(name) ? name : '(skipped)' });
      if (name.length < 2) continue;
      if (/^\(.*\)$/.test(name) || /^[\d\s]+$/.test(name)) continue;

      results.push({ name, level, cls });
    }
    if (debug) { lastImportDebug = debug; console.log('[Import] parseOCRTable (fallback)', debug); }
    return results;
  }

  /* ── Fallback: line-based OCR parser (when word bbox not used) ── */
  function parseOCRText(text) {
    const results = [];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^page\s+\d+$/i.test(line)) continue;
      if (/^(level|job|name|position|favorite)\b/i.test(line)) continue;
      for (const cls of ALL_CLASSES) {
        const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const m = new RegExp('\\b' + escaped + '\\b', 'i').exec(line);
        if (!m) continue;
        const before = line.slice(0, m.index).trim();
        const after  = line.slice(m.index + m[0].length).trim();
        const levelNums = (before.match(/\b(\d{1,3})\b/g) || [])
          .map(Number).filter(n => n >= 1 && n <= 300);
        const level = levelNums.length ? levelNums[levelNums.length - 1] : null;
        const afterTokens = after.split(/\s+/).filter(t => {
          if (!t || t.length < 2) return false;
          if (/^\d+$/.test(t)) return false;
          if (/^[Ll][vy]\.?\d*/i.test(t)) return false;
          if (/^\W+$/.test(t)) return false;
          return true;
        });
        const name = afterTokens[0] || '';
        if (name.length < 2) continue;
        results.push({ name, level, cls });
        break;
      }
    }
    return results;
  }

  function detectWorldFromText(text) {
    if (!text || typeof KNOWN_WORLDS === 'undefined') return null;
    const clean = text.replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const tokens = clean.split(/\s+/).filter(Boolean);
    for (const t of tokens) {
      for (const w of KNOWN_WORLDS) {
        if (t.toLowerCase() === w.toLowerCase()) return w;
      }
    }
    const flat = ' ' + clean.toLowerCase() + ' ';
    for (const w of KNOWN_WORLDS) {
      const key = ' ' + w.toLowerCase() + ' ';
      if (flat.includes(key)) return w;
    }
    return null;
  }

  function nameMatchesExisting(parsedName) {
    const n = (parsedName || '').trim().toLowerCase();
    if (!n) return false;
    return chars.some(c => {
      const existing = (c.name || '').trim().toLowerCase();
      if (existing === n) return true;
      if (n.length >= 4 && existing.length >= 4 && (n.includes(existing) || existing.includes(n))) return true;
      return false;
    });
  }

  function dedupeRows(rows) {
    const seen = new Set();
    return rows.filter(r => {
      const key = (r.name || '').trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).map(r => ({
      ...r,
      name:       (r.name || '').trim(),
      exists:     nameMatchesExisting(r.name),
      _checked:   !nameMatchesExisting(r.name),
      preset:     r.preset    || null,
      accPresets: Array.isArray(r.accPresets) ? r.accPresets : (r.accPreset ? [r.accPreset] : []),
      stars:      r.stars ?? null,
    }));
  }

  function showReview(rows) {
    reviewRows = [...rows].sort((a, b) => (a.exists === b.exists ? 0 : a.exists ? 1 : -1));
    const newCount = reviewRows.filter(r => !r.exists).length;
    reviewTitle.textContent = `${rows.length} character(s) found — ${newCount} new`;
    reviewWrap.classList.remove('hidden');
    renderReviewTable();
  }

  function renderReviewTable() {
    reviewBody.innerHTML = '';
    reviewRows.forEach((row) => {
      const tr = document.createElement('tr');
      if (row.exists) tr.classList.add('row-exists');

      const cbTd = document.createElement('td');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'import-row-select-cb';
      cb.checked = row._checked;
      cb.disabled = row.exists;
      cb.addEventListener('change', () => { row._checked = cb.checked; });
      cbTd.appendChild(cb);

      const nameTd = document.createElement('td');
      const nameIn = document.createElement('input');
      nameIn.type = 'text'; nameIn.value = row.name;
      nameIn.addEventListener('change', () => row.name = nameIn.value.trim());
      nameTd.appendChild(nameIn);

      const lvlTd = document.createElement('td');
      const lvlIn = document.createElement('input');
      lvlIn.type = 'number'; lvlIn.min = 1; lvlIn.max = 300;
      lvlIn.value = row.level || ''; lvlIn.placeholder = '—';
      lvlIn.addEventListener('change', () => row.level = parseInt(lvlIn.value) || null);
      lvlTd.appendChild(lvlIn);

      const clsTd = document.createElement('td');
      const clsBtn = document.createElement('button');
      clsBtn.type = 'button';
      clsBtn.className = 'inline-picker-trigger' + (row.cls ? '' : ' picker-placeholder');
      clsBtn.textContent = row.cls || 'Select class…';
      clsBtn.setAttribute('data-open-floating-class', '1');
      clsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof window.openFloatingClassPicker === 'function') {
          window.openFloatingClassPicker(clsBtn, row.cls || '', (val) => {
            row.cls = val || '';
            clsBtn.textContent = val || 'Select class…';
            clsBtn.classList.toggle('picker-placeholder', !val);
          });
        }
      });
      clsTd.appendChild(clsBtn);

      const worldTd = document.createElement('td');
      const worldBtn = document.createElement('button');
      worldBtn.type = 'button';
      worldBtn.className = 'inline-picker-trigger' + (row.world ? '' : ' picker-placeholder');
      worldBtn.textContent = row.world || 'Select world…';
      worldBtn.setAttribute('data-open-floating-world', '1');
      worldBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof window.openFloatingWorldPicker === 'function') {
          window.openFloatingWorldPicker(worldBtn, row.world || '', (val) => {
            row.world = val || '';
            worldBtn.textContent = val || 'Select world…';
            worldBtn.classList.toggle('picker-placeholder', !val);
          });
        }
      });
      worldTd.appendChild(worldBtn);

      const presetTd = document.createElement('td');
      const presetSel = document.createElement('select');
      presetSel.disabled = row.exists;
      const pNone = document.createElement('option');
      pNone.value = ''; pNone.textContent = '— None —';
      presetSel.appendChild(pNone);
      const gearList = typeof getFullGearPresetList === 'function' ? getFullGearPresetList() : GEAR_PRESETS;
      const customGearCount = (typeof getCustomGearPresets === 'function' ? getCustomGearPresets() : []).length;
      gearList.forEach((p, i) => {
        if (i === 0 && customGearCount > 0) {
          const co = document.createElement('option');
          co.disabled = true;
          co.textContent = 'Custom';
          presetSel.appendChild(co);
        }
        if (i === customGearCount && customGearCount > 0) {
          const d = document.createElement('option');
          d.disabled = true;
          d.textContent = 'Default';
          presetSel.appendChild(d);
        }
        const opt = document.createElement('option');
        opt.value = p.name; opt.textContent = p.name;
        if (p.name === row.preset) opt.selected = true;
        presetSel.appendChild(opt);
      });
      presetSel.addEventListener('change', () => { row.preset = presetSel.value || null; });
      presetTd.appendChild(presetSel);

      const accPresetTd = document.createElement('td');
      accPresetTd.className = 'import-acc-presets-cell';
      const accOrder = typeof getFullAccessoryPresetOrder === 'function' ? getFullAccessoryPresetOrder() : ACCESSORY_PRESETS.map(x => x.name);
      const customAccCount = (typeof getCustomAccessoryPresets === 'function' ? getCustomAccessoryPresets() : []).length;
      function accSummary(selected) {
        if (!selected || selected.length === 0) return '— None —';
        if (selected.length <= 2) return selected.join(', ');
        return selected[0] + ' +' + (selected.length - 1);
      }
      const accTrigger = document.createElement('button');
      accTrigger.type = 'button';
      accTrigger.className = 'inline-picker-trigger acc-preset-multi-trigger' + (row.exists ? ' picker-placeholder' : '');
      accTrigger.textContent = accSummary(row.accPresets || []);
      accTrigger.disabled = row.exists;
      const accPanel = document.createElement('div');
      accPanel.className = 'acc-preset-multi-panel hidden';
      accPanel.setAttribute('role', 'listbox');
      accOrder.forEach((name, i) => {
        if (i === 0 && customAccCount > 0) {
          const customDiv = document.createElement('div');
          customDiv.className = 'preset-list-divider preset-list-divider-custom';
          customDiv.textContent = 'Custom';
          accPanel.appendChild(customDiv);
        }
        if (i === customAccCount && customAccCount > 0) {
          const div = document.createElement('div');
          div.className = 'preset-list-divider preset-list-divider-custom';
          div.textContent = 'Default';
          accPanel.appendChild(div);
        }
        const label = document.createElement('label');
        label.className = 'acc-preset-multi-option';
        label.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;padding:4px 8px;white-space:nowrap';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'import-acc-cb';
        cb.value = name;
        cb.checked = (row.accPresets || []).includes(name);
        cb.addEventListener('change', () => {
          row.accPresets = Array.from(accPanel.querySelectorAll('.import-acc-cb:checked')).map(el => el.value);
          accTrigger.textContent = accSummary(row.accPresets);
          accTrigger.classList.toggle('picker-placeholder', !row.accPresets || row.accPresets.length === 0);
        });
        label.appendChild(cb);
        label.appendChild(document.createTextNode(name));
        accPanel.appendChild(label);
      });
      accPresetTd.appendChild(accTrigger);
      accPresetTd.appendChild(accPanel);
      accPanel._container = accPresetTd;
      accPanel.addEventListener('click', (e) => e.stopPropagation());
      function closeAccPanel(panel, container) {
        panel.classList.add('hidden');
        if (panel.parentElement === document.body) document.body.removeChild(panel);
        if (container && panel.parentElement !== container) container.appendChild(panel);
      }
      accTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (row.exists) return;
        const wasOpen = accPanel.parentElement === document.body;
        document.querySelectorAll('.acc-preset-multi-panel').forEach(p => {
          if (p.parentElement === document.body) closeAccPanel(p, p._container);
        });
        if (wasOpen) return;
        document.body.appendChild(accPanel);
        const rect = accTrigger.getBoundingClientRect();
        accPanel.style.position = 'fixed';
        accPanel.style.left = rect.left + 'px';
        accPanel.style.top = (rect.bottom + 2) + 'px';
        accPanel.style.minWidth = rect.width + 'px';
        accPanel.style.zIndex = '10000';
        accPanel.classList.remove('hidden');
        document.addEventListener('click', function onClose() {
          closeAccPanel(accPanel, accPresetTd);
          document.removeEventListener('click', onClose);
        }, { once: true });
      });

      const starsTd   = document.createElement('td');
      const starsWrap = document.createElement('div');
      starsWrap.className = 'stars-cell';
      [10, 15, 18, 22].forEach(n => {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'sf-quick';
        btn.dataset.sf = String(n); btn.textContent = n;
        if (row.exists) btn.disabled = true;
        starsWrap.appendChild(btn);
      });
      const starsIn = document.createElement('input');
      starsIn.type = 'number'; starsIn.min = 0; starsIn.max = 25;
      starsIn.className = 'form-input stars-type-input';
      starsIn.placeholder = '—'; starsIn.disabled = row.exists;
      starsIn.value = row.stars != null ? row.stars : '';
      starsWrap.appendChild(starsIn);
      if (!row.exists) {
        const sfq = initSfQuick(starsWrap, starsIn);
        sfq.reset(row.stars);
      }
      starsIn.addEventListener('input', () => {
        if (row.exists) return;
        const v = starsIn.value.trim();
        row.stars = v === '' ? null : parseInt(v, 10);
      });
      starsTd.appendChild(starsWrap);

      const statusTd = document.createElement('td');
      statusTd.innerHTML = row.exists
        ? '<span class="badge-exists">Already exists</span>'
        : '<span class="badge-new">New</span>';

      tr.append(cbTd, nameTd, lvlTd, clsTd, worldTd, presetTd, accPresetTd, starsTd, statusTd);
      reviewBody.appendChild(tr);
    });
  }

  document.getElementById('importSelectAll').addEventListener('change', function () {
    reviewBody.querySelectorAll('.import-row-select-cb:not(:disabled)').forEach((cb, i) => {
      cb.checked = this.checked;
      const newRows = reviewRows.filter(r => !r.exists);
      if (newRows[i]) newRows[i]._checked = this.checked;
    });
  });

  const importDebugCheckbox = document.getElementById('importDebugCheckbox');
  const importDebugWrap = document.getElementById('importDebugWrap');
  const importViewDebugBtn = document.getElementById('importViewDebugBtn');
  if (importDebugCheckbox) {
    importDebugCheckbox.checked = localStorage.getItem('ll_import_debug') === '1';
    importDebugCheckbox.addEventListener('change', () => {
      localStorage.setItem('ll_import_debug', importDebugCheckbox.checked ? '1' : '');
    });
  }
  if (importViewDebugBtn && importDebugWrap) {
    importViewDebugBtn.addEventListener('click', () => {
      const wasHidden = importDebugWrap.classList.contains('hidden');
      importDebugWrap.classList.toggle('hidden');
      if (wasHidden) {
        importDebugWrap.textContent = lastImportDebug
          ? JSON.stringify(lastImportDebug, null, 2)
          : 'No debug data. Enable "Log parsing details" and process an image.';
      }
    });
  }
  const importCopyDebugBtn = document.getElementById('importCopyDebugBtn');
  if (importCopyDebugBtn) {
    importCopyDebugBtn.addEventListener('click', async () => {
      if (!lastImportDebug) {
        importCopyDebugBtn.textContent = 'No debug data';
        setTimeout(() => { importCopyDebugBtn.textContent = 'Copy debug to clipboard'; }, 1500);
        return;
      }
      const json = JSON.stringify(lastImportDebug, null, 2);
      try {
        await navigator.clipboard.writeText(json);
        importCopyDebugBtn.textContent = 'Copied!';
        setTimeout(() => { importCopyDebugBtn.textContent = 'Copy debug to clipboard'; }, 2000);
      } catch (e) {
        importCopyDebugBtn.textContent = 'Copy failed';
        setTimeout(() => { importCopyDebugBtn.textContent = 'Copy debug to clipboard'; }, 2000);
      }
    });
  }

  document.getElementById('importConfirmBtn').addEventListener('click', () => {
    const toAdd = reviewRows.filter(r => !r.exists && r._checked && r.name.trim());
    const missingClass = toAdd.filter(r => !(r.cls && r.cls.trim()));
    if (missingClass.length) {
      alert('Please select a class for all selected characters.');
      return;
    }
    if (toAdd.length) {
      const lastWorld = localStorage.getItem('ll_last_world') || null;
      toAdd.forEach(r => {
        let gear = {};
        if (r.gear) {
          SLOTS.forEach(s => { gear[s] = r.gear[s] || { item: 'None', stars: 0 }; });
        } else {
          SLOTS.forEach(s => { gear[s] = { item: 'None', stars: 0 }; });
          if (r.accPresets && r.accPresets.length) applyAccessoryPresets(gear, r.accPresets);
          if (r.preset)        applyPreset(gear, r.preset,    r.cls);
          if (r.stars != null) setAllStars(gear, r.stars);
        }
        chars.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
          name:      r.name.trim(),
          level:     r.level || null,
          cls:       r.cls   || null,
          world:     r.world || lastWorld,
          imageUrl:  r.imageUrl || null,
          collapsed: false,
          gear,
        });
      });
      save(); render();
    }
    closeImport();
  });

  /* ── Per-character gear import (hamburger → Import gear from screenshot) ── */
  let gearImportCharIdx = null;
  let gearImportRecognizedGear = null;
  let gearImportSelectedFile = null;

  const gearImportOverlay   = document.getElementById('gearImportOverlay');
  const gearImportCharName  = document.getElementById('gearImportCharName');
  const gearImportDropzone  = document.getElementById('gearImportDropzone');
  const gearImportFileInput = document.getElementById('gearImportFileInput');
  const gearImportDropLabel = document.getElementById('gearImportDropLabel');
  const gearImportProcessBtn = document.getElementById('gearImportProcessBtn');
  const gearImportProgress   = document.getElementById('gearImportProgress');
  const gearImportApplyBtn  = document.getElementById('gearImportApplyBtn');
  const gearImportCancelBtn = document.getElementById('gearImportCancelBtn');
  const gearImportResultsWrap = document.getElementById('gearImportResultsWrap');
  const gearImportResults   = document.getElementById('gearImportResults');

  function closeGearImport() {
    gearImportOverlay.classList.add('hidden');
    gearImportCharIdx = null;
    gearImportRecognizedGear = null;
    gearImportSelectedFile = null;
    gearImportFileInput.value = '';
    gearImportDropLabel.textContent = 'Drop equipment screenshot or click to browse';
    gearImportProcessBtn.disabled = true;
    gearImportApplyBtn.disabled = true;
    gearImportProgress.textContent = '';
    if (gearImportResultsWrap) gearImportResultsWrap.classList.add('hidden');
    if (gearImportResults) gearImportResults.innerHTML = '';
  }

  function setGearImportFile(file) {
    gearImportSelectedFile = file || null;
    if (gearImportResultsWrap) gearImportResultsWrap.classList.add('hidden');
    if (gearImportResults) gearImportResults.innerHTML = '';
    if (file) {
      gearImportDropLabel.textContent = file.name;
      gearImportProcessBtn.disabled = false;
      gearImportRecognizedGear = null;
      gearImportApplyBtn.disabled = true;
    } else {
      gearImportDropLabel.textContent = 'Drop equipment screenshot or click to browse';
      gearImportProcessBtn.disabled = true;
      gearImportApplyBtn.disabled = true;
    }
    gearImportProgress.textContent = '';
  }

  function renderGearImportResults(gear) {
    if (!gear || !gearImportResults) return;
    const slotOrder = typeof EQUIPMENT_SCREENSHOT_SLOTS !== 'undefined' ? EQUIPMENT_SCREENSHOT_SLOTS : (typeof SLOTS !== 'undefined' ? SLOTS : []);
    const lines = [];
    slotOrder.forEach(slot => {
      const entry = gear[slot];
      const item = entry && entry.item && entry.item !== 'None' ? entry.item : null;
      if (item) lines.push({ slot, item });
    });
    const esc = typeof escHtml === 'function' ? escHtml : s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    gearImportResults.innerHTML = lines.length
      ? lines.map(({ slot, item }) => `<div>${esc(slot)}: ${esc(item)}</div>`).join('')
      : '<div style="color:var(--text-muted)">No gear recognised. Try a clearer screenshot or apply and edit manually.</div>';
    if (gearImportResultsWrap) gearImportResultsWrap.classList.remove('hidden');
  }

  window.openGearImportModal = function(idx) {
    if (idx == null || !chars[idx]) return;
    gearImportCharIdx = idx;
    gearImportRecognizedGear = null;
    gearImportSelectedFile = null;
    if (gearImportCharName) gearImportCharName.textContent = 'Character: ' + (chars[idx].name || 'Unnamed');
    gearImportFileInput.value = '';
    gearImportDropLabel.textContent = 'Drop equipment screenshot or click to browse';
    gearImportProcessBtn.disabled = true;
    gearImportApplyBtn.disabled = true;
    gearImportProgress.textContent = '';
    if (gearImportResultsWrap) gearImportResultsWrap.classList.add('hidden');
    if (gearImportResults) gearImportResults.innerHTML = '';
    gearImportOverlay.classList.remove('hidden');
  };

  if (gearImportDropzone) {
    gearImportDropzone.addEventListener('click', e => { if (e.target !== gearImportFileInput) gearImportFileInput.click(); });
    gearImportDropzone.addEventListener('dragover', e => { e.preventDefault(); gearImportDropzone.classList.add('drag-over'); });
    gearImportDropzone.addEventListener('dragleave', () => gearImportDropzone.classList.remove('drag-over'));
    gearImportDropzone.addEventListener('drop', e => {
      e.preventDefault();
      gearImportDropzone.classList.remove('drag-over');
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f && f.type.startsWith('image/')) setGearImportFile(f);
    });
  }
  gearImportFileInput.addEventListener('change', () => setGearImportFile(gearImportFileInput.files && gearImportFileInput.files[0]));

  gearImportProcessBtn.addEventListener('click', async () => {
    const file = gearImportSelectedFile || (gearImportFileInput.files && gearImportFileInput.files[0]);
    if (!file) return;
    gearImportProcessBtn.disabled = true;
    gearImportProgress.textContent = 'Loading OCR…';
    try {
      if (!window.Tesseract) await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
      gearImportProgress.textContent = 'Recognising…';
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: m => { if (m.status === 'recognizing text') gearImportProgress.textContent = `Recognising… ${Math.round(m.progress * 100)}%`; }
      });
      const result = await processEquipmentScreenshot(file, worker);
      await worker.terminate();
      gearImportRecognizedGear = result.gear;
      gearImportApplyBtn.disabled = false;
      gearImportProgress.textContent = 'Done — review below and click Apply to use this gear.';
      renderGearImportResults(gearImportRecognizedGear);
    } catch (err) {
      gearImportProgress.textContent = '❌ ' + (err.message || 'Error');
      gearImportProcessBtn.disabled = false;
    }
  });

  gearImportApplyBtn.addEventListener('click', () => {
    if (gearImportCharIdx == null || !gearImportRecognizedGear) return;
    const c = chars[gearImportCharIdx];
    if (!c) { closeGearImport(); return; }
    c.gear = c.gear || {};
    SLOTS.forEach(s => { c.gear[s] = gearImportRecognizedGear[s] || { item: 'None', stars: 0 }; });
    save();
    render();
    closeGearImport();
  });

  if (gearImportCancelBtn) gearImportCancelBtn.addEventListener('click', closeGearImport);
  if (gearImportOverlay) gearImportOverlay.addEventListener('click', e => { if (e.target === gearImportOverlay) closeGearImport(); });

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
})();

/* ────────────────────────────────────────────────────────────────
   CLASS HOVER TOOLTIP
──────────────────────────────────────────────────────────────── */
(function () {
  const tip = document.getElementById('cls-tooltip');
  let timer = null;

  function showTip(el) {
    const cls   = el.dataset.clsTooltip;
    const level = el.dataset.clsLevel || '';
    if (!cls) return;

    tip.innerHTML = buildClassTooltipHTML(cls, level);

    tip.style.visibility = 'hidden';
    tip.classList.add('visible');

    const elRect  = el.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const margin  = 8;

    let top  = elRect.bottom + 6;
    let left = elRect.left;

    if (left + tipRect.width > window.innerWidth - margin) {
      left = window.innerWidth - tipRect.width - margin;
    }
    if (left < margin) left = margin;
    if (top + tipRect.height > window.innerHeight - margin) {
      top = elRect.top - tipRect.height - 6;
    }

    tip.style.top  = top  + 'px';
    tip.style.left = left + 'px';
    tip.style.visibility = '';
  }

  function hideTip() {
    clearTimeout(timer);
    timer = null;
    tip.classList.remove('visible');
  }

  document.addEventListener('mouseover', e => {
    const el = e.target;
    if (!el.dataset || !el.dataset.clsTooltip) return;
    clearTimeout(timer);
    timer = setTimeout(() => showTip(el), 500);
  });

  document.addEventListener('mouseout', e => {
    const el = e.target;
    if (!el.dataset || !el.dataset.clsTooltip) return;
    hideTip();
  });
})();

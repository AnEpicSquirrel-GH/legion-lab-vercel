'use strict';

// All class names, longest-first for greedy OCR matching
const ALL_CLASSES  = Object.keys(CLASS_CATEGORY).sort((a, b) => b.length - a.length);
const KNOWN_WORLDS = ['Kronos','Hyperion','Scania','Bera','Solis','Luna'];

/* ────────────────────────────────────────────────────────────────
   TOP-BAR CONTROLS
──────────────────────────────────────────────────────────────── */
document.getElementById('toggleAllBtn').addEventListener('click', toggleAll);
document.getElementById('openAddBtn').addEventListener('click', openModal);
document.getElementById('openAddBtn2').addEventListener('click', openModal);

/* Dev mode: 5 clicks on header icon within 2s enables full features (stays until refresh) */
let devMode = false;
window.isDevMode = function() { return devMode; };

function applyDevModeUI() {
  const toggleBgBtn = document.getElementById('toggleBgBtn');
  if (toggleBgBtn) toggleBgBtn.style.display = devMode ? '' : 'none';
  const screenshotsTab = document.querySelector('.import-tab-btn[data-tab="screenshots"]');
  if (screenshotsTab) screenshotsTab.style.display = devMode ? '' : 'none';
  const siteTitle = document.getElementById('siteTitle');
  if (siteTitle) siteTitle.textContent = devMode ? 'Legion Labussy' : 'Legion Lab';
  document.querySelectorAll('.import-debug-dev-only, .lookup-debug-dev-only').forEach(function (el) {
    el.style.display = devMode ? '' : 'none';
  });
}

(function() {
  let clicks = 0;
  let resetTimer = null;
  document.getElementById('siteHeaderIcon').addEventListener('click', () => {
    clicks++;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { clicks = 0; }, 2000);
    if (clicks >= 5) {
      devMode = true;
      clicks = 0;
      applyDevModeUI();
    }
  });
})();
applyDevModeUI();

// Populate gear preset dropdown and accessory preset checkboxes in the add/edit modal
;(function() {
  const gSel = document.getElementById('inputPreset');
  const gearList = typeof getFullGearPresetList === 'function' ? getFullGearPresetList() : GEAR_PRESETS;
  const customGearCount = (typeof getCustomGearPresets === 'function' ? getCustomGearPresets() : []).length;
  gearList.forEach((p, i) => {
    if (i === 0 && customGearCount > 0) {
      const customOpt = document.createElement('option');
      customOpt.disabled = true;
      customOpt.textContent = 'Custom';
      gSel.appendChild(customOpt);
    }
    if (i === customGearCount && customGearCount > 0) {
      const div = document.createElement('option');
      div.disabled = true;
      div.textContent = 'Default';
      gSel.appendChild(div);
    }
    const opt = document.createElement('option');
    opt.value = p.name; opt.textContent = p.name;
    gSel.appendChild(opt);
  });
  (function initGearPresetDropdown() {
    if (gSel.closest('.gear-preset-dropdown-wrap')) return;
    const gearWrap = document.createElement('div');
    gearWrap.className = 'gear-preset-dropdown-wrap';
    gSel.parentNode.insertBefore(gearWrap, gSel);
    gearWrap.appendChild(gSel);
    const gearTrigger = document.createElement('button');
    gearTrigger.type = 'button';
    gearTrigger.className = 'gear-preset-trigger';
    const gearTriggerText = document.createElement('span');
    gearTriggerText.className = 'gear-preset-text picker-placeholder';
    gearTriggerText.textContent = '— None —';
    const gearTriggerChevron = document.createElement('span');
    gearTriggerChevron.className = 'gear-preset-chevron';
    gearTriggerChevron.textContent = '▼';
    gearTrigger.appendChild(gearTriggerText);
    gearTrigger.appendChild(gearTriggerChevron);
    const gearPanel = document.createElement('div');
    gearPanel.className = 'gear-preset-panel hidden';
    gearWrap.appendChild(gearTrigger);
    gearWrap.appendChild(gearPanel);
    function closeGearPanel() {
      gearPanel.classList.add('hidden');
      if (gearPanel.parentElement === document.body) document.body.removeChild(gearPanel);
      const w = gSel.closest('.gear-preset-dropdown-wrap');
      if (w && gearPanel.parentElement !== w) w.appendChild(gearPanel);
    }
    gearPanel._close = closeGearPanel;
    gearPanel.addEventListener('click', (e) => e.stopPropagation());
    gearTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!gearPanel.classList.contains('hidden')) {
        closeGearPanel();
        return;
      }
      document.querySelectorAll('.gear-preset-panel').forEach(p => { if (p._close) p._close(); });
      document.querySelectorAll('.acc-preset-multi-panel').forEach(p => {
        if (p.parentElement === document.body) { p.classList.add('hidden'); p.parentElement.removeChild(p); const c = p._container; if (c) c.appendChild(p); }
      });
      const rect = gearTrigger.getBoundingClientRect();
      gearPanel.style.position = 'fixed';
      gearPanel.style.left = rect.left + 'px';
      gearPanel.style.top = (rect.bottom + 2) + 'px';
      gearPanel.style.width = rect.width + 'px';
      gearPanel.style.minWidth = rect.width + 'px';
      gearPanel.style.maxWidth = rect.width + 'px';
      gearPanel.style.zIndex = '10001';
      document.body.appendChild(gearPanel);
      gearPanel.classList.remove('hidden');
      document.addEventListener('click', function onClose() { closeGearPanel(); document.removeEventListener('click', onClose); }, { once: true });
    });
    gearPanel.innerHTML = '';
    const noneRow = document.createElement('div');
    noneRow.className = 'gear-preset-option';
    noneRow.textContent = '— None —';
    noneRow.addEventListener('click', () => { gSel.value = ''; window._updateInputPresetPlaceholder && window._updateInputPresetPlaceholder(); if (gearPanel._close) gearPanel._close(); });
    gearPanel.appendChild(noneRow);
    gearList.forEach((p, i) => {
      if (i === 0 && customGearCount > 0) {
        const div = document.createElement('div');
        div.className = 'preset-list-divider preset-list-divider-custom';
        div.textContent = 'Custom';
        gearPanel.appendChild(div);
      }
      if (i === customGearCount && customGearCount > 0) {
        const div = document.createElement('div');
        div.className = 'preset-list-divider preset-list-divider-custom';
        div.textContent = 'Default';
        gearPanel.appendChild(div);
      }
      const row = document.createElement('div');
      row.className = 'gear-preset-option';
      row.textContent = p.name;
      row.addEventListener('click', () => { gSel.value = p.name; window._updateInputPresetPlaceholder && window._updateInputPresetPlaceholder(); if (gearPanel._close) gearPanel._close(); });
      gearPanel.appendChild(row);
    });
  })();
  function updateGearPresetPlaceholder() {
    const gearWrap = gSel.closest('.gear-preset-dropdown-wrap');
    const textEl = gearWrap && gearWrap.querySelector('.gear-preset-text');
    if (textEl) {
      const opt = gSel.options[gSel.selectedIndex];
      textEl.textContent = opt ? opt.textContent : '— None —';
      textEl.classList.toggle('picker-placeholder', !gSel.value);
    }
  }
  updateGearPresetPlaceholder();
  window._updateInputPresetPlaceholder = updateGearPresetPlaceholder;
  const accWrap = document.getElementById('inputAccessoryPresetWrap');
  if (accWrap) {
    function accSummary(selected) {
      if (!selected || selected.length === 0) return '— None —';
      if (selected.length <= 2) return selected.join(', ');
      return selected[0] + ' +' + (selected.length - 1);
    }
    const accTrigger = document.createElement('button');
    accTrigger.type = 'button';
    accTrigger.className = 'inline-picker-trigger acc-preset-multi-trigger';
    const accTriggerText = document.createElement('span');
    accTriggerText.className = 'acc-preset-trigger-text picker-placeholder';
    accTriggerText.textContent = '— None —';
    const accTriggerChevron = document.createElement('span');
    accTriggerChevron.className = 'acc-preset-trigger-chevron';
    accTriggerChevron.textContent = '▼';
    accTrigger.appendChild(accTriggerText);
    accTrigger.appendChild(accTriggerChevron);
    const accPanel = document.createElement('div');
    accPanel.className = 'acc-preset-multi-panel form-dropdown-panel hidden';
    accPanel.setAttribute('role', 'listbox');
    const accOrder = typeof getFullAccessoryPresetOrder === 'function' ? getFullAccessoryPresetOrder() : ACCESSORY_PRESETS.map(x => x.name);
    const customAccCount = (typeof getCustomAccessoryPresets === 'function' ? getCustomAccessoryPresets() : []).length;
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
      cb.className = 'input-acc-preset-cb';
      cb.value = name;
      cb.addEventListener('change', () => {
        const selected = Array.from(accPanel.querySelectorAll('.input-acc-preset-cb:checked')).map(el => el.value);
        const textEl = accTrigger.querySelector('.acc-preset-trigger-text');
        if (textEl) { textEl.textContent = accSummary(selected); textEl.classList.toggle('picker-placeholder', selected.length === 0); }
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(name));
      accPanel.appendChild(label);
    });
    accWrap.appendChild(accTrigger);
    accWrap.appendChild(accPanel);
    accPanel._container = accWrap;
    accPanel.addEventListener('click', (e) => e.stopPropagation());
    function closeAccPanel(panel, container) {
      panel.classList.add('hidden');
      if (panel.parentElement === document.body) document.body.removeChild(panel);
      if (container && panel.parentElement !== container) container.appendChild(panel);
    }
    accTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = accPanel.parentElement === document.body;
      document.querySelectorAll('.gear-preset-panel').forEach(p => { if (p._close) p._close(); });
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
        closeAccPanel(accPanel, accWrap);
        document.removeEventListener('click', onClose);
      }, { once: true });
    });
  }
  window._getInputAccessoryPresets = function() {
    if (!accWrap) return [];
    return Array.from(accWrap.querySelectorAll('.input-acc-preset-cb:checked')).map(cb => cb.value);
  };
  window._clearInputAccessoryPresetChecks = function() {
    if (!accWrap) return;
    accWrap.querySelectorAll('.input-acc-preset-cb').forEach(cb => { cb.checked = false; });
    const textEl = accWrap.querySelector('.acc-preset-multi-trigger .acc-preset-trigger-text');
    if (textEl) { textEl.textContent = '— None —'; textEl.classList.add('picker-placeholder'); }
  };

  window._inputSfQuick = initSfQuick(
    document.getElementById('inputStarsRow'),
    document.getElementById('inputStarsCount')
  );
})();

/* ────────────────────────────────────────────────────────────────
   MODAL EVENT LISTENERS
──────────────────────────────────────────────────────────────── */
document.getElementById('lookupBtn').addEventListener('click', handleLookup);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.getElementById('confirmAddBtn').addEventListener('click', handleConfirmAdd);

document.getElementById('inputName').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); handleLookup(); }
});
document.getElementById('inputName').addEventListener('input', (e) => {
  updateRankingsLink(e.target.value.trim());
  if (typeof updateAddCharDuplicateState === 'function') updateAddCharDuplicateState();
});
// Enter in these fields submits the add/edit form
['inputLevel', 'inputClass', 'inputWorld', 'inputImageUrl'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleConfirmAdd(); }
  });
});

let spritePreviewTimer = null;
document.getElementById('inputImageUrl').addEventListener('input', (e) => {
  clearTimeout(spritePreviewTimer);
  const url = e.target.value.trim();
  if (!url) { resetSpritePreview(); return; }
  spritePreviewTimer = setTimeout(() => showSpritePreview(url), 400);
});

document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

// Esc in an input: collapse selection or blur so highlight goes away; then next Esc closes modal
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const el = document.activeElement;
  if (el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
    e.preventDefault();
    e.stopPropagation();
    const start = el.selectionStart, end = el.selectionEnd;
    if (typeof start === 'number' && typeof end === 'number' && start !== end) {
      el.setSelectionRange(end, end);
    } else {
      el.blur();
    }
    return;
  }
  closeModal();
}, true);

/* ────────────────────────────────────────────────────────────────
   MULTI-SELECT
──────────────────────────────────────────────────────────────── */
let multiSelectMode  = false;
let selectedIndices  = new Set();

const charList       = document.getElementById('char-list');
const msBar          = document.getElementById('multiselectBar');
const msCount        = document.getElementById('msCount');
const msSelectAllBtn = document.getElementById('msSelectAllBtn');
const msClearBtn     = document.getElementById('msClearBtn');
const msExitBtn      = document.getElementById('msExitBtn');
const msDeleteBtn    = document.getElementById('msDeleteBtn');
const msPresetBtn    = document.getElementById('msPresetBtn');
const multiSelectBtn = document.getElementById('multiSelectBtn');
const msEditBtn      = document.getElementById('msEditBtn');

function updateMsBar() {
  const n = selectedIndices.size;
  msCount.textContent = `${n} selected`;
  msDeleteBtn.disabled  = n === 0;
  msPresetBtn.disabled  = n === 0;
  if (msEditBtn) msEditBtn.disabled = n === 0;
}

function enterMultiSelect() {
  multiSelectMode = true;
  selectedIndices.clear();
  charList.classList.add('multiselect-active');
  msBar.classList.remove('hidden');
  multiSelectBtn.classList.add('btn-primary');
  updateMsBar();
}

function exitMultiSelect() {
  multiSelectMode = false;
  selectedIndices.clear();
  charList.classList.remove('multiselect-active');
  msBar.classList.add('hidden');
  multiSelectBtn.classList.remove('btn-primary');
  charList.querySelectorAll('.row-select-cb').forEach(cb => cb.checked = false);
}

multiSelectBtn.addEventListener('click', () => {
  if (multiSelectMode) exitMultiSelect(); else enterMultiSelect();
});

msExitBtn.addEventListener('click', exitMultiSelect);

msSelectAllBtn.addEventListener('click', () => {
  charList.querySelectorAll('.row-select-cb').forEach(cb => {
    cb.checked = true;
    const idx = parseInt(cb.dataset.idx, 10);
    selectedIndices.add(idx);
  });
  updateMsBar();
});

msClearBtn.addEventListener('click', () => {
  selectedIndices.clear();
  charList.querySelectorAll('.row-select-cb').forEach(cb => cb.checked = false);
  updateMsBar();
});

/* ── Delete confirmation (shared for single + mass delete) ── */
const deleteConfirmOverlay = document.getElementById('deleteConfirmOverlay');
const deleteConfirmGrid    = document.getElementById('deleteConfirmGrid');
const deleteConfirmMsg     = document.getElementById('deleteConfirmMsg');
const deleteConfirmYes     = document.getElementById('deleteConfirmYes');
const deleteConfirmNo      = document.getElementById('deleteConfirmNo');
let pendingDeleteIndices   = [];

function openDeleteConfirmModal(indices) {
  if (!indices.length) return;
  pendingDeleteIndices = indices.slice().sort((a, b) => a - b);
  deleteConfirmMsg.innerHTML = `Remove ${indices.length} character(s)?<br><span style="color:var(--danger);font-weight:600">This cannot be undone.</span>`;
  deleteConfirmGrid.innerHTML = '';
  pendingDeleteIndices.forEach(i => {
    const c   = chars[i];
    if (!c) return;
    const cat  = CLASS_CATEGORY[c.cls] ?? null;
    const icon = cat ? LEGION_BLOCK_ICON[cat] : null;
    const card = document.createElement('div');
    card.className = 'delete-confirm-card';
    card.innerHTML = `
      <span class="dc-name" title="${escHtml(c.name)}">${escHtml(c.name)}</span>
      <span class="dc-cls">
        ${icon ? `<img src="${escHtml(icon)}" alt="">` : ''}
        ${escHtml(c.cls || '—')}
      </span>`;
    deleteConfirmGrid.appendChild(card);
  });
  deleteConfirmOverlay.classList.remove('hidden');
}
window.openDeleteConfirmModal = openDeleteConfirmModal;

msDeleteBtn.addEventListener('click', () => {
  if (!selectedIndices.size) return;
  openDeleteConfirmModal([...selectedIndices]);
});

deleteConfirmYes.addEventListener('click', () => {
  pendingDeleteIndices.sort((a, b) => b - a).forEach(i => chars.splice(i, 1));
  pendingDeleteIndices = [];
  selectedIndices.clear();
  save();
  render();
  updateMsBar();
  deleteConfirmOverlay.classList.add('hidden');
});

deleteConfirmNo.addEventListener('click', () => deleteConfirmOverlay.classList.add('hidden'));
deleteConfirmOverlay.addEventListener('click', e => {
  if (e.target === deleteConfirmOverlay) deleteConfirmOverlay.classList.add('hidden');
});

msPresetBtn.addEventListener('click', () => {
  if (!selectedIndices.size) return;
  openPresetModal([...selectedIndices]);
});

/* ────────────────────────────────────────────────────────────────
   MASS EDIT
──────────────────────────────────────────────────────────────── */
const massEditOverlay   = document.getElementById('massEditOverlay');
const massEditBody      = document.getElementById('massEditBody');
const massEditSaveBtn   = document.getElementById('massEditSaveBtn');
const massEditCancelBtn = document.getElementById('massEditCancelBtn');

let massEditRows = [];

msEditBtn.addEventListener('click', () => {
  if (!selectedIndices.size) return;
  try {
    massEditRows = [...selectedIndices].sort((a,b) => a - b).map(i => {
      const c = chars[i];
      if (!c) throw new Error(`No character at index ${i}`);
      return { charIdx: i, name: c.name || '', level: c.level, cls: c.cls || '', world: c.world || '', preset: '', accPresets: [], stars: null };
    });
    renderMassEditTable();
    massEditOverlay.classList.remove('hidden');
  } catch(err) {
    console.error('Mass Edit error:', err);
    alert('Mass Edit error: ' + err.message);
  }
});

function renderMassEditTable() {
  massEditBody.innerHTML = '';
  massEditRows.forEach(row => {
    const tr = document.createElement('tr');

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

    const gPresetTd = document.createElement('td');
    const gPresetSel = document.createElement('select');
    const gpNone = document.createElement('option'); gpNone.value = ''; gpNone.textContent = '— None —';
    gPresetSel.appendChild(gpNone);
    const gearList = typeof getFullGearPresetList === 'function' ? getFullGearPresetList() : GEAR_PRESETS;
    const customGearCount = (typeof getCustomGearPresets === 'function' ? getCustomGearPresets() : []).length;
    gearList.forEach((p, i) => {
      if (i === 0 && customGearCount > 0) {
        const co = document.createElement('option'); co.disabled = true; co.textContent = 'Custom';
        gPresetSel.appendChild(co);
      }
      if (i === customGearCount && customGearCount > 0) {
        const d = document.createElement('option'); d.disabled = true; d.textContent = 'Default';
        gPresetSel.appendChild(d);
      }
      const opt = document.createElement('option'); opt.value = p.name; opt.textContent = p.name;
      gPresetSel.appendChild(opt);
    });
    gPresetSel.addEventListener('change', () => row.preset = gPresetSel.value);
    gPresetTd.appendChild(gPresetSel);

    const aPresetTd = document.createElement('td');
    aPresetTd.className = 'import-acc-presets-cell';
    const accOrder = typeof getFullAccessoryPresetOrder === 'function' ? getFullAccessoryPresetOrder() : ACCESSORY_PRESETS.map(x => x.name);
    const customAccCount = (typeof getCustomAccessoryPresets === 'function' ? getCustomAccessoryPresets() : []).length;
    function accSummary(selected) {
      if (!selected || selected.length === 0) return '— None —';
      if (selected.length <= 2) return selected.join(', ');
      return selected[0] + ' +' + (selected.length - 1);
    }
    const accTrigger = document.createElement('button');
    accTrigger.type = 'button';
    accTrigger.className = 'inline-picker-trigger acc-preset-multi-trigger' + (!(row.accPresets && row.accPresets.length) ? ' picker-placeholder' : '');
    accTrigger.textContent = accSummary(row.accPresets || []);
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
      cb.className = 'mass-edit-acc-cb';
      cb.value = name;
      cb.checked = (row.accPresets || []).includes(name);
      cb.addEventListener('change', () => {
        row.accPresets = Array.from(accPanel.querySelectorAll('.mass-edit-acc-cb:checked')).map(el => el.value);
        accTrigger.textContent = accSummary(row.accPresets);
        accTrigger.classList.toggle('picker-placeholder', !row.accPresets || row.accPresets.length === 0);
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(name));
      accPanel.appendChild(label);
    });
    aPresetTd.appendChild(accTrigger);
    aPresetTd.appendChild(accPanel);
    accPanel._container = aPresetTd;
    accPanel.addEventListener('click', (e) => e.stopPropagation());
    function closeAccPanel(panel, container) {
      panel.classList.add('hidden');
      if (panel.parentElement === document.body) document.body.removeChild(panel);
      if (container && panel.parentElement !== container) container.appendChild(panel);
    }
    accTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
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
        closeAccPanel(accPanel, aPresetTd);
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
      starsWrap.appendChild(btn);
    });
    const starsIn = document.createElement('input');
    starsIn.type = 'number'; starsIn.min = 0; starsIn.max = 25;
    starsIn.className = 'form-input stars-type-input';
    starsIn.placeholder = '—';
    starsIn.value = row.stars != null ? row.stars : '';
    starsWrap.appendChild(starsIn);
    const sfq = initSfQuick(starsWrap, starsIn);
    sfq.reset(row.stars);
    starsIn.addEventListener('input', () => {
      const v = starsIn.value.trim();
      row.stars = v === '' ? null : parseInt(v, 10);
    });
    starsTd.appendChild(starsWrap);

    tr.append(nameTd, lvlTd, clsTd, worldTd, gPresetTd, aPresetTd, starsTd);
    massEditBody.appendChild(tr);
  });
}

massEditSaveBtn.addEventListener('click', () => {
  const missingClass = massEditRows.some(row => {
    const c = chars[row.charIdx];
    if (!c) return false;
    const newCls = (row.cls && row.cls.trim()) || c.cls;
    return !newCls;
  });
  if (missingClass) {
    alert('Every character must have a class. Please select a class for any character missing one.');
    return;
  }
  massEditRows.forEach(row => {
    const c = chars[row.charIdx];
    if (!c) return;
    c.name  = row.name  || c.name;
    c.level = row.level ?? c.level;
    c.cls   = row.cls   || c.cls;
    c.world = row.world || c.world;
    c.gear  = c.gear   || {};
    if (row.accPresets && row.accPresets.length) applyAccessoryPresets(c.gear, row.accPresets);
    if (row.preset)      applyPreset(c.gear, row.preset,    c.cls);
    if (row.stars != null) setAllStars(c.gear, row.stars);
  });
  save(); render(); updateMsBar();
  massEditOverlay.classList.add('hidden');
});

massEditCancelBtn.addEventListener('click', () => massEditOverlay.classList.add('hidden'));
massEditOverlay.addEventListener('click', e => { if (e.target === massEditOverlay) massEditOverlay.classList.add('hidden'); });

/* ────────────────────────────────────────────────────────────────
   GEAR BACKGROUND TOGGLE
──────────────────────────────────────────────────────────────── */
document.getElementById('toggleBgBtn').addEventListener('click', () => {
  gearBgEnabled = !gearBgEnabled;
  document.getElementById('toggleBgBtn').textContent =
    `Gear Backgrounds: ${gearBgEnabled ? 'On' : 'Off'}`;
  document.getElementById('toggleBgBtn').classList.toggle('btn-primary', gearBgEnabled);
  document.querySelectorAll('.gear-icon-wrap').forEach(wrap => {
    if (!gearBgEnabled) {
      wrap.style.background   = '';
      wrap.style.borderRadius = '';
    } else {
      const slot = wrap.closest('.gear-slot');
      if (!slot) return;
      const charSection = wrap.closest('[data-idx]');
      if (!charSection) return;
      const idx = parseInt(charSection.dataset.idx, 10);
      const slotName = slot.dataset.slot;
      const char = chars[idx];
      if (!char) return;
      const itemLabel = char.gear[slotName]?.item ?? 'None';
      const setName   = ITEM_TIER[itemLabel] ?? 'None';
      renderGearIcon(wrap, setName, slotName, itemLabel, char.cls);
    }
  });
});

/* ── Select-all on focus for stars number inputs ── */
document.addEventListener('focus', (e) => {
  const el = e.target;
  if (el?.nodeName !== 'INPUT' || el.type !== 'number') return;
  if (el.classList.contains('star-input') || el.classList.contains('stars-type-input') ||
      el.id === 'presetStarsCount' || el.id === 'inputStarsCount' || el.id === 'starsModalInput') {
    el.select();
  }
}, true);

/* ── Tab between Stars inputs for same character (gear slots only) ── */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const el = e.target;
  if (el?.nodeName !== 'INPUT' || !el.classList.contains('star-input')) return;
  const section = el.closest('[data-idx]');
  if (!section) return;
  const slotOrder = [...ROW_1_SLOTS, ...ROW_2_SLOTS];
  const visibleStarInputs = [];
  for (const slot of slotOrder) {
    const slotEl = section.querySelector(`.gear-slot[data-slot="${slot}"]`);
    if (!slotEl) continue;
    const starRow = slotEl.querySelector('.star-row');
    if (!starRow || starRow.classList.contains('hidden')) continue;
    const starInput = starRow.querySelector('.star-input');
    if (starInput) visibleStarInputs.push(starInput);
  }
  const idx = visibleStarInputs.indexOf(el);
  if (idx === -1) return;
  if (!e.shiftKey) {
    const next = idx + 1;
    if (next < visibleStarInputs.length) {
      e.preventDefault();
      visibleStarInputs[next].focus();
    }
  } else {
    const prev = idx - 1;
    if (prev >= 0) {
      e.preventDefault();
      visibleStarInputs[prev].focus();
    }
  }
});

/* ────────────────────────────────────────────────────────────────
   INIT
──────────────────────────────────────────────────────────────── */
try {
  load();
} catch (e) {
  console.error('Legion Lab: load() failed', e);
}
try {
  render();
} catch (e) {
  console.error('Legion Lab: render() failed', e);
}

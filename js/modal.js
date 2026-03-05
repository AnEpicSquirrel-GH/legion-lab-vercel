'use strict';

let pendingLookup = null;
let addCharLookupSucceeded = false;
let addCharLookupAttempted = false;

function updateAddCharSectionVisibility() {
  const manualEl = document.getElementById('addCharManualSection');
  const gearEl = document.getElementById('addCharGearSection');
  if (!manualEl || !gearEl) return;
  const devMode = typeof window.isDevMode === 'function' && window.isDevMode();
  const showManual = (editingIdx !== null) || devMode || (addCharLookupAttempted && !addCharLookupSucceeded);
  const showGear = (editingIdx !== null) || addCharLookupSucceeded || showManual;
  manualEl.classList.toggle('hidden', !showManual);
  gearEl.classList.toggle('hidden', !showGear);
  const dividerManual = document.getElementById('addCharDividerManual');
  const dividerGear = document.getElementById('addCharDividerGear');
  if (dividerManual) dividerManual.classList.toggle('hidden', !showManual);
  if (dividerGear) dividerGear.classList.toggle('hidden', !showGear);
}

/* ── Class Picker ────────────────────────────────────────────────── */
(function buildClassPicker() {
  const panel    = document.getElementById('classPickerPanel');
  const btn      = document.getElementById('classPickerBtn');
  const display  = document.getElementById('classPickerDisplay');
  const hidden   = document.getElementById('inputClass');
  const search   = document.getElementById('cpSearch');
  const factions = document.getElementById('cpFactions');

  CLASS_FACTIONS.forEach(({ faction, classes }) => {
    const sec = document.createElement('div');
    sec.className = 'cp-faction';
    sec.dataset.faction = faction;

    const lbl = document.createElement('div');
    lbl.className = 'cp-faction-label';
    lbl.textContent = faction;
    sec.appendChild(lbl);

    const grid = document.createElement('div');
    grid.className = 'cp-grid';
    classes.forEach(cls => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cp-class-btn';
      b.textContent = cls;
      b.title = cls;
      b.dataset.cls = cls;
      b.addEventListener('click', () => selectClass(cls));
      grid.appendChild(b);
    });
    sec.appendChild(grid);
    factions.appendChild(sec);
  });

  function selectClass(cls) {
    hidden.value = cls;
    display.textContent = cls;
    display.classList.remove('picker-placeholder');
    factions.querySelectorAll('.cp-class-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.cls === cls));
    closePanel();
  }

  function openPanel() {
    panel.classList.remove('hidden');
    search.value = '';
    filterClasses('');
    panel.scrollTop = 0;
    if (factions && factions.scrollTop !== undefined) factions.scrollTop = 0;
    btn.blur();
    setTimeout(() => {
      panel.scrollTop = 0;
      if (factions && factions.scrollTop !== undefined) factions.scrollTop = 0;
      search.focus();
    }, 50);
  }

  function closePanel() {
    panel.scrollTop = 0;
    if (factions && factions.scrollTop !== undefined) factions.scrollTop = 0;
    panel.classList.add('hidden');
  }

  function filterClasses(q) {
    const lq = q.toLowerCase();
    document.querySelectorAll('.cp-faction').forEach(sec => {
      let anyVisible = false;
      sec.querySelectorAll('.cp-class-btn').forEach(b => {
        const match = b.dataset.cls.toLowerCase().includes(lq);
        b.style.display = match ? '' : 'none';
        if (match) anyVisible = true;
      });
      sec.classList.toggle('hidden', !anyVisible);
    });
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.contains('hidden') ? openPanel() : closePanel();
  });
  search.addEventListener('input', () => filterClasses(search.value));
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== btn) closePanel();
  });

  window._classPickerSet = (cls) => {
    if (cls) {
      selectClass(cls);
    } else {
      hidden.value = '';
      display.textContent = 'Select a class…';
      display.classList.add('picker-placeholder');
      factions.querySelectorAll('.cp-class-btn').forEach(b => b.classList.remove('active'));
    }
  };
})();

/* ── World Picker ────────────────────────────────────────────────── */
(function buildWorldPicker() {
  const WORLD_GROUPS = [
    { label: 'GMS — Heroic',       worlds: ['Kronos', 'Hyperion'] },
    { label: 'GMS — Interactive',  worlds: ['Scania', 'Bera'] },
    { label: 'EU — Heroic',        worlds: ['Solis'] },
    { label: 'EU — Interactive',  worlds: ['Luna'] },
  ];

  const panel   = document.getElementById('worldPickerPanel');
  const btn     = document.getElementById('worldPickerBtn');
  const display = document.getElementById('worldPickerDisplay');
  const hidden  = document.getElementById('inputWorld');
  const groups  = document.getElementById('wpGroups');

  WORLD_GROUPS.forEach(({ label, worlds }) => {
    const sec = document.createElement('div');
    sec.className = 'cp-faction';

    const lbl = document.createElement('div');
    lbl.className = 'cp-faction-label';
    lbl.textContent = label;
    sec.appendChild(lbl);

    const grid = document.createElement('div');
    grid.className = 'cp-grid';
    grid.style.gridTemplateColumns = '';
    worlds.forEach(w => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cp-class-btn';
      b.textContent = w;
      b.dataset.world = w;
      b.addEventListener('click', () => selectWorld(w));
      grid.appendChild(b);
    });
    sec.appendChild(grid);
    groups.appendChild(sec);
  });

  function selectWorld(w) {
    hidden.value = w;
    display.textContent = w;
    display.classList.remove('picker-placeholder');
    groups.querySelectorAll('.cp-class-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.world === w));
    panel.classList.add('hidden');
    if (typeof updateAddCharDuplicateState === 'function') updateAddCharDuplicateState();
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.contains('hidden') ? panel.classList.remove('hidden') : panel.classList.add('hidden');
  });
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== btn) panel.classList.add('hidden');
  });

  window._worldPickerSet = (w) => {
    if (w) {
      selectWorld(w);
    } else {
      hidden.value = '';
      display.textContent = 'Select a world…';
      display.classList.add('picker-placeholder');
      groups.querySelectorAll('.cp-class-btn').forEach(b => b.classList.remove('active'));
      if (typeof updateAddCharDuplicateState === 'function') updateAddCharDuplicateState();
    }
  };
})();

/* ── Gear Preset quick-apply modal ─────────────────────────────── */
;(function() {
  const overlay    = document.getElementById('presetOverlay');
  const charName   = document.getElementById('presetCharName');
  const charCls    = document.getElementById('presetCharCls');
  const charIcon   = document.getElementById('presetCharIcon');
  const gearSel    = document.getElementById('presetGearSel');
  const starsCount = document.getElementById('presetStarsCount');
  const applyBtn   = document.getElementById('presetApplyBtn');
  const cancelBtn  = document.getElementById('presetCancelBtn');
  let   targetIdx  = null;

  const sfQuick = initSfQuick(overlay, starsCount);

  const accCheckboxes = document.getElementById('presetAccCheckboxes');

  (function initGearPresetDropdown() {
    if (gearSel.closest('.gear-preset-dropdown-wrap')) return;
    const gearWrap = document.createElement('div');
    gearWrap.className = 'gear-preset-dropdown-wrap';
    gearSel.parentNode.insertBefore(gearWrap, gearSel);
    gearWrap.appendChild(gearSel);
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
    gearPanel.addEventListener('click', (e) => e.stopPropagation());
    function closeGearPanel() {
      gearPanel.classList.add('hidden');
      if (gearPanel.parentElement === document.body) document.body.removeChild(gearPanel);
      const w = gearSel.closest('.gear-preset-dropdown-wrap');
      if (w && gearPanel.parentElement !== w) w.appendChild(gearPanel);
    }
    gearPanel._close = closeGearPanel;
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
  })();

  function refreshPresetOptions() {
    gearSel.innerHTML = '';
    const gearOpt = document.createElement('option');
    gearOpt.value = '';
    gearOpt.textContent = '— None —';
    gearSel.appendChild(gearOpt);
    const gearList = typeof getFullGearPresetList === 'function' ? getFullGearPresetList() : GEAR_PRESETS;
    const customGearCount = (typeof getCustomGearPresets === 'function' ? getCustomGearPresets() : []).length;
    gearList.forEach((p, i) => {
      if (i === 0 && customGearCount > 0) {
        const customOpt = document.createElement('option');
        customOpt.disabled = true;
        customOpt.textContent = 'Custom';
        gearSel.appendChild(customOpt);
      }
      if (i === customGearCount && customGearCount > 0) {
        const div = document.createElement('option');
        div.disabled = true;
        div.textContent = 'Default';
        gearSel.appendChild(div);
      }
      const o = document.createElement('option');
      o.value = p.name;
      o.textContent = p.name;
      gearSel.appendChild(o);
    });
    const gearWrap = gearSel.closest('.gear-preset-dropdown-wrap');
    if (gearWrap) {
      const gearTrigger = gearWrap.querySelector('.gear-preset-trigger');
      const gearTriggerText = gearTrigger && gearTrigger.querySelector('.gear-preset-text');
      const gearPanel = gearWrap.querySelector('.gear-preset-panel');
      if (gearPanel) {
        gearPanel.innerHTML = '';
        const noneRow = document.createElement('div');
        noneRow.className = 'gear-preset-option';
        noneRow.dataset.value = '';
        noneRow.textContent = '— None —';
        noneRow.addEventListener('click', () => { gearSel.value = ''; updateGearPresetPlaceholder(); if (gearPanel._close) gearPanel._close(); });
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
          row.dataset.value = p.name;
          row.textContent = p.name;
          row.addEventListener('click', () => { gearSel.value = p.name; updateGearPresetPlaceholder(); if (gearPanel._close) gearPanel._close(); });
          gearPanel.appendChild(row);
        });
      }
      updateGearPresetPlaceholder();
    }
    if (accCheckboxes) {
      accCheckboxes.innerHTML = '';
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
        cb.className = 'acc-preset-cb';
        cb.value = name;
        cb.addEventListener('change', () => {
          const selected = Array.from(accPanel.querySelectorAll('.acc-preset-cb:checked')).map(el => el.value);
          const textEl = accTrigger.querySelector('.acc-preset-trigger-text');
          if (textEl) { textEl.textContent = accSummary(selected); textEl.classList.toggle('picker-placeholder', selected.length === 0); }
        });
        label.appendChild(cb);
        label.appendChild(document.createTextNode(name));
        accPanel.appendChild(label);
      });
      accCheckboxes.appendChild(accTrigger);
      accCheckboxes.appendChild(accPanel);
      accPanel._container = accCheckboxes;
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
          closeAccPanel(accPanel, accCheckboxes);
          document.removeEventListener('click', onClose);
        }, { once: true });
      });
    }
  }
  function updateGearPresetPlaceholder() {
    const gearWrap = gearSel.closest('.gear-preset-dropdown-wrap');
    const textEl = gearWrap && gearWrap.querySelector('.gear-preset-text');
    if (textEl) {
      const opt = gearSel.options[gearSel.selectedIndex];
      textEl.textContent = opt ? opt.textContent : '— None —';
      textEl.classList.toggle('picker-placeholder', !gearSel.value);
    }
  }
  refreshPresetOptions();

  function getSelectedAccessoryPresets() {
    if (!accCheckboxes) return [];
    return Array.from(accCheckboxes.querySelectorAll('.acc-preset-cb:checked')).map(cb => cb.value);
  }

  function clearAccessoryPresetChecks() {
    if (!accCheckboxes) return;
    accCheckboxes.querySelectorAll('.acc-preset-cb').forEach(cb => { cb.checked = false; });
    const textEl = accCheckboxes.querySelector('.acc-preset-multi-trigger .acc-preset-trigger-text');
    if (textEl) { textEl.textContent = '— None —'; textEl.classList.add('picker-placeholder'); }
  }

  window.openPresetModal = function(idxOrArr) {
    refreshPresetOptions();
    targetIdx = idxOrArr;
    if (Array.isArray(idxOrArr)) {
      charName.textContent = `${idxOrArr.length} characters selected`;
      charCls.textContent  = '';
      charIcon.style.display = 'none';
    } else {
      const c = chars[idxOrArr];
      charName.textContent = c.name;
      charCls.textContent  = c.cls || '—';
      const cat  = CLASS_CATEGORY[c.cls] ?? null;
      const icon = cat ? LEGION_BLOCK_ICON[cat] : null;
      if (icon) { charIcon.src = icon; charIcon.alt = cat; charIcon.style.display = 'block'; }
      else { charIcon.style.display = 'none'; }
    }
    gearSel.value = '';
    updateGearPresetPlaceholder();
    clearAccessoryPresetChecks();
    sfQuick.reset(null);
    overlay.classList.remove('hidden');
  };

  applyBtn.addEventListener('click', () => {
    if (targetIdx === null) return;
    const accSelected = getSelectedAccessoryPresets();
    const indices = Array.isArray(targetIdx) ? targetIdx : [targetIdx];
    indices.forEach(i => {
      const char = chars[i];
      char.gear = char.gear || {};
      if (accSelected.length) applyAccessoryPresets(char.gear, accSelected);
      if (gearSel.value) applyPreset(char.gear, gearSel.value, char.cls);
      if (starsCount.value.trim()) setAllStars(char.gear, starsCount.value);
    });
    if (gearSel.value || accSelected.length || starsCount.value.trim()) { save(); render(); }
    overlay.classList.add('hidden');
    targetIdx = null;
  });

  cancelBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
    targetIdx = null;
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) { overlay.classList.add('hidden'); targetIdx = null; }
  });
})();

/* ── Set All Starforce modal ─────────────────────────────────────── */
;(function() {
  const modal      = document.getElementById('starsModal');
  const input      = document.getElementById('starsModalInput');
  const applyBtn   = document.getElementById('starsModalApply');
  const cancelBtn  = document.getElementById('starsModalCancel');
  let   targetIdx  = null;

  const sfQuick = initSfQuick(modal, input);

  window.openStarsModal = function(idx) {
    targetIdx = idx;
    sfQuick.reset(18);
    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 50);
  };

  applyBtn.addEventListener('click', () => {
    if (targetIdx === null) return;
    const c = chars[targetIdx];
    if (!c) { modal.classList.add('hidden'); return; }
    c.gear = c.gear || {};
    setAllStars(c.gear, input.value);
    save(); render();
    modal.classList.add('hidden');
    targetIdx = null;
  });

  cancelBtn.addEventListener('click', () => { modal.classList.add('hidden'); targetIdx = null; });
  modal.addEventListener('click', e => { if (e.target === modal) { modal.classList.add('hidden'); targetIdx = null; } });
})();

/* ── Add / Edit character modal ─────────────────────────────────── */
function openModal(prefill = {}) {
  pendingLookup = null;
  document.getElementById('inputName').value     = prefill.name     || '';
  const levelVal = prefill.level != null && prefill.level !== '' ? prefill.level : 260;
  document.getElementById('inputLevel').value    = levelVal;
  window._classPickerSet(prefill.cls || '');
  window._worldPickerSet(
    prefill.world || (editingIdx === null ? (localStorage.getItem('ll_last_world') || '') : '')
  );
  document.getElementById('inputImageUrl').value        = prefill.imageUrl || '';
  document.getElementById('inputPreset').value = '';
  if (window._updateInputPresetPlaceholder) window._updateInputPresetPlaceholder();
  if (window._clearInputAccessoryPresetChecks) window._clearInputAccessoryPresetChecks();
  if (window._inputSfQuick) window._inputSfQuick.reset(null);
  document.getElementById('lookupStatus').textContent = '';
  document.getElementById('lookupStatus').className = 'lookup-status';
  var lookupDebugEl = document.getElementById('lookupDebugWrap');
  if (lookupDebugEl) { lookupDebugEl.textContent = ''; lookupDebugEl.classList.add('hidden'); }
  document.getElementById('charPreview').classList.add('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
  resetSpritePreview();
  if (prefill.imageUrl) showSpritePreview(prefill.imageUrl);
  updateRankingsLink(prefill.name || '');
  var proxyInput = document.getElementById('lookupProxyInput');
  if (proxyInput && typeof getLookupProxyUrl === 'function') proxyInput.value = getLookupProxyUrl() || '';
  addCharLookupSucceeded = false;
  addCharLookupAttempted = false;
  updateAddCharSectionVisibility();
  var addBtn = document.getElementById('confirmAddBtn');
  if (addBtn) addBtn.disabled = false;
  setTimeout(() => document.getElementById(prefill.name ? 'inputLevel' : 'inputName').focus(), 80);
}

(function initLookupProxy() {
  var proxyInput = document.getElementById('lookupProxyInput');
  var clearBtn = document.getElementById('lookupProxyClearBtn');
  var key = 'll_lookup_proxy';
  if (proxyInput) {
    proxyInput.addEventListener('input', function () {
      try { var v = this.value.trim(); localStorage.setItem(key, v); } catch (e) {}
    });
    proxyInput.addEventListener('blur', function () {
      try { var v = this.value.trim(); localStorage.setItem(key, v); } catch (e) {}
    });
  }
  if (clearBtn && proxyInput) {
    clearBtn.addEventListener('click', function () {
      proxyInput.value = '';
      try { localStorage.removeItem(key); } catch (e) {}
    });
  }
})();

function updateRankingsLink(name) {
  const base = 'https://www.nexon.com/maplestory/rankings/north-america/overall/legendary?world_type=both&search_type=character-name&search=';
  document.getElementById('rankingsLink').href = base + encodeURIComponent(name);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  editingIdx = null;
  document.getElementById('modalTitle').textContent = 'Add Character';
  const addBtn = document.getElementById('confirmAddBtn');
  if (addBtn) { addBtn.textContent = 'Add Character'; addBtn.disabled = false; }
}

function updateAddCharDuplicateState() {
  if (editingIdx !== null) return;
  const preview = document.getElementById('charPreview');
  if (!preview || preview.classList.contains('hidden')) return;
  const nameEl = document.getElementById('inputName');
  const worldEl = document.getElementById('inputWorld');
  const name = nameEl ? nameEl.value.trim() : '';
  const world = worldEl ? worldEl.value : '';
  const norm = (s) => (s || '').trim().toLowerCase();
  const alreadyExists = Array.isArray(chars) && name && chars.some((c) => norm(c.name) === norm(name) && norm(c.world) === norm(world));
  const addBtn = document.getElementById('confirmAddBtn');
  if (addBtn) addBtn.disabled = !!alreadyExists;
  if (alreadyExists) setLookupStatus('This character is already on your roster (same name and world).', 'err');
  else setLookupStatus('Character found. Fill or adjust the fields below.', 'ok');
}

let lastSearchedName = null;
let lastSearchTime = 0;
const SEARCH_COOLDOWN_MS = 5000;

async function handleLookup() {
  const nameInput = document.getElementById('inputName');
  const name = nameInput && nameInput.value ? nameInput.value.trim() : '';
  if (!name) {
    setLookupStatus('Please enter a character name first.', 'err');
    return;
  }
  if (name === lastSearchedName) {
    setLookupStatus('Name unchanged. Change the name to search again.', 'err');
    return;
  }
  const now = Date.now();
  if (lastSearchTime && (now - lastSearchTime < SEARCH_COOLDOWN_MS)) {
    const wait = Math.ceil((SEARCH_COOLDOWN_MS - (now - lastSearchTime)) / 1000);
    setLookupStatus('Please wait ' + wait + ' second(s) between searches.', 'err');
    return;
  }
  addCharLookupAttempted = true;
  setLookupStatus('Looking up…', 'loading');
  document.getElementById('charPreview').classList.add('hidden');
  const debugMode = typeof window.isDevMode === 'function' && window.isDevMode();
  var worldInput = document.getElementById('inputWorld');
  var region = (worldInput && worldInput.value && worldInput.value.trim()) || 'gms';
  const raw = typeof lookupCharacter === 'function'
    ? await lookupCharacter(name, region, debugMode ? { debug: true } : {})
    : null;
  let result = null;
  let debug = null;
  let serverError = null;
  if (raw && typeof raw === 'object') {
    result = raw.result !== undefined ? raw.result : raw;
    debug = raw.debug;
    serverError = raw.serverError;
  } else {
    result = raw;
  }
  var lookupDebugWrap = document.getElementById('lookupDebugWrap');
  if (lookupDebugWrap) {
    if (debugMode && debug) {
      var lines = [
        'Page origin: ' + (debug.pageOrigin || '—'),
        'URL: ' + (debug.url || '—'),
        'Target (API): ' + (debug.targetUrl || '—'),
        'Via proxy: ' + (debug.viaProxy ? 'yes' : 'no'),
        'Region used: ' + (region || 'gms'),
        'Status: ' + (debug.status != null ? debug.status : '—') + (debug.statusText ? ' ' + debug.statusText : ''),
        debug.error ? 'Error: ' + debug.error : '',
        (debug.error && debug.error.indexOf('NetworkError') !== -1)
          ? ((debug.pageOrigin || '').toLowerCase().slice(0, 7) === 'file://' || (debug.pageOrigin || '') === 'null'
            ? 'Tip: Browsers block network requests from file://. Run "npx serve" in the project folder and open the URL it shows (e.g. http://localhost:3000). Then Search can use your CORS proxy — no node server.js needed.'
            : 'Tip: If you use a proxy, it may be down or blocked. Try clearing the proxy field, or check the browser console (F12).')
          : '',
        debug.responsePreview ? 'Response preview:\n' + debug.responsePreview : '',
      ].filter(Boolean);
      lookupDebugWrap.textContent = lines.join('\n');
      lookupDebugWrap.classList.remove('hidden');
    } else {
      lookupDebugWrap.textContent = '';
      lookupDebugWrap.classList.add('hidden');
    }
  }
  if (!result) {
    var errMsg = 'Character not found or lookup failed. Check name and try again.';
    var status = (debug && debug.status != null) ? debug.status : serverError;
    var is5xx = typeof status === 'number' && status >= 500 && status < 600;
    if (is5xx || (debug && debug.error && /522|502|503|504|timeout|unavailable/i.test(debug.error))) {
      errMsg = 'Nexon Rankings or the server may be unavailable. You can still add the character by entering Level, Class, and World manually.';
    } else if (debugMode && debug && debug.error && debug.error.indexOf('NetworkError') !== -1) {
        var origin = (debug.pageOrigin || '').toLowerCase();
        var isFile = origin === 'null' || origin === 'file://' || origin.slice(0, 7) === 'file://';
        errMsg = isFile
          ? 'Browsers block requests from file://. Run "npx serve" in the project folder, then open the URL it shows so Search can use your proxy.'
          : 'Request failed. Make sure the server is running (node server.js) and you opened http://localhost:3000.';
    } else if (debugMode && debug) {
      errMsg += ' See debug below.';
    }
    setLookupStatus(errMsg, 'err');
    updateAddCharSectionVisibility();
    lastSearchedName = name;
    lastSearchTime = Date.now();
    document.getElementById('inputLevel').focus();
    return;
  }
  lastSearchedName = name;
  lastSearchTime = Date.now();
  pendingLookup = result;
  addCharLookupSucceeded = true;
  updateAddCharSectionVisibility();
  document.getElementById('inputName').value = result.name || name;
  if (result.level != null) document.getElementById('inputLevel').value = String(result.level);
  if (result.cls && window._classPickerSet) window._classPickerSet(result.cls);
  if (result.world && window._worldPickerSet) window._worldPickerSet(result.world);
  if (result.imageUrl) document.getElementById('inputImageUrl').value = result.imageUrl;
  const preview = document.getElementById('charPreview');
  const previewName = document.getElementById('previewName');
  const previewLevel = document.getElementById('previewLevel');
  const previewBlockIcon = document.getElementById('previewBlockIcon');
  const previewCls = document.getElementById('previewCls');
  const previewWorld = document.getElementById('previewWorld');
  const previewImg = document.getElementById('previewImg');
  if (preview && previewName) {
    const displayName = result.name || name;
    previewName.textContent = displayName;
    previewName.title = displayName;
    previewLevel.textContent = result.level != null ? 'Lv. ' + result.level : 'Lv. ?';
    const clsCategory = typeof CLASS_CATEGORY !== 'undefined' ? (CLASS_CATEGORY[result.cls] ?? null) : null;
    const blockIconSrc = clsCategory && typeof LEGION_BLOCK_ICON !== 'undefined' ? LEGION_BLOCK_ICON[clsCategory] : null;
    if (previewBlockIcon) {
      if (blockIconSrc) {
        previewBlockIcon.src = blockIconSrc;
        previewBlockIcon.alt = clsCategory;
        previewBlockIcon.title = clsCategory;
        previewBlockIcon.style.display = '';
      } else {
        previewBlockIcon.style.display = 'none';
      }
    }
    if (previewCls) {
      previewCls.textContent = result.cls || '—';
      if (result.cls && clsCategory) previewCls.dataset.clsCat = clsCategory;
      else delete previewCls.dataset.clsCat;
    }
    if (previewWorld) previewWorld.textContent = result.world || '';
    if (previewImg && result.imageUrl) {
      previewImg.src = result.imageUrl;
      previewImg.alt = displayName;
    }
    preview.classList.remove('hidden');
  }
  if (result.imageUrl) showSpritePreview(result.imageUrl);
  const hasDetails = result.level != null || result.cls || result.world || result.imageUrl;
  setLookupStatus(
    hasDetails
      ? 'Character found. Fill or adjust the fields below.'
      : 'Name found, but Nexon\'s page didn\'t include level/class/world here. Enter them manually below, or open Nexon Rankings in your browser and right‑click the sprite → Copy image address.',
    'ok'
  );
  updateAddCharDuplicateState();
  document.getElementById('inputLevel').focus();
}

function setLookupStatus(msg, cls) {
  const el = document.getElementById('lookupStatus');
  el.textContent = msg;
  el.className = 'lookup-status ' + (cls || '');
}

/* ── Sprite URL preview ── */
function resetSpritePreview() {
  const wrap = document.getElementById('spritePreviewWrap');
  wrap.style.display = 'none';
  document.getElementById('spritePreview').src = '';
  document.getElementById('spritePreviewStatus').textContent = '';
}

function showSpritePreview(url) {
  if (!url) { resetSpritePreview(); return; }
  const wrap   = document.getElementById('spritePreviewWrap');
  const img    = document.getElementById('spritePreview');
  const status = document.getElementById('spritePreviewStatus');
  wrap.style.display = 'flex';
  status.textContent = 'Loading…';
  status.style.color = 'var(--accent)';
  img.onload  = () => { status.textContent = '✓ Sprite loaded'; status.style.color = 'var(--success)'; };
  img.onerror = () => { status.textContent = '✕ Could not load image'; status.style.color = 'var(--danger)'; };
  if (isSafeImageUrl(url)) {
    img.src = url.trim();
  } else {
    status.textContent = '✕ URL must be https:// or http://';
    status.style.color = 'var(--danger)';
  }
}

function handleConfirmAdd() {
  const name = document.getElementById('inputName').value.trim();
  if (!name) { setLookupStatus('Please enter a character name.', 'err'); return; }

  const cls = document.getElementById('inputClass').value.trim() || null;
  if (!cls) { setLookupStatus('Please select a class.', 'err'); return; }

  const levelRaw = document.getElementById('inputLevel').value;
  const level    = levelRaw ? parseInt(levelRaw, 10) : null;
  const world    = document.getElementById('inputWorld').value || null;
  if (world) localStorage.setItem('ll_last_world', world);
  let imageUrl = document.getElementById('inputImageUrl').value.trim() || pendingLookup?.imageUrl || null;
  if (imageUrl && !isSafeImageUrl(imageUrl)) imageUrl = null;

  const preset       = document.getElementById('inputPreset').value;
  const accPresets   = (window._getInputAccessoryPresets && window._getInputAccessoryPresets()) || [];
  const starsCountRaw = document.getElementById('inputStarsCount').value.trim();
  const starsCount   = starsCountRaw ? starsCountRaw : null;

  if (editingIdx !== null) {
    const existing = chars[editingIdx];
    existing.name     = name;
    existing.level    = level;
    existing.cls      = cls;
    existing.world    = world;
    existing.imageUrl = imageUrl;
    existing.gear     = existing.gear || {};
    if (accPresets.length) applyAccessoryPresets(existing.gear, accPresets);
    if (preset)           applyPreset(existing.gear, preset, cls);
    if (starsCount)       setAllStars(existing.gear, starsCount);
    save();
    render();
    closeModal();
    return;
  }

  const norm = (s) => (s || '').trim().toLowerCase();
  const nameNorm = norm(name);
  const worldNorm = norm(world);
  const alreadyExists = Array.isArray(chars) && chars.some((c) => norm(c.name) === nameNorm && norm(c.world) === worldNorm);
  if (alreadyExists) {
    setLookupStatus('This character is already on your roster (same name and world).', 'err');
    return;
  }

  const newChar = {
    id: Date.now().toString(36),
    name,
    level,
    cls,
    world,
    imageUrl,
    collapsed: false,
    gear: {},
  };
  SLOTS.forEach(s => { newChar.gear[s] = { item: 'None', stars: 0 }; });
  if (accPresets.length) applyAccessoryPresets(newChar.gear, accPresets);
  if (preset)            applyPreset(newChar.gear, preset, cls);
  if (starsCount)        setAllStars(newChar.gear, starsCount);

  chars.push(newChar);
  save();
  render();
  closeModal();
}

/* ── Floating class/world pickers (Import + Mass Edit tables) ── */
(function floatingPickers() {
  const FLOATING_WORLD_GROUPS = [
    { label: 'GMS — Heroic',       worlds: ['Kronos', 'Hyperion'] },
    { label: 'GMS — Interactive',  worlds: ['Scania', 'Bera'] },
    { label: 'EU — Heroic',        worlds: ['Solis'] },
    { label: 'EU — Interactive',  worlds: ['Luna'] },
  ];

  const classWrap  = document.getElementById('floatingClassPickerWrap');
  const classPanel = classWrap?.querySelector('.class-picker-panel');
  const classFactions = document.getElementById('floatingCpFactions');
  const classSearch  = document.getElementById('floatingCpSearch');
  const worldWrap   = document.getElementById('floatingWorldPickerWrap');
  const worldGroups = document.getElementById('floatingWpGroups');

  if (!classWrap || !worldWrap) return;

  function buildFloatingClassPanel() {
    if (!classFactions) return;
    classFactions.innerHTML = '';
    CLASS_FACTIONS.forEach(({ faction, classes }) => {
      const sec = document.createElement('div');
      sec.className = 'cp-faction';
      sec.dataset.faction = faction;
      const lbl = document.createElement('div');
      lbl.className = 'cp-faction-label';
      lbl.textContent = faction;
      sec.appendChild(lbl);
      const grid = document.createElement('div');
      grid.className = 'cp-grid';
      classes.forEach(cls => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cp-class-btn';
        b.textContent = cls;
        b.title = cls;
        b.dataset.cls = cls;
        grid.appendChild(b);
      });
      sec.appendChild(grid);
      classFactions.appendChild(sec);
    });
  }

  function buildFloatingWorldPanel() {
    if (!worldGroups) return;
    worldGroups.innerHTML = '';
    FLOATING_WORLD_GROUPS.forEach(({ label, worlds }) => {
      const sec = document.createElement('div');
      sec.className = 'cp-faction';
      const lbl = document.createElement('div');
      lbl.className = 'cp-faction-label';
      lbl.textContent = label;
      sec.appendChild(lbl);
      const grid = document.createElement('div');
      grid.className = 'cp-grid';
      worlds.forEach(w => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cp-class-btn';
        b.textContent = w;
        b.dataset.world = w;
        grid.appendChild(b);
      });
      sec.appendChild(grid);
      worldGroups.appendChild(sec);
    });
  }

  buildFloatingClassPanel();
  buildFloatingWorldPanel();

  function filterFloatingClasses(q) {
    const lq = (q || '').toLowerCase();
    classFactions.querySelectorAll('.cp-faction').forEach(sec => {
      let any = false;
      sec.querySelectorAll('.cp-class-btn').forEach(b => {
        const match = b.dataset.cls.toLowerCase().includes(lq);
        b.style.display = match ? '' : 'none';
        if (match) any = true;
      });
      sec.classList.toggle('hidden', !any);
    });
  }

  let floatingClassCallback = null;
  let floatingWorldCallback = null;
  let floatingClassAnchor = null;
  let floatingWorldAnchor = null;

  function closeFloatingClass() {
    const fp = classWrap?.querySelector('.class-picker-panel');
    if (fp) fp.scrollTop = 0;
    classWrap.classList.add('hidden');
    classWrap.setAttribute('aria-hidden', 'true');
    floatingClassCallback = null;
    floatingClassAnchor = null;
  }
  function closeFloatingWorld() {
    worldWrap.classList.add('hidden');
    worldWrap.setAttribute('aria-hidden', 'true');
    floatingWorldCallback = null;
    floatingWorldAnchor = null;
  }

  classFactions?.addEventListener('click', (e) => {
    const btn = e.target.closest('.cp-class-btn');
    if (!btn || !floatingClassCallback) return;
    floatingClassCallback(btn.dataset.cls);
    closeFloatingClass();
  });
  classSearch?.addEventListener('input', () => filterFloatingClasses(classSearch.value));
  worldGroups?.addEventListener('click', (e) => {
    const btn = e.target.closest('.cp-class-btn');
    if (!btn || !floatingWorldCallback) return;
    floatingWorldCallback(btn.dataset.world);
    closeFloatingWorld();
  });

  document.addEventListener('click', (e) => {
    if (classWrap && !classWrap.contains(e.target) && !e.target.closest('[data-open-floating-class]'))
      closeFloatingClass();
    if (worldWrap && !worldWrap.contains(e.target) && !e.target.closest('[data-open-floating-world]'))
      closeFloatingWorld();
  });

  function positionFloating(wrap, anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const panel = wrap.querySelector('.class-picker-panel');
    const spaceBelow = window.innerHeight - rect.bottom;
    const preferBelow = spaceBelow >= 200;
    if (preferBelow) {
      wrap.style.top = (rect.bottom + 4) + 'px';
      wrap.style.left = rect.left + 'px';
    } else {
      wrap.style.top = (rect.top - (panel?.offsetHeight || 300) - 4) + 'px';
      wrap.style.left = rect.left + 'px';
    }
  }

  window.openFloatingClassPicker = function(anchorEl, currentVal, onSelect) {
    if (!classWrap.classList.contains('hidden') && floatingClassAnchor === anchorEl) {
      closeFloatingClass();
      return;
    }
    floatingClassAnchor = anchorEl;
    floatingClassCallback = onSelect;
    classFactions.querySelectorAll('.cp-class-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.cls === currentVal);
      b.style.display = '';
    });
    classFactions.querySelectorAll('.cp-faction').forEach(sec => sec.classList.remove('hidden'));
    if (classSearch) classSearch.value = '';
    filterFloatingClasses('');
    const floatingPanel = classWrap.querySelector('.class-picker-panel');
    if (floatingPanel) floatingPanel.scrollTop = 0;
    positionFloating(classWrap, anchorEl);
    classWrap.classList.remove('hidden');
    classWrap.setAttribute('aria-hidden', 'false');
    if (anchorEl && anchorEl.blur) anchorEl.blur();
    setTimeout(() => {
      if (floatingPanel) floatingPanel.scrollTop = 0;
      classSearch?.focus();
    }, 50);
  };

  window.openFloatingWorldPicker = function(anchorEl, currentVal, onSelect) {
    if (!worldWrap.classList.contains('hidden') && floatingWorldAnchor === anchorEl) {
      closeFloatingWorld();
      return;
    }
    floatingWorldAnchor = anchorEl;
    floatingWorldCallback = onSelect;
    worldGroups.querySelectorAll('.cp-class-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.world === currentVal));
    positionFloating(worldWrap, anchorEl);
    worldWrap.classList.remove('hidden');
    worldWrap.setAttribute('aria-hidden', 'false');
  };
})();

/* ── Custom Presets modal ─────────────────────────────────────────── */
(function customPresetsModal() {
  const overlay = document.getElementById('customPresetsOverlay');
  const closeBtn = document.getElementById('customPresetsCloseBtn');
  const tabBtns = overlay.querySelectorAll('.import-tab-btn');
  const panes = overlay.querySelectorAll('.import-pane');

  let currentTab = 'equipment';
  let editingId = null;

  function getListWrap() {
    return document.getElementById(currentTab === 'equipment' ? 'customPresetsListWrapEquipment' : 'customPresetsListWrapAccessories');
  }
  function getFormWrap() {
    return document.getElementById(currentTab === 'equipment' ? 'customPresetsFormWrapEquipment' : 'customPresetsFormWrapAccessories');
  }
  function getNameInput() {
    return document.getElementById(currentTab === 'equipment' ? 'customPresetNameEquipment' : 'customPresetNameAccessories');
  }
  function getSlotsWrap() {
    return document.getElementById(currentTab === 'equipment' ? 'customPresetSlotsWrapEquipment' : 'customPresetSlotsWrapAccessories');
  }

  function getCustomList() {
    return currentTab === 'equipment' ? getCustomGearPresets() : getCustomAccessoryPresets();
  }
  function saveCustomList(arr) {
    if (currentTab === 'equipment') saveCustomGearPresets(arr);
    else saveCustomAccessoryPresets(arr);
  }
  function getSlotOptions() {
    return currentTab === 'equipment' ? GEAR_PRESET_SLOT_OPTIONS : ACCESSORY_PRESET_SLOT_OPTIONS;
  }
  function getSlots() {
    if (currentTab === 'equipment') {
      const equipmentInRowOrder = (typeof ROW_1_SLOTS !== 'undefined' ? ROW_1_SLOTS : []).filter(s =>
        ['Weapon', 'Secondary Weapon', 'Emblem', 'Hat', 'Top/Overall', 'Bottom', 'Shoulder', 'Cape', 'Gloves', 'Shoes'].includes(s));
      return equipmentInRowOrder.length
        ? equipmentInRowOrder
        : ['Weapon', 'Secondary Weapon', 'Emblem', 'Hat', 'Top/Overall', 'Bottom', 'Shoulder', 'Cape', 'Gloves', 'Shoes'];
    }
    const row2 = (typeof ROW_2_SLOTS !== 'undefined' ? ROW_2_SLOTS : []).filter(s =>
      ['Ring 1', 'Ring 2', 'Ring 3', 'Ring 4', 'Belt', 'Face Accessory', 'Eye Accessory', 'Earring', 'Pendant 1', 'Pendant 2', 'Pocket', 'Medal'].includes(s));
    const row1Acc = (typeof ROW_1_SLOTS !== 'undefined' ? ROW_1_SLOTS : []).filter(s => s === 'Badge' || s === 'Shoulder');
    return row1Acc.length ? [...row1Acc, ...row2] : ['Badge', 'Shoulder', 'Ring 1', 'Ring 2', 'Ring 3', 'Ring 4', 'Belt', 'Face Accessory', 'Eye Accessory', 'Earring', 'Pendant 1', 'Pendant 2', 'Pocket', 'Medal'];
  }

  function switchToTab(tab) {
    currentTab = tab;
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    panes.forEach(p => p.classList.toggle('hidden', p.id !== 'custom-preset-pane-' + tab));
  }

  function renderList() {
    const listWrap = getListWrap();
    const formWrap = getFormWrap();
    listWrap.innerHTML = '';
    const list = getCustomList();
    const addLabel = currentTab === 'equipment' ? 'Add Equipment Preset' : 'Add Accessory Preset';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-primary';
    addBtn.textContent = addLabel;
    addBtn.style.marginBottom = '10px';
    addBtn.addEventListener('click', () => {
      editingId = null;
      getNameInput().value = '';
      buildSlotDropdowns();
      getSlotsWrap().querySelectorAll('select').forEach((sel, i) => { sel.value = getSlots()[i] ? 'None' : ''; });
      getFormWrap().classList.remove('hidden');
    });
    listWrap.appendChild(addBtn);
    list.forEach(p => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;padding:6px 8px;background:var(--bg-dark);border-radius:4px;border:1px solid var(--border)';
      const nameEl = document.createElement('span');
      nameEl.style.flex = '1';
      nameEl.textContent = p.name;
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => {
        editingId = p.id;
        getNameInput().value = p.name;
        buildSlotDropdowns();
        const slots = getSlots();
        const options = getSlotOptions();
        const slotsWrapEl = getSlotsWrap();
        slots.forEach((slot, i) => {
          const sel = slotsWrapEl.querySelector('select[data-slot="' + slot + '"]');
          if (!sel) return;
          const saved = (p.gear && p.gear[slot]) ? p.gear[slot] : 'None';
          const opts = options[slot] || ['None'];
          sel.value = opts.includes(saved) ? saved : 'None';
        });
        getFormWrap().classList.remove('hidden');
      });
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn';
      delBtn.textContent = 'Delete';
      delBtn.style.color = 'var(--danger)';
      delBtn.addEventListener('click', () => {
        if (!confirm('Delete preset "' + p.name + '"?')) return;
        const arr = getCustomList().filter(x => x.id !== p.id);
        saveCustomList(arr);
        renderList();
      });
      row.append(nameEl, editBtn, delBtn);
      listWrap.appendChild(row);
    });
  }

  function buildSlotDropdowns() {
    const slotsWrapEl = getSlotsWrap();
    slotsWrapEl.innerHTML = '';
    const options = getSlotOptions();
    const slots = getSlots();
    slots.forEach(slot => {
      const row = document.createElement('div');
      row.className = 'form-row';
      row.style.marginBottom = '8px';
      const label = document.createElement('label');
      label.className = 'form-label';
      label.textContent = slot;
      label.style.minWidth = '120px';
      const sel = document.createElement('select');
      sel.className = 'form-input';
      sel.dataset.slot = slot;
      (options[slot] || ['None']).forEach(opt => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = (slot === 'Emblem' && typeof PRESET_EMBLEM_DISPLAY !== 'undefined' && PRESET_EMBLEM_DISPLAY[opt]) ? PRESET_EMBLEM_DISPLAY[opt] : opt;
        sel.appendChild(o);
      });
      row.append(label, sel);
      slotsWrapEl.appendChild(row);
    });
  }

  function savePreset() {
    const name = getNameInput().value.trim();
    if (!name) { alert('Please enter a preset name.'); return; }
    const slots = getSlots();
    const gear = {};
    const slotsWrapEl = getSlotsWrap();
    slots.forEach(slot => {
      const sel = slotsWrapEl.querySelector('select[data-slot="' + slot + '"]');
      gear[slot] = sel ? sel.value : 'None';
    });
    const arr = getCustomList();
    if (editingId) {
      const idx = arr.findIndex(p => p.id === editingId);
      if (idx >= 0) { arr[idx] = { id: arr[idx].id, name, gear }; saveCustomList(arr); }
    } else {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      arr.push({ id, name, gear });
      saveCustomList(arr);
    }
    getFormWrap().classList.add('hidden');
    editingId = null;
    renderList();
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchToTab(btn.dataset.tab);
      document.getElementById('customPresetsFormWrapEquipment').classList.add('hidden');
      document.getElementById('customPresetsFormWrapAccessories').classList.add('hidden');
      editingId = null;
      renderList();
    });
  });

  document.getElementById('openCustomPresetsBtn').addEventListener('click', () => {
    switchToTab('equipment');
    document.getElementById('customPresetsFormWrapEquipment').classList.add('hidden');
    document.getElementById('customPresetsFormWrapAccessories').classList.add('hidden');
    editingId = null;
    renderList();
    overlay.classList.remove('hidden');
  });

  overlay.querySelectorAll('#customPresetSaveBtnEquipment, #customPresetSaveBtnAccessories').forEach(btn => btn.addEventListener('click', savePreset));
  overlay.querySelectorAll('#customPresetCancelBtnEquipment, #customPresetCancelBtnAccessories').forEach(btn => btn.addEventListener('click', () => { getFormWrap().classList.add('hidden'); editingId = null; }));
  closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && !overlay.classList.contains('hidden')) {
      if (!getFormWrap().classList.contains('hidden')) { getFormWrap().classList.add('hidden'); editingId = null; }
      else overlay.classList.add('hidden');
    }
  });
})();

/* ── Legion Backup modal (Export / Import) ───────────────────────── */
(function backupModal() {
  const BACKUP_VERSION = 1;
  const overlay = document.getElementById('backupOverlay');
  const exportBtn = document.getElementById('backupExportBtn');
  const importBtn = document.getElementById('backupImportBtn');
  const fileInput = document.getElementById('backupFileInput');
  const closeBtn = document.getElementById('backupCloseBtn');

  document.getElementById('openBackupBtn').addEventListener('click', () => {
    overlay.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && !overlay.classList.contains('hidden')) {
      overlay.classList.add('hidden');
    }
  });

  function exportBackup() {
    const payload = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      chars: Array.isArray(chars) ? chars : [],
      customGearPresets: typeof getCustomGearPresets === 'function' ? getCustomGearPresets() : [],
      customAccessoryPresets: typeof getCustomAccessoryPresets === 'function' ? getCustomAccessoryPresets() : [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'legion-lab-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function normalizeImportedChars(arr) {
    if (!Array.isArray(arr)) return [];
    const slots = typeof SLOTS !== 'undefined' && Array.isArray(SLOTS) ? SLOTS : [];
    return arr.filter(c => c != null && typeof c === 'object').map(c => {
      const gear = (c.gear && typeof c.gear === 'object' && !Array.isArray(c.gear)) ? c.gear : {};
      slots.forEach(s => {
        if (!gear[s]) gear[s] = { item: 'None', stars: 0 };
        else if (gear[s].set !== undefined && gear[s].item === undefined && typeof SLOT_ITEMS !== 'undefined' && SLOT_ITEMS[s]) {
          const match = (SLOT_ITEMS[s] || []).find(it => it && it.tier === gear[s].set);
          gear[s] = { item: match ? match.label : 'None', stars: gear[s].stars ?? 0 };
        }
      });
      return {
        id: c.id || Date.now().toString(36) + Math.random().toString(36).slice(2),
        name: c.name ?? '',
        level: c.level ?? null,
        cls: c.cls ?? null,
        world: c.world ?? null,
        imageUrl: c.imageUrl ?? null,
        collapsed: c.collapsed ?? false,
        gear,
      };
    });
  }

  function importBackup(payload) {
    if (!payload || typeof payload !== 'object') return false;
    const arr = Array.isArray(payload.chars) ? payload.chars : [];
    const replace = confirm(
      'Import ' + arr.length + ' character(s) from backup.\n\n' +
      'Choose OK to replace your current list, or Cancel to merge (add to existing).'
    );
    const newChars = normalizeImportedChars(arr);
    if (replace) {
      chars.length = 0;
      newChars.forEach(c => chars.push(c));
    } else {
      newChars.forEach(c => chars.push(c));
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'customGearPresets') && Array.isArray(payload.customGearPresets) && typeof saveCustomGearPresets === 'function') {
      saveCustomGearPresets(payload.customGearPresets);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'customAccessoryPresets') && Array.isArray(payload.customAccessoryPresets) && typeof saveCustomAccessoryPresets === 'function') {
      saveCustomAccessoryPresets(payload.customAccessoryPresets);
    }
    save();
    render();
    if (typeof updateMsBar === 'function') updateMsBar();
    overlay.classList.add('hidden');
    return true;
  }

  exportBtn.addEventListener('click', () => {
    exportBackup();
  });

  importBtn.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        if (importBackup(payload)) {
          alert('Backup imported successfully.');
        } else {
          alert('Invalid backup file or no character data found.');
        }
      } catch (e) {
        alert('Could not read backup file: ' + (e.message || 'invalid JSON'));
      }
      fileInput.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  });
})();

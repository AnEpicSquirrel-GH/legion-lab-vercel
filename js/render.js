'use strict';

let gearBgEnabled = true;

/** True if this item counts as Lucky for the given slot (e.g. Genesis/Destiny weapons by tier, or exact LUCKY_ITEMS match). */
function isLuckyForSlot(item, slot) {
  if (!item || item === 'None') return false;
  if (typeof LUCKY_ITEMS !== 'undefined' && LUCKY_ITEMS[item] === slot) return true;
  if (slot === 'Weapon' && typeof ITEM_TIER !== 'undefined') {
    const tier = ITEM_TIER[item];
    if (tier === 'Pitched' || tier === 'Eternal') return true;  // Genesis / Destiny weapons (any class-specific label)
  }
  return false;
}

/** Minimum piece count for this set to grant any bonus (e.g. 2 for CRA, 3 for Boss). */
function getMinEffectTier(set, charCategory) {
  const effects = set.effectsByCategory?.[charCategory] || set.effectsByCategory?.Warrior || set.effects;
  if (!effects) return 999;
  const keys = Object.keys(effects).map(Number).filter(k => !isNaN(k) && k >= 0);
  return keys.length ? Math.min(...keys) : 999;
}

/** Highest effect tier actually reached for this piece count (e.g. Boss with 4 pieces → 3 set, no 4 set exists). */
function getAchievedBonusTier(set, pieceCount, charCategory) {
  const effects = set.effectsByCategory?.[charCategory] || set.effectsByCategory?.Warrior || set.effects;
  if (!effects) return 0;
  const keys = Object.keys(effects).map(Number).filter(k => !isNaN(k) && k >= 0 && k <= pieceCount);
  return keys.length ? Math.max(...keys) : 0;
}

/** Returns { setId: count } for each predefined gear set that has at least the minimum pieces for one bonus. */
function getSetCounts(char) {
  const counts = {};
  if (!char.gear || typeof GEAR_SETS === 'undefined') return counts;
  const charCategory = typeof CLASS_CATEGORY !== 'undefined' ? (CLASS_CATEGORY[char.cls] || 'Warrior') : 'Warrior';

  Object.entries(GEAR_SETS).forEach(([setId, set]) => {
    if (!set.slots || !set.items) return;
    const itemSet = set.items;
    let n = 0;
    set.slots.forEach(slot => {
      const item = char.gear[slot]?.item;
      if (!item || item === 'None') return;
      const slotItems = itemSet[slot];
      if (slotItems && (slotItems.has && slotItems.has(item))) n++;
    });
    set.slots.forEach(slot => {
      const item = char.gear[slot]?.item;
      if (!item || item === 'None') return;
      const slotItems = itemSet[slot];
      if (!slotItems || (slotItems.has && slotItems.has(item))) return;
      if (!isLuckyForSlot(item, slot)) return;
      let otherCount = 0;
      set.slots.forEach(s => {
        if (s === slot) return;
        const o = char.gear[s]?.item;
        if (o && o !== 'None' && itemSet[s] && (itemSet[s].has && itemSet[s].has(o))) otherCount++;
      });
      if (otherCount >= 3) n++;
    });
    const minTier = getMinEffectTier(set, charCategory);
    if (n >= minTier) counts[setId] = n;
  });
  return counts;
}

/** Cumulative effect lines up to the given bonus tier (use getAchievedBonusTier for which tier is hit). */
function getCumulativeEffectLinesForSet(setId, upToTier, charCategory) {
  const set = GEAR_SETS[setId];
  if (!set) return [];
  const effects = set.effectsByCategory?.[charCategory] || set.effectsByCategory?.Warrior || set.effects;
  if (!effects || upToTier < 1) return [];
  const lines = [];
  for (let n = 2; n <= upToTier && n <= 10; n++) {
    const arr = effects[n];
    if (arr) lines.push(...arr);
  }
  return lines;
}

/** Preferred display order for cumulative bonus stats. List each stat once; percent keys (e.g. "Boss Damage%") match the base name for ordering. */
const CUMULATIVE_STAT_ORDER = [
  'Weapon Attack', 'Magic Attack', 'Boss Damage', 'Ignore Enemy DEF', 'Critical Damage', 'Damage',
  'All Stats', 'STR', 'DEX', 'INT', 'LUK',
  'Max HP', 'Max HP%', 'Max MP', 'Max MP%',
  'Defense'
];

function cumulativeOrderIndex(key) {
  let i = CUMULATIVE_STAT_ORDER.indexOf(key);
  if (i >= 0) return i;
  if (key.endsWith('%')) {
    i = CUMULATIVE_STAT_ORDER.indexOf(key.slice(0, -1));
    if (i >= 0) return i;
  }
  return CUMULATIVE_STAT_ORDER.length;
}

/** Merge cumulative effect lines into combined totals (e.g. "All Stats: +10" + "Max HP: +1,000" → summed). */
function mergeCumulativeEffectLines(lines) {
  if (!lines || lines.length === 0) return [];
  const map = new Map();
  const unmerged = [];
  const re = /^(.+?):\s*\+([\d,]+)(%?)\s*$/;
  lines.forEach(line => {
    const t = line.trim();
    const m = t.match(re);
    if (!m) {
      unmerged.push(t);
      return;
    }
    const [, stat, numStr, pct] = m;
    const key = stat.trim() + (pct || '');
    const num = parseInt(numStr.replace(/,/g, ''), 10);
    if (!map.has(key)) map.set(key, { stat: stat.trim(), total: 0, pct: !!pct });
    map.get(key).total += num;
  });
  const merged = Array.from(map.entries())
    .sort((a, b) => cumulativeOrderIndex(a[0]) - cumulativeOrderIndex(b[0]))
    .map(([, v]) => (v.pct ? `${v.stat}: +${v.total}%` : `${v.stat}: +${v.total.toLocaleString()}`));
  return merged.concat(unmerged);
}

/** Incremental set effects by tier (2, 3, 4...) for tooltip left column. */
function getSetEffectsByTier(setId, charCategory) {
  const set = GEAR_SETS[setId];
  if (!set) return null;
  return set.effectsByCategory?.[charCategory] || set.effectsByCategory?.Warrior || set.effects || null;
}

/** Build the Sets column (after sprite, before gear). */
function buildSetsCell(char, idx, section) {
  const cell = document.createElement('div');
  cell.className = 'char-sets-cell';
  cell.dataset.idx = idx;

  const headerEl = document.createElement('div');
  headerEl.className = 'sets-header';
  headerEl.textContent = 'Set Effects';

  const lineEl = document.createElement('div');
  lineEl.className = 'sets-line';

  const expandedBlock = document.createElement('div');
  expandedBlock.className = 'sets-expanded';

  cell.append(headerEl, lineEl, expandedBlock);
  return cell;
}

/** Update sets column from current character gear. */
function syncSetsCell(section) {
  const idx = parseInt(section?.dataset.idx, 10);
  if (isNaN(idx) || !chars[idx]) return;
  const char = chars[idx];
  const cell = section?.querySelector('.char-sets-cell');
  if (!cell) return;

  const lineEl = cell.querySelector('.sets-line');
  const expandedBlock = cell.querySelector('.sets-expanded');
  if (!lineEl || !expandedBlock) return;

  const counts = getSetCounts(char);
  const setIds = Object.keys(counts);
  const charCategory = typeof CLASS_CATEGORY !== 'undefined' ? (CLASS_CATEGORY[char.cls] || 'Warrior') : 'Warrior';

  lineEl.innerHTML = '';
  expandedBlock.innerHTML = '';

  if (setIds.length === 0) {
    lineEl.textContent = '—';
    return;
  }

  setIds.forEach(setId => {
    const n = counts[setId];
    const set = GEAR_SETS[setId];
    const name = set?.shortName ?? set?.name ?? setId;
    const color = set?.color ?? 'inherit';
    const achievedTier = getAchievedBonusTier(set, n, charCategory);
    const effectsByTier = getSetEffectsByTier(setId, charCategory);
    const cumulativeRaw = getCumulativeEffectLinesForSet(setId, achievedTier, charCategory);
    const cumulative = mergeCumulativeEffectLines(cumulativeRaw);
    const tag = document.createElement('span');
    tag.className = 'set-tag';
    tag.style.color = color;
    if (color && color !== 'inherit') {
      tag.style.background = color + '1A';
      tag.style.borderColor = color + '88';
    }
    tag.textContent = `${name} (${n})`;
    tag.dataset.setId = setId;
    tag.dataset.count = String(n);
    tag._tooltip = { setId, n, achievedTier, effectsByTier, cumulative, set, charCategory };
    lineEl.appendChild(tag);
    if (setIds.indexOf(setId) < setIds.length - 1) lineEl.appendChild(document.createTextNode(' '));
  });

  /* Expanded: same inline wrapping layout as collapsed; no per-set blocks */
  const expandedLine = document.createElement('div');
  expandedLine.className = 'sets-expanded-line';
  setIds.forEach(setId => {
    const n = counts[setId];
    const set = GEAR_SETS[setId];
    const name = set?.shortName ?? set?.name ?? setId;
    const color = set?.color ?? 'inherit';
    const achievedTier = getAchievedBonusTier(set, n, charCategory);
    const effectsByTier = getSetEffectsByTier(setId, charCategory);
    const cumulativeRaw = getCumulativeEffectLinesForSet(setId, achievedTier, charCategory);
    const cumulative = mergeCumulativeEffectLines(cumulativeRaw);
    const tag = document.createElement('span');
    tag.className = 'set-tag';
    tag.style.color = color;
    if (color && color !== 'inherit') {
      tag.style.background = color + '1A';
      tag.style.borderColor = color + '88';
    }
    tag.textContent = `${name} (${n})`;
    tag.dataset.setId = setId;
    tag.dataset.count = String(n);
    tag._tooltip = { setId, n, achievedTier, effectsByTier, cumulative, set, charCategory };
    expandedLine.appendChild(tag);
    if (setIds.indexOf(setId) < setIds.length - 1) expandedLine.appendChild(document.createTextNode(' '));
  });
  expandedBlock.appendChild(expandedLine);

  /* Total Cumulative Set Bonuses: merge cumulative from all sets into one list */
  const allCumulativeLines = [];
  setIds.forEach(setId => {
    const n = counts[setId];
    const set = GEAR_SETS[setId];
    const achievedTier = getAchievedBonusTier(set, n, charCategory);
    const raw = getCumulativeEffectLinesForSet(setId, achievedTier, charCategory);
    const merged = mergeCumulativeEffectLines(raw);
    allCumulativeLines.push(...merged);
  });
  const totalCumulative = mergeCumulativeEffectLines(allCumulativeLines);
  if (totalCumulative.length > 0) {
    const totalHead = document.createElement('div');
    totalHead.className = 'sets-total-cumulative-head';
    totalHead.textContent = 'Total Cumulative Set Bonuses';
    expandedBlock.appendChild(totalHead);
    const totalList = document.createElement('div');
    totalList.className = 'sets-total-cumulative';
    totalCumulative.forEach(line => {
      const p = document.createElement('div');
      p.className = 'sets-total-cumulative-line';
      p.textContent = line;
      totalList.appendChild(p);
    });
    expandedBlock.appendChild(totalList);
  }

  attachSetTooltip(lineEl);
  attachSetTooltip(expandedBlock);
}

let setsTooltipEl = null;
let setsTooltipTimer = null;

function attachSetTooltip(container) {
  if (!container) return;
  container.querySelectorAll('.set-tag, .set-block-title').forEach(el => {
    const data = el._tooltip;
    if (!data) return;
    el.addEventListener('mouseenter', function (e) {
      clearTimeout(setsTooltipTimer);
      setsTooltipTimer = setTimeout(() => showSetTooltip(e, data), 500);
    });
    el.addEventListener('mouseleave', function () {
      clearTimeout(setsTooltipTimer);
      setsTooltipTimer = null;
      hideSetTooltip();
    });
  });
}

function showSetTooltip(e, data) {
  if (!data || !data.set) return;
  if (!setsTooltipEl) {
    setsTooltipEl = document.createElement('div');
    setsTooltipEl.className = 'sets-tooltip';
    document.body.appendChild(setsTooltipEl);
  }
  const { setId, n, achievedTier, effectsByTier, cumulative, set } = data;
  const name = set.name ?? set.shortName ?? setId;
  const tierLabel = (achievedTier != null && achievedTier > 0) ? achievedTier : n;
  let leftHtml = '<div class="sets-tt-head">' + escHtml(name) + ' Effects</div>';
  if (effectsByTier) {
    [2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(i => {
      if (!effectsByTier[i]) return;
      leftHtml += `<div class="sets-tt-tier">${i} set:</div>`;
      effectsByTier[i].forEach(line => leftHtml += `<div class="sets-tt-line">${escHtml(line)}</div>`);
    });
  }
  let rightHtml = '<div class="sets-tt-head">Cumulative (' + tierLabel + ' set)</div>';
  (cumulative || []).forEach(line => rightHtml += `<div class="sets-tt-line">${escHtml(line)}</div>`);
  setsTooltipEl.innerHTML = '<div class="sets-tt-col">' + leftHtml + '</div><div class="sets-tt-col">' + rightHtml + '</div>';
  setsTooltipEl.style.display = 'block';
  requestAnimationFrame(() => positionSetTooltip(e));
}

function positionSetTooltip(e) {
  if (!setsTooltipEl || setsTooltipEl.style.display !== 'block') return;
  const rect = setsTooltipEl.getBoundingClientRect();
  const x = e.clientX;
  const y = e.clientY;
  const pad = 8;
  let left = x + pad;
  let top = y + pad;
  if (left + rect.width > window.innerWidth) left = x - rect.width - pad;
  if (top + rect.height > window.innerHeight) top = window.innerHeight - rect.height - pad;
  if (top < 0) top = pad;
  if (left < 0) left = pad;
  setsTooltipEl.style.left = left + 'px';
  setsTooltipEl.style.top = top + 'px';
}

function hideSetTooltip() {
  if (setsTooltipEl) setsTooltipEl.style.display = 'none';
}

function render() {
  document.querySelectorAll('.gear-sel-panel').forEach(p => p.remove());
  const list = document.getElementById('char-list');
  if (!list) return;
  list.innerHTML = '';
  const fragment = document.createDocumentFragment();
  chars.forEach((c, i) => fragment.appendChild(buildSection(c, i)));
  list.appendChild(fragment);
  updateToggleBtn();
  if (typeof multiSelectMode !== 'undefined' && multiSelectMode) {
    list.classList.add('multiselect-active');
  }
}

/** Rebuild only the section at index (avoids full list re-render for single-character updates). */
function updateSection(idx) {
  const list = document.getElementById('char-list');
  if (!list || idx < 0 || idx >= chars.length) return;
  const sections = list.querySelectorAll('.char-section');
  const oldSection = sections[idx];
  if (!oldSection) return;
  const newSection = buildSection(chars[idx], idx);
  oldSection.replaceWith(newSection);
}

function buildSection(char, idx) {
  const section = document.createElement('div');
  section.className = 'char-section' + (char.collapsed ? ' collapsed' : '') + (idx % 2 === 1 ? ' zebra-odd' : '');
  section.dataset.idx = idx;

  /* ── left meta strip ── */
  const meta = document.createElement('div');
  meta.className = 'row-meta';

  const handle = document.createElement('span');
  handle.className = 'drag-handle';
  handle.textContent = '≡';
  handle.title = 'Drag to reorder / Click for options';

  handle.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.handle-menu').forEach(m => m.remove());
    const menu = document.createElement('div');
    menu.className = 'handle-menu';
    const editBtn = document.createElement('button');
    editBtn.textContent = '✎  Edit';
    editBtn.addEventListener('click', (e) => { e.stopPropagation(); menu.remove(); editChar(idx); });
    const presetBtn = document.createElement('button');
    presetBtn.textContent = '⚙  Gear Presets';
    presetBtn.addEventListener('click', (e) => { e.stopPropagation(); menu.remove(); openPresetModal(idx); });
    const starsBtn = document.createElement('button');
    starsBtn.textContent = '☆  Set All Starforce';
    starsBtn.addEventListener('click', (e) => { e.stopPropagation(); menu.remove(); openStarsModal(idx); });
    const delBtn = document.createElement('button');
    delBtn.className = 'menu-delete';
    delBtn.textContent = '✕  Delete';
    delBtn.addEventListener('click', (e) => { e.stopPropagation(); menu.remove(); deleteChar(idx); });
    menu.append(editBtn, presetBtn, starsBtn, delBtn);
    document.body.appendChild(menu);
    const rect = handle.getBoundingClientRect();
    menu.style.left = rect.left + 'px';
    const gap = 4;
    const paddingFromBottom = 12;
    const menuHeight = menu.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom - paddingFromBottom;
    if (spaceBelow >= menuHeight) {
      menu.style.top = (rect.bottom + gap) + 'px';
    } else {
      menu.style.top = (rect.top - menuHeight - gap) + 'px';
    }
    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 0);
  });

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'toggle-btn';
  toggleBtn.innerHTML = '&#9660;';
  toggleBtn.title = char.collapsed ? 'Expand' : 'Collapse';
  toggleBtn.addEventListener('click', () => { toggleChar(idx); });

  const selCb = document.createElement('input');
  selCb.type = 'checkbox';
  selCb.className = 'row-select-cb';
  selCb.dataset.idx = idx;
  selCb.checked = selectedIndices.has(idx);
  selCb.addEventListener('change', () => {
    if (selCb.checked) selectedIndices.add(idx); else selectedIndices.delete(idx);
    updateMsBar();
  });
  meta.append(selCb, toggleBtn, handle);

  /* ── character info cell ── */
  const infoCell = document.createElement('div');
  infoCell.className = 'char-info-cell';

  const spriteWrap = document.createElement('div');
  spriteWrap.className = 'char-sprite-wrap';
  if (char.imageUrl && isSafeImageUrl(char.imageUrl)) {
    const img = document.createElement('img');
    img.className = 'char-sprite';
    img.loading = 'lazy';
    img.src = char.imageUrl.trim();
    img.alt = char.name;
    img.onerror = () => { spriteWrap.innerHTML = '<div class="char-sprite-placeholder">🧙</div>'; };
    spriteWrap.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'char-sprite-placeholder';
    ph.textContent = '🧙';
    spriteWrap.appendChild(ph);
  }

  const text = document.createElement('div');
  text.className = 'char-text';
  const clsCategory = CLASS_CATEGORY[char.cls] ?? null;
  const blockIcon = clsCategory ? LEGION_BLOCK_ICON[clsCategory] : null;
  const tileIcon  = getLegionTileIcon(char.cls, char.level);
  const rank      = getLegionRank(char.level, char.cls);
  const blockImg  = blockIcon
    ? `<img class="legion-block-icon" src="${escHtml(blockIcon)}" alt="${escHtml(clsCategory)}" title="${escHtml(clsCategory)}">`
    : '';
  text.innerHTML = `
    <div class="char-name" title="${escHtml(char.name)}">${escHtml(char.name)}</div>
    <div class="char-level">${char.level ? 'Lv. ' + char.level : 'Lv. ?'}</div>
    <div class="char-cls-world">
      <div class="cls-line">${blockImg}<span class="cls">${escHtml(char.cls || '—')}</span></div>
      <div class="world-part">${char.world ? escHtml(char.world) : ''}</div>
      <div class="legion-icons-row"></div>
    </div>
  `;

  if (char.cls) {
    const clsSpan = text.querySelector('.cls');
    if (clsSpan) {
      clsSpan.dataset.clsTooltip = char.cls;
      clsSpan.dataset.clsLevel   = char.level ?? '';
      if (clsCategory) clsSpan.dataset.clsCat = clsCategory;
    }
  }

  infoCell.append(text);

  /* ── gear content ── */
  const gearContent = document.createElement('div');
  gearContent.className = 'gear-content';

  const gearRows = document.createElement('div');
  gearRows.className = 'gear-rows';

  [ROW_1_SLOTS, ROW_2_SLOTS].forEach(rowSlots => {
    const gearRow = document.createElement('div');
    gearRow.className = 'gear-row';
    rowSlots.forEach(slot => gearRow.appendChild(buildSlot(char, idx, slot, section)));
    gearRows.appendChild(gearRow);
  });

  const summary = document.createElement('div');
  summary.className = 'gear-summary';

  [ROW_1_SLOTS, ROW_2_SLOTS].forEach(rowSlots => {
    const summaryRow = document.createElement('div');
    summaryRow.className = 'summary-row';
    rowSlots.forEach(slot => summaryRow.appendChild(buildSummaryChip(char, slot)));
    summary.appendChild(summaryRow);
  });

  gearContent.append(gearRows, summary);

  const setsCell = buildSetsCell(char, idx, section);

  const charRow = document.createElement('div');
  charRow.className = 'char-row';
  charRow.append(meta, infoCell, spriteWrap, setsCell, gearContent);
  section.appendChild(charRow);
  syncSetsCell(section);

  wireExclusiveSlots(section, ['Ring 1', 'Ring 2', 'Ring 3', 'Ring 4'], idx);
  wireExclusiveSlots(section, ['Pendant 1', 'Pendant 2'], idx);

  const topItem = char.gear['Top/Overall']?.item ?? 'None';
  if (ITEM_META[topItem]?.isOverall) {
    updateBottomForOverall(section, true, /*skipSave=*/true);
  }

  setupDnD(section, idx);

  return section;
}

/**
 * Wires a group of same-type slots (e.g. Ring 1–4, Pendant 1–2) so that
 * each slot's dropdown hides items already equipped in sibling slots,
 * and resets any sibling that would become a duplicate when a value is chosen.
 */
function wireExclusiveSlots(section, slotNames, charIdx) {
  const slots = slotNames.map(name => {
    const slotEl = section.querySelector(`.gear-slot[data-slot="${name}"]`);
    return slotEl ? { name, slotEl } : null;
  }).filter(Boolean);
  if (slots.length < 2) return;

  function refreshExclusions() {
    slots.forEach(({ slotEl: el }) => {
      const wrap = el.querySelector('.gear-sel-wrap');
      if (!wrap) return;
      const excluded = new Set();
      slots.forEach(({ slotEl: other }) => {
        if (other === el) return;
        const otherSel = other.querySelector('.gear-select');
        if (otherSel && otherSel.value !== 'None') excluded.add(otherSel.value);
      });
      wrap._excluded = excluded;
    });
  }

  slots.forEach(({ slotEl }) => {
    const sel = slotEl.querySelector('.gear-select');
    if (!sel) return;
    sel.addEventListener('change', () => {
      if (sel.value !== 'None') {
        slots.forEach(({ slotEl: sib }) => {
          if (sib === slotEl) return;
          const sibSel = sib.querySelector('.gear-select');
          if (sibSel && sibSel.value === sel.value) {
            sibSel.value = 'None';
            sibSel.dispatchEvent(new Event('change'));
          }
        });
      }
      refreshExclusions();
    });
  });

  refreshExclusions();
}

/** Creates and styles a single summary chip for the collapsed view. */
function buildSummaryChip(char, slot) {
  const gd = char.gear[slot] || { item: 'None', stars: 0 };
  const chip = document.createElement('span');
  chip.className = 'summary-chip';
  chip.dataset.slot = slot;
  applyChipStyle(chip, gd.item ?? 'None', gd.stars ?? 0);
  return chip;
}

/** Finds a chip in the section's summary and refreshes its style + text. */
function syncChip(section, slot, itemLabel, stars) {
  if (!section) return;
  const chip = section.querySelector(`.summary-chip[data-slot="${slot}"]`);
  if (chip) applyChipStyle(chip, itemLabel, stars);
}

/**
 * Sets chip text, color, and tooltip.
 *   • Equipped item in a GEAR_SET → set color
 *   • Otherwise (including None) → default/white
 */
function applyChipStyle(chip, itemLabel, stars) {
  const slot   = chip.dataset.slot;
  const gearSet = typeof getSetForItem !== 'undefined' ? getSetForItem(itemLabel, slot) : null;
  const isNone = itemLabel === 'None';

  let suffix = '';
  if (slot && !isNone) {
    if (itemHasStars(slot, itemLabel)) suffix = ' (' + stars + '\u2605)';
    else if (isOzRing(itemLabel)) suffix = ' Lv. ' + Math.max(1, Math.min(6, parseInt(stars, 10) || (typeof OZ_RING_DEFAULT_LEVEL !== 'undefined' ? OZ_RING_DEFAULT_LEVEL : 4)));
  }

  const ozLevel = isOzRing(itemLabel) ? Math.max(1, Math.min(6, parseInt(stars, 10) || (typeof OZ_RING_DEFAULT_LEVEL !== 'undefined' ? OZ_RING_DEFAULT_LEVEL : 4))) : null;
  chip.textContent = isNone
    ? `NO ${SLOT_ABBR[slot] ?? slot.toUpperCase()}`
    : itemLabel + (ozLevel != null ? ' ' + ozLevel : '');
  chip.title = `${slot}: ${itemLabel}${suffix}`;
  chip.classList.toggle('chip-none', isNone);

  if (!isNone && gearSet?.color) {
    chip.style.color       = gearSet.color;
    chip.style.borderColor = gearSet.color + '88';
    chip.style.background  = gearSet.color + '1A';
  } else {
    chip.style.color = '';
    chip.style.borderColor = 'rgba(255,255,255,0.12)';
    chip.style.background  = 'rgba(255,255,255,0.06)';
  }
}

/** Applies/removes the N/A state on the Bottom slot based on whether an Overall is equipped. */
function updateBottomForOverall(section, isOverall, skipSave = false) {
  const bottomSlot = section.querySelector('.gear-slot[data-slot="Bottom"]');
  if (!bottomSlot) return;

  const sel      = bottomSlot.querySelector('.gear-select');
  const iconWrap = bottomSlot.querySelector('.gear-icon-wrap');
  const charIdx  = parseInt(section.dataset.idx, 10);

  bottomSlot.classList.toggle('slot-na', isOverall);
  if (sel) sel.disabled = isOverall;

  if (isOverall) {
    if (!skipSave) {
      chars[charIdx].gear['Bottom'] = { item: 'None', stars: 0 };
      save();
    }
    if (sel) { sel.value = 'None'; sel._syncDisplay?.(); }
    if (iconWrap) { iconWrap.innerHTML = ''; const b = makeNaBadge(); b.title = 'N/A — Overall equipped'; iconWrap.appendChild(b); }
    bottomSlot.querySelectorAll('.star-row').forEach(r => r.classList.add('hidden'));
    syncChip(section, 'Bottom', 'None', 0);
  } else {
    if (iconWrap) { iconWrap.innerHTML = ''; iconWrap.appendChild(makeNaBadge()); }
  }
}

function buildSlot(char, charIdx, slot, section) {
  const gearData    = char.gear[slot] || { item: 'None', stars: 0 };
  const currentItem = gearData.item ?? 'None';
  const slotEl      = document.createElement('div');
  slotEl.className  = 'gear-slot';
  slotEl.dataset.slot = slot;

  const hdr = document.createElement('div');
  hdr.className = 'slot-header';
  hdr.textContent = slot;

  const body = document.createElement('div');
  body.className = 'slot-body';

  const classWeapons = slot === 'Weapon' ? getWeaponItemsForClass(char.cls) : null;
  const allItems     = classWeapons ?? SLOT_ITEMS[slot] ?? [];
  const charCat      = CLASS_CATEGORY[char.cls] || '';
  let items;
  let effectiveItem  = currentItem;
  if (slot === 'Secondary Weapon' && char.cls === 'Zero') {
    const weapon = char.gear['Weapon']?.item;
    const zeroItems = typeof getZeroSecondaryItems !== 'undefined' ? getZeroSecondaryItems(weapon) : [];
    const forcedHeavy = zeroItems.length ? zeroItems[0].label : 'Utgard Heavy Sword';
    const weaponStars = char.gear['Weapon']?.stars ?? 0;
    chars[charIdx].gear[slot] = { item: forcedHeavy, stars: weaponStars };
    effectiveItem = forcedHeavy;
    items = zeroItems.length ? zeroItems : [{ label: forcedHeavy, tier: ITEM_TIER[forcedHeavy] || 'Pensalir' }];
  } else if (classWeapons) {
    const hasCurrent = currentItem === 'None' || classWeapons.some(it => it.label === currentItem);
    items = hasCurrent
      ? classWeapons
      : [{ label: currentItem, tier: ITEM_TIER[currentItem] ?? 'None' }, ...classWeapons];
  } else {
    items = allItems.filter(it => {
      if (it.excl && it.excl.includes(char.cls)) return it.label === currentItem;
      if (!it.cls || it.cls.length === 0) return true;
      if (it.cls.includes(char.cls)) return true;
      if (charCat && it.cls.includes(charCat)) return true;
      return it.label === currentItem;
    });
  }
  // Ring slots: only one of each exclusive group (e.g. Guardian Angel / Dawn Guardian) across all four rings
  const RING_SLOTS_ARR = ['Ring 1', 'Ring 2', 'Ring 3', 'Ring 4'];
  if (RING_SLOTS_ARR.includes(slot) && typeof getRingExclusiveGroup === 'function') {
    const otherRingSlots = RING_SLOTS_ARR.filter(s => s !== slot);
    const otherHasGuardian = otherRingSlots.some(s => {
      const g = getRingExclusiveGroup(chars[charIdx].gear[s]?.item);
      return g != null;
    });
    const currentGroup = getRingExclusiveGroup(currentItem);
    if (otherHasGuardian && !currentGroup) {
      items = items.filter(it => getRingExclusiveGroup(it.label) == null);
    }
  }
  const { wrap: selWrap, sel } = makeGearSelect(items, effectiveItem, STANDALONE_SLOTS.has(slot), slot);
  if (slot === 'Secondary Weapon' && char.cls === 'Zero') sel.disabled = true;

  const iconWrap = document.createElement('div');
  iconWrap.className = 'gear-icon-wrap';

  const starRow = document.createElement('div');
  starRow.className = 'star-row';

  const starInput = document.createElement('input');
  starInput.type = 'text';
  starInput.inputMode = 'numeric';
  starInput.className = 'star-input';
  starInput.setAttribute('aria-label', 'Stars');
  const isZeroHeavy = slot === 'Secondary Weapon' && char.cls === 'Zero';
  const fixedStars = typeof getFixedStars === 'function' ? getFixedStars(slot, gearData.item ?? currentItem) : null;
  let initialStars = isZeroHeavy ? (char.gear['Weapon']?.stars ?? 0) : (gearData.stars ?? 0);
  if (fixedStars != null) {
    initialStars = fixedStars;
    if (gearData.item && chars[charIdx].gear[slot]) {
      chars[charIdx].gear[slot].stars = fixedStars;
      save();
    }
  } else if (!isZeroHeavy && typeof getMaxStars === 'function') {
    const maxStars = getMaxStars(slot, gearData.item ?? currentItem);
    initialStars = Math.max(0, Math.min(maxStars, initialStars));
    if (gearData.item && gearData.item !== 'None' && initialStars !== (gearData.stars ?? 0) && chars[charIdx].gear[slot]) {
      chars[charIdx].gear[slot].stars = initialStars;
      save();
    }
  }
  starInput.value = String(initialStars);
  if (isZeroHeavy || fixedStars != null) {
    starInput.readOnly = true;
    starInput.disabled = true;
  }

  const starLbl = document.createElement('span');
  starLbl.className = 'star-lbl';
  starLbl.textContent = 'Stars';
  starRow.append(starInput, starLbl);

  const ozRow = document.createElement('div');
  ozRow.className = 'star-row';

  const ozSel = document.createElement('select');
  ozSel.className = 'gear-select';
  const ozDefault = typeof OZ_RING_DEFAULT_LEVEL !== 'undefined' ? OZ_RING_DEFAULT_LEVEL : 4;
  [1, 2, 3, 4, 5, 6].forEach(n => {
    const o = document.createElement('option');
    o.value = n;
    o.textContent = `Level ${n}`;
    const ozVal = (gearData.stars >= 1 && gearData.stars <= 6) ? gearData.stars : ozDefault;
    if (ozVal === n) o.selected = true;
    ozSel.appendChild(o);
  });
  const ozLbl = document.createElement('span');
  ozLbl.className = 'star-lbl';
  ozLbl.textContent = 'Lv.';
  ozRow.append(ozSel, ozLbl);

  const noneTxt = document.createElement('div');
  noneTxt.className = 'none-text hidden';

  function applyInputVisibility(itemLabel) {
    const showStar = (slot === 'Secondary Weapon' && char.cls === 'Zero') || itemHasStars(slot, itemLabel);
    const showOz   = itemLabel !== 'None' && isOzRing(itemLabel);
    starRow.classList.toggle('hidden', !showStar);
    ozRow.classList.toggle('hidden', !showOz);
  }
  applyInputVisibility(effectiveItem || currentItem);

  renderGearIcon(iconWrap, ITEM_TIER[currentItem] ?? 'None', slot, currentItem, char.cls);

  function applyStarValue() {
    const itemLabel = chars[charIdx].gear[slot]?.item ?? 'None';
    const fixedStars = typeof getFixedStars === 'function' ? getFixedStars(slot, itemLabel) : null;
    let v;
    if (fixedStars != null) {
      v = fixedStars;
    } else {
      const raw = starInput.value.replace(/\D/g, '');
      v = raw === '' ? 0 : parseInt(raw, 10);
      if (isNaN(v)) v = 0;
      const maxStars = typeof getMaxStars === 'function' ? getMaxStars(slot, itemLabel) : 30;
      v = Math.max(0, Math.min(maxStars, v));
    }
    starInput.value = String(v);
    chars[charIdx].gear[slot].stars = v;
    if (slot === 'Weapon' && chars[charIdx].cls === 'Zero') {
      if (chars[charIdx].gear['Secondary Weapon']) {
        chars[charIdx].gear['Secondary Weapon'].stars = v;
        const secSlot = section.querySelector('[data-slot="Secondary Weapon"]');
        if (secSlot) {
          const si = secSlot.querySelector('.star-input');
          if (si) si.value = String(v);
        }
      }
      syncChip(section, 'Secondary Weapon', chars[charIdx].gear['Secondary Weapon']?.item, v);
    }
    save();
    syncChip(section, slot, chars[charIdx].gear[slot].item, v);
    syncSetsCell(section);
  }
  starInput.addEventListener('focus', () => {
    const itemLabel = chars[charIdx].gear[slot]?.item ?? 'None';
    if (typeof getFixedStars === 'function' && getFixedStars(slot, itemLabel) != null) return;
    starInput.select();
  });
  starInput.addEventListener('input', () => {
    const raw = starInput.value.replace(/\D/g, '');
    if (starInput.value !== raw) starInput.value = raw;
  });
  starInput.addEventListener('change', applyStarValue);
  starInput.addEventListener('blur', () => starInput.dispatchEvent(new Event('change')));

  ozSel.addEventListener('change', () => {
    const lv = parseInt(ozSel.value, 10);
    chars[charIdx].gear[slot].stars = lv;
    save();
    syncChip(section, slot, chars[charIdx].gear[slot].item, lv);
    syncSetsCell(section);
  });

  sel.addEventListener('change', () => {
    const newItem   = sel.value;
    const newTier   = ITEM_TIER[newItem] ?? 'None';
    const prevStars = chars[charIdx].gear[slot]?.stars ?? 0;
    const ozDefault = typeof OZ_RING_DEFAULT_LEVEL !== 'undefined' ? OZ_RING_DEFAULT_LEVEL : 4;
    let keepStars = newItem === 'None' ? 0
      : isOzRing(newItem) ? Math.max(1, Math.min(6, prevStars || ozDefault))
      : prevStars;
    const fixedStars = typeof getFixedStars === 'function' ? getFixedStars(slot, newItem) : null;
    if (fixedStars != null) keepStars = fixedStars;
    else {
      const maxStars = typeof getMaxStars === 'function' ? getMaxStars(slot, newItem) : 30;
      if (!isOzRing(newItem)) keepStars = Math.min(keepStars, maxStars);
    }

    chars[charIdx].gear[slot] = { item: newItem, stars: keepStars };
    if (slot === 'Weapon' && chars[charIdx].cls === 'Zero' && typeof getHeavySwordForLong !== 'undefined') {
      const heavy = getHeavySwordForLong(newItem);
      if (heavy && chars[charIdx].gear['Secondary Weapon']) {
        chars[charIdx].gear['Secondary Weapon'] = { item: heavy, stars: keepStars };
        const secSlot = section.querySelector('[data-slot="Secondary Weapon"]');
        if (secSlot) {
          const si = secSlot.querySelector('.star-input');
          if (si) si.value = String(keepStars);
        }
        syncChip(section, 'Secondary Weapon', heavy, keepStars);
      }
    }
    save();

    starInput.value = String(keepStars);
    ozSel.value     = keepStars || (typeof OZ_RING_DEFAULT_LEVEL !== 'undefined' ? OZ_RING_DEFAULT_LEVEL : 4);
    const isFixedStars = typeof getFixedStars === 'function' && getFixedStars(slot, newItem) != null;
    starInput.readOnly = isZeroHeavy || isFixedStars;
    starInput.disabled = isZeroHeavy || isFixedStars;
    applyInputVisibility(newItem);
    syncChip(section, slot, newItem, keepStars);
    syncSetsCell(section);

    if (RING_SLOTS_ARR.includes(slot) && typeof getRingExclusiveGroup === 'function') {
      updateSection(charIdx);
      return;
    }

    renderGearIcon(iconWrap, newTier, slot, newItem, char.cls);

    if (slot === 'Top/Overall') {
      updateBottomForOverall(section, !!(ITEM_META[newItem]?.isOverall));
    }

    // Zero: Weapon is Long only; force Secondary to the matching Heavy and refresh Secondary slot UI
    if (slot === 'Weapon' && char.cls === 'Zero' && typeof getHeavySwordForLong !== 'undefined') {
      const heavy = getHeavySwordForLong(newItem);
      if (heavy) {
        chars[charIdx].gear['Secondary Weapon'] = { item: heavy, stars: 0 };
        save();
        const secSlotEl = section.querySelector('.gear-slot[data-slot="Secondary Weapon"]');
        if (secSlotEl) {
          const secSel = secSlotEl.querySelector('.gear-select');
          const secIconWrap = secSlotEl.querySelector('.gear-icon-wrap');
          const secChip = section.querySelector(`.summary-chip[data-slot="Secondary Weapon"]`);
          if (secSel) {
            secSel.innerHTML = '';
            const opt = document.createElement('option');
            opt.value = heavy;
            opt.textContent = heavy;
            opt.selected = true;
            secSel.appendChild(opt);
            if (secSel._syncDisplay) secSel._syncDisplay();
          }
          if (secIconWrap) renderGearIcon(secIconWrap, ITEM_TIER[heavy] ?? 'None', 'Secondary Weapon', heavy, char.cls);
          if (secChip) syncChip(section, 'Secondary Weapon', heavy, 0);
          syncSetsCell(section);
        }
      }
    }

    // Focus the star/Lv input so the user can type immediately (skip when fixed stars — implies not editable)
    const showStar = itemHasStars(slot, newItem);
    const showOz   = newItem !== 'None' && isOzRing(newItem);
    setTimeout(() => {
      if (showStar && !isFixedStars) {
        starInput.focus();
        starInput.select();
      } else if (showOz) {
        ozSel.focus();
      }
    }, 0);
  });

  const starWrap = document.createElement('div');
  starWrap.className = 'star-row-wrap';
  starWrap.append(starRow, ozRow);
  body.append(selWrap, iconWrap, starWrap, noneTxt);
  slotEl.append(hdr, body);
  return slotEl;
}

/**
 * Render gear icon from local MapleIcons/Gear Icons/.
 * Color (background/badge) is set-only; icon path still uses tier. Non-set items show no tint.
 */
function renderGearIcon(wrap, setName, slot, itemLabel, charClass) {
  wrap.innerHTML = '';
  const set = SETS[setName];
  const gearSet = typeof getSetForItem !== 'undefined' ? getSetForItem(itemLabel || '', slot) : null;
  if (!set || setName === 'None') {
    wrap.style.background   = '';
    wrap.style.borderRadius = '';
    wrap.appendChild(makeNaBadge());
    return;
  }

  if (gearBgEnabled) {
    wrap.style.background   = gearSet?.color ? hexToRgba(gearSet.color, 0.25) : 'rgba(255,255,255,0.06)';
    wrap.style.borderRadius = '6px';
  } else {
    wrap.style.background   = '';
    wrap.style.borderRadius = '';
  }

  const candidates = itemIconCandidates(setName, slot, itemLabel || '', charClass);
  const badgeSet = gearSet ? { color: gearSet.color, abbr: gearSet.shortName || gearSet.name } : null;
  if (candidates.length === 0) { wrap.appendChild(badgeSet ? makeBadge(badgeSet) : makeNaBadge()); return; }

  const img = document.createElement('img');
  img.className = 'gear-img';
  img.alt = itemLabel || slot;

  function tryNext(remaining) {
    if (remaining.length === 0) { wrap.innerHTML = ''; wrap.appendChild(badgeSet ? makeBadge(badgeSet) : makeNaBadge()); return; }
    img.onerror = () => tryNext(remaining.slice(1));
    img.src = remaining[0];
  }
  tryNext(candidates);
  wrap.appendChild(img);
}

function makeBadge(set) {
  const div = document.createElement('div');
  div.className = 'gear-badge';
  div.style.background = set.color;
  div.textContent = set.abbr || set.shortName || '';
  return div;
}

function makeNaBadge() {
  const div = document.createElement('div');
  div.className = 'gear-badge gear-badge-na';
  return div;
}

function updateToggleBtn() {
  const btn = document.getElementById('toggleAllBtn');
  if (!btn) return;
  const anyExpanded = chars.some(c => !c.collapsed);
  btn.textContent = anyExpanded ? 'Collapse All' : 'Expand All';
}

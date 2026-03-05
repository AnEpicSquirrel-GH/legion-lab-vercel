'use strict';

/* ────────────────────────────────────────────────────────────────
   CHARACTER ACTIONS
──────────────────────────────────────────────────────────────── */
function toggleChar(idx) {
  chars[idx].collapsed = !chars[idx].collapsed;
  save();
  const section = document.querySelector(`#char-list .char-section[data-idx="${idx}"]`);
  if (section) {
    section.classList.toggle('collapsed', chars[idx].collapsed);
    const btn = section.querySelector('.toggle-btn');
    if (btn) btn.title = chars[idx].collapsed ? 'Expand' : 'Collapse';
  }
}

function toggleAll() {
  const anyExpanded = chars.some(c => !c.collapsed);
  chars.forEach(c => { c.collapsed = anyExpanded; });
  save();
  document.querySelectorAll('#char-list .char-section').forEach((section, i) => {
    const idx = parseInt(section.dataset.idx, 10);
    if (isNaN(idx)) return;
    section.classList.toggle('collapsed', chars[idx].collapsed);
    const btn = section.querySelector('.toggle-btn');
    if (btn) btn.title = chars[idx].collapsed ? 'Expand' : 'Collapse';
  });
}

function deleteChar(idx) {
  if (typeof window.openDeleteConfirmModal === 'function') {
    window.openDeleteConfirmModal([idx]);
  } else {
    if (!confirm(`Remove "${chars[idx].name}" from your list?`)) return;
    chars.splice(idx, 1);
    save();
    render();
  }
}

function editChar(idx) {
  const c = chars[idx];
  editingIdx = idx;
  openModal({
    name:     c.name,
    level:    c.level ?? '',
    cls:      c.cls   ?? '',
    world:    c.world ?? '',
    imageUrl: c.imageUrl ?? '',
  });
  document.getElementById('modalTitle').textContent = 'Edit Character';
  document.getElementById('confirmAddBtn').textContent = 'Save Changes';
}

/* Small transient status label near a character row (best-effort) */
function showTempStatus(idx, msg, cls, ms = 3000) {
  const sec = document.querySelector(`.char-section[data-idx="${idx}"]`);
  if (!sec) return;
  let lbl = sec.querySelector('.refresh-lbl');
  if (!lbl) {
    lbl = document.createElement('span');
    lbl.className = 'refresh-lbl';
    lbl.style.cssText = 'font-size:10px;margin-left:4px;';
    const nameEl = sec.querySelector('.char-name');
    if (nameEl) nameEl.parentElement.appendChild(lbl);
  }
  lbl.textContent = msg;
  lbl.style.color = cls === 'ok' ? 'var(--success)' : cls === 'err' ? 'var(--danger)' : 'var(--accent)';
  clearTimeout(lbl._t);
  lbl._t = setTimeout(() => { lbl.textContent = ''; }, ms);
}

/* ────────────────────────────────────────────────────────────────
   DRAG & DROP
──────────────────────────────────────────────────────────────── */
function _dndClearIndicators() {
  document.querySelectorAll('.char-section').forEach(s => s.classList.remove('drop-before', 'drop-after'));
}

function _dndDropBefore(section, clientY) {
  const rect = section.getBoundingClientRect();
  return clientY < rect.top + rect.height / 2;
}

function setupDnD(section, idx) {
  const handle = section.querySelector('.drag-handle');
  if (handle) {
    handle.draggable = true;
    handle.addEventListener('dragstart', (e) => {
      dragSrcIdx = idx;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => section.style.opacity = '.4', 0);
    });
    handle.addEventListener('dragend', () => {
      section.style.opacity = '';
      _dndClearIndicators();
      dragSrcIdx = null;
    });
  }

  section.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragSrcIdx === null || dragSrcIdx === idx) return;

    document.querySelectorAll('.char-section').forEach(s => {
      if (s !== section) s.classList.remove('drop-before', 'drop-after');
    });
    const before = _dndDropBefore(section, e.clientY);
    section.classList.toggle('drop-before', before);
    section.classList.toggle('drop-after', !before);
  });

  section.addEventListener('dragleave', (e) => {
    if (!section.contains(e.relatedTarget)) {
      section.classList.remove('drop-before', 'drop-after');
    }
  });

  section.addEventListener('drop', (e) => {
    e.preventDefault();
    if (dragSrcIdx === null || dragSrcIdx === idx) {
      _dndClearIndicators();
      return;
    }

    const before = _dndDropBefore(section, e.clientY);
    _dndClearIndicators();

    const [moved] = chars.splice(dragSrcIdx, 1);
    const adj = dragSrcIdx < idx ? idx - 1 : idx;
    chars.splice(before ? adj : adj + 1, 0, moved);
    save();
    render();
  });
}

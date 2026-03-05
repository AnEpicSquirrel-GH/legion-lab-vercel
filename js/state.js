'use strict';

let chars       = [];    // array of character objects
let dragSrcIdx  = null;
let editingIdx  = null;  // null = adding new, number = editing existing

// character shape:
// { id, name, level, cls, world, imageUrl, collapsed, gear: { slot: { item, stars } } }

function save() {
  if (!Array.isArray(chars)) {
    console.warn('Legion Lab: save() skipped — chars is not an array');
    return;
  }
  try {
    localStorage.setItem('ll_v1', JSON.stringify(chars));
  } catch (e) {
    console.warn('Legion Lab: could not save to localStorage', e);
  }
}

function load() {
  // 1) Load from ll_v1 (or empty on parse error / non-array)
  try {
    const raw = JSON.parse(localStorage.getItem('ll_v1') || '[]');
    chars = Array.isArray(raw) ? raw : [];
    if (!Array.isArray(raw)) {
      console.warn('Legion Lab: ll_v1 was not an array, using empty character list');
    }
  } catch (e) {
    console.warn('Legion Lab: could not load from localStorage, using empty list', e);
    chars = [];
  }

  // 2) Migrate from legacy/alternate keys if we have no characters
  if (chars.length === 0) {
    try {
      const legacyRaw = localStorage.getItem('lvl');
      const legacy = legacyRaw ? JSON.parse(legacyRaw) : null;
      if (Array.isArray(legacy) && legacy.length > 0) {
        chars = legacy.map(c => ({
          id: c.id || Date.now().toString(36) + Math.random().toString(36).slice(2),
          name: c.name ?? '',
          level: c.level ?? null,
          cls: c.cls ?? null,
          world: c.world ?? null,
          imageUrl: c.imageUrl ?? c.magisk ?? null,
          collapsed: c.collapsed ?? false,
          gear: (c.gear && typeof c.gear === 'object' && !Array.isArray(c.gear)) ? c.gear : {},
        }));
        save();
      }
    } catch (legacyE) {
      console.warn('Legion Lab: could not migrate from lvl', legacyE);
    }
  }
  if (chars.length === 0) {
    try {
      const prefix = '_l_list_loc__';
      const collected = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(prefix)) continue;
        const worldFromKey = key.slice(prefix.length).replace(/_/g, ' ');
        const worldTitle = worldFromKey.charAt(0).toUpperCase() + worldFromKey.slice(1).toLowerCase();
        let list;
        try {
          list = JSON.parse(localStorage.getItem(key) || '[]');
        } catch (_) { continue; }
        if (!Array.isArray(list)) continue;
        list.forEach(c => {
          if (c == null || typeof c !== 'object') return;
          try {
            collected.push({
              id: c.id || Date.now().toString(36) + Math.random().toString(36).slice(2),
              name: c.name ?? '',
              level: c.level ?? null,
              cls: c.cls ?? c.chr ?? null,
              world: c.world ?? worldTitle,
              imageUrl: c.imageUrl ?? c.imageUri ?? null,
              collapsed: false,
              gear: (c.gear && typeof c.gear === 'object' && !Array.isArray(c.gear)) ? c.gear : {},
            });
          } catch (_) { /* skip bad entry */ }
        });
      }
      if (collected.length > 0) {
        chars = collected;
        save();
      }
    } catch (lListE) {
      console.warn('Legion Lab: could not migrate from _l_list_loc__*', lListE);
    }
  }
  if (chars.length === 0) {
    try {
      const altKey = '_char_data/characters/legion-lab/index.html_V4';
      const altRaw = localStorage.getItem(altKey);
      const alt = altRaw ? JSON.parse(altRaw) : null;
      if (Array.isArray(alt) && alt.length > 0) {
        chars = alt.map(c => {
          if (c == null || typeof c !== 'object') return null;
          return {
            id: c.id || Date.now().toString(36) + Math.random().toString(36).slice(2),
            name: c.name ?? '',
            level: c.level ?? null,
            cls: c.cls ?? c.chr ?? null,
            world: c.world ?? null,
            imageUrl: c.imageUrl ?? c.imageUri ?? null,
            collapsed: c.collapsed ?? false,
            gear: (c.gear && typeof c.gear === 'object' && !Array.isArray(c.gear)) ? c.gear : {},
          };
        }).filter(Boolean);
        if (chars.length > 0) save();
      }
    } catch (altE) {
      console.warn('Legion Lab: could not migrate from _char_data key', altE);
    }
  }

  // 3) Normalize: ensure each char has gear object and all slots (safe if SLOTS missing)
  const slots = typeof SLOTS !== 'undefined' && Array.isArray(SLOTS) ? SLOTS : [];
  chars = chars.filter(c => c != null && typeof c === 'object');
  chars.forEach(c => {
    if (!c.gear || typeof c.gear !== 'object' || Array.isArray(c.gear)) c.gear = {};
    slots.forEach(s => {
      const g = c.gear[s];
      if (!g) {
        c.gear[s] = { item: 'None', stars: 0 };
      } else if (g.set !== undefined && g.item === undefined) {
        const match = (typeof SLOT_ITEMS !== 'undefined' && SLOT_ITEMS[s]) ? (SLOT_ITEMS[s] || []).find(it => it && it.tier === g.set) : null;
        c.gear[s] = { item: match ? match.label : 'None', stars: g.stars ?? 0 };
      }
    });
  });
}

/* ────────────────────────────────────────────────────────────────
   CHARACTER LOOKUP  (Nexon Rankings via local server)
   ─────────────────────────────────────────────────────────────
   Returns { name, level, cls, world, imageUrl } or null.
   Uses same-origin /api/nexon-lookup (server fetches Nexon Rankings
   and parses level, class, world, image). Run node server.js and open
   http://localhost:3000 for Search to work.
──────────────────────────────────────────────────────────────── */
const LOOKUP_PROXY_KEY = 'll_lookup_proxy';
const DEFAULT_LOOKUP_PROXY = 'https://api.allorigins.win/raw';

function getLookupProxyUrl() {
  try {
    const u = typeof localStorage !== 'undefined' ? localStorage.getItem(LOOKUP_PROXY_KEY) : null;
    return (u && typeof u === 'string' && u.trim()) ? u.trim() : null;
  } catch (e) { return null; }
}

function getEffectiveLookupProxyUrl(hasSameOriginApi) {
  const user = getLookupProxyUrl();
  if (user) return user;
  if (!hasSameOriginApi) return DEFAULT_LOOKUP_PROXY;
  return null;
}

function worldToNexonRegion(world) {
  const w = (world || '').trim().toLowerCase();
  if (w === 'luna' || w === 'solis') return 'europe';
  return 'north-america';
}

/* Client-side parse of Nexon ranking API JSON (used when fetching via CORS proxy without server). */
const NEXON_RANKING_API_BASE = 'https://www.nexon.com/api/maplestory/no-auth/ranking/v2';
const NEXON_WORLD_ID_TO_NAME = { 1: 'Bera', 19: 'Scania', 45: 'Kronos', 70: 'Hyperion' };

function isLikelyPromoImage(url) {
  if (!url || typeof url !== 'string') return true;
  const u = url.toLowerCase();
  if (/\d{3,4}x\d{3,4}/.test(u)) return true;
  if (/one-punch|onepunch|promo|banner|update\.jpg|event|collab|v267|1200x630/.test(u)) return true;
  return false;
}

function parseNexonRankingApiResponse(bodyStr, searchName) {
  try {
    const data = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr;
    if (!data || !Array.isArray(data.ranks) || data.ranks.length === 0) return null;
    const lowerName = (searchName || '').trim().toLowerCase();
    const char = data.ranks.find(c => (c.characterName || '').toLowerCase() === lowerName)
      || data.ranks.find(c => (c.characterName || '').toLowerCase().includes(lowerName))
      || data.ranks[0];
    const img = char.characterImgURL || char.characterImage || char.image;
    const worldName = (char.worldID != null && NEXON_WORLD_ID_TO_NAME[char.worldID]) ? NEXON_WORLD_ID_TO_NAME[char.worldID] : null;
    return {
      name: char.characterName || searchName || '',
      level: char.level != null ? Number(char.level) : null,
      cls: char.jobName || char.job || char.characterClass || null,
      world: worldName,
      imageUrl: img && !isLikelyPromoImage(img) ? String(img).trim() : null,
    };
  } catch (_) {
    return null;
  }
}

async function lookupViaProxy(trimmed, nexonRegion, proxyUrl, debugOut) {
  const apiRegion = nexonRegion === 'europe' ? 'eu' : 'na';
  const nexonApiUrl = NEXON_RANKING_API_BASE + '/' + apiRegion + '?type=overall&id=legendary&reboot_index=0&page_index=1&character_name=' + encodeURIComponent(trimmed);
  const proxyFetchUrl = proxyUrl.replace(/\?.*$/, '') + (proxyUrl.indexOf('?') >= 0 ? '&' : '?') + 'url=' + encodeURIComponent(nexonApiUrl);
  const res = await fetch(proxyFetchUrl, { method: 'GET' });
  if (debugOut) {
    debugOut.viaProxy = true;
    debugOut.status = res.status;
    debugOut.statusText = res.statusText || '';
  }
  const rawText = await res.text();
  if (debugOut && rawText) {
    debugOut.responsePreview = rawText.length > 800 ? rawText.slice(0, 800) + '\n… (truncated)' : rawText;
  }
  if (!res.ok) return null;
  let bodyStr = rawText;
  try {
    const data = JSON.parse(rawText);
    if (data && typeof data === 'object' && data.contents != null) {
      bodyStr = typeof data.contents === 'string' ? data.contents : JSON.stringify(data.contents);
    } else if (data && Array.isArray(data.ranks)) {
      return parseNexonRankingApiResponse(data, trimmed);
    }
  } catch (_) {}
  return parseNexonRankingApiResponse(bodyStr, trimmed);
}

async function lookupCharacter(name, regionOrWorld = 'gms', options = {}) {
  const debug = options && options.debug === true;
  const debugOut = debug ? { url: '', targetUrl: '', viaProxy: false, status: null, statusText: '', responsePreview: '', error: null } : null;

  if (!name || typeof name !== 'string') {
    if (debugOut) { debugOut.error = 'Missing or invalid name'; return { result: null, debug: debugOut }; }
    return null;
  }
  const trimmed = name.trim();
  if (!trimmed) {
    if (debugOut) { debugOut.error = 'Name is empty after trim'; return { result: null, debug: debugOut }; }
    return null;
  }

  const nexonRegion = worldToNexonRegion(regionOrWorld);
  let origin = '';
  try { origin = (typeof location !== 'undefined' && location.origin) ? location.origin : ''; } catch (_) {}
  const hasSameOriginApi = origin && origin !== 'null' && origin.toLowerCase().slice(0, 7) !== 'file://';
  const proxyUrl = typeof getEffectiveLookupProxyUrl === 'function' ? getEffectiveLookupProxyUrl(hasSameOriginApi) : (getLookupProxyUrl && getLookupProxyUrl());
  const hasProxy = !!(proxyUrl && proxyUrl.trim());

  if (debugOut) {
    debugOut.pageOrigin = origin || '—';
    debugOut.targetUrl = hasSameOriginApi ? (origin + '/api/nexon-lookup?name=…') : '—';
    debugOut.url = hasSameOriginApi ? (origin + '/api/nexon-lookup?name=' + encodeURIComponent(trimmed) + '&region=' + encodeURIComponent(nexonRegion)) : '—';
  }

  if (!hasSameOriginApi && hasProxy) {
    if (debugOut) debugOut.viaProxy = true;
    try {
      const proxyResult = await lookupViaProxy(trimmed, nexonRegion, proxyUrl.trim(), debugOut || {});
      if (proxyResult && (proxyResult.level != null || proxyResult.cls || proxyResult.imageUrl)) {
        if (debug) return { result: proxyResult, debug: debugOut };
        return proxyResult;
      }
    } catch (proxyErr) {
      if (debugOut) debugOut.error = (proxyErr && proxyErr.message) ? proxyErr.message : String(proxyErr);
    }
    return debug ? { result: null, debug: debugOut } : null;
  }

  const base = origin || 'http://localhost:3000';
  let targetUrl = base + '/api/nexon-lookup?name=' + encodeURIComponent(trimmed) + '&region=' + encodeURIComponent(nexonRegion);
  if (debug) targetUrl += '&debug=1';
  if (debugOut) {
    debugOut.targetUrl = targetUrl;
    debugOut.url = targetUrl;
  }

  try {
    const res = await fetch(targetUrl, { method: 'GET' });
    if (debugOut) {
      debugOut.status = res.status;
      debugOut.statusText = res.statusText || '';
    }
    const text = await res.text();
    if (debugOut && text) {
      debugOut.responsePreview = text.length > 800 ? text.slice(0, 800) + '\n… (truncated)' : text;
    }
    if (res.ok) {
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (parseErr) {
        if (debugOut) debugOut.error = 'Invalid JSON: ' + (parseErr && parseErr.message ? parseErr.message : String(parseErr));
        return debug ? { result: null, debug: debugOut } : null;
      }
      if (data && typeof data === 'object' && data.no_result_slipped !== 'Not found' && data.error !== 'Not found') {
        const num = (v) => (v != null && v !== '' && String(v).toLowerCase() !== 'null' ? Number(v) : null);
        const str = (v) => (v != null && v !== '' && String(v).toLowerCase() !== 'null' ? String(v).trim() || null : null);
        const result = {
          name: str(data.name ?? data.hand) || trimmed,
          level: num(data.level),
          cls: str(data.cls ?? data.class ?? data.job),
          world: str(data.world),
          imageUrl: str(data.imageUrl),
        };
        if (debug) return { result, debug: debugOut };
        return result;
      }
    }
    if (res.status >= 500 && res.status < 600) {
      return debug ? { result: null, debug: debugOut } : null;
    }

    const proxyUrlFallback = typeof getEffectiveLookupProxyUrl === 'function' ? getEffectiveLookupProxyUrl(hasSameOriginApi) : (getLookupProxyUrl && getLookupProxyUrl());
    if (proxyUrlFallback && proxyUrlFallback.trim()) {
      const proxyResult = await lookupViaProxy(trimmed, nexonRegion, proxyUrlFallback.trim(), debugOut || {});
      if (proxyResult && (proxyResult.level != null || proxyResult.cls || proxyResult.imageUrl)) {
        if (debug) return { result: proxyResult, debug: debugOut };
        return proxyResult;
      }
    }

    if (debugOut) debugOut.error = debugOut.error || ('HTTP ' + res.status + (res.statusText ? ' ' + res.statusText : ''));
    return debug ? { result: null, debug: debugOut } : null;
  } catch (e) {
    const proxyUrlCatch = typeof getEffectiveLookupProxyUrl === 'function' ? getEffectiveLookupProxyUrl(hasSameOriginApi) : (getLookupProxyUrl && getLookupProxyUrl());
    if (proxyUrlCatch && proxyUrlCatch.trim()) {
      try {
        const proxyResult = await lookupViaProxy(trimmed, nexonRegion, proxyUrlCatch.trim(), debugOut || {});
        if (proxyResult && (proxyResult.level != null || proxyResult.cls || proxyResult.imageUrl)) {
          if (debug) return { result: proxyResult, debug: debugOut };
          return proxyResult;
        }
      } catch (proxyErr) {
        if (debugOut) debugOut.error = (proxyErr && proxyErr.message) ? proxyErr.message : String(proxyErr);
      }
    } else if (debugOut) {
      debugOut.error = (e && e.message) ? e.message : String(e);
    }
    console.warn('Legion Lab: character lookup failed', e);
    return debug ? { result: null, debug: debugOut } : null;
  }
}

/* ────────────────────────────────────────────────────────────────
   CUSTOM PRESETS (Equipment + Accessories)
   Stored in localStorage; merged with built-in when applying.
──────────────────────────────────────────────────────────────── */
const CUSTOM_GEAR_PRESETS_KEY = 'll_custom_gear_presets';
const CUSTOM_ACCESSORY_PRESETS_KEY = 'll_custom_accessory_presets';

function getCustomGearPresets() {
  try {
    const raw = localStorage.getItem(CUSTOM_GEAR_PRESETS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.warn('Legion Lab: could not load custom gear presets', e);
    return [];
  }
}

function saveCustomGearPresets(arr) {
  try {
    localStorage.setItem(CUSTOM_GEAR_PRESETS_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn('Legion Lab: could not save custom gear presets', e);
  }
}

function getCustomAccessoryPresets() {
  try {
    const raw = localStorage.getItem(CUSTOM_ACCESSORY_PRESETS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.warn('Legion Lab: could not load custom accessory presets', e);
    return [];
  }
}

function saveCustomAccessoryPresets(arr) {
  try {
    localStorage.setItem(CUSTOM_ACCESSORY_PRESETS_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn('Legion Lab: could not save custom accessory presets', e);
  }
}

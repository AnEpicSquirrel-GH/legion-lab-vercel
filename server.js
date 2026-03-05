/**
 * Minimal local server: serves static files, same-origin proxy, and
 * Nexon Rankings-based character lookup (no MapleStory.gg).
 *
 * Run: node server.js
 * Open http://localhost:3000 — Search uses Nexon Rankings via /api/nexon-lookup
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname);

const NEXON_RANKINGS_BASE = 'https://www.nexon.com/maplestory/rankings';
const NEXON_RANKING_API_BASE = 'https://www.nexon.com/api/maplestory/no-auth/ranking/v2';

// Nexon ranking API returns worldID; map to world name (from user confirmation / rankings page).
const NEXON_WORLD_ID_TO_NAME = {
  1: 'Bera',
  19: 'Scania',
  45: 'Kronos',
  70: 'Hyperion',
  // Add more as needed
};

function rankingPageHeaders(rankingsUrl) {
  return {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': NEXON_RANKINGS_BASE + '/',
  };
}

function isLikelyPromoImage(url) {
  if (!url || typeof url !== 'string') return true;
  const u = url.toLowerCase();
  if (/\d{3,4}x\d{3,4}/.test(u)) return true;
  if (/one-punch|onepunch|promo|banner|update\.jpg|event|collab|v267|1200x630/.test(u)) return true;
  return false;
}

function findCharacterList(obj, depth) {
  if (depth > 15 || !obj) return null;
  if (Array.isArray(obj)) {
    const first = obj[0];
    const hasCharFields = obj.length > 0 && typeof first === 'object' && first !== null
      && (first.characterName !== undefined || first.name !== undefined || first.CharacterName !== undefined
          || first.character_name !== undefined || first.characterLevel !== undefined || first.level !== undefined);
    if (hasCharFields) return obj;
    for (let i = 0; i < Math.min(obj.length, 5); i++) {
      const found = findCharacterList(obj[i], depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    for (const k of ['rankings', 'initialRankings', 'characters', 'list', 'rankingList', 'data', 'results']) {
      if (obj[k] !== undefined) {
        const v = obj[k];
        if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') return v;
      }
    }
    for (const k of keys) {
      const found = findCharacterList(obj[k], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function parseNexonRankingsHtml(html, searchName) {
  const name = (searchName || '').trim();
  const lowerName = name.toLowerCase();
  let out = { name: name || null, level: null, cls: null, world: null, imageUrl: null };

  const applyChar = (char) => {
    out.name = char.characterName ?? char.name ?? char.CharacterName ?? char.character_name ?? out.name;
    out.level = char.characterLevel ?? char.level ?? char.Level ?? char.CharacterLevel ?? char.character_level ?? null;
    out.cls = char.characterClass ?? char.job ?? char.Class ?? char.Job ?? char.character_class ?? char.class ?? null;
    out.world = char.worldName ?? char.world ?? char.World ?? char.Server ?? char.world_name ?? null;
    const rawImg = char.characterImage ?? char.image ?? char.portrait ?? char.CharacterImage ?? char.characterImageUrl ?? char.character_image ?? null;
    out.imageUrl = rawImg && !isLikelyPromoImage(rawImg) ? rawImg : null;
  };

  const tryParseJson = (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') return null;
      const list = findCharacterList(data, 0);
      if (!Array.isArray(list) || list.length === 0) return null;
      const nameKey = (c) => (c.characterName || c.name || c.CharacterName || c.character_name || '').toString().toLowerCase();
      const char = list.find(c => nameKey(c) === lowerName)
        || list.find(c => nameKey(c).includes(lowerName) || lowerName.includes(nameKey(c)))
        || list[0];
      applyChar(char);
      return true;
    } catch (_) { return null; }
  };

  const tryJson = (pattern) => {
    const m = html.match(pattern);
    if (!m) return null;
    return tryParseJson(m[1]) ? out : null;
  };

  if (tryJson(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i)) return out;
  if (tryJson(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i)) return out;
  if (tryJson(/window\.__PRELOADED_STATE__\s*=\s*([\s\S]*?);\s*<\/script>/i)) return out;

  const scriptTags = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const tag of scriptTags) {
    const m = tag.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if (!m || !m[1]) continue;
    const raw = m[1].trim();
    if ((raw.startsWith('{') || raw.startsWith('[')) && (raw.includes('rankings') || raw.includes('character') || raw.includes(lowerName))) {
      if (tryParseJson(raw)) return out;
    }
  }

  const imgMatch = html.match(/<img[^>]+src="([^"]*character[^"]*\.(?:png|jpg|jpeg|webp))"[^>]*>/i)
    || html.match(/"(https:\/\/[^"]*nexon[^"]*\.(?:png|jpg|jpeg|webp))"/i);
  if (imgMatch) {
    const candidate = imgMatch[1].replace(/&amp;/g, '&');
    if (!isLikelyPromoImage(candidate)) out.imageUrl = candidate;
  }

  const levelMatch = html.match(/\bLevel\s*[:\s]*(\d{1,3})\b/i) || html.match(/"level"\s*:\s*(\d+)/i);
  if (levelMatch) out.level = parseInt(levelMatch[1], 10);

  const jobMatch = html.match(/"job"\s*:\s*"([^"]+)"/i) || html.match(/"characterClass"\s*:\s*"([^"]+)"/i)
    || html.match(/\b(?:Explorer|Cygnus|Hero|Legend|Resistance|Nova|Zero|Kinesis|Beast Tamer|Hayato|Kanna|Demon|Ark|Adele|Illium)[^"]*"/i);
  if (jobMatch) out.cls = jobMatch[1] || (jobMatch[0] && jobMatch[0].replace(/^["']|["']$/g, ''));

  const worldMatch = html.match(/"worldName"\s*:\s*"([^"]+)"/i) || html.match(/"world"\s*:\s*"([^"]+)"/i);
  if (worldMatch) out.world = worldMatch[1];

  return out;
}

function parseNexonRankingApiResponse(body, searchName) {
  try {
    const data = typeof body === 'string' ? JSON.parse(body) : body;
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
      _worldID: char.worldID,
    };
  } catch (_) {
    return null;
  }
}

const NEXON_LOOKUP_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const nexonLookupCache = new Map(); // key: region:nameLower, value: { result, ts }

function nexonLookup(name, region, wantDebug, cb) {
  if (typeof wantDebug === 'function') {
    cb = wantDebug;
    wantDebug = false;
  }
  if (!name || !name.trim()) {
    cb(null, 400, 'Missing name');
    return;
  }
  const trimmed = name.trim();
  const r = (region || 'north-america').toLowerCase().replace(/\s/g, '');
  const cacheKey = r + ':' + trimmed.toLowerCase();
  const cached = nexonLookupCache.get(cacheKey);
  if (cached && (Date.now() - cached.ts < NEXON_LOOKUP_CACHE_TTL_MS)) {
    const result = { ...cached.result };
    if (wantDebug) result._debug = { source: 'cache', cachedAt: cached.ts };
    return cb(result, 200);
  }
  const apiRegion = r === 'europe' ? 'eu' : 'na';
  const apiUrl = `${NEXON_RANKING_API_BASE}/${apiRegion}?type=overall&id=legendary&reboot_index=0&page_index=1&character_name=${encodeURIComponent(trimmed)}`;
  const apiHeaders = {
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': NEXON_RANKINGS_BASE + '/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  function finish(result, fromApi) {
    result.name = result.name || trimmed;
    if (wantDebug) {
      result._debug = fromApi
        ? { source: 'nexon_ranking_api', url: apiUrl, worldID: result._worldID }
        : { source: 'nexon_html', htmlLength: 0, hasNextData: false, hint: 'Fell back to HTML (API may have failed).' };
    }
    delete result._worldID;
    nexonLookupCache.set(cacheKey, { result: { ...result }, ts: Date.now() });
    cb(result, 200);
  }

  const req = require('https').get(apiUrl, { headers: apiHeaders }, (res) => {
    const chunks = [];
    res.on('data', (ch) => chunks.push(ch));
    res.on('end', () => {
      let body = Buffer.concat(chunks);
      const enc = (res.headers['content-encoding'] || '').toLowerCase();
      if (enc === 'gzip') {
        try { body = zlib.gunzipSync(body); } catch (_) {}
      } else if (enc === 'br') {
        try { body = zlib.brotliDecompressSync(body); } catch (_) {}
      } else if (enc === 'deflate') {
        try { body = zlib.inflateSync(body); } catch (_) {}
      }
      const bodyStr = body.toString('utf8');
      if (res.statusCode === 200 && bodyStr) {
        const result = parseNexonRankingApiResponse(bodyStr, trimmed);
        if (result && (result.level != null || result.cls || result.imageUrl)) {
          return finish(result, true);
        }
      }
      const rankingsUrl = `${NEXON_RANKINGS_BASE}/${r === 'europe' ? 'europe' : 'north-america'}/overall/legendary?world_type=both&search_type=character-name&search=${encodeURIComponent(trimmed)}`;
      const headers = rankingPageHeaders(rankingsUrl);
      require('https').get(rankingsUrl, { headers }, (res2) => {
        const chunks2 = [];
        res2.on('data', (ch) => chunks2.push(ch));
        res2.on('end', () => {
          let body2 = Buffer.concat(chunks2);
          const enc2 = (res2.headers['content-encoding'] || '').toLowerCase();
          if (enc2 === 'gzip') try { body2 = zlib.gunzipSync(body2); } catch (_) {}
          else if (enc2 === 'br') try { body2 = zlib.brotliDecompressSync(body2); } catch (_) {}
          const bodyStr2 = body2.toString('utf8');
          if (res2.statusCode !== 200) {
            cb(null, res2.statusCode, bodyStr2.slice(0, 200));
            return;
          }
          let result = parseNexonRankingsHtml(bodyStr2, trimmed);
          const contentType = (res2.headers['content-type'] || '').toLowerCase();
          if (contentType.indexOf('application/json') !== -1 && (bodyStr2.startsWith('{') || bodyStr2.startsWith('['))) {
            try {
              const data = JSON.parse(bodyStr2);
              const list = findCharacterList(data, 0);
              if (Array.isArray(list) && list.length > 0) {
                const nameKey = (c) => (c.characterName || c.name || '').toString().toLowerCase();
                const char = list.find(c => nameKey(c) === trimmed.toLowerCase()) || list[0];
                result.name = char.characterName ?? char.name ?? result.name;
                result.level = char.characterLevel ?? char.level ?? null;
                result.cls = char.characterClass ?? char.job ?? char.Job ?? null;
                result.world = char.worldName ?? char.world ?? null;
                const rawImg = char.characterImage ?? char.image ?? char.characterImgURL ?? null;
                result.imageUrl = rawImg && !isLikelyPromoImage(rawImg) ? rawImg : null;
              }
            } catch (_) {}
          }
          result.name = result.name || trimmed;
          if (wantDebug) {
            const nextMatch = bodyStr2.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
            const hasNext = !!nextMatch;
            result._debug = {
              source: 'nexon_html',
              htmlLength: bodyStr2.length,
              hasNextData: hasNext,
              nextDataSnippet: hasNext ? nextMatch[1].slice(0, 2000) + '…' : 'not found',
              htmlSnippet: hasNext ? undefined : bodyStr2.replace(/\s+/g, ' ').slice(0, 1500) + '…',
              hint: hasNext ? undefined : 'Nexon serves a shell; rankings load via JS.',
            };
          }
          cb(result, 200);
        });
      }).on('error', () => {
        const fallback = { name: trimmed, level: null, cls: null, world: null, imageUrl: null };
        if (wantDebug) fallback._debug = { source: 'fallback', error: 'API and HTML fetch failed' };
        cb(fallback, 200);
      });
    });
  });
  req.on('error', (e) => {
    cb(null, 502, e.message || 'fetch failed');
  });
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  const types = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
  };
  const contentType = types[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function proxyRequest(res, targetUrl) {
  const parsed = url.parse(targetUrl);
  if (!parsed.protocol || !parsed.host || !/^https?:$/.test(parsed.protocol)) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid url');
    return;
  }
  const lib = parsed.protocol === 'https:' ? require('https') : require('http');
  lib.get(targetUrl, { headers: { 'Accept': 'application/json' } }, (proxyRes) => {
    let body = '';
    proxyRes.on('data', (ch) => { body += ch; });
    proxyRes.on('end', () => {
      res.writeHead(proxyRes.statusCode || 200, {
        'Content-Type': proxyRes.headers['content-type'] || 'application/json',
      });
      res.end(body);
    });
  }).on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy error: ' + (e.message || 'fetch failed'));
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname === '/' ? '/index.html' : parsed.pathname;

  if (pathname === '/api/proxy') {
    const target = parsed.query && parsed.query.url;
    if (!target) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing url query');
      return;
    }
    proxyRequest(res, target);
    return;
  }

  if (pathname === '/api/nexon-lookup') {
    const q = parsed.query || {};
    const name = (q.name || '').trim();
    const region = (q.region || 'north-america').trim() || 'north-america';
    const wantDebug = q.debug === '1' || q.debug === 'true';
    if (!name) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing name' }));
      return;
    }
    nexonLookup(name, region, wantDebug, (data, status, errMsg) => {
      if (status !== 200) {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: errMsg || 'Lookup failed' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    });
    return;
  }

  let safePath = pathname.replace(/^\//, '');
  try {
    safePath = decodeURIComponent(safePath);
  } catch (_) {
    // leave as-is if invalid encoding
  }
  const filePath = path.join(ROOT, safePath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end();
    return;
  }
  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log('Legion Lab server at http://localhost:' + PORT);
  console.log('Set CORS proxy URL to: http://localhost:' + PORT + '/api/proxy');
});

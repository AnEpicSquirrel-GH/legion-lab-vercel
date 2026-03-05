'use strict';

// ── Legion block icon per gear category ──────────────────────────
const LEGION_BLOCK_ICON = {
  Warrior: 'MapleIcons/Legion_System_Warrior_Block.png',
  Mage:    'MapleIcons/Legion_System_Magician_Block.png',
  Archer:  'MapleIcons/Legion_System_Bowman_Block.png',
  Thief:   'MapleIcons/Legion_System_Thief_Block.png',
  Pirate:  'MapleIcons/Legion_System_Pirate_Block.png',
  Xenon:   'MapleIcons/Legion_System_Xenon_Block.png',
};

// Category → tile filename suffix (SS/SSS)
const LEGION_TILE_SUFFIX = {
  Warrior: 'Warrior',
  Mage:    'Mage',
  Archer:  'Bowman',
  Thief:   'Thief',
  Pirate:  'Pirate',
  Xenon:   'Xenon',
};

function getLegionRank(level, cls) {
  const lv = parseInt(level, 10);
  if (isNaN(lv)) return null;
  const isZero = cls === 'Zero';
  if (isZero) {
    if (lv >= 250) return 'SSS';
    if (lv >= 200) return 'SS';
    if (lv >= 180) return 'S';
    if (lv >= 160) return 'A';
    if (lv >= 130) return 'B';
  } else {
    if (lv >= 250) return 'SSS';
    if (lv >= 200) return 'SS';
    if (lv >= 140) return 'S';
    if (lv >= 100) return 'A';
    if (lv >= 60)  return 'B';
  }
  return null;
}

function getLegionTileIcon(cls, level) {
  const rank     = getLegionRank(level, cls);
  const category = CLASS_CATEGORY[cls] ?? null;
  if (!rank || !category) return null;
  const suffix = LEGION_TILE_SUFFIX[category];
  if (rank === 'SSS') return `MapleIcons/Legion_Tile_SSS_${suffix}.webp`;
  if (rank === 'SS')  return category === 'Xenon' ? null : `MapleIcons/Legion_Tile_SS_${suffix}.webp`;
  if (rank === 'S')   return category === 'Xenon'
    ? 'MapleIcons/Legion_Tile_S_Type2.webp'
    : 'MapleIcons/Legion_Tile_S_Type1.webp';
  if (rank === 'A')   return 'MapleIcons/Legion_Tile_A_All.png';
  if (rank === 'B')   return 'MapleIcons/Legion_Tile_B_All.png';
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS TOOLTIP DATA  (link skills + legion member effects)
// ─────────────────────────────────────────────────────────────────────────────

// Shared link-skill data objects (referenced by multiple classes)
const _L = {
  expWar:  ['Invincible Belief',    'Explorer Warrior',  ['Restore 20% Max HP/sec at ≤15% HP (CD 410s)', 'Restore 23% Max HP/sec (CD 370s)', 'Restore 26% Max HP/sec (CD 330s)']],
  expMag:  ['Empirical Knowledge',  'Explorer Mage',     ['15% chance: Dmg +1%, Ignore DEF +1%/stack (3 stacks)', '17% chance: Dmg +1%, Ignore DEF +1%/stack', '19% chance: Dmg +2%, Ignore DEF +2%/stack']],
  expBow:  ["Adventurer's Curiosity", 'Explorer Bowman', ['Critical Rate +3%', 'Critical Rate +4%', 'Critical Rate +6%']],
  expThf:  ["Thief's Cunning",      'Explorer Thief',    ['Dmg +3% for 10s after debuffing (CD 20s)', 'Dmg +6% for 10s', 'Dmg +9% for 10s']],
  expPir:  ['Pirate Blessing',      'Explorer Pirate',   ['All Stats +20, HP/MP +350, Dmg Taken -5%', 'All Stats +30, HP/MP +525, Dmg Taken -7%', 'All Stats +40, HP/MP +700, Dmg Taken -9%']],
  cygnus:  ['Cygnus Blessing',      'Cygnus Knights',    ['ATK/MATK +7, Status Resist +2, Ele Resist +1%', 'ATK/MATK +9, Status Resist +3, Ele Resist +3%', 'ATK/MATK +11, Status Resist +4, Ele Resist +4%']],
  resist:  ['Spirit of Freedom',    'Resistance',        ['Invincibility 1s after reviving', 'Invincibility 2s after reviving', 'Invincibility 3s after reviving']],
};

// LINK_SKILL[className] = [skillName, sharedLabel|null, [lv1, lv2, lv3]]
const LINK_SKILL = {
  // Explorers
  'Hero':                         _L.expWar,
  'Paladin':                      _L.expWar,
  'Dark Knight':                  _L.expWar,
  'Arch Mage (Fire, Poison)':     _L.expMag,
  'Arch Mage (Ice, Lightning)':   _L.expMag,
  'Bishop':                       _L.expMag,
  'Bowmaster':                    _L.expBow,
  'Marksman':                     _L.expBow,
  'Pathfinder':                   _L.expBow,
  'Night Lord':                   _L.expThf,
  'Shadower':                     _L.expThf,
  'Dual Blade':                   _L.expThf,
  'Buccaneer':                    _L.expPir,
  'Corsair':                      _L.expPir,
  'Cannon Master':                _L.expPir,
  // Cygnus Knights
  'Dawn Warrior':                 _L.cygnus,
  'Blaze Wizard':                 _L.cygnus,
  'Wind Archer':                  _L.cygnus,
  'Night Walker':                 _L.cygnus,
  'Thunder Breaker':              _L.cygnus,
  'Mihile':                       ["Knight's Watch",       null, ['Status Resist +100 for 10s (CD 120s)', 'Status Resist +100 for 15s', 'Status Resist +100 for 20s']],
  // Heroes
  'Aran':                         ['Combo Kill Blessing',  null, ['Combo Kill Marble EXP +400%', 'Combo Kill Marble EXP +650%', 'Combo Kill Marble EXP +900%']],
  'Evan':                         ['Rune Persistence',     null, ['Rune Duration +30%', 'Rune Duration +50%', 'Rune Duration +70%']],
  'Luminous':                     ['Light Wash',           null, ['Ignore DEF +10%', 'Ignore DEF +15%', 'Ignore DEF +20%']],
  'Mercedes':                     ['Elven Blessing',       null, ['EXP +10%', 'EXP +15%', 'EXP +20%']],
  'Phantom':                      ['Phantom Instinct',     null, ['Critical Rate +10%', 'Critical Rate +15%', 'Critical Rate +20%']],
  'Shade (Eunwol)':               ['Close Call',           null, ['Survive fatal attack 5% chance', 'Survive fatal attack 10% chance', 'Survive fatal attack 15% chance']],
  // Resistance
  'Battle Mage':                  _L.resist,
  'Wild Hunter':                  _L.resist,
  'Mechanic':                     _L.resist,
  'Blaster':                      _L.resist,
  'Xenon':                        ['Hybrid Logic',         null, ['All Stats +5%', 'All Stats +10%', 'All Stats +15%']],
  'Demon Slayer':                 ['Fury Unleashed',       null, ['Boss Damage +10%', 'Boss Damage +15%', 'Boss Damage +20%']],
  'Demon Avenger':                ['Wild Rage',            null, ['Damage +5%', 'Damage +10%', 'Damage +15%']],
  // Nova
  'Kaiser':                       ['Iron Will',            null, ['Max HP +10%', 'Max HP +15%', 'Max HP +20%']],
  'Kain':                         ['Time to Prepare',      null, ['Dmg +9% for 20s (5-stack req.)', 'Dmg +17% for 20s', 'Dmg +25% for 20s']],
  'Cadena':                       ['Unfair Advantage',     null, ['Dmg +3% vs weaker/debuffed enemies', 'Dmg +6%', 'Dmg +9%']],
  'Angelic Buster':               ['Terms and Conditions', null, ['Dmg +30% for 10s (CD 90s)', 'Dmg +45% for 10s (CD 60s)', 'Dmg +60% for 10s (CD 60s)']],
  // Transcendent
  'Zero':                         ["Rhinne's Blessing",    null, ['Dmg Taken -3%, Ignore DEF +2%', 'Dmg Taken -6%, Ignore DEF +4%', 'Dmg Taken -9%, Ignore DEF +6%']],
  // Friends World
  'Kinesis':                      ['Judgment',             null, ['Critical Damage +2%', 'Critical Damage +4%', 'Critical Damage +6%']],
  // Flora
  'Adele':                        ['Noble Fire',           null, ['Boss Dmg +2% + up to +4% (party)', 'Boss Dmg +4% + up to +8% (party)', 'Boss Dmg +6% + up to +12% (party)']],
  'Illium':                       ['Tide of Battle',       null, ['Dmg +2%/stack when moving (4 stacks, 10s)', 'Dmg +3%/stack (up to +12%)', 'Dmg +4%/stack (up to +16%)']],
  'Khali':                        ['Innate Gift',          null, ['Dmg +3%; recover 1% HP/MP/s on attack (CD 30s)', 'Dmg +5%; recover 2% HP/MP/s', 'Dmg +7%; recover 3% HP/MP/s']],
  'Ark':                          ['Solus',                null, ['In combat: Dmg +1% per stack (up to 5)', 'In combat: Dmg +1% + 2%/stack', 'In combat: Dmg +1% + 3%/stack']],
  // Anima
  'Lara':                         ["Nature's Friend",      null, ['Dmg +3%; +7% vs normals for 30s (20 kills)', 'Dmg +5%; +11% vs normals', 'Dmg +7%; +15% vs normals']],
  'Hoyoung':                      ['Bravado',              null, ['Ignore DEF +5%, Dmg +9% vs full-HP enemies', 'Ignore DEF +10%, Dmg +14%', 'Ignore DEF +15%, Dmg +19%']],
  'Ren':                          ['Grounded Body',        null, ['Dmg Taken -2%', 'Dmg Taken -4%', 'Dmg Taken -6%']],
  // Sengoku
  'Hayato':                       ['Moonlit Blade Learnings', null, ['Crit Dmg +3% (requires Crit Rate ≥100%)', 'Crit Dmg +5%', 'Crit Dmg +7%']],
  'Kanna':                        ['Elementalism',         null, ['Dmg +10% for 12s (after 40 attack uses)', 'Dmg +15% for 12s', 'Dmg +20% for 12s']],
  // Jianghu
  'Lynn':                         ['Focus Spirit',         null, ['Boss Dmg +4%, Crit Rate +4%, HP/MP +3%', 'Boss Dmg +7%, Crit Rate +7%, HP/MP +4%', 'Boss Dmg +10%, Crit Rate +10%, HP/MP +5%']],
  'Mo Xuan':                      ['Qi Cultivation',       null, ['Boss Dmg +2%; +1%/stack vs boss (6 stacks)', 'Boss Dmg +4%; +2%/stack', 'Boss Dmg +6%; +3%/stack']],
  // Shine
  'Sia Astelle':                  ['Tree of Stars',        null, ['Buff Duration +4%, Crit Dmg +1%', 'Buff Duration +7%, Crit Dmg +2%', 'Buff Duration +10%, Crit Dmg +3%']],
};

// LEGION_EFFECT[className] = [stat label, [B, A, S, SS, SSS]]
const LEGION_EFFECT = {
  'Hero':                        ['STR',                      ['+10','+20','+40','+80','+100']],
  'Paladin':                     ['STR',                      ['+10','+20','+40','+80','+100']],
  'Dark Knight':                 ['Max HP',                   ['+2%','+3%','+4%','+5%','+6%']],
  'Arch Mage (Fire, Poison)':    ['Max MP',                   ['+2%','+3%','+4%','+5%','+6%']],
  'Arch Mage (Ice, Lightning)':  ['INT',                      ['+10','+20','+40','+80','+100']],
  'Bishop':                      ['INT',                      ['+10','+20','+40','+80','+100']],
  'Bowmaster':                   ['DEX',                      ['+10','+20','+40','+80','+100']],
  'Marksman':                    ['Critical Rate',            ['+1%','+2%','+3%','+4%','+5%']],
  'Pathfinder':                  ['DEX',                      ['+10','+20','+40','+80','+100']],
  'Night Lord':                  ['Critical Rate',            ['+1%','+2%','+3%','+4%','+5%']],
  'Shadower':                    ['LUK',                      ['+10','+20','+40','+80','+100']],
  'Dual Blade':                  ['LUK',                      ['+10','+20','+40','+80','+100']],
  'Buccaneer':                   ['STR',                      ['+10','+20','+40','+80','+100']],
  'Corsair':                     ['Summon Duration',          ['+4%','+6%','+8%','+10%','+12%']],
  'Cannon Master':               ['STR',                      ['+10','+20','+40','+80','+100']],
  'Dawn Warrior':                ['Max HP',                   ['+250','+500','+1000','+2000','+2500']],
  'Blaze Wizard':                ['INT',                      ['+10','+20','+40','+80','+100']],
  'Wind Archer':                 ['DEX',                      ['+10','+20','+40','+80','+100']],
  'Night Walker':                ['LUK',                      ['+10','+20','+40','+80','+100']],
  'Thunder Breaker':             ['STR',                      ['+10','+20','+40','+80','+100']],
  'Mihile':                      ['Max HP',                   ['+250','+500','+1000','+2000','+2500']],
  'Aran':                        ['Max HP Recovery (70%)',    ['2%',  '4%',  '6%',  '8%',  '10%']],
  'Evan':                        ['Max MP Recovery (70%)',    ['2%',  '4%',  '6%',  '8%',  '10%']],
  'Luminous':                    ['INT',                      ['+10','+20','+40','+80','+100']],
  'Mercedes':                    ['Skill Cooldown',           ['-2%', '-3%', '-4%', '-5%', '-6%']],
  'Phantom':                     ['Mesos Obtained',           ['+1%','+2%','+3%','+4%','+5%']],
  'Shade (Eunwol)':              ['Critical Damage',          ['+1%','+2%','+3%','+5%','+6%']],
  'Battle Mage':                 ['INT',                      ['+10','+20','+40','+80','+100']],
  'Wild Hunter':                 ['Extra Damage (20% chance)',['4%',  '8%',  '12%', '16%', '20%']],
  'Mechanic':                    ['Buff Duration',            ['+5%','+10%','+15%','+20%','+25%']],
  'Blaster':                     ['Ignore DEF',               ['+1%','+2%','+3%','+5%','+6%']],
  'Xenon':                       ['STR · DEX · LUK',         ['+5', '+10', '+20', '+40', '+50']],
  'Demon Slayer':                ['Abnormal Status Resist',   ['+1', '+2', '+3', '+4', '+5']],
  'Demon Avenger':               ['Boss Damage',              ['+1%','+2%','+3%','+5%','+6%']],
  'Kaiser':                      ['STR',                      ['+10','+20','+40','+80','+100']],
  'Kain':                        ['DEX',                      ['+10','+20','+40','+80','+100']],
  'Cadena':                      ['LUK',                      ['+10','+20','+40','+80','+100']],
  'Angelic Buster':              ['DEX',                      ['+10','+20','+40','+80','+100']],
  'Zero':                        ['EXP Obtained',             ['+4%','+6%','+8%','+10%','+12%']],
  'Kinesis':                     ['INT',                      ['+10','+20','+40','+80','+100']],
  'Adele':                       ['STR',                      ['+10','+20','+40','+80','+100']],
  'Illium':                      ['INT',                      ['+10','+20','+40','+80','+100']],
  'Khali':                       ['LUK',                      ['+10','+20','+40','+80','+100']],
  'Ark':                         ['STR',                      ['+10','+20','+40','+80','+100']],
  'Ren':                         ['Movement Speed',           ['+2%','+4%','+6%','+8%','+10%']],
  'Lara':                        ['INT',                      ['+10','+20','+40','+80','+100']],
  'Hoyoung':                     ['LUK',                      ['+10','+20','+40','+80','+100']],
  'Hayato':                      ['Critical Damage',          ['+1%','+2%','+3%','+5%','+6%']],
  'Kanna':                       ['Boss Damage',              ['+1%','+2%','+3%','+5%','+6%']],
  'Lynn':                        ['Ignore DEF',               ['+1%','+2%','+3%','+5%','+6%']],
  'Mo Xuan':                     ['Critical Damage',          ['+1%','+2%','+3%','+5%','+6%']],
  'Sia Astelle':                 ['Abnormal Status Damage',   ['+1%','+2%','+3%','+5%','+6%']],
};

// LINK_SKILL_ICON[skillName] = path to icon file
const _LS_DIR = 'MapleIcons/Link Skills/';
const LINK_SKILL_ICON = {
  'Invincible Belief':        _LS_DIR + 'Skill_Invincible_Belief.png',
  'Empirical Knowledge':      _LS_DIR + 'Skill_Empirical_Knowledge.png',
  "Adventurer's Curiosity":   _LS_DIR + "Skill_Adventurer's_Curiosity.png",
  "Thief's Cunning":          _LS_DIR + "Skill_Thief's_Cunning.png",
  'Pirate Blessing':          _LS_DIR + 'Skill_Pirate_Blessing.png',
  'Cygnus Blessing':          _LS_DIR + 'Skill_Cygnus_Blessing.png',
  "Knight's Watch":           _LS_DIR + "Skill_Knight's_Watch.png",
  'Combo Kill Blessing':      _LS_DIR + 'Skill_Combo_Kill_Blessing.png',
  'Rune Persistence':         _LS_DIR + 'Skill_Rune_Persistence.png',
  'Light Wash':               _LS_DIR + 'Skill_Light_Wash.png',
  'Elven Blessing':           _LS_DIR + 'Skill_Elven_Blessing_(Linked).png',
  'Phantom Instinct':         _LS_DIR + 'Skill_Phantom_Instinct.png',
  'Close Call':               _LS_DIR + 'Skill_Close_Call.png',
  'Spirit of Freedom':        _LS_DIR + 'Skill_Spirit_of_Freedom.png',
  'Hybrid Logic':             _LS_DIR + 'Skill_Hybrid_Logic.png',
  'Fury Unleashed':           _LS_DIR + 'Skill_Fury_Unleashed.png',
  'Wild Rage':                _LS_DIR + 'Skill_Wild_Rage.png',
  'Iron Will':                _LS_DIR + 'Skill_Iron_Will.png',
  'Time to Prepare':          _LS_DIR + 'Skill_Time_to_Prepare.png',
  'Unfair Advantage':         _LS_DIR + 'Skill_Unfair_Advantage.png',
  'Terms and Conditions':     _LS_DIR + 'Skill_Terms_and_Conditions.png',
  "Rhinne's Blessing":        _LS_DIR + "Skill_Rhinne's_Blessing.png",
  'Judgment':                 _LS_DIR + 'Skill_Judgment_(Kinesis).png',
  'Noble Fire':               _LS_DIR + 'Skill_Noble_Fire.png',
  'Tide of Battle':           _LS_DIR + 'Skill_Tide_of_Battle.png',
  'Innate Gift':              _LS_DIR + 'Skill_Innate_Gift.png',
  'Solus':                    _LS_DIR + 'Skill_Solus.png',
  "Nature's Friend":          _LS_DIR + "Skill_Nature's_Friend.png",
  'Bravado':                  _LS_DIR + 'Skill_Bravado.png',
  'Grounded Body':            _LS_DIR + 'Skill_Grounded_Body.png',
  'Moonlit Blade Learnings':  _LS_DIR + 'Skill_Moonlit_Blade_Learnings.png',
  'Elementalism':             _LS_DIR + 'Skill_Elementalism.png',
  'Focus Spirit':             _LS_DIR + 'Skill_Spirit_Guide_Blessing.png',
  'Qi Cultivation':           _LS_DIR + 'Skill_Qi_Cultivation.png',
  'Tree of Stars':            _LS_DIR + 'Skill_Tree_of_Stars.png',
};

const _RANKS = ['B','A','S','SS','SSS'];

/** Returns 1/2/3 for GMS link skill level, or null if below 70. */
function getLinkSkillLevel(level) {
  const lv = parseInt(level, 10);
  if (isNaN(lv) || lv < 70) return null;
  if (lv >= 210) return 3;
  if (lv >= 120) return 2;
  return 1;
}

/** Builds the inner HTML for the class hover tooltip. */
function buildClassTooltipHTML(cls, level) {
  const link   = LINK_SKILL[cls];
  const legion = LEGION_EFFECT[cls];
  const rank   = getLegionRank(level, cls);
  const lv     = getLinkSkillLevel(level);

  const cat = CLASS_CATEGORY[cls] ?? '';
  let html = `<div class="ctt-title" data-cls-cat="${escHtml(cat)}">${escHtml(cls)}</div>`;

  // ── Link Skill ──
  if (link) {
    const [name, shared, levels] = link;
    const iconPath = LINK_SKILL_ICON[name];
    const iconHTML = iconPath
      ? `<img class="ctt-link-icon" src="${escHtml(iconPath)}" alt="${escHtml(name)}">`
      : '';
    const effectHTML = lv
      ? `<div class="ctt-effect">${escHtml(levels[lv - 1])}</div>`
      : `<div class="ctt-effect ctt-muted">Reach Lv. 70 to unlock</div>`;
    html += `<div class="ctt-section">
      <div class="ctt-label">Link Skill${lv ? ` · Lv.${lv}` : ''}</div>
      <div class="ctt-link-row">
        ${iconHTML}
        <div class="ctt-link-text">
          <div class="ctt-name">${escHtml(name)}${shared ? `<span class="ctt-tag">${escHtml(shared)}</span>` : ''}</div>
          ${effectHTML}
        </div>
      </div>
    </div>`;
  }

  // ── Legion Effect ──
  if (legion) {
    const [stat, vals] = legion;
    const rankIdx = _RANKS.indexOf(rank);
    const tileIconPath = getLegionTileIcon(cls, level);
    const tileIconHTML = tileIconPath
      ? `<img class="ctt-link-icon" src="${escHtml(tileIconPath)}" alt="${escHtml(rank ?? '')}">`
      : '';
    const effectText = (rank && rankIdx >= 0)
      ? `<div class="ctt-effect">${escHtml(stat)} ${escHtml(vals[rankIdx])}</div>`
      : `<div class="ctt-effect ctt-muted">${escHtml(stat)} — Reach Lv. 60 to activate</div>`;
    html += `<div class="ctt-section">
      <div class="ctt-label">Legion${rank ? ` · ${rank}` : ''}</div>
      <div class="ctt-link-row">
        ${tileIconHTML}
        <div class="ctt-link-text">${effectText}</div>
      </div>
    </div>`;
  }

  return html;
}

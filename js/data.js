'use strict';

// ── Slot groupings ───────────────────────────────────────────────
const ROW_1_SLOTS = ['Weapon', 'Secondary Weapon', 'Emblem', 'Hat', 'Top/Overall', 'Bottom', 'Shoulder', 'Cape', 'Gloves', 'Shoes', 'Android Heart', 'Badge', 'Totem'];
const ROW_2_SLOTS = ['Ring 1', 'Ring 2', 'Ring 3', 'Ring 4', 'Belt', 'Face Accessory', 'Eye Accessory', 'Earring', 'Pendant 1', 'Pendant 2', 'Pocket', 'Medal', 'Offset Totem'];
const SLOTS = [...ROW_1_SLOTS, ...ROW_2_SLOTS];

/** Gear = main equipment slots: Weapon, Hat, Top/Overall, Bottom, Shoes, Gloves, Belt, Shoulder, Cape, Secondary Weapon/Shield, Emblem, Heart. */
const GEAR_SLOTS = ['Weapon', 'Hat', 'Top/Overall', 'Bottom', 'Shoes', 'Gloves', 'Belt', 'Shoulder', 'Cape', 'Secondary Weapon', 'Emblem', 'Android Heart'];

/** Accessories = Badge, Earrings, Eye, Face, Medal, Pendant, Pocket, Ring, Shoulder, Totem (new, to be expanded). */
const ACCESSORY_SLOTS_ORDERED = ['Badge', 'Earring', 'Eye Accessory', 'Face Accessory', 'Medal', 'Pendant 1', 'Pendant 2', 'Pocket', 'Ring 1', 'Ring 2', 'Ring 3', 'Ring 4', 'Shoulder', 'Totem', 'Offset Totem'];

/** Equipment Inventory screenshot: slot order as they appear in the game UI (row by row). Row 6: Pocket, (empty cell), Badge. */
const EQUIPMENT_SCREENSHOT_SLOTS = [
  'Ring 4', 'Face Accessory', 'Hat', 'Cape',
  'Ring 3', 'Eye Accessory', 'Top/Overall', 'Gloves',
  'Ring 2', 'Earring', 'Bottom', 'Shoes',
  'Ring 1', 'Pendant 2', 'Shoulder', 'Medal',
  'Belt', 'Pendant 1', 'Weapon', 'Secondary Weapon', 'Emblem', 'Android Heart',
  'Pocket', 'Badge'
];

/** Normalized (0–1) regions for each slot in equipment screenshot: { slot, x, y, w, h }. Used to assign OCR words to slots. */
function getEquipmentScreenshotRegions() {
  const slots = EQUIPMENT_SCREENSHOT_SLOTS;
  const regions = [];
  const rowHeight = 1 / 6;
  for (let row = 0; row < 4; row++) {
    const cols = 4;
    for (let col = 0; col < cols; col++) {
      regions.push({
        slot: slots[regions.length],
        x: col / cols,
        y: row * rowHeight,
        w: 1 / cols,
        h: rowHeight
      });
    }
  }
  for (let col = 0; col < 6; col++) {
    regions.push({
      slot: slots[regions.length],
      x: col / 6,
      y: 4 * rowHeight,
      w: 1 / 6,
      h: rowHeight
    });
  }
  regions.push({ slot: 'Pocket', x: 0, y: 5 * rowHeight, w: 1 / 3, h: rowHeight });
  regions.push({ slot: 'Badge', x: 2 / 3, y: 5 * rowHeight, w: 1 / 3, h: rowHeight });
  return regions;
}

// ── Gear set / tier definitions ─────────────────────────────────
// 'name' is the display label used in the collapsed summary chips.
// Tiers in progression order:
//   Pensalir → Dawn (yellow) / Princess No (pink) → Fafnir (CRA)
//   → Absolab → Arcane → Pitched/Genesis (green) → Eternal
const SETS = {
  None:       { name: 'None',        color: null,      level: null, abbr: '—'   },
  Pensalir:   { name: 'Pensalir',    color: '#6B9EBE', level: 140,  abbr: 'PEN' },
  Dawn:       { name: 'Dawn',        color: '#F59E0B', level: 140,  abbr: 'DWN' },  // Dawn Set accessories
  PrincessNo: { name: 'Princess No', color: '#EC4899', level: 140,  abbr: 'PNO' },  // Princess No set
  Fafnir:     { name: 'CRA',         color: '#00FCCC', level: 150,  abbr: 'CRA' },  // Chaos Root Abyss
  Sweetwater: { name: 'Sweetwater',  color: '#3B9FCF', level: 160,  abbr: 'SWT' },  // Commerci Sweetwater
  Absolab:    { name: 'Absolab',     color: '#C84848', level: 160,  abbr: 'ABS' },
  Arcane:     { name: 'Arcane',      color: '#9B59B6', level: 200,  abbr: 'ARC' },
  Pitched:    { name: 'Pitched',     color: '#22C55E', level: 200,  abbr: 'PCH' },  // Pitched Boss set (incl. Genesis Weapon)
  Brilliant:  { name: 'Brilliant',   color: '#84CC16', level: 200,  abbr: 'BRL' },  // Brilliant Boss set
  Frozen:     { name: 'Frozen',      color: '#6B9EBE', level: 130,  abbr: 'FRZ' },  // Frozen set (same tier color as Pensalir)
  Eternal:    { name: 'Eternal',     color: '#FFD700', level: 250,  abbr: 'ETN' },
  Gollux:     { name: 'Gollux',      color: '#C2622D', level: 140,  abbr: 'GOL' },  // Superior Gollux only
  OzRing:     { name: 'Oz Ring',     color: '#3B82F6', level: 140,  abbr: 'OZR' },  // Oz Tower rings (level 1–6)
};

// ── Per-slot item lists ─────────────────────────────────────────
// Each entry: { label, tier }  — tier drives color only.
// Special flags:
//   ozRing: true  → use a level 1–6 dropdown instead of star input
//   hasStars: false → hide star input (default true for non-oz items)
const _RING_ITEMS = [
  { label: 'Meister Ring',                 tier: 'Pensalir'   },
  { label: 'Silver Blossom Ring',          tier: 'Pensalir'   },
  { label: 'Noble Ifia\'s Ring',           tier: 'Pensalir'   },
  { label: 'Guardian Angel Ring',          tier: 'Pensalir'   },
  { label: 'Dawn Guardian Angel Ring',                    tier: 'Dawn'       },
  { label: "Kanna's Treasure",             tier: 'PrincessNo' },
  { label: 'Superior Gollux Ring',         tier: 'Gollux'     },
  { label: 'Endless Terror',               tier: 'Pitched'    },
  { label: 'Whisper of the Source',        tier: 'Brilliant'  },
  { label: 'Ring of Restraint',            tier: 'OzRing',    ozRing: true },
  { label: 'Continuous Ring',              tier: 'OzRing',    ozRing: true },
  { label: 'Level Jump Ring',              tier: 'OzRing',    ozRing: true },
  { label: 'Risk Taker Ring',              tier: 'OzRing',    ozRing: true },
  { label: 'Critical Damage Ring',         tier: 'OzRing',    ozRing: true },
  { label: 'Totalling Ring',               tier: 'OzRing',    ozRing: true },
];
const _PENDANT_ITEMS = [
  { label: 'Chaos Horntail Necklace',      tier: 'Pensalir'   },
  { label: 'Mechanator Pendant',           tier: 'Pensalir'   },
  { label: 'Dominator Pendant',            tier: 'Pensalir'   },
  { label: 'Daybreak Pendant',             tier: 'Dawn'       },
  { label: 'Superior Gollux Pendant',      tier: 'Gollux'     },
  { label: 'Source of Suffering',          tier: 'Pitched'    },
  { label: 'Oath of Death',                tier: 'Brilliant'  },
];
const SLOT_ITEMS = {
  'Weapon': [
    { label: 'Pensalir Weapon',              tier: 'Pensalir' },
    { label: 'CRA Weapon',                   tier: 'Fafnir'   },
    { label: 'Absolab Weapon',               tier: 'Absolab'  },
    { label: 'Arcane Umbra Weapon',          tier: 'Arcane'   },
    { label: 'Genesis Weapon',               tier: 'Pitched'  },
    { label: 'Destiny Weapon',               tier: 'Eternal'  },
  ],
  'Hat': [
    { label: 'Pensalir Hat',                 tier: 'Pensalir' },
    { label: 'Frozen Hat',                   tier: 'Frozen'   },
    { label: 'CRA Hat',                      tier: 'Fafnir'   },
    { label: 'Chaos Vellum Helmet',          tier: 'Fafnir'   },  // Lucky: counts toward any set with Hat slot (if 3+ other set pieces)
    { label: 'Royal Dunwitch Hat',           tier: 'Fafnir',   cls: ['Arch Mage (Fire, Poison)', 'Arch Mage (Ice, Lightning)', 'Bishop', 'Evan', 'Luminous', 'Kanna', 'Illium', 'Lara', 'Battle Mage', 'Kinesis', 'Blaze Wizard', 'Sia Astelle', 'Lynn'] },
    { label: 'Royal Warrior Helm',           tier: 'Fafnir',   cls: ['Hero', 'Paladin', 'Dark Knight', 'Aran', 'Mihile', 'Kaiser', 'Adele', 'Zero', 'Hayato', 'Dawn Warrior', 'Blaster', 'Demon Slayer', 'Demon Avenger', 'Ren'] },
    { label: 'Royal Ranger Beret',           tier: 'Fafnir',   cls: ['Bowmaster', 'Marksman', 'Pathfinder', 'Wild Hunter', 'Wind Archer', 'Kain', 'Mercedes'] },
    { label: 'Royal Assassin Hood',          tier: 'Fafnir',   cls: ['Night Lord', 'Shadower', 'Dual Blade', 'Phantom', 'Cadena', 'Hoyoung', 'Khali', 'Night Walker', 'Xenon'] },
    { label: 'Royal Wanderer Hat',            tier: 'Fafnir',   cls: ['Buccaneer', 'Corsair', 'Cannon Master', 'Mechanic', 'Angelic Buster', 'Ark', 'Mo Xuan', 'Thunder Breaker', 'Shade (Eunwol)'] },
    { label: 'Absolab Hat',                  tier: 'Absolab'  },
    { label: 'Arcane Umbra Hat',             tier: 'Arcane'   },
    { label: 'Eternal Hat',                  tier: 'Eternal'  },
  ],
  'Top/Overall': [
    { label: 'Pensalir Overall',             tier: 'Pensalir', isOverall: true },
    { label: 'Frozen Overall',               tier: 'Frozen',   isOverall: true },
    { label: 'CRA Top',                      tier: 'Fafnir'   },
    { label: 'Eagle Eye Dunwitch Robe',      tier: 'Fafnir',   cls: ['Arch Mage (Fire, Poison)', 'Arch Mage (Ice, Lightning)', 'Bishop', 'Evan', 'Luminous', 'Kanna', 'Illium', 'Lara', 'Battle Mage', 'Kinesis', 'Blaze Wizard', 'Sia Astelle', 'Lynn'] },
    { label: 'Eagle Eye Warrior Armor',       tier: 'Fafnir',   cls: ['Hero', 'Paladin', 'Dark Knight', 'Aran', 'Mihile', 'Kaiser', 'Adele', 'Zero', 'Hayato', 'Dawn Warrior', 'Blaster', 'Demon Slayer', 'Demon Avenger', 'Ren'] },
    { label: 'Eagle Eye Ranger Cowl',        tier: 'Fafnir',   cls: ['Bowmaster', 'Marksman', 'Pathfinder', 'Wild Hunter', 'Wind Archer', 'Kain', 'Mercedes'] },
    { label: 'Eagle Eye Assassin Shirt',     tier: 'Fafnir',   cls: ['Night Lord', 'Shadower', 'Dual Blade', 'Phantom', 'Cadena', 'Hoyoung', 'Khali', 'Night Walker', 'Xenon'] },
    { label: 'Eagle Eye Wanderer Coat',       tier: 'Fafnir',   cls: ['Buccaneer', 'Corsair', 'Cannon Master', 'Mechanic', 'Angelic Buster', 'Ark', 'Mo Xuan', 'Thunder Breaker', 'Shade (Eunwol)'] },
    { label: 'Absolab Overall',              tier: 'Absolab',  isOverall: true },
    { label: 'Arcane Umbra Overall',         tier: 'Arcane',   isOverall: true },
    { label: 'Eternal Top',                  tier: 'Eternal'  },
  ],
  'Bottom': [
    { label: 'CRA Bottom',                   tier: 'Fafnir'   },
    { label: 'Trixter Dunwitch Pants',       tier: 'Fafnir',   cls: ['Arch Mage (Fire, Poison)', 'Arch Mage (Ice, Lightning)', 'Bishop', 'Evan', 'Luminous', 'Kanna', 'Illium', 'Lara', 'Battle Mage', 'Kinesis', 'Blaze Wizard', 'Sia Astelle', 'Lynn'] },
    { label: 'Trixter Warrior Pants',        tier: 'Fafnir',   cls: ['Hero', 'Paladin', 'Dark Knight', 'Aran', 'Mihile', 'Kaiser', 'Adele', 'Zero', 'Hayato', 'Dawn Warrior', 'Blaster', 'Demon Slayer', 'Demon Avenger', 'Ren'] },
    { label: 'Trixter Ranger Pants',         tier: 'Fafnir',   cls: ['Bowmaster', 'Marksman', 'Pathfinder', 'Wild Hunter', 'Wind Archer', 'Kain', 'Mercedes'] },
    { label: 'Trixter Assassin Pants',       tier: 'Fafnir',   cls: ['Night Lord', 'Shadower', 'Dual Blade', 'Phantom', 'Cadena', 'Hoyoung', 'Khali', 'Night Walker', 'Xenon'] },
    { label: 'Trixter Wanderer Pants',       tier: 'Fafnir',   cls: ['Buccaneer', 'Corsair', 'Cannon Master', 'Mechanic', 'Angelic Buster', 'Ark', 'Mo Xuan', 'Thunder Breaker', 'Shade (Eunwol)'] },
    { label: 'Eternal Bottom',               tier: 'Eternal'  },
  ],
  'Gloves': [
    { label: 'Pensalir Gloves',              tier: 'Pensalir' },
    { label: 'Absolab Gloves',               tier: 'Absolab'  },
    { label: 'Arcane Umbra Gloves',          tier: 'Arcane'   },
    { label: 'Eternal Gloves',               tier: 'Eternal'  },
  ],
  'Shoes': [
    { label: 'Pensalir Shoes',               tier: 'Pensalir' },
    { label: 'Absolab Shoes',                tier: 'Absolab'  },
    { label: 'Arcane Umbra Shoes',           tier: 'Arcane'   },
    { label: 'Eternal Shoes',                tier: 'Eternal'  },
  ],
  'Shoulder': [
    { label: 'Royal Black Metal Shoulder',   tier: 'Pensalir' },
    { label: "Hayato's Treasure",            tier: 'PrincessNo' },
    { label: 'Absolab Shoulder',             tier: 'Absolab'  },
    { label: 'Arcane Umbra Shoulder',        tier: 'Arcane'   },
    { label: 'Eternal Shoulder',             tier: 'Eternal'  },
  ],
  'Cape': [
    { label: 'Pensalir Cape',                tier: 'Pensalir' },
    { label: 'Frozen Cape',                  tier: 'Frozen'   },
    { label: 'Absolab Cape',                 tier: 'Absolab'  },
    { label: 'Arcane Umbra Cape',            tier: 'Arcane'   },
    { label: 'Eternal Cape',                 tier: 'Eternal'  },
  ],
  'Belt': [
    { label: 'Golden Clover Belt',           tier: 'Pensalir'   },
    { label: 'Enraged Zakum Belt',           tier: 'Pensalir'   },
    { label: "Ayame's Treasure",             tier: 'PrincessNo' },
    { label: 'Superior Gollux Belt',         tier: 'Gollux'     },
    { label: 'Dreamy Belt',                  tier: 'Pitched'    },
  ],
  'Secondary Weapon': [
    // ── All classes (except Dual Blade who use Kataras) ──
    { label: 'Lv. 100 Secondary',            tier: 'Pensalir',  excl: ['Dual Blade'] },
    // ── Explorer Warriors ──
    { label: 'Deimos Warrior Shield',        tier: 'Pensalir',  cls: ['Hero', 'Paladin', 'Dawn Warrior'], hasStars: true },
    // ── Explorer + Other Mages ──
    { label: 'Deimos Sage Shield',           tier: 'Pensalir',  cls: ['Arch Mage (Fire, Poison)', 'Arch Mage (Ice, Lightning)', 'Bishop', 'Blaze Wizard', 'Evan', 'Battle Mage'], hasStars: true },
    // ── All Cygnus Knights ──
    { label: 'Ereve Brilliance',             tier: 'Pensalir',  cls: ['Dawn Warrior', 'Blaze Wizard', 'Wind Archer', 'Night Walker', 'Thunder Breaker', 'Mihile'] },
    // ── Adele (Bladebinder) ──
    { label: 'Noble Bladebinder',            tier: 'Pensalir',  cls: ['Adele'] },
    // ── Explorer Thieves ──
    { label: 'Deimos Shadow Shield',         tier: 'Pensalir',  cls: ['Shadower'], hasStars: true },
    { label: 'Frozen Secondary',             tier: 'Frozen',    excl: ['Dual Blade'] },
    { label: 'Princess No Secondary',        tier: 'PrincessNo', excl: ['Dual Blade'] },
    // ── Princess No: Demon Slayer / Demon Avenger (Demon Aegis) ──
    { label: 'Ruin Force Shield',            tier: 'PrincessNo', cls: ['Demon Slayer', 'Demon Avenger'] },
    // ── Dual Blade Kataras ──
    { label: 'Utgard Katara',                tier: 'Pensalir',  cls: ['Dual Blade'] },
    { label: 'Sweetwater Katara',            tier: 'Pensalir',  cls: ['Dual Blade'] },
    { label: 'Fafnir Rapid Edge',            tier: 'Fafnir',    cls: ['Dual Blade'] },
    { label: 'AbsoLab Katara',               tier: 'Absolab',   cls: ['Dual Blade'] },
    { label: 'Arcane Umbra Katara',          tier: 'Arcane',    cls: ['Dual Blade'] },
    { label: 'Carte Frozen',                 tier: 'Frozen',    cls: ['Phantom'] },
    { label: 'Frozen Katara',                tier: 'Frozen',    cls: ['Dual Blade'] },
    // ── Kaiser only ──
    { label: 'Frozen Dragon Essence',        tier: 'Frozen',    cls: ['Kaiser'] },
  ],
  'Emblem': [
    // ── Silver tier ─────────────────────────────────────────────
    { label: 'Silver Maple Leaf Emblem',              tier: 'Pensalir', cls: ['Hero','Paladin','Dark Knight','Arch Mage (Fire, Poison)','Arch Mage (Ice, Lightning)','Bishop','Bowmaster','Marksman','Pathfinder','Night Lord','Shadower','Dual Blade','Buccaneer','Corsair','Cannon Master'] },
    { label: 'Silver Cygnus Emblem',                  tier: 'Pensalir', cls: ['Dawn Warrior','Blaze Wizard','Wind Archer','Night Walker','Thunder Breaker','Mihile'] },
    { label: 'Silver Heroes Emblem (Aran)',            tier: 'Pensalir', cls: ['Aran'] },
    { label: 'Silver Heroes Emblem (Evan)',            tier: 'Pensalir', cls: ['Evan'] },
    { label: 'Silver Heroes Emblem (Mercedes)',        tier: 'Pensalir', cls: ['Mercedes'] },
    { label: 'Silver Heroes Emblem (Phantom)',         tier: 'Pensalir', cls: ['Phantom'] },
    { label: 'Silver Heroes Emblem (Luminous)',        tier: 'Pensalir', cls: ['Luminous'] },
    { label: 'Silver Heroes Emblem (Shade)',           tier: 'Pensalir', cls: ['Shade (Eunwol)'] },
    { label: 'Silver Demon Emblem',                   tier: 'Pensalir', cls: ['Demon Slayer','Demon Avenger'] },
    { label: 'Silver Resistance Emblem',              tier: 'Pensalir', cls: ['Battle Mage','Wild Hunter','Mechanic','Blaster'] },
    { label: 'Silver Kinesis Emblem',                 tier: 'Pensalir', cls: ['Kinesis'] },
    { label: 'Lesser Dragon Emblem',                  tier: 'Pensalir', cls: ['Kaiser'] },
    { label: 'Lesser Angel Emblem',                   tier: 'Pensalir', cls: ['Angelic Buster'] },
    { label: 'Silver Agent Emblem',                   tier: 'Pensalir', cls: ['Cadena'] },
    { label: 'Silver Hitman Emblem',                  tier: 'Pensalir', cls: ['Kain'] },
    { label: "Silver Knight's Emblem",                tier: 'Pensalir', cls: ['Adele'] },
    { label: 'Silver Crystal Emblem',                 tier: 'Pensalir', cls: ['Illium'] },
    { label: 'Silver Chaser Emblem',                  tier: 'Pensalir', cls: ['Khali'] },
    { label: 'Silver Abyssal Emblem',                 tier: 'Pensalir', cls: ['Ark'] },
    { label: 'Silver Three Paths Emblem',             tier: 'Pensalir', cls: ['Hoyoung'] },
    { label: 'Silver Earthseer Emblem',               tier: 'Pensalir', cls: ['Lara'] },
    { label: 'Silver Xuanshan School Emblem',         tier: 'Pensalir', cls: ['Mo Xuan'] },
    { label: 'Silver Crescent Emblem',                tier: 'Pensalir', cls: ['Hayato'] },
    { label: 'Silver Blossom Emblem',                 tier: 'Pensalir', cls: ['Kanna'] },
    { label: 'Silver Sword Emblem',                   tier: 'Pensalir', cls: ['Ren'] },
    { label: 'Silver Guardian Emblem',                tier: 'Pensalir', cls: ['Sia Astelle'] },
    { label: 'Silver Forest Emblem',                  tier: 'Pensalir', cls: ['Lynn'] },
    // ── Gold tier ───────────────────────────────────────────────
    { label: 'Gold Maple Leaf Emblem',                tier: 'Fafnir', cls: ['Hero','Paladin','Dark Knight','Arch Mage (Fire, Poison)','Arch Mage (Ice, Lightning)','Bishop','Bowmaster','Marksman','Pathfinder','Night Lord','Shadower','Dual Blade','Buccaneer','Corsair','Cannon Master'] },
    { label: 'Gold Cygnus Emblem',                    tier: 'Fafnir', cls: ['Dawn Warrior','Blaze Wizard','Wind Archer','Night Walker','Thunder Breaker','Mihile'] },
    { label: 'Gold Heroes Emblem (Aran)',              tier: 'Fafnir', cls: ['Aran'] },
    { label: 'Gold Heroes Emblem (Evan)',              tier: 'Fafnir', cls: ['Evan'] },
    { label: 'Gold Heroes Emblem (Mercedes)',          tier: 'Fafnir', cls: ['Mercedes'] },
    { label: 'Gold Heroes Emblem (Phantom)',           tier: 'Fafnir', cls: ['Phantom'] },
    { label: 'Gold Heroes Emblem (Luminous)',          tier: 'Fafnir', cls: ['Luminous'] },
    { label: 'Gold Heroes Emblem (Shade)',             tier: 'Fafnir', cls: ['Shade (Eunwol)'] },
    { label: 'Gold Demon Emblem',                     tier: 'Fafnir', cls: ['Demon Slayer','Demon Avenger'] },
    { label: 'Gold Resistance Emblem',                tier: 'Fafnir', cls: ['Battle Mage','Wild Hunter','Mechanic','Blaster'] },
    { label: 'Gold Kinesis Emblem',                   tier: 'Fafnir', cls: ['Kinesis'] },
    { label: 'Dragon Emblem',                         tier: 'Fafnir', cls: ['Kaiser'] },
    { label: 'Angel Emblem',                          tier: 'Fafnir', cls: ['Angelic Buster'] },
    { label: 'Gold Agent Emblem',                     tier: 'Fafnir', cls: ['Cadena'] },
    { label: 'Gold Hitman Emblem',                    tier: 'Fafnir', cls: ['Kain'] },
    { label: "Gold Knight's Emblem",                  tier: 'Fafnir', cls: ['Adele'] },
    { label: 'Gold Crystal Emblem',                   tier: 'Fafnir', cls: ['Illium'] },
    { label: 'Gold Chaser Emblem',                    tier: 'Fafnir', cls: ['Khali'] },
    { label: 'Gold Abyssal Emblem',                   tier: 'Fafnir', cls: ['Ark'] },
    { label: 'Gold Three Paths Emblem',               tier: 'Fafnir', cls: ['Hoyoung'] },
    { label: 'Gold Earthseer Emblem',                 tier: 'Fafnir', cls: ['Lara'] },
    { label: 'Gold Xuanshan School Emblem',           tier: 'Fafnir', cls: ['Mo Xuan'] },
    { label: 'Gold Crescent Emblem',                  tier: 'Fafnir', cls: ['Hayato'] },
    { label: 'Gold Blossom Emblem',                   tier: 'Fafnir', cls: ['Kanna'] },
    { label: 'Eternal Time Emblem',                   tier: 'Fafnir', cls: ['Zero'] },
    { label: 'Gold Sword Emblem',                     tier: 'Fafnir', cls: ['Ren'] },
    { label: 'Gold Guardian Emblem',                  tier: 'Fafnir', cls: ['Sia Astelle'] },
    { label: 'Gold Forest Emblem',                    tier: 'Fafnir', cls: ['Lynn'] },
    // ── Top tier ────────────────────────────────────────────────
    { label: "Mitra's Rage",                          tier: 'Pitched' },
  ],
  'Badge': [
    { label: 'Crystal Ventus Badge',         tier: 'Pensalir', hasStars: false },
    { label: 'Seven Days Badge',             tier: 'Absolab',  hasStars: false },
    { label: 'Ghost Ship Exorcist Badge',    tier: 'Arcane',   hasStars: true  },
    { label: 'Sengoku High Badge',           tier: 'Arcane',   hasStars: true  },
    { label: 'Genesis Badge',                tier: 'Pitched',  hasStars: false },
  ],
  'Ring 1': _RING_ITEMS,
  'Ring 2': _RING_ITEMS,
  'Ring 3': _RING_ITEMS,
  'Ring 4': _RING_ITEMS,
  'Earring': [
    { label: 'Dea Sidus Earrings',           tier: 'Pensalir' },
    { label: "Will o' the Wisps",            tier: 'Pensalir' },
    { label: 'Estella Earrings',             tier: 'Dawn'     },
    { label: 'Superior Gollux Earrings',     tier: 'Gollux'   },
    { label: 'Commanding Force Earring',     tier: 'Pitched'  },
  ],
  'Pendant 1': _PENDANT_ITEMS,
  'Pendant 2': _PENDANT_ITEMS,
  'Face Accessory': [
    { label: 'Condensed Power Crystal',      tier: 'Pensalir' },
    { label: 'Twilight Mark',                tier: 'Dawn'     },
    { label: 'Berserked',                    tier: 'Pitched'  },
  ],
  'Eye Accessory': [
    { label: 'Aquatic Letter Eye Accessory', tier: 'Pensalir' },
    { label: 'Black Bean Mark',              tier: 'Pensalir' },
    { label: 'Papulatus Mark',               tier: 'Pensalir' },
    { label: 'Magic Eyepatch',               tier: 'Pitched'  },
  ],
  'Pocket': [
    { label: 'Stone of Eternal Life',        tier: 'Pensalir' },
    { label: 'Pink Bean Cup',                tier: 'Pensalir' },
    { label: 'Cursed Blue Spellbook',        tier: 'Pitched'  },
    { label: 'Cursed Green Spellbook',       tier: 'Pitched'  },
    { label: 'Cursed Red Spellbook',         tier: 'Pitched'  },
    { label: 'Cursed Yellow Spellbook',      tier: 'Pitched'  },
  ],
  'Android Heart': [
    { label: 'Lidium Heart',                 tier: 'Pensalir' },
    { label: 'Fairy Heart',                  tier: 'Absolab'  },
    { label: 'Wondroid Heart',               tier: 'Absolab'  },
    { label: 'Glimmering Wondroid Heart',    tier: 'Arcane'   },
    { label: 'Plasma Heart',                 tier: 'Arcane'   },
    { label: 'Black Heart',                  tier: 'Pitched'  },
    { label: 'Total Control',                tier: 'Pitched'  },
  ],
  'Medal': [
    { label: 'Generic Medal',                tier: 'Pensalir', hasStars: false },
    { label: 'Hyper Burning',                tier: 'Pensalir', hasStars: false },
    { label: 'Victoria Cup (20)',            tier: 'Pensalir', hasStars: false },
    { label: 'One Who Has Godly Control',    tier: 'Pensalir', hasStars: false },
    { label: "Pollo's Friend",               tier: 'Pensalir', hasStars: false },
    { label: "Fritto's Friend",              tier: 'Pensalir', hasStars: false },
    { label: 'Seven Day Monster Parker',     tier: 'Pensalir', hasStars: false, dividerAbove: true },
    { label: 'Chaos Von Bon Crusher',        tier: 'Fafnir',   hasStars: false },
    { label: 'Chaos Vellum Crusher',         tier: 'Fafnir',   hasStars: false },
    { label: 'Antellion Guardian',           tier: 'Arcane',   hasStars: false },
    { label: 'Immortal Legacy',              tier: 'Brilliant', hasStars: false },
  ],
  'Totem': [
    { label: 'Dark Doom Totems',       tier: 'Pensalir', hasStars: false },
    { label: 'Afterlands Souviner',    tier: 'Pensalir', hasStars: false },
    { label: 'Guild Castle Brooch',    tier: 'Pensalir', hasStars: false },
    { label: 'Antique Totems',         tier: 'Pensalir', hasStars: false },
  ],
  'Offset Totem': [
    { label: 'Dark Doom Totem',        tier: 'Pensalir', hasStars: false },
    { label: 'Nine-Tailed Fox',         tier: 'Pensalir', hasStars: false },
    { label: 'Ancient Slate Replica',  tier: 'Pensalir', hasStars: false },
    { label: 'Chains of Resentment',   tier: 'Pensalir', hasStars: false },
    { label: 'Frenzy Totem',           tier: 'Pensalir', hasStars: false },
  ],
};

// Auto-built lookup: item label → tier key (used for color coding and icon paths)
const ITEM_TIER = { None: 'None' };
Object.values(SLOT_ITEMS).forEach(items =>
  items.forEach(it => { ITEM_TIER[it.label] = it.tier; })
);

// Item label → item meta (for flag lookups without scanning arrays)
const ITEM_META = {};
Object.values(SLOT_ITEMS).forEach(items =>
  items.forEach(it => { ITEM_META[it.label] = it; })
);

// ── Max Star Force (wiki: https://maplestorywiki.net/w/Star_Force_Enhancement) ─
// By equipment required level: 0–94 → 5★, 95–107 → 8★, 108–117 → 10★, 118–127 → 15★, 128–137 → 20★, 138+ → 30★
function maxStarsByEquipLevel(level) {
  if (level == null || level >= 138) return 30;
  if (level >= 128) return 20;
  if (level >= 118) return 15;
  if (level >= 108) return 10;
  if (level >= 95) return 8;
  return 5;
}
// Exceptions from wiki (per-item pages: Max Star Force Enhancements; not tier-based)
const ITEM_MAX_STARS_OVERRIDES = {
  // Android Hearts (per Android_Heart / item pages)
  'Glimmering Wondroid Heart': 15,
  'Lidium Heart': 5,
  'Wondroid Heart': 5,
  'Fairy Heart': 8,
  'Black Heart': 15,
  'Plasma Heart': 20,
  // Badges
  'Ghost Ship Exorcist Badge': 22,
  'Sengoku High Badge': 22,
  // Sweetwater (Lv 160 but capped 15 on wiki)
  'Sweetwater Shoes': 15,
  'Sweetwater Gloves': 15,
  'Sweetwater Cape': 15,
  // Rings (per-item wiki: required level / max stars)
  'Silver Blossom Ring': 10,          // Lv 110
  'Noble Ifia\'s Ring': 15,           // Lv 120
  // Face / Eye / Belt / Pendant / Earring / Shoulder / Pocket (per-item when not 30)
  'Condensed Power Crystal': 10,     // Lv 110
  'Royal Black Metal Shoulder': 15,   // Lv 120
  'Black Bean Mark': 20,              // Lv 135
  'Aquatic Letter Eye Accessory': 8,  // Lv 100
  'Mechanator Pendant': 15,            // Lv 120
  // Pocket (no star force on wiki)
  'Stone of Eternal Life': 0,
  // Fixed (not editable) — Genesis/Destiny use tier check in getFixedStars
  'Genesis Weapon': 22,
  'Destiny Weapon': 22,
};
const FIXED_STARS_ITEMS = {}; // optional: other slot→item→stars overrides
/** Weapons with fixed 22★ (Genesis = Pitched, Destiny = Eternal). */
function getFixedStars(slot, itemLabel) {
  if (!itemLabel || itemLabel === 'None') return null;
  if (slot === 'Weapon' && typeof ITEM_TIER !== 'undefined') {
    const tier = ITEM_TIER[itemLabel];
    if (tier === 'Pitched' || tier === 'Eternal') return 22;
  }
  const slotMap = FIXED_STARS_ITEMS[slot];
  return slotMap && Object.prototype.hasOwnProperty.call(slotMap, itemLabel) ? slotMap[itemLabel] : null;
}
// Fallback when item has no tier (e.g. unknown/imported). Ensures every slot gets a safe cap.
const DEFAULT_MAX_STARS_BY_SLOT = {
  'Android Heart': 15,
  'Badge': 22,
  'Weapon': 30,
  'Secondary Weapon': 25,
  'Hat': 30, 'Top/Overall': 30, 'Bottom': 30, 'Shoulder': 30, 'Cape': 30, 'Gloves': 30, 'Shoes': 30,
  'Ring 1': 30, 'Ring 2': 30, 'Ring 3': 30, 'Ring 4': 30,
  'Belt': 30, 'Face Accessory': 30, 'Eye Accessory': 30, 'Earring': 30, 'Pendant 1': 30, 'Pendant 2': 30, 'Pocket': 30,
};
function getMaxStars(slot, itemLabel) {
  if (!itemLabel || itemLabel === 'None') return 0;
  if (Object.prototype.hasOwnProperty.call(ITEM_MAX_STARS_OVERRIDES, itemLabel))
    return ITEM_MAX_STARS_OVERRIDES[itemLabel];
  const tier = typeof ITEM_TIER !== 'undefined' ? ITEM_TIER[itemLabel] : null;
  if (slot === 'Weapon' && (tier === 'Pitched' || tier === 'Eternal')) return 22;
  const level = tier && typeof SETS !== 'undefined' && SETS[tier] ? SETS[tier].level : null;
  if (level != null) return maxStarsByEquipLevel(level);
  return DEFAULT_MAX_STARS_BY_SLOT[slot] != null ? DEFAULT_MAX_STARS_BY_SLOT[slot] : 30;
}

// ── Gear Presets ─────────────────────────────────────────────────────────────
const GEAR_PRESETS = [
  {
    name: 'Pensalir Set',
    gear: {
      'Hat':               'Pensalir Hat',
      'Top/Overall':       'Pensalir Overall',
      'Shoes':             'Pensalir Shoes',
      'Gloves':            'Pensalir Gloves',
      'Shoulder':          'Royal Black Metal Shoulder',
      'Cape':              'Pensalir Cape',
      'Weapon':            'Pensalir Weapon',
      'Secondary Weapon':  'Lv. 100 Secondary',
      'Emblem':            '__GOLD_EMBLEM__',
    },
  },
  {
    name: 'CRA / Abso Set',
    gear: {
      'Hat':               'CRA Hat',
      'Top/Overall':       'CRA Top',
      'Bottom':            'CRA Bottom',
      'Shoes':             'Absolab Shoes',
      'Gloves':            'Absolab Gloves',
      'Shoulder':          'Absolab Shoulder',
      'Cape':              'Absolab Cape',
      'Weapon':            'Absolab Weapon',
      'Secondary Weapon':  'Lv. 100 Secondary',
      'Emblem':            '__GOLD_EMBLEM__',
    },
  },
  {
    name: 'CRA / Arcane Set',
    gear: {
      'Hat':               'CRA Hat',
      'Top/Overall':       'CRA Top',
      'Bottom':            'CRA Bottom',
      'Shoes':             'Arcane Umbra Shoes',
      'Gloves':            'Arcane Umbra Gloves',
      'Shoulder':          'Arcane Umbra Shoulder',
      'Cape':              'Arcane Umbra Cape',
      'Weapon':            'Arcane Umbra Weapon',
      'Secondary Weapon':  'Lv. 100 Secondary',
      'Emblem':            '__GOLD_EMBLEM__',
    },
  },
  {
    name: '3 Eternal / Arcane Set',
    gear: {
      'Hat':               'Eternal Hat',
      'Top/Overall':       'Eternal Top',
      'Bottom':            'Eternal Bottom',
      'Shoes':             'Arcane Umbra Shoes',
      'Gloves':            'Arcane Umbra Gloves',
      'Shoulder':          'Arcane Umbra Shoulder',
      'Cape':              'Arcane Umbra Cape',
      'Weapon':             'Genesis Weapon',
      'Secondary Weapon':  'Lv. 100 Secondary',
      'Emblem':            '__GOLD_EMBLEM__',
    },
  },
  {
    name: 'Full Eternal Set',
    gear: {
      'Hat':               'Eternal Hat',
      'Top/Overall':       'Eternal Top',
      'Bottom':            'Eternal Bottom',
      'Gloves':            'Eternal Gloves',
      'Shoes':             'Eternal Shoes',
      'Cape':              'Eternal Cape',
      'Shoulder':          'Eternal Shoulder',
      'Weapon':            'Destiny Weapon',
      'Secondary Weapon':  'Lv. 100 Secondary',
      'Emblem':            '__GOLD_EMBLEM__',
    },
  },
];

/** Slots that have class-specific variants; preset dropdown shows only canonical (no cls) so we apply the right one per class. */
const GEAR_PRESET_CANONICAL_SLOTS = new Set(['Hat', 'Top/Overall', 'Bottom']);

/** Tier order for preset dropdowns: lowest tier first (Pensalir, then Absolab, Arcane, Eternal, etc.). */
const PRESET_TIER_ORDER = ['Frozen', 'Pensalir', 'Dawn', 'PrincessNo', 'Gollux', 'Fafnir', 'Sweetwater', 'Absolab', 'Arcane', 'Pitched', 'Brilliant', 'Eternal'];
function presetTierRank(tier) {
  const i = PRESET_TIER_ORDER.indexOf(tier);
  return i >= 0 ? i : 999;
}
/** Weapon label → tier for sorting preset weapon list. */
const PRESET_WEAPON_TIER = {
  'Pensalir Weapon': 'Pensalir', 'CRA Weapon': 'Fafnir', 'Absolab Weapon': 'Absolab',
  'Arcane Umbra Weapon': 'Arcane', 'Genesis Weapon': 'Pitched', 'Destiny Weapon': 'Eternal',
};

/** Display labels for special preset emblem values (used in Custom Presets dropdown). */
const PRESET_EMBLEM_DISPLAY = { '__SILVER_EMBLEM__': 'Silver Emblem', '__GOLD_EMBLEM__': 'Gold Emblem' };

/** Options per slot for custom equipment presets. Sorted by tier (lowest first). Secondary = all from SLOT_ITEMS; Emblem = generic only (no class-specific labels); Hat/Top/Bottom = canonical only. */
const GEAR_PRESET_SLOT_OPTIONS = (() => {
  const opt = {};
  const gearSlots = ['Hat', 'Top/Overall', 'Bottom', 'Shoes', 'Gloves', 'Shoulder', 'Cape', 'Weapon', 'Secondary Weapon', 'Emblem'];
  const weaponSet = new Set();
  GEAR_PRESETS.forEach(p => {
    if (p.gear['Weapon']) weaponSet.add(p.gear['Weapon']);
  });
  gearSlots.forEach(slot => {
    if (slot === 'Weapon') {
      const list = Array.from(weaponSet).sort((a, b) => {
        const rA = presetTierRank(PRESET_WEAPON_TIER[a] || '');
        const rB = presetTierRank(PRESET_WEAPON_TIER[b] || '');
        return rA !== rB ? rA - rB : a.localeCompare(b);
      });
      opt[slot] = ['None', ...list];
    } else if (slot === 'Secondary Weapon') {
      opt[slot] = ['None', 'Lv. 100 Secondary', 'Frozen Secondary', 'Princess No Secondary'];
    } else if (slot === 'Emblem') {
      opt[slot] = ['None', '__SILVER_EMBLEM__', '__GOLD_EMBLEM__', "Mitra's Rage"];
    } else {
      const items = SLOT_ITEMS[slot];
      const list = items
        ? (GEAR_PRESET_CANONICAL_SLOTS.has(slot)
          ? items.filter(it => !it.cls)
          : items)
        : [];
      const sorted = list.slice().sort((a, b) => {
        const rA = presetTierRank(a.tier || '');
        const rB = presetTierRank(b.tier || '');
        return rA !== rB ? rA - rB : (a.label || '').localeCompare(b.label || '');
      });
      opt[slot] = ['None', ...sorted.map(it => it.label)];
    }
  });
  return opt;
})();

const ACCESSORY_PRESETS = [
  {
    name: 'Boss Set',
    gear: {
      'Badge':           'Crystal Ventus Badge',
      'Shoulder':        'Royal Black Metal Shoulder',
      'Pocket':          'Pink Bean Cup',
      'Belt':            'Golden Clover Belt',
      'Face Accessory':  'Condensed Power Crystal',
      'Eye Accessory':   'Black Bean Mark',
      'Earring':         'Dea Sidus Earrings',
      'Pendant 1':       'Mechanator Pendant',
      'Pendant 2':       'Dominator Pendant',
      'Ring 1':          'Silver Blossom Ring',
      'Ring 2':          "Noble Ifia's Ring",
      'Ring 3':          'Guardian Angel Ring',
    },
  },
  {
    name: 'Dawn Set',
    gear: {
      'Ring 1':    'Dawn Guardian Angel Ring',
      'Pendant 1': 'Daybreak Pendant',
      'Earring':   'Estella Earrings',
    },
  },
  {
    name: 'Superior Gollux Set',
    gear: {
      'Ring 1':    'Superior Gollux Ring',
      'Pendant 1': 'Superior Gollux Pendant',
      'Earring':   'Superior Gollux Earrings',
      'Belt':      'Superior Gollux Belt',
    },
  },
  {
    name: 'Pitched Boss Set',
    gear: {
      'Face Accessory': 'Berserked',
      'Eye Accessory':  'Magic Eyepatch',
      'Pendant 1':      'Source of Suffering',
      'Belt':           'Dreamy Belt',
      'Ring 1':         'Endless Terror',
      'Pocket':         'Cursed Red Spellbook',
    },
  },
  {
    name: 'Brilliant Boss Set',
    gear: {
      'Ring 1':    'Whisper of the Source',
      'Pendant 1': 'Oath of Death',
      'Medal':     'Immortal Legacy',
    },
  },
];

/** All item labels per slot for custom accessory presets (from SLOT_ITEMS; sorted by tier lowest first). */
const ACCESSORY_PRESET_SLOT_OPTIONS = (() => {
  const ringSlots = ['Ring 1', 'Ring 2', 'Ring 3', 'Ring 4'];
  const pendantSlots = ['Pendant 1', 'Pendant 2'];
  const opt = {};
  function labelsFor(slot) {
    const items = SLOT_ITEMS[slot];
    if (!items) return ['None'];
    const list = items.filter(it => it.label && !ITEM_META[it.label]?.ozRing);
    const sorted = list.slice().sort((a, b) => {
      const rA = presetTierRank(a.tier || '');
      const rB = presetTierRank(b.tier || '');
      return rA !== rB ? rA - rB : (a.label || '').localeCompare(b.label || '');
    });
    return ['None', ...sorted.map(it => it.label)];
  }
  ['Badge', 'Shoulder', 'Pocket', 'Belt', 'Face Accessory', 'Eye Accessory', 'Earring', 'Medal'].forEach(slot => {
    opt[slot] = labelsFor(slot);
  });
  const ringLabels = labelsFor('Ring 1');
  ringSlots.forEach(s => { opt[s] = ringLabels; });
  const pendantLabels = labelsFor('Pendant 1');
  pendantSlots.forEach(s => { opt[s] = pendantLabels; });
  return opt;
})();

// Slots where items are standalone (not part of the named tier's set).
// Only Pitched-tier items in these slots keep their tier color; everything else shows white.
const STANDALONE_SLOTS   = new Set(['Badge', 'Medal', 'Android Heart']);
const STANDALONE_COLORED = new Set(['Pitched', 'Brilliant', 'Eternal']);

// Which slots count toward each set (derived from SLOT_ITEMS). Used for set-count display.
const SET_SLOTS = {};
Object.keys(SETS).forEach(tier => {
  if (tier === 'None') return;
  SET_SLOTS[tier] = new Set();
});
Object.entries(SLOT_ITEMS).forEach(([slot, items]) => {
  items.forEach(it => {
    if (it.tier && SET_SLOTS[it.tier]) SET_SLOTS[it.tier].add(slot);
  });
});

// Set effects per piece count: incremental bonus at that tier. Display name comes from SETS[tier].name.
const SET_EFFECTS = {
  Fafnir: {
    2: ['STR/DEX/INT/LUK +20', 'Max HP/MP +1,000'],
    3: ['Max HP/MP +10%', 'Attack/Magic Attack +50'],
    4: ['Boss Damage +30%'],
  },
  Pensalir: {
    2: ['STR/DEX/INT/LUK +10', 'Max HP/MP +500'],
    3: ['Max HP/MP +5%', 'Attack/Magic Attack +30'],
    4: ['Defense +500'],
    5: ['All stats +5'],
    6: ['Damage +10%'],
    7: ['Boss Damage +10%'],
  },
  Absolab: {
    2: ['STR/DEX/INT/LUK +30', 'Max HP/MP +1,500'],
    3: ['Max HP/MP +15%', 'Attack/Magic Attack +80'],
    4: ['Boss Damage +30%'],
    5: ['Ignore DEF +10%'],
    6: ['Damage +10%'],
    7: ['Critical Rate +10%'],
    8: ['Boss Damage +10%'],
  },
  Arcane: {
    2: ['STR/DEX/INT/LUK +50', 'Max HP/MP +2,000'],
    3: ['Max HP/MP +20%', 'Attack/Magic Attack +100'],
    4: ['Boss Damage +30%'],
    5: ['Ignore DEF +15%'],
    6: ['Damage +15%'],
    7: ['Critical Rate +15%'],
    8: ['Boss Damage +15%'],
  },
  Eternal: {
    2: ['STR/DEX/INT/LUK +80', 'Max HP/MP +3,000'],
    3: ['Max HP/MP +25%', 'Attack/Magic Attack +120'],
    4: ['Boss Damage +35%'],
    5: ['Ignore DEF +20%'],
    6: ['Damage +20%'],
    7: ['Critical Rate +20%'],
    8: ['Boss Damage +20%'],
  },
  Frozen: {
    2: ['STR/DEX/INT/LUK +15', 'Max HP/MP +800'],
    3: ['Max HP/MP +8%', 'Attack/Magic Attack +40'],
    4: ['Boss Damage +15%'],
  },
  Gollux: {
    2: ['STR/DEX/INT/LUK +25', 'Max HP/MP +1,000'],
    3: ['Boss Damage +30%', 'Ignore DEF +10%'],
    4: ['Damage +10%', 'Max HP/MP +15%'],
  },
  Dawn: {
    2: ['STR/DEX/INT/LUK +20', 'Max HP/MP +1,000'],
    3: ['Boss Damage +20%', 'Damage +5%'],
  },
  PrincessNo: {
    2: ['STR/DEX/INT/LUK +25', 'Max HP/MP +1,200'],
    3: ['Boss Damage +25%', 'Ignore DEF +8%'],
  },
  Pitched: {
    2: ['Boss Damage +20%', 'Damage +5%'],
    3: ['Ignore DEF +10%', 'Critical Damage +5%'],
    4: ['Boss Damage +15%', 'Damage +10%'],
    5: ['All stats +15', 'Max HP/MP +20%'],
    6: ['Boss Damage +20%', 'Damage +15%'],
  },
  Brilliant: {
    2: ['Boss Damage +15%', 'Damage +5%'],
    3: ['Ignore DEF +8%', 'Critical Damage +5%'],
  },
  Sweetwater: { 2: ['Attack/Magic Attack +30'], 3: ['Boss Damage +10%'], 4: ['Damage +5%'] },
  OzRing: {},
};

// Lucky Equipment: counts toward any set that has that slot, if 3+ other set pieces and no set piece in that slot
const LUCKY_ITEMS = { 'Genesis Weapon': 'Weapon', 'Destiny Weapon': 'Weapon', 'Chaos Vellum Helmet': 'Hat' };

// ── Predefined named sets (Sets column uses these; CRA is class-specific) ──
// Items: slot → Set of item labels that count. Weapon set filled by weapons.js after load.
const GEAR_SETS = {
  CRA: {
    name: 'Root Abyss Set',
    shortName: 'CRA',
    color: '#00FCCC',
    slots: ['Hat', 'Top/Overall', 'Bottom', 'Weapon'],
    items: {
      'Hat': new Set([
        'CRA Hat', 'Royal Dunwitch Hat', 'Royal Warrior Helm', 'Royal Ranger Beret',
        'Royal Assassin Hood', 'Royal Wanderer Hat',
      ]),
      'Top/Overall': new Set([
        'CRA Top', 'Eagle Eye Dunwitch Robe', 'Eagle Eye Warrior Armor', 'Eagle Eye Ranger Cowl',
        'Eagle Eye Assassin Shirt', 'Eagle Eye Wanderer Coat',
      ]),
      'Bottom': new Set([
        'CRA Bottom', 'Trixter Dunwitch Pants', 'Trixter Warrior Pants', 'Trixter Ranger Pants',
        'Trixter Assassin Pants', 'Trixter Wanderer Pants',
      ]),
      'Weapon': [], // filled by weapons.js (all Fafnir weapon labels)
    },
    effectsByCategory: {
      Warrior: {
        2: ['STR: +20', 'DEX: +20', 'Max HP: +1,000', 'Max MP: +1,000'],
        3: ['Max HP: +10%', 'Max MP: +10%', 'Weapon Attack: +50'],
        4: ['Boss Damage: +30%'],
      },
      Mage: {
        2: ['INT: +20', 'LUK: +20', 'Max HP: +1,000', 'Max MP: +1,000'],
        3: ['Max HP: +10%', 'Max MP: +10%', 'Magic Attack: +50'],
        4: ['Boss Damage: +30%'],
      },
      Archer: {
        2: ['STR: +20', 'DEX: +20', 'Max HP: +1,000', 'Max MP: +1,000'],
        3: ['Max HP: +10%', 'Max MP: +10%', 'Weapon Attack: +50'],
        4: ['Boss Damage: +30%'],
      },
      Thief: {
        2: ['DEX: +20', 'LUK: +20', 'Max HP: +1,000', 'Max MP: +1,000'],
        3: ['Max HP: +10%', 'Max MP: +10%', 'Weapon Attack: +50'],
        4: ['Boss Damage: +30%'],
      },
      Pirate: {
        2: ['STR: +20', 'DEX: +20', 'Max HP: +1,000', 'Max MP: +1,000'],
        3: ['Max HP: +10%', 'Max MP: +10%', 'Weapon Attack: +50'],
        4: ['Boss Damage: +30%'],
      },
      Xenon: {
        2: ['DEX: +20', 'LUK: +20', 'Max HP: +1,000', 'Max MP: +1,000'],
        3: ['Max HP: +10%', 'Max MP: +10%', 'Weapon Attack: +50'],
        4: ['Boss Damage: +30%'],
      },
    },
  },
  Arcane: {
    name: 'Arcane Umbra Set',
    shortName: 'Arcane',
    color: '#9B59B6',
    slots: ['Weapon', 'Hat', 'Top/Overall', 'Bottom', 'Gloves', 'Shoes', 'Shoulder', 'Cape'],
    items: (() => {
      const slotList = ['Weapon', 'Hat', 'Top/Overall', 'Bottom', 'Gloves', 'Shoes', 'Shoulder', 'Cape'];
      const out = {};
      slotList.forEach(slot => { out[slot] = new Set(); });
      Object.entries(SLOT_ITEMS).forEach(([slot, list]) => {
        if (!out[slot]) return;
        list.forEach(it => { if (it.tier === 'Arcane') out[slot].add(it.label); });
      });
      out['Weapon'] = []; // filled by weapons.js
      return out;
    })(),
    effects: {
      2: ['Weapon Attack: +30', 'Magic Attack: +30', 'Boss Damage: +10%'],
      3: ['Weapon Attack: +30', 'Magic Attack: +30', 'Defense: +400', 'Ignore Enemy DEF: +10%'],
      4: ['All Stats: +50', 'Weapon Attack: +35', 'Magic Attack: +35', 'Boss Damage: +10%'],
      5: ['Max HP: +2,000', 'Max MP: +2,000', 'Weapon Attack: +40', 'Magic Attack: +40', 'Boss Damage: +10%'],
      6: ['Max HP: +30%', 'Max MP: +30%', 'Weapon Attack: +30', 'Magic Attack: +30'],
      7: ['Weapon Attack: +30', 'Magic Attack: +30', 'Ignore Enemy DEF: +10%'],
    },
  },
  Absolab: {
    name: 'AbsoLab Set',
    shortName: 'AbsoLab',
    color: '#C84848',
    slots: ['Weapon', 'Hat', 'Top/Overall', 'Bottom', 'Gloves', 'Shoes', 'Shoulder', 'Cape'],
    items: (() => {
      const slotList = ['Weapon', 'Hat', 'Top/Overall', 'Bottom', 'Gloves', 'Shoes', 'Shoulder', 'Cape'];
      const out = {};
      slotList.forEach(slot => { out[slot] = new Set(); });
      Object.entries(SLOT_ITEMS).forEach(([slot, list]) => {
        if (!out[slot]) return;
        list.forEach(it => { if (it.tier === 'Absolab') out[slot].add(it.label); });
      });
      out['Weapon'] = []; // filled by weapons.js
      return out;
    })(),
    effects: {
      2: ['Max HP: +1,500', 'Max MP: +1,500', 'Weapon Attack: +20', 'Magic Attack: +20', 'Boss Damage: +10%'],
      3: ['All Stats: +30', 'Weapon Attack: +20', 'Magic Attack: +20', 'Boss Damage: +10%'],
      4: ['Weapon Attack: +25', 'Magic Attack: +25', 'Defense: +200', 'Ignore Enemy DEF: +10%'],
      5: ['Weapon Attack: +30', 'Magic Attack: +30', 'Boss Damage: +10%'],
      6: ['Max HP: +20%', 'Max MP: +20%', 'Weapon Attack: +20', 'Magic Attack: +20'],
      7: ['Weapon Attack: +20', 'Magic Attack: +20', 'Ignore Enemy DEF: +10%'],
    },
  },
  Eternal: {
    name: 'Eternal Set',
    shortName: 'Eternal',
    color: '#FFD700',
    slots: ['Weapon', 'Hat', 'Top/Overall', 'Bottom', 'Gloves', 'Shoes', 'Shoulder', 'Cape'],
    items: (() => {
      const slotList = ['Weapon', 'Hat', 'Top/Overall', 'Bottom', 'Gloves', 'Shoes', 'Shoulder', 'Cape'];
      const out = {};
      slotList.forEach(slot => { out[slot] = new Set(); });
      Object.entries(SLOT_ITEMS).forEach(([slot, list]) => {
        if (!out[slot]) return;
        list.forEach(it => { if (it.tier === 'Eternal') out[slot].add(it.label); });
      });
      out['Weapon'] = []; // filled by weapons.js
      return out;
    })(),
    effects: {
      2: ['Max HP: +2,500', 'Max MP: +2,500', 'Weapon Attack: +40', 'Magic Attack: +40', 'Boss Damage: +10%'],
      3: ['All Stats: +50', 'Weapon Attack: +40', 'Magic Attack: +40', 'Defense: +600', 'Boss Damage: +10%'],
      4: ['Max HP: +15%', 'Max MP: +15%', 'Weapon Attack: +40', 'Magic Attack: +40', 'Boss Damage: +10%'],
      5: ['Weapon Attack: +40', 'Magic Attack: +40', 'Ignore Enemy DEF: +20%'],
      6: ['Weapon Attack: +40', 'Magic Attack: +40', 'Boss Damage: +15%'],
      7: ['All Stats: +50', 'Max HP: +2,500', 'Max MP: +2,500', 'Weapon Attack: +40', 'Magic Attack: +40', 'Boss Damage: +15%'],
      8: ['Weapon Attack: +40', 'Magic Attack: +40', 'Boss Damage: +15%'],
    },
  },
  Boss: {
    name: 'Boss Accessory Set',
    shortName: 'Boss',
    color: '#6B9EBE',
    slots: ['Face Accessory', 'Eye Accessory', 'Earring', 'Ring 1', 'Ring 2', 'Ring 3', 'Ring 4', 'Pendant 1', 'Pendant 2', 'Belt', 'Shoulder', 'Pocket', 'Badge'],
    items: {
      'Face Accessory': new Set(['Condensed Power Crystal']),
      'Eye Accessory': new Set(['Aquatic Letter Eye Accessory', 'Black Bean Mark', 'Papulatus Mark']),
      'Earring': new Set(['Dea Sidus Earrings', "Will o' the Wisps"]),
      'Ring 1': new Set(['Silver Blossom Ring', "Noble Ifia's Ring", 'Guardian Angel Ring']),
      'Ring 2': new Set(['Silver Blossom Ring', "Noble Ifia's Ring", 'Guardian Angel Ring']),
      'Ring 3': new Set(['Silver Blossom Ring', "Noble Ifia's Ring", 'Guardian Angel Ring']),
      'Ring 4': new Set(['Silver Blossom Ring', "Noble Ifia's Ring", 'Guardian Angel Ring']),
      'Pendant 1': new Set(['Chaos Horntail Necklace', 'Mechanator Pendant', 'Dominator Pendant']),
      'Pendant 2': new Set(['Chaos Horntail Necklace', 'Mechanator Pendant', 'Dominator Pendant']),
      'Belt': new Set(['Golden Clover Belt', 'Enraged Zakum Belt']),
      'Shoulder': new Set(['Royal Black Metal Shoulder']),
      'Pocket': new Set(['Stone of Eternal Life', 'Pink Bean Cup']),
      'Badge': new Set(['Crystal Ventus Badge']),
    },
    effects: {
      3: ['All Stats: +10', 'Max HP: +5%', 'Max MP: +5%', 'Weapon Attack: +5', 'Magic Attack: +5', 'Defense: +60'],
      5: ['All Stats: +10', 'Max HP: +5%', 'Max MP: +5%', 'Weapon Attack: +5', 'Magic Attack: +5', 'Defense: +60'],
      7: ['All Stats: +10', 'Weapon Attack: +10', 'Magic Attack: +10', 'Defense: +80', 'Ignore Enemy DEF: +10%'],
      9: ['All Stats: +15', 'Weapon Attack: +10', 'Magic Attack: +10', 'Defense: +100', 'Boss Damage: +10%'],
    },
  },
  Dawn: {
    name: 'Dawn Boss Set',
    shortName: 'Dawn',
    color: '#F59E0B',
    slots: ['Face Accessory', 'Earring', 'Ring 1', 'Ring 2', 'Ring 3', 'Ring 4', 'Pendant 1', 'Pendant 2'],
    items: {
      'Face Accessory': new Set(['Twilight Mark']),
      'Earring': new Set(['Estella Earrings']),
      'Ring 1': new Set(['Dawn Guardian Angel Ring']),
      'Ring 2': new Set(['Dawn Guardian Angel Ring']),
      'Ring 3': new Set(['Dawn Guardian Angel Ring']),
      'Ring 4': new Set(['Dawn Guardian Angel Ring']),
      'Pendant 1': new Set(['Daybreak Pendant']),
      'Pendant 2': new Set(['Daybreak Pendant']),
    },
    effects: {
      2: ['All Stats: +10', 'Max HP: +250', 'Weapon Attack: +10', 'Magic Attack: +10', 'Boss Damage: +10%'],
      3: ['All Stats: +10', 'Max HP: +250', 'Weapon Attack: +10', 'Magic Attack: +10'],
      4: ['All Stats: +10', 'Max HP: +250', 'Weapon Attack: +10', 'Magic Attack: +10', 'Defense: +100', 'Ignore Enemy DEF: +10%'],
    },
  },
  Gollux: {
    name: 'Superior Gollux Set',
    shortName: 'Gollux',
    color: '#C2622D',
    slots: ['Earring', 'Ring 1', 'Ring 2', 'Ring 3', 'Ring 4', 'Pendant 1', 'Pendant 2', 'Belt'],
    items: {
      'Earring': new Set(['Superior Gollux Earrings']),
      'Ring 1': new Set(['Superior Gollux Ring']),
      'Ring 2': new Set(['Superior Gollux Ring']),
      'Ring 3': new Set(['Superior Gollux Ring']),
      'Ring 4': new Set(['Superior Gollux Ring']),
      'Pendant 1': new Set(['Superior Gollux Pendant']),
      'Pendant 2': new Set(['Superior Gollux Pendant']),
      'Belt': new Set(['Superior Gollux Belt']),
    },
    effects: {
      2: ['All Stats: +20', 'Max HP: +1,500', 'Max MP: +1,500'],
      3: ['Max HP: +13%', 'Max MP: +13%', 'Weapon Attack: +35', 'Magic Attack: +35'],
      4: ['Boss Damage: +30%', 'Ignore Enemy DEF: +30%'],
    },
  },
  Brilliant: {
    name: 'Brilliant Boss Set',
    shortName: 'Brilliant',
    color: '#84CC16',  // lime
    slots: ['Ring 1', 'Ring 2', 'Ring 3', 'Ring 4', 'Pendant 1', 'Pendant 2', 'Medal'],
    items: {
      'Ring 1': new Set(['Whisper of the Source']),
      'Ring 2': new Set(['Whisper of the Source']),
      'Ring 3': new Set(['Whisper of the Source']),
      'Ring 4': new Set(['Whisper of the Source']),
      'Pendant 1': new Set(['Oath of Death']),
      'Pendant 2': new Set(['Oath of Death']),
      'Medal': new Set(['Immortal Legacy']),
    },
    effects: {
      2: ['Boss Damage: +15%', 'Damage: +5%'],
      3: ['Ignore DEF: +8%', 'Critical Damage: +5%'],
    },
  },
  Sengoku: {
    name: 'Sengoku Treasure Set',
    shortName: 'Sengoku',
    color: '#EC4899',
    slots: ['Ring 1', 'Ring 2', 'Ring 3', 'Ring 4', 'Belt', 'Shoulder'],
    items: {
      'Ring 1': new Set(["Kanna's Treasure"]),
      'Ring 2': new Set(["Kanna's Treasure"]),
      'Ring 3': new Set(["Kanna's Treasure"]),
      'Ring 4': new Set(["Kanna's Treasure"]),
      'Belt': new Set(["Ayame's Treasure"]),
      'Shoulder': new Set(["Hayato's Treasure"]),
    },
    effects: {
      2: ['All Stats: +2', 'Weapon Attack: +3', 'Magic Attack: +3', 'Defense: +20', 'Damage: +3%'],
      3: ['All Stats: +8', 'Weapon Attack: +12', 'Magic Attack: +12', 'Defense: +80', 'Damage: +6%'],
    },
  },
  SevenDays: {
    name: 'Seven Days Set',
    shortName: 'Seven Days',
    color: '#A78BFA',
    slots: ['Badge', 'Medal'],
    items: {
      'Badge': new Set(['Seven Days Badge']),
      'Medal': new Set(['Seven Day Monster Parker']),
    },
    effects: {
      2: ['Ignore Enemy DEF: +10%'],
    },
  },
  Pitched: {
    name: 'Pitched Boss Set',
    shortName: 'Pitched',
    color: '#22C55E',
    slots: ['Emblem', 'Face Accessory', 'Eye Accessory', 'Earring', 'Ring 1', 'Ring 2', 'Ring 3', 'Ring 4', 'Pendant 1', 'Pendant 2', 'Belt', 'Pocket', 'Badge', 'Android Heart'],
    items: {
      'Emblem': new Set(["Mitra's Rage"]),
      'Face Accessory': new Set(['Berserked']),
      'Eye Accessory': new Set(['Magic Eyepatch']),
      'Earring': new Set(['Commanding Force Earring']),
      'Ring 1': new Set(['Endless Terror']),
      'Ring 2': new Set(['Endless Terror']),
      'Ring 3': new Set(['Endless Terror']),
      'Ring 4': new Set(['Endless Terror']),
      'Pendant 1': new Set(['Source of Suffering']),
      'Pendant 2': new Set(['Source of Suffering']),
      'Belt': new Set(['Dreamy Belt']),
      'Pocket': new Set(['Cursed Red Spellbook', 'Cursed Blue Spellbook', 'Cursed Green Spellbook', 'Cursed Yellow Spellbook']),
      'Badge': new Set(['Genesis Badge']),
      'Android Heart': new Set(['Black Heart', 'Total Control']),
    },
    effects: {
      2: ['All Stats: +10', 'Max HP: +250', 'Weapon Attack: +10', 'Magic Attack: +10', 'Boss Damage: +10%'],
      3: ['All Stats: +10', 'Max HP: +250', 'Weapon Attack: +10', 'Magic Attack: +10', 'Defense: +250', 'Ignore Enemy DEF: +10%'],
      4: ['All Stats: +15', 'Max HP: +375', 'Weapon Attack: +15', 'Magic Attack: +15', 'Critical Damage: +6%'],
      5: ['All Stats: +15', 'Max HP: +375', 'Weapon Attack: +15', 'Magic Attack: +15', 'Boss Damage: +10%'],
      6: ['All Stats: +15', 'Max HP: +375', 'Weapon Attack: +15', 'Magic Attack: +15', 'Ignore Enemy DEF: +10%'],
      7: ['All Stats: +15', 'Max HP: +375', 'Weapon Attack: +15', 'Magic Attack: +15', 'Critical Damage: +6%'],
      8: ['All Stats: +15', 'Max HP: +375', 'Weapon Attack: +15', 'Magic Attack: +15', 'Boss Damage: +10%'],
      9: ['All Stats: +15', 'Max HP: +375', 'Weapon Attack: +15', 'Magic Attack: +15', 'Critical Damage: +6%'],
      10: ['All Stats: +20', 'Max HP: +500', 'Weapon Attack: +20', 'Magic Attack: +20', 'Boss Damage: +10%'],
    },
  },
};

/** Returns the GEAR_SETS set object if this item is in that set for this slot; otherwise null. Used for set-only coloring. */
function getSetForItem(itemLabel, slot) {
  if (!itemLabel || itemLabel === 'None' || typeof GEAR_SETS === 'undefined') return null;
  for (const setId of Object.keys(GEAR_SETS)) {
    const set = GEAR_SETS[setId];
    if (set?.items?.[slot]?.has?.(itemLabel)) return set;
  }
  // Genesis / Pitched-tier weapons: color as Pitched Boss set even though Weapon is not a Pitched slot
  if (slot === 'Weapon' && typeof ITEM_TIER !== 'undefined' && ITEM_TIER[itemLabel] === 'Pitched' && GEAR_SETS.Pitched) {
    return GEAR_SETS.Pitched;
  }
  return null;
}

// Slot label shown when a slot has None equipped
const SLOT_ABBR = {
  'Weapon': 'WEAPON', 'Hat': 'HAT', 'Top/Overall': 'TOP', 'Bottom': 'BOTTOM',
  'Gloves': 'GLOVES', 'Shoes': 'SHOES', 'Shoulder': 'SHOULDER', 'Cape': 'CAPE',
  'Belt': 'BELT', 'Secondary Weapon': 'SEC WPN', 'Emblem': 'EMBLEM', 'Badge': 'BADGE',
  'Ring 1': 'RING 1', 'Ring 2': 'RING 2', 'Ring 3': 'RING 3', 'Ring 4': 'RING 4',
  'Earring': 'EARRING', 'Pendant 1': 'PENDANT 1', 'Pendant 2': 'PENDANT 2',
  'Face Accessory': 'FACE', 'Eye Accessory': 'EYE', 'Pocket': 'POCKET', 'Android Heart': 'HEART', 'Medal': 'MEDAL', 'Totem': 'TOTEM', 'Offset Totem': 'OFFSET TOTEM',
};

// Filename prefix per set  (matches what's in MapleIcons/Gear Icons/)
const SET_PREFIX = {
  Pensalir:   'Pensalir',
  Dawn:       'Dawn',
  PrincessNo: 'PrincessNo',
  Frozen:     'Frozen',
  Fafnir:     'CRA',
  Sweetwater: null,           // weapon-only tier; no armour icon files
  Absolab:    'Abso',
  Arcane:     'Arcane',
  Pitched:    'Pitched',
  Eternal:    'Eternal',
  Gollux:     'Gollux',
  OzRing:     'Oz',
};

// Filename suffix per slot  (used to build local icon paths)
const SLOT_SUFFIX = {
  'Hat':              'Hat',
  'Top/Overall':      'Top',
  'Bottom':           'Bottom',
  'Shoes':            'Shoes',
  'Gloves':           'Gloves',
  'Shoulder':         'Shoulder',
  'Cape':             'Cape',
  'Belt':             'Belt',
  'Weapon':           'Weapon',
  'Secondary Weapon': 'Secondary',
  'Emblem':           'Emblem',
  'Badge':            'Badge',
  'Ring 1':           'Ring',         // all four rings share the same icon per set
  'Ring 2':           'Ring',
  'Ring 3':           'Ring',
  'Ring 4':           'Ring',
  'Earring':          'Earring',
  'Pendant 1':        'Pendant',      // both pendants share the same icon per set
  'Pendant 2':        'Pendant',
  'Face Accessory':   'Face',
  'Eye Accessory':    'Eye',
  'Pocket':           'Pocket',
  'Android Heart':    'Heart',
  'Totem':            'Totem',
  'Offset Totem':     'Offset Totem',
};

// Sets whose Top/Overall icon uses "Overall" in the filename rather than "Top"
const SET_USES_OVERALL = new Set(['Pensalir', 'Absolab', 'Arcane', 'Frozen']);

// Slots whose items live in the Accessories subfolder
const ACCESSORY_SLOTS = new Set([
  'Ring 1','Ring 2','Ring 3','Ring 4','Earring',
  'Pendant 1','Pendant 2','Face Accessory','Eye Accessory','Medal',
  'Pocket','Badge','Shoulder','Emblem','Belt','Totem','Offset Totem',
]);

// Oz ring items live one level deeper: Accessories/Oz Rings/
const OZ_RING_LABELS = new Set([
  'Weapon Jump Ring','Ring of Restraint','Risk Taker Ring',
  'Critical Damage Ring','Total Damage Ring',
]);

/** Ring items that share one logical slot: only one can be equipped across Ring 1–4. highTier is used when applying presets. */
const RING_EXCLUSIVE_GROUPS = {
  guardian: {
    items: ['Guardian Angel Ring', 'Dawn Guardian Angel Ring'],
    highTier: 'Dawn Guardian Angel Ring',
  },
};
function getRingExclusiveGroup(itemLabel) {
  if (!itemLabel || itemLabel === 'None') return null;
  for (const g of Object.values(RING_EXCLUSIVE_GROUPS)) {
    if (g.items.includes(itemLabel)) return g;
  }
  return null;
}
function getRingExclusiveGroupKey(itemLabel) {
  if (!itemLabel || itemLabel === 'None') return null;
  for (const [key, g] of Object.entries(RING_EXCLUSIVE_GROUPS)) {
    if (g.items.includes(itemLabel)) return key;
  }
  return null;
}
function isInRingExclusiveGroup(itemLabel, group) {
  return group && group.items && group.items.includes(itemLabel);
}

// Default level for Oz rings when none set (1–6)
const OZ_RING_DEFAULT_LEVEL = 4;

// Helper: does this item use a 1–6 level dropdown instead of a star input?
function isOzRing(label) { return !!(ITEM_META[label]?.ozRing); }

// Helper: does this item show a star/SF input? (defaults true; badges/secondary opt-in via hasStars, medals/pocket/emblem never)
function itemHasStars(slot, label) {
  if (label === 'None') return false;
  if (isOzRing(label))  return false;
  if (slot === 'Medal') return false;
  if (slot === 'Pocket') return false;
  if (slot === 'Emblem') return false;
  if (slot === 'Totem') return false;
  if (slot === 'Offset Totem') return false;
  if (slot === 'Secondary Weapon') return !!(ITEM_META[label]?.hasStars);  // only certain shields
  if (slot === 'Badge') return !!(ITEM_META[label]?.hasStars);
  return true;
}

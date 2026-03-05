'use strict';

// Slots whose icon file varies by character job category
const CLASS_SPECIFIC_SLOTS = new Set(['Hat', 'Top/Overall', 'Bottom', 'Weapon', 'Secondary Weapon', 'Emblem']);

// ── All GMS classes grouped by faction, alphabetical within each group ──────
const CLASS_FACTIONS = [
  { faction: 'Explorers',      classes: ['Arch Mage (Fire, Poison)', 'Arch Mage (Ice, Lightning)', 'Bishop', 'Bowmaster', 'Buccaneer', 'Cannon Master', 'Corsair', 'Dark Knight', 'Dual Blade', 'Hero', 'Marksman', 'Night Lord', 'Paladin', 'Pathfinder', 'Shadower'] },
  { faction: 'Cygnus Knights', classes: ['Blaze Wizard', 'Dawn Warrior', 'Mihile', 'Night Walker', 'Thunder Breaker', 'Wind Archer'] },
  { faction: 'Heroes',         classes: ['Aran', 'Evan', 'Luminous', 'Mercedes', 'Phantom', 'Shade (Eunwol)'] },
  { faction: 'Resistance',     classes: ['Battle Mage', 'Blaster', 'Demon Avenger', 'Demon Slayer', 'Mechanic', 'Wild Hunter', 'Xenon'] },
  { faction: 'Nova',           classes: ['Angelic Buster', 'Cadena', 'Kain', 'Kaiser'] },
  { faction: 'Flora',          classes: ['Adele', 'Ark', 'Illium', 'Khali'] },
  { faction: 'Anima',          classes: ['Hoyoung', 'Lara', 'Ren'] },
  { faction: 'Sengoku',        classes: ['Hayato', 'Kanna'] },
  { faction: 'Friends World',  classes: ['Kinesis'] },
  { faction: 'Jianghu',        classes: ['Lynn', 'Mo Xuan'] },
  { faction: 'Transcendent',   classes: ['Zero'] },
  { faction: 'Shine',          classes: ['Sia Astelle'] },
];

// ── Job name → gear category ─────────────────────────────────────
const CLASS_CATEGORY = {
  // Warriors
  Hero: 'Warrior', Paladin: 'Warrior', 'Dark Knight': 'Warrior',
  Aran: 'Warrior', Mihile: 'Warrior', Kaiser: 'Warrior',
  Adele: 'Warrior', Zero: 'Warrior', Hayato: 'Warrior',
  'Dawn Warrior': 'Warrior', Blaster: 'Warrior',
  'Demon Slayer': 'Warrior', 'Demon Avenger': 'Warrior',
  Ren: 'Warrior',
  // Mages
  'Arch Mage (Fire, Poison)': 'Mage', 'Arch Mage (Ice, Lightning)': 'Mage',
  Bishop: 'Mage', Evan: 'Mage', Luminous: 'Mage',
  Kanna: 'Mage', Illium: 'Mage', Lara: 'Mage',
  'Battle Mage': 'Mage', Kinesis: 'Mage', 'Blaze Wizard': 'Mage',
  'Sia Astelle': 'Mage', Lynn: 'Mage',
  // Archers
  Bowmaster: 'Archer', Marksman: 'Archer', Pathfinder: 'Archer',
  'Wild Hunter': 'Archer', 'Wind Archer': 'Archer', Kain: 'Archer',
  Mercedes: 'Archer',
  // Thieves
  'Night Lord': 'Thief', Shadower: 'Thief', 'Dual Blade': 'Thief',
  Phantom: 'Thief', Cadena: 'Thief', Hoyoung: 'Thief',
  Khali: 'Thief', 'Night Walker': 'Thief',
  // Pirates
  Buccaneer: 'Pirate', Corsair: 'Pirate', 'Cannon Master': 'Pirate',
  Mechanic: 'Pirate', 'Angelic Buster': 'Pirate',
  Ark: 'Pirate', 'Mo Xuan': 'Pirate', 'Thunder Breaker': 'Pirate',
  'Shade (Eunwol)': 'Pirate',
  // Xenon — hybrid Thief/Pirate, treated as its own unique category
  Xenon: 'Xenon',
};

/* ────────────────────────────────────────────────────────────────
   CLASS WEAPON & SECONDARY DATASET
   Provides per-class: faction, weapon types, secondary type.
   Used to drive class-specific weapon dropdown options and icons.
   Entries marked // TBC need player verification.
────────────────────────────────────────────────────────────────── */
const CLASS_WEAPON_DATA = {

  // ── Explorer Warriors ──────────────────────────────────────────
  'Hero': {
    faction:     'Explorer',
    weaponTypes: ['Two-handed Sword', 'Two-handed Axe', 'One-handed Sword', 'One-handed Axe'],
    secondary:   'Medallion',   // wiki: Medallion exclusive to Hero; can also use Shield with 1H
  },
  'Paladin': {
    faction:     'Explorer',
    weaponTypes: ['Two-handed Blunt', 'Two-handed Sword', 'One-handed Blunt', 'One-handed Sword'],
    secondary:   'Rosary',              // Rosary (unique) or Shield with 1H weapons
  },
  'Dark Knight': {
    faction:     'Explorer',
    weaponTypes: ['Spear', 'Polearm'],
    secondary:   'Iron Chain',
  },

  // ── Explorer Mages ─────────────────────────────────────────────
  'Arch Mage (Fire, Poison)': {
    faction:     'Explorer',
    weaponTypes: ['Staff', 'Wand'],
    secondary:   'Magic Book',
  },
  'Arch Mage (Ice, Lightning)': {
    faction:     'Explorer',
    weaponTypes: ['Staff', 'Wand'],
    secondary:   'Magic Book',
  },
  'Bishop': {
    faction:     'Explorer',
    weaponTypes: ['Staff', 'Wand'],
    secondary:   'Magic Book',
  },

  // ── Explorer Archers ───────────────────────────────────────────
  'Bowmaster': {
    faction:     'Explorer',
    weaponTypes: ['Bow'],
    secondary:   'Arrow Fletching',
  },
  'Marksman': {
    faction:     'Explorer',
    weaponTypes: ['Crossbow'],
    secondary:   'Bow Thimble',
  },
  'Pathfinder': {
    faction:     'Explorer',
    weaponTypes: ['Ancient Bow'],
    secondary:   'Relic',
  },

  // ── Explorer Thieves ───────────────────────────────────────────
  'Night Lord': {
    faction:     'Explorer',
    weaponTypes: ['Claw'],
    secondary:   'Charm',
  },
  'Shadower': {
    faction:     'Explorer',
    weaponTypes: ['Dagger'],
    secondary:   'Dagger Scabbard',
  },
  'Dual Blade': {
    faction:     'Explorer',
    weaponTypes: ['Dagger'],
    secondary:   'Katara',
  },

  // ── Explorer Pirates ───────────────────────────────────────────
  'Buccaneer': {
    faction:     'Explorer',
    weaponTypes: ['Knuckle'],
    secondary:   'Wrist Band',
  },
  'Corsair': {
    faction:     'Explorer',
    weaponTypes: ['Gun'],
    secondary:   'Far Sight',
  },
  'Cannon Master': {
    faction:     'Explorer',
    weaponTypes: ['Hand Cannon'],
    secondary:   'Powder Keg',
  },

  // ── Cygnus Knights ─────────────────────────────────────────────
  'Dawn Warrior': {
    faction:     'Cygnus',
    weaponTypes: ['Two-handed Sword', 'One-handed Sword'],
    secondary:   'Jewel',              // Cygnus Jewel (or Shield with 1H sword)
  },
  'Mihile': {
    faction:     'Cygnus',
    weaponTypes: ['One-handed Sword'],
    secondary:   'Soul Shield',          // Soul Shield of Justice (unique Mihile icon)
  },
  'Blaze Wizard': {
    faction:     'Cygnus',
    weaponTypes: ['Staff', 'Wand'],
    secondary:   'Jewel',              // Cygnus Jewel (or Shield)
  },
  'Wind Archer': {
    faction:     'Cygnus',
    weaponTypes: ['Bow'],
    secondary:   'Jewel',              // Cygnus Jewel
  },
  'Night Walker': {
    faction:     'Cygnus',
    weaponTypes: ['Claw'],
    secondary:   'Jewel',              // Cygnus Jewel
  },
  'Thunder Breaker': {
    faction:     'Cygnus',
    weaponTypes: ['Knuckle'],
    secondary:   'Jewel',              // Cygnus Jewel
  },

  // ── MapleStory Heroes ──────────────────────────────────────────
  'Aran': {
    faction:     'Hero',
    weaponTypes: ['Polearm'],
    secondary:   'Mass',
  },
  'Evan': {
    faction:     'Hero',
    weaponTypes: ['Staff', 'Wand'],
    secondary:   'Document',
  },
  'Mercedes': {
    faction:     'Hero',
    weaponTypes: ['Dual Bowguns'],
    secondary:   'Magic Arrow',
  },
  'Phantom': {
    faction:     'Hero',
    weaponTypes: ['Cane'],
    secondary:   'Card',
  },
  'Luminous': {
    faction:     'Hero',
    weaponTypes: ['Shining Rod'],
    secondary:   'Orb',
  },
  'Shade (Eunwol)': {
    faction:     'Hero',
    weaponTypes: ['Knuckle'],
    secondary:   'Fox Marble',
  },

  // ── Resistance ─────────────────────────────────────────────────
  'Demon Slayer': {
    faction:     'Resistance',
    weaponTypes: ['One-handed Axe', 'One-handed Blunt'],
    secondary:   'Demon Aegis',
  },
  'Demon Avenger': {
    faction:     'Resistance',
    weaponTypes: ['Desperado'],
    secondary:   'Abyssal Path',
  },
  'Blaster': {
    faction:     'Resistance',
    weaponTypes: ['Arm Cannon'],
    secondary:   'Charge',
  },
  'Battle Mage': {
    faction:     'Resistance',
    weaponTypes: ['Staff'],
    secondary:   'Magic Marble',
  },
  'Wild Hunter': {
    faction:     'Resistance',
    weaponTypes: ['Crossbow'],
    secondary:   'Arrowhead',
  },
  'Mechanic': {
    faction:     'Resistance',
    weaponTypes: ['Gun'],
    secondary:   'Controller',
  },
  'Xenon': {
    faction:     'Resistance',
    weaponTypes: ['Whip Blade'],
    secondary:   'Controller',   // wiki: Controller exclusive to Xenon
  },
  'Kinesis': {
    faction:     'Resistance',
    weaponTypes: ['Psy-limiter'],
    secondary:   'Chess Piece',         // exclusive to Kinesis (wiki)
  },

  // ── Nova ───────────────────────────────────────────────────────
  'Kaiser': {
    faction:     'Nova',
    weaponTypes: ['Two-handed Sword'],
    secondary:   'Dragon Essence',
  },
  'Angelic Buster': {
    faction:     'Nova',
    weaponTypes: ['Soul Shooter'],
    secondary:   'Soul Ring',
  },
  'Cadena': {
    faction:     'Nova',
    weaponTypes: ['Chain'],
    secondary:   'Warp Forge',
  },
  'Kain': {
    faction:     'Nova',
    weaponTypes: ['Whispershot'],
    secondary:   'Weapon Belt',   // wiki: Weapon Belt exclusive to Kain
  },

  // ── Flora ──────────────────────────────────────────────────────
  'Adele': {
    faction:     'Flora',
    weaponTypes: ['Bladecaster'],
    secondary:   'Bladebinder',
  },
  'Illium': {
    faction:     'Flora',
    weaponTypes: ['Lucent Gauntlet'],
    secondary:   'Lucent Wings',
  },
  'Khali': {
    faction:     'Flora',
    weaponTypes: ['Chakram'],
    secondary:   'Hex Seeker',          // exclusive to Khali (wiki)
  },

  // ── Anima ──────────────────────────────────────────────────────
  'Ark': {
    faction:     'Anima',
    weaponTypes: ['Martial Brace'],
    secondary:   'Abyssal Path',   // wiki: Abyssal Path exclusive to Ark
  },
  'Hoyoung': {
    faction:     'Anima',
    weaponTypes: ['Ritual Fan'],
    secondary:   'Fan Tassel',   // wiki: Fan Tassel exclusive to Hoyoung
  },
  'Lara': {
    faction:     'Anima',
    weaponTypes: ['Wand'],
    secondary:   'Ornament',
  },
  'Mo Xuan': {
    faction:     'Jianghu',
    weaponTypes: ['Martial Brace'],
    secondary:   'Brace Band',
  },

  // ── Sengoku ────────────────────────────────────────────────────
  'Hayato': {
    faction:     'Sengoku',
    weaponTypes: ['Katana'],
    secondary:   'Kodachi',
  },
  'Kanna': {
    faction:     'Sengoku',
    weaponTypes: ['Fan'],
    secondary:   'Talisman',
  },

  // ── Zero ───────────────────────────────────────────────────────
  'Zero': {
    faction:     'Zero',
    weaponTypes: ['Long Sword', 'Heavy Sword'],  // Alpha (Long Sword) + Beta (Heavy Sword)
    secondary:   null,                           // Zero has no traditional secondary slot
  },

  // ── Other / Newer ──────────────────────────────────────────────
  'Ren': {
    faction:     'Anima',                //
    weaponTypes: ['Sword'],             // Ren's unique Sword type
    secondary:   'Imugi Gem',             // TBC
  },
  'Sia Astelle': {
    faction:     'Shine',             // TBC — faction not confirmed
    weaponTypes: ['Celestial Light'],
    secondary:   'Compass',
  },
  'Lynn': {
    faction:     'Anima',
    weaponTypes: ['Memorial Staff'],
    secondary:   'Leaf',   // wiki: Leaf exclusive to Lynn
  },
};

// Maps each class name to its Silver-tier (or Lesser) class emblem label.
// Used to resolve '__SILVER_EMBLEM__' sentinel in presets.
const CLASS_SILVER_EMBLEM = {
  'Hero':                       'Silver Maple Leaf Emblem',
  'Paladin':                    'Silver Maple Leaf Emblem',
  'Dark Knight':                'Silver Maple Leaf Emblem',
  'Arch Mage (Fire, Poison)':   'Silver Maple Leaf Emblem',
  'Arch Mage (Ice, Lightning)': 'Silver Maple Leaf Emblem',
  'Bishop':                     'Silver Maple Leaf Emblem',
  'Bowmaster':                  'Silver Maple Leaf Emblem',
  'Marksman':                   'Silver Maple Leaf Emblem',
  'Pathfinder':                 'Silver Maple Leaf Emblem',
  'Night Lord':                 'Silver Maple Leaf Emblem',
  'Shadower':                   'Silver Maple Leaf Emblem',
  'Dual Blade':                 'Silver Maple Leaf Emblem',
  'Buccaneer':                  'Silver Maple Leaf Emblem',
  'Corsair':                    'Silver Maple Leaf Emblem',
  'Cannon Master':              'Silver Maple Leaf Emblem',
  'Dawn Warrior':               'Silver Cygnus Emblem',
  'Blaze Wizard':               'Silver Cygnus Emblem',
  'Wind Archer':                'Silver Cygnus Emblem',
  'Night Walker':               'Silver Cygnus Emblem',
  'Thunder Breaker':            'Silver Cygnus Emblem',
  'Mihile':                     'Silver Cygnus Emblem',
  'Aran':                       'Silver Heroes Emblem (Aran)',
  'Evan':                       'Silver Heroes Emblem (Evan)',
  'Mercedes':                   'Silver Heroes Emblem (Mercedes)',
  'Phantom':                    'Silver Heroes Emblem (Phantom)',
  'Luminous':                   'Silver Heroes Emblem (Luminous)',
  'Shade (Eunwol)':             'Silver Heroes Emblem (Shade)',
  'Demon Slayer':               'Silver Demon Emblem',
  'Demon Avenger':              'Silver Demon Emblem',
  'Battle Mage':                'Silver Resistance Emblem',
  'Wild Hunter':                'Silver Resistance Emblem',
  'Mechanic':                   'Silver Resistance Emblem',
  'Blaster':                    'Silver Resistance Emblem',
  'Kinesis':                    'Silver Kinesis Emblem',
  'Kaiser':                     'Lesser Dragon Emblem',
  'Angelic Buster':             'Lesser Angel Emblem',
  'Cadena':                     'Silver Agent Emblem',
  'Kain':                       'Silver Hitman Emblem',
  'Adele':                      "Silver Knight's Emblem",
  'Illium':                     'Silver Crystal Emblem',
  'Khali':                      'Silver Chaser Emblem',
  'Ark':                        'Silver Abyssal Emblem',
  'Hoyoung':                    'Silver Three Paths Emblem',
  'Lara':                       'Silver Earthseer Emblem',
  'Mo Xuan':                    'Silver Xuanshan School Emblem',
  'Hayato':                     'Silver Crescent Emblem',
  'Kanna':                      'Silver Blossom Emblem',
  'Zero':                       'Eternal Time Emblem',
  'Ren':                        'Silver Sword Emblem',
  'Sia Astelle':                'Silver Guardian Emblem',
  'Lynn':                       'Silver Forest Emblem',
};

// Maps each class name to its Gold-tier class emblem label.
// Used to resolve '__GOLD_EMBLEM__' sentinel in presets.
const CLASS_GOLD_EMBLEM = {
  // ── Explorer ────────────────────────────────────────────────
  'Hero':                       'Gold Maple Leaf Emblem',
  'Paladin':                    'Gold Maple Leaf Emblem',
  'Dark Knight':                'Gold Maple Leaf Emblem',
  'Arch Mage (Fire, Poison)':   'Gold Maple Leaf Emblem',
  'Arch Mage (Ice, Lightning)': 'Gold Maple Leaf Emblem',
  'Bishop':                     'Gold Maple Leaf Emblem',
  'Bowmaster':                  'Gold Maple Leaf Emblem',
  'Marksman':                   'Gold Maple Leaf Emblem',
  'Pathfinder':                 'Gold Maple Leaf Emblem',
  'Night Lord':                 'Gold Maple Leaf Emblem',
  'Shadower':                   'Gold Maple Leaf Emblem',
  'Dual Blade':                 'Gold Maple Leaf Emblem',
  'Buccaneer':                  'Gold Maple Leaf Emblem',
  'Corsair':                    'Gold Maple Leaf Emblem',
  'Cannon Master':              'Gold Maple Leaf Emblem',
  // ── Cygnus Knights ──────────────────────────────────────────
  'Dawn Warrior':               'Gold Cygnus Emblem',
  'Blaze Wizard':               'Gold Cygnus Emblem',
  'Wind Archer':                'Gold Cygnus Emblem',
  'Night Walker':               'Gold Cygnus Emblem',
  'Thunder Breaker':            'Gold Cygnus Emblem',
  'Mihile':                     'Gold Cygnus Emblem',
  // ── Heroes ──────────────────────────────────────────────────
  'Aran':                       'Gold Heroes Emblem (Aran)',
  'Evan':                       'Gold Heroes Emblem (Evan)',
  'Mercedes':                   'Gold Heroes Emblem (Mercedes)',
  'Phantom':                    'Gold Heroes Emblem (Phantom)',
  'Luminous':                   'Gold Heroes Emblem (Luminous)',
  'Shade (Eunwol)':             'Gold Heroes Emblem (Shade)',
  // ── Resistance ──────────────────────────────────────────────
  'Demon Slayer':               'Gold Demon Emblem',
  'Demon Avenger':              'Gold Demon Emblem',
  'Battle Mage':                'Gold Resistance Emblem',
  'Wild Hunter':                'Gold Resistance Emblem',
  'Mechanic':                   'Gold Resistance Emblem',
  'Blaster':                    'Gold Resistance Emblem',
  'Kinesis':                    'Gold Kinesis Emblem',
  // ── Nova ────────────────────────────────────────────────────
  'Kaiser':                     'Dragon Emblem',
  'Angelic Buster':             'Angel Emblem',
  'Cadena':                     'Gold Agent Emblem',
  'Kain':                       'Gold Hitman Emblem',
  // ── Flora ───────────────────────────────────────────────────
  'Adele':                      "Gold Knight's Emblem",
  'Illium':                     'Gold Crystal Emblem',
  'Khali':                      'Gold Chaser Emblem',
  'Ark':                        'Gold Abyssal Emblem',
  // ── Anima / Jianghu ─────────────────────────────────────────
  'Hoyoung':                    'Gold Three Paths Emblem',
  'Lara':                       'Gold Earthseer Emblem',
  'Mo Xuan':                    'Gold Xuanshan School Emblem',
  // ── Sengoku ─────────────────────────────────────────────────
  'Hayato':                     'Gold Crescent Emblem',
  'Kanna':                      'Gold Blossom Emblem',
  // ── Other / Unique ──────────────────────────────────────────
  'Zero':                       'Eternal Time Emblem',
  'Ren':                        'Gold Sword Emblem',
  'Sia Astelle':                'Gold Guardian Emblem',
  'Lynn':                       'Gold Forest Emblem',
};

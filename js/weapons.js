'use strict';

/* ────────────────────────────────────────────────────────────────
   WEAPON TIER ITEMS
   Maps weapon type → tier (SETS key) → { label, icon }.
   icon = filename stem in MapleIcons/Gear Icons/Weapons/ (no .png).
   Entries marked // TBC have uncertain in-game names — verify
   against actual weapon item names before display.
────────────────────────────────────────────────────────────────── */
const WEAPON_TIER_ITEMS = {

  // ── Mage ───────────────────────────────────────────────────────
  'Staff': {
    Pensalir:   { label: 'Utgard Staff',                    icon: 'Utgard_Staff' },
    Fafnir:     { label: 'Fafnir Mana Crown',               icon: 'Fafnir_Mana_Crown' },
    Sweetwater: { label: 'Sweetwater Staff',                icon: 'Sweetwater_Staff' },
    Absolab:    { label: 'AbsoLab Spellsong Staff',         icon: 'AbsoLab_Spellsong_Staff' },
    Arcane:     { label: 'Arcane Umbra Staff',              icon: 'Arcane_Umbra_Staff' },
    Pitched:    { label: 'Genesis Staff',                   icon: 'Genesis_Staff' },
    Eternal:    { label: 'Destiny Staff',                   icon: 'Destiny_Staff' },
  },

  'Wand': {
    Pensalir:   { label: 'Utgard Wand',                     icon: 'Utgard_Staff' },           // no Wand-specific Utgard icon in set
    Fafnir:     { label: 'Fafnir Mana Taker',               icon: 'Fafnir_Mana_Crown' },          // no Mana Taker icon; using Staff icon
    Sweetwater: { label: 'Sweetwater Wand',                 icon: 'Sweetwater_Staff' },
    Absolab:    { label: 'AbsoLab Spellsong Wand',          icon: 'AbsoLab_Spellsong_Staff' },
    Arcane:     { label: 'Arcane Umbra Wand',               icon: 'Arcane_Umbra_Staff' },
    Pitched:    { label: 'Genesis Wand',                    icon: 'Genesis_Staff' },
    Eternal:    { label: 'Destiny Wand',                    icon: 'Destiny_Wand' },
  },

  'Shining Rod': {
    Pensalir:   { label: 'Utgard Shining Rod',              icon: 'Utgard_Shining_Rod' },
    Fafnir:     { label: 'Fafnir Mana Cradle',              icon: 'Fafnir_Mana_Cradle' },
    Sweetwater: { label: 'Sweetwater Shining Rod',          icon: 'Sweetwater_Shining_Rod' },
    Absolab:    { label: 'AbsoLab Shining Rod',             icon: 'AbsoLab_Shining_Rod' },
    Arcane:     { label: 'Arcane Umbra Shining Rod',        icon: 'Arcane_Umbra_Shining_Rod' },
    Pitched:    { label: 'Genesis Shining Rod',             icon: 'Genesis_Shining_Rod' },
    Eternal:    { label: 'Destiny Shining Rod',             icon: 'Destiny_Shining_Rod' },
  },

  'Memorial Staff': {
    Pensalir:   { label: 'Utgard Memorial Staff',           icon: 'Utgard_Memorial_Staff' },
    Fafnir:     { label: 'Fafnir Memorial Staff',           icon: 'Fafnir_Memorial_Staff' },
    Sweetwater: { label: 'Sweetwater Memorial Staff',       icon: 'Sweetwater_Memorial_Staff' },
    Absolab:    { label: 'AbsoLab Memorial Staff',          icon: 'AbsoLab_Memorial_Staff' },
    Arcane:     { label: 'Arcane Umbra Memorial Staff',     icon: 'Arcane_Umbra_Memorial_Staff' },
    Pitched:    { label: 'Genesis Memorial Staff',          icon: 'Genesis_Memorial_Staff' },
    Eternal:    { label: 'Destiny Memorial Staff',          icon: 'Destiny_Memorial_Staff' },
  },

  'Lucent Gauntlet': {
    Pensalir:   { label: 'Utgard Lucent Gauntlet',          icon: 'Utgard_Lucent_Gauntlet' },
    Fafnir:     { label: 'Fafnir Lucent Gauntlet',          icon: 'Fafnir_Lucent_Gauntlet' },
    Sweetwater: { label: 'Sweetwater Lucent Gauntlet',      icon: 'Sweetwater_Lucent_Gauntlet' },
    Absolab:    { label: 'AbsoLab Lucent Gauntlet',         icon: 'AbsoLab_Lucent_Gauntlet' },
    Arcane:     { label: 'Arcane Umbra Lucent Gauntlet',    icon: 'Arcane_Umbra_Lucent_Gauntlet' },
    Pitched:    { label: 'Genesis Lucent Gauntlet',         icon: 'Genesis_Lucent_Gauntlet' },
    Eternal:    { label: 'Destiny Lucent Gauntlet',         icon: 'Destiny_Lucent_Gauntlet' },
  },

  'Psy-limiter': {
    Pensalir:   { label: 'Utgard Psy-limiter',              icon: 'Utgard_Psy-limiter' },
    Fafnir:     { label: 'Fafnir Psy-limiter',              icon: 'Fafnir_Psy-limiter' },
    Sweetwater: { label: 'Sweetwater Psy-limiter',          icon: 'Sweetwater_Psy-limiter' },
    Absolab:    { label: 'AbsoLab Psy-limiter',             icon: 'AbsoLab_Psy-limiter' },
    Arcane:     { label: 'Arcane Umbra Psy-limiter',        icon: 'Arcane_Umbra_Psy-limiter' },
    Pitched:    { label: 'Genesis Psy-limiter',             icon: 'Genesis_Psy-limiter' },
    Eternal:    { label: 'Destiny Psy-limiter',             icon: 'Destiny_Psy-limiter' },
  },

  'Celestial Light': {
    // Sia Astelle — used in conjunction with Compass secondary
    Pensalir:   { label: 'Utgard Celestial Light',          icon: 'Utgard_Celestial_Light' },
    Fafnir:     { label: 'Fafnir Celestial Light',          icon: 'Fafnir_Celestial_Light' },
    Sweetwater: { label: 'Sweetwater Celestial Light',      icon: 'Sweetwater_Celestial_Light' },
    Absolab:    { label: 'AbsoLab Celestial Light',         icon: 'AbsoLab_Celestial_Light' },
    Arcane:     { label: 'Arcane Umbra Celestial Light',    icon: 'Arcane_Umbra_Celestial_Light' },
    Pitched:    { label: 'Genesis Celestial Light',         icon: 'Genesis_Celestial_Light' },
    Eternal:    { label: 'Destiny Celestial Light',         icon: 'Destiny_Celestial_Light' },
  },

  // ── Warrior ────────────────────────────────────────────────────
  'One-handed Sword': {
    Pensalir:   { label: 'Utgard Saber',                    icon: 'Utgard_Saber' },
    Fafnir:     { label: 'Fafnir Mistilteinn',              icon: 'Fafnir_Mistilteinn' },
    Sweetwater: { label: 'Sweetwater One-handed Sword',     icon: 'Sweetwater_Sword_(One-handed_Sword)' },
    Absolab:    { label: 'AbsoLab Saber',                   icon: 'AbsoLab_Saber' },
    Arcane:     { label: 'Arcane Umbra Saber',              icon: 'Arcane_Umbra_Saber' },
    Pitched:    { label: 'Genesis Saber',                   icon: 'Genesis_Saber' },
    Eternal:    { label: 'Destiny Saber',                   icon: 'Destiny_Saber' },
  },

  'Two-handed Sword': {
    Pensalir:   { label: 'Utgard Two-handed Sword',         icon: 'Utgard_Giantslayer_Sword' },
    Fafnir:     { label: 'Fafnir Penitent Tears',           icon: 'Fafnir_Penitent_Tears' },
    Sweetwater: { label: 'Sweetwater Two-handed Sword',     icon: 'Sweetwater_Two-handed_Sword' },
    Absolab:    { label: 'AbsoLab Broad Saber',             icon: 'AbsoLab_Broad_Saber' },
    Arcane:     { label: 'Arcane Umbra Two-handed Sword',   icon: 'Arcane_Umbra_Two-handed_Sword' },
    Pitched:    { label: 'Genesis Two-handed Sword',        icon: 'Genesis_Two-handed_Sword' },
    Eternal:    { label: 'Destiny Two-handed Sword',        icon: 'Destiny_Two-handed_Sword' },
  },

  'One-handed Blunt': {
    Pensalir:   { label: 'Utgard Hair',                     icon: 'Utgard_Hair' },
    Fafnir:     { label: 'Fafnir Guardian Hammer',          icon: 'Fafnir_Guardian_Hammer' },
    Sweetwater: { label: 'Sweetwater Mace',                 icon: 'Sweetwater_Mace' },
    Absolab:    { label: 'AbsoLab Bit Hammer',              icon: 'AbsoLab_Bit_Hammer' },
    Arcane:     { label: 'Arcane Umbra Hammer',             icon: 'Arcane_Umbra_Hammer' },
    Pitched:    { label: 'Genesis Hammer',                  icon: 'Genesis_Hammer' },
    Eternal:    { label: 'Destiny Hammer',                  icon: 'Destiny_Hammer' },
  },

  'Two-handed Blunt': {
    Pensalir:   { label: 'Utgard Two-handed Hammer',        icon: 'Utgard_Two-handed_Hammer' },
    Fafnir:     { label: 'Fafnir Lightning Striker',        icon: 'Fafnir_Lightning_Striker' },
    Sweetwater: { label: 'Sweetwater Maul',                 icon: 'Sweetwater_Maul' },
    Absolab:    { label: 'AbsoLab Broad Hammer',            icon: 'AbsoLab_Broad_Hammer' },
    Arcane:     { label: 'Arcane Umbra Two-handed Hammer',  icon: 'Arcane_Umbra_Two-handed_Hammer' },
    Pitched:    { label: 'Genesis Two-handed Hammer',       icon: 'Genesis_Two-handed_Hammer' },
    Eternal:    { label: 'Destiny Two-handed Hammer',       icon: 'Destiny_Two-handed_Hammer' },
  },

  'Spear': {
    Pensalir:   { label: 'Utgard Spear',                    icon: 'Utgard_Spear' },
    Fafnir:     { label: 'Fafnir Brionak',                  icon: 'Fafnir_Brionak' },
    Sweetwater: { label: 'Sweetwater Spear',                icon: 'Sweetwater_Spear' },
    Absolab:    { label: 'AbsoLab Piercing Spear',          icon: 'AbsoLab_Piercing_Spear' },
    Arcane:     { label: 'Arcane Umbra Spear',              icon: 'Arcane_Umbra_Spear' },
    Pitched:    { label: 'Genesis Spear',                   icon: 'Genesis_Spear' },
    Eternal:    { label: 'Destiny Spear',                   icon: 'Destiny_Spear' },
  },

  'Polearm': {
    Pensalir:   { label: 'Utgard Hellslayer',               icon: 'Utgard_Hellslayer' },
    Fafnir:     { label: 'Fafnir Moon Glaive',              icon: 'Fafnir_Moon_Glaive' },
    Sweetwater: { label: 'Sweetwater Polearm',              icon: 'Sweetwater_Polearm' },
    Absolab:    { label: 'AbsoLab Hellslayer',              icon: 'AbsoLab_Hellslayer' },
    Arcane:     { label: 'Arcane Umbra Polearm',            icon: 'Arcane_Umbra_Polearm' },
    Pitched:    { label: 'Genesis Polearm',                 icon: 'Genesis_Polearm' },
    Eternal:    { label: 'Destiny Polearm',                 icon: 'Destiny_Polearm' },
  },

  'One-handed Axe': {
    Pensalir:   { label: 'Utgard Axe',                      icon: 'Utgard_Axe' },
    Fafnir:     { label: 'Fafnir Twin Cleaver',             icon: 'Fafnir_Twin_Cleaver' },
    Sweetwater: { label: 'Sweetwater Axe',                  icon: 'Sweetwater_Axe' },
    Absolab:    { label: 'AbsoLab Axe',                     icon: 'AbsoLab_Axe' },
    Arcane:     { label: 'Arcane Umbra Axe',                icon: 'Arcane_Umbra_Axe' },
    Pitched:    { label: 'Genesis Axe',                     icon: 'Genesis_Axe' },
    Eternal:    { label: 'Destiny Axe',                     icon: 'Destiny_Axe' },
  },

  'Two-handed Axe': {
    Pensalir:   { label: 'Utgard Two-handed Axe',           icon: 'Utgard_Two-handed_Axe' },
    Fafnir:     { label: 'Fafnir Battle Cleaver',           icon: 'Fafnir_Battle_Cleaver' },
    Sweetwater: { label: 'Sweetwater Two-handed Axe',       icon: 'Sweetwater_Two-handed_Axe' },
    Absolab:    { label: 'AbsoLab Broad Axe',               icon: 'AbsoLab_Broad_Axe' },
    Arcane:     { label: 'Arcane Umbra Two-handed Axe',     icon: 'Arcane_Umbra_Two-handed_Axe' },
    Pitched:    { label: 'Genesis Two-handed Axe',          icon: 'Genesis_Two-handed_Axe' },
    Eternal:    { label: 'Destiny Two-handed Axe',          icon: 'Destiny_Two-handed_Axe' },
  },

  'Desperado': {
    Pensalir:   { label: 'Utgard Desperado',                icon: 'Utgard_Desperado' },
    Fafnir:     { label: 'Fafnir Death Bringer',            icon: 'Fafnir_Death_Bringer' },
    Sweetwater: { label: 'Sweetwater Demon Sword',          icon: 'Sweetwater_Demon_Sword' },
    Absolab:    { label: 'AbsoLab Desperado',               icon: 'AbsoLab_Desperado' },
    Arcane:     { label: 'Arcane Umbra Desperado',          icon: 'Arcane_Umbra_Desperado' },
    Pitched:    { label: 'Genesis Desperado',               icon: 'Genesis_Desperado' },
    Eternal:    { label: 'Destiny Desperado',               icon: 'Destiny_Desperado' },
  },

  'Bladecaster': {
    Pensalir:   { label: 'Utgard Restraint',                icon: 'Utgard_Restraint' },
    Fafnir:     { label: 'Fafnir Mercy',                    icon: 'Fafnir_Mercy' },
    Sweetwater: { label: 'Sweetwater Bladecaster',          icon: 'Sweetwater_Bladecaster' },
    Absolab:    { label: 'AbsoLab Bladecaster',             icon: 'AbsoLab_Bladecaster' },
    Arcane:     { label: 'Arcane Umbra Bladecaster',        icon: 'Arcane_Umbra_Bladecaster' },
    Pitched:    { label: 'Genesis Bladecaster',             icon: 'Genesis_Bladecaster' },
    Eternal:    { label: 'Destiny Bladecaster',             icon: 'Destiny_Bladecaster' },
  },

  'Arm Cannon': {
    Pensalir:   { label: 'Utgard Hrimthurs',                icon: 'Utgard_Hrimthurs' },
    Fafnir:     { label: 'Fafnir Big Mountain',             icon: 'Fafnir_Big_Mountain' },
    Sweetwater: { label: 'Sweetwater Gauntlet Buster',      icon: 'Sweetwater_Gauntlet_Buster' },
    Absolab:    { label: 'AbsoLab Pile God',                icon: 'AbsoLab_Pile_God' },
    Arcane:     { label: 'Arcane Umbra Ellaha',             icon: 'Arcane_Umbra_Ellaha' },
    Pitched:    { label: 'Genesis Ellaha',                  icon: 'Genesis_Ellaha' },
    Eternal:    { label: 'Destiny Ellaha',                  icon: 'Genesis_Ellaha' },             // no Destiny Ellaha icon; using Genesis
  },

  'Katana': {
    Pensalir:   { label: 'Utgard Katana',                   icon: 'Utgard_Katana' },
    Fafnir:     { label: 'Fafnir Raven Ring',                icon: 'Fafnir_Raven_Ring' },
    Sweetwater: { label: 'Sweetwater Katana',               icon: 'Sweetwater_Katana' },
    Absolab:    { label: 'AbsoLab Katana',                  icon: 'AbsoLab_Katana' },
    Arcane:     { label: 'Arcane Umbra Katana',             icon: 'Arcane_Umbra_Katana' },
    Pitched:    { label: 'Genesis Katana',                  icon: 'Genesis_Katana' },
    Eternal:    { label: 'Destiny Katana',                  icon: 'Destiny_Katana' },
  },

  // Zero — Long Sword (Alpha) uses Lazuli icons, Heavy Sword (Beta) uses Lapis icons
  'Long Sword': {
    Pensalir:   { label: 'Utgard Long Sword',               icon: 'Lazuli_Type_7' },
    Fafnir:     { label: 'Fafnir Long Sword',               icon: 'Lazuli_Type_7' },
    Sweetwater: { label: 'Sweetwater Long Sword',           icon: 'Lazuli_Type_7' },
    Absolab:    { label: 'AbsoLab Long Sword',              icon: 'Lazuli_Type_8' },
    Arcane:     { label: 'Arcane Umbra Long Sword',         icon: 'Lazuli_Type_9' },
    Pitched:    { label: 'Genesis Long Sword',              icon: 'Genesis_Lazuli' },
    Eternal:    { label: 'Destiny Long Sword',              icon: 'Destiny_Lazuli' },
  },
  'Heavy Sword': {
    Pensalir:   { label: 'Utgard Heavy Sword',              icon: 'Lapis_Type_7' },
    Fafnir:     { label: 'Fafnir Heavy Sword',              icon: 'Lapis_Type_7' },
    Sweetwater: { label: 'Sweetwater Heavy Sword',          icon: 'Lapis_Type_7' },
    Absolab:    { label: 'AbsoLab Heavy Sword',             icon: 'Lapis_Type_8' },
    Arcane:     { label: 'Arcane Umbra Heavy Sword',        icon: 'Lapis_Type_9' },
    Pitched:    { label: 'Genesis Heavy Sword',             icon: 'Genesis_Lapis' },
    Eternal:    { label: 'Destiny Heavy Sword',             icon: 'Destiny_Lapis' },
  },

  // Ren — unique Sword type (not a standard warrior sword)
  'Sword': {
    Pensalir:   {label: 'Utgard Giantslayer Sword',         icon: 'Utgard_Giantslayer_Sword' },
    Fafnir:     {label: 'Fafnir Soaring Sword',             icon: 'Fafnir_Soaring_Sword'},
    Sweetwater: { label: 'Sweetwater Sword',                icon: 'Sweetwater_Sword_(Sword)' },
    Absolab:    { label: 'AbsoLab Furious Sword',           icon: 'AbsoLab_Furious_Sword' },
    Arcane:     { label: 'Arcane Umbra Illusory Sword',     icon: 'Arcane_Umbra_Illusory_Sword' },
    Pitched:    { label: 'Genesis Sword',                   icon: 'Genesis_Sword' },
    Eternal:    { label: 'Destiny Sword',                   icon: 'Destiny_Sword' },
  },

  // ── Archer ─────────────────────────────────────────────────────
  'Bow': {
    Pensalir:   { label: 'Utgard Bow',                      icon: 'Utgard_Bow' },
    Fafnir:     { label: 'Fafnir Wind Chaser',              icon: 'Fafnir_Wind_Chaser' },
    Sweetwater: { label: 'Sweetwater Bow',                  icon: 'Sweetwater_Bow' },
    Absolab:    { label: 'AbsoLab Sureshot Bow',            icon: 'AbsoLab_Sureshot_Bow' },
    Arcane:     { label: 'Arcane Umbra Bow',                icon: 'Arcane_Umbra_Bow' },
    Pitched:    { label: 'Genesis Bow',                     icon: 'Genesis_Bow' },
    Eternal:    { label: 'Destiny Bow',                     icon: 'Destiny_Bow' },
  },

  'Crossbow': {
    Pensalir:   { label: 'Utgard Crossbow',                 icon: 'Utgard_Crossbow' },
    Fafnir:     { label: 'Fafnir Windwing Shooter',         icon: 'Fafnir_Windwing_Shooter' },
    Sweetwater: { label: 'Sweetwater Crossbow',             icon: 'Sweetwater_Crossbow' },
    Absolab:    { label: 'AbsoLab Crossbow',                icon: 'AbsoLab_Crossbow' },
    Arcane:     { label: 'Arcane Umbra Crossbow',           icon: 'Arcane_Umbra_Crossbow' },
    Pitched:    { label: 'Genesis Crossbow',                icon: 'Genesis_Crossbow' },
    Eternal:    { label: 'Destiny Crossbow',                icon: 'Destiny_Crossbow' },
  },

  'Ancient Bow': {
    Pensalir:   { label: 'Utgard Ancient Bow',              icon: 'Utgard_Ancient_Bow' },
    Fafnir:     { label: 'Fafnir Ancient Bow',              icon: 'Fafnir_Ancient_Bow' },
    Sweetwater: { label: 'Sweetwater Ancient Bow',          icon: 'Sweetwater_Ancient_Bow' },
    Absolab:    { label: 'AbsoLab Ancient Bow',             icon: 'AbsoLab_Ancient_Bow' },
    Arcane:     { label: 'Arcane Umbra Ancient Bow',        icon: 'Arcane_Umbra_Ancient_Bow' },
    Pitched:    { label: 'Genesis Ancient Bow',             icon: 'Genesis_Ancient_Bow' },
    Eternal:    { label: 'Destiny Ancient Bow',             icon: 'Destiny_Ancient_Bow' },
  },

  'Dual Bowguns': {
    Pensalir:   { label: 'Utgard Dual Bowguns',             icon: 'Utgard_Dual_Bowguns' },
    Fafnir:     { label: 'Fafnir Dual Windwing',            icon: 'Fafnir_Dual_Windwing' },
    Sweetwater: { label: 'Sweetwater Twin Angels',          icon: 'Sweetwater_Twin_Angels' },
    Absolab:    { label: 'AbsoLab Dual Bowguns',            icon: 'AbsoLab_Dual_Bowguns' },
    Arcane:     { label: 'Arcane Umbra Dual Bowguns',       icon: 'Arcane_Umbra_Dual_Bowguns' },
    Pitched:    { label: 'Genesis Dual Bowguns',            icon: 'Genesis_Dual_Bowguns' },
    Eternal:    { label: 'Destiny Dual Bowguns',            icon: 'Destiny_Dual_Bowguns' },
  },

  'Whispershot': {
    Pensalir:   { label: 'Utgard Whispershot',              icon: 'Utgard_Whispershot' },
    Fafnir:     { label: 'Fafnir Nightchaser',              icon: 'Fafnir_Nightchaser' },
    Sweetwater: { label: 'Sweetwater Whispershot',          icon: 'Sweetwater_Whispershot' },
    Absolab:    { label: 'AbsoLab Whispershot',             icon: 'AbsoLab_Whispershot' },
    Arcane:     { label: 'Arcane Umbra Whispershot',        icon: 'Arcane_Umbra_Whispershot' },
    Pitched:    { label: 'Genesis Whispershot',             icon: 'Genesis_Whispershot' },    // TBC
    Eternal:    { label: 'Destiny Whispershot',             icon: 'Destiny_Whispershot' },
  },

  // ── Thief ──────────────────────────────────────────────────────
  'Claw': {
    Pensalir:   { label: 'Utgard Guards',                   icon: 'Utgard_Guards' },
    Fafnir:     { label: 'Fafnir Risk Holder',              icon: 'Fafnir_Risk_Holder' },
    Sweetwater: { label: 'Sweetwater Steer',                icon: 'Sweetwater_Steer' },
    Absolab:    { label: 'AbsoLab Revenge Guard',           icon: 'AbsoLab_Revenge_Guard' },
    Arcane:     { label: 'Arcane Umbra Guards',             icon: 'Arcane_Umbra_Guards' },
    Pitched:    { label: 'Genesis Guards',                  icon: 'Genesis_Guards' },
    Eternal:    { label: 'Destiny Guards',                  icon: 'Destiny_Guards' },
  },

  'Dagger': {
    Pensalir:   { label: 'Utgard Dagger',                   icon: 'Utgard_Dagger' },
    Fafnir:     { label: 'Fafnir Damascus',                 icon: 'Fafnir_Damascus' },
    Sweetwater: { label: 'Sweetwater Knife',                 icon: 'Sweetwater_Knife' },
    Absolab:    { label: 'AbsoLab Blade Lord',              icon: 'AbsoLab_Blade_Lord' },
    Arcane:     { label: 'Arcane Umbra Dagger',             icon: 'Arcane_Umbra_Dagger' },
    Pitched:    { label: 'Genesis Dagger',                  icon: 'Genesis_Dagger' },
    Eternal:    { label: 'Destiny Dagger',                  icon: 'Destiny_Dagger' },
  },

  'Cane': {
    Pensalir:   { label: 'Utgard Cane',                     icon: 'Utgard_Cane' },
    Fafnir:     { label: 'Fafnir Ciel Claire',              icon: 'Fafnir_Ciel_Claire' },
    Sweetwater: { label: 'Sweetwater Cane',                 icon: 'Sweetwater_Cane' },
    Absolab:    { label: 'AbsoLab Cane',                    icon: 'AbsoLab_Forked_Cane' },
    Arcane:     { label: 'Arcane Umbra Cane',               icon: 'Arcane_Umbra_Cane' },
    Pitched:    { label: 'Genesis Cane',                    icon: 'Genesis_Cane' },
    Eternal:    { label: 'Destiny Cane',                    icon: 'Destiny_Cane' },
  },

  'Whip Blade': {
    Pensalir:   { label: 'Utgard Whip Blade',               icon: 'Utgard_Energy_Chain' },
    Fafnir:     { label: 'Fafnir Whip Blade',               icon: 'AbsoLab_Whip_Blade' },         // no Fafnir Whip Blade icon
    Sweetwater: { label: 'Sweetwater Whip Blade',           icon: 'AbsoLab_Whip_Blade' },         // no Sweetwater Whip Blade icon
    Absolab:    { label: 'AbsoLab Whip Blade',              icon: 'AbsoLab_Whip_Blade' },
    Arcane:     { label: 'Arcane Umbra Whip Blade',         icon: 'Arcane_Umbra_Energy_Chain' },
    Pitched:    { label: 'Genesis Whip Blade',              icon: 'Genesis_Energy_Chain' },
    Eternal:    { label: 'Destiny Whip Blade',              icon: 'Destiny_Energy_Chain' },
  },

  'Chain': {
    Pensalir:   { label: 'Utgard Chain',                    icon: 'Utgard_Chain' },
    Fafnir:     { label: 'Fafnir Chain',                    icon: 'Fafnir_Chain' },
    Sweetwater: { label: 'Sweetwater Chain',                icon: 'Sweetwater_Chain' },
    Absolab:    { label: 'AbsoLab Chain',                   icon: 'AbsoLab_Chain' },
    Arcane:     { label: 'Arcane Umbra Chain',              icon: 'Arcane_Umbra_Chain' },
    Pitched:    { label: 'Genesis Chain',                   icon: 'Genesis_Chain' },
    Eternal:    { label: 'Destiny Chain',                   icon: 'Destiny_Chain' },
  },

  'Ritual Fan': {
    // Hoyoung — weapon type is "Ritual Fan"
    Pensalir:   { label: 'Utgard Giant Ritual Fan',         icon: 'Utgard_Giant_Ritual_Fan' },
    Fafnir:     { label: 'Fafnir Dragon Ritual Fan',        icon: 'Fafnir_Dragon_Ritual_Fan' },
    Sweetwater: { label: 'Sweetwater Ritual Fan',           icon: 'Sweetwater_Ritual_Fan' },
    Absolab:    { label: 'AbsoLab Monster Ritual Fan',      icon: 'AbsoLab_Monster_Ritual_Fan' },
    Arcane:     { label: 'Arcane Umbra Super Ritual Fan',   icon: 'Arcane_Umbra_Super_Ritual_Fan' },
    Pitched:    { label: 'Genesis Ritual Fan',              icon: 'Genesis_Ritual_Fan' },
    Eternal:    { label: 'Destiny Ritual Fan',              icon: 'Destiny_Ritual_Fan' },
  },

  'Chakram': {
    Pensalir:   { label: 'Utgard Chakram',                  icon: 'Arcane_Umbra_Chakram' },  // TBC — earliest icon
    Fafnir:     { label: 'Fafnir Chakram',                  icon: 'Fafnir_Chakram' },
    Sweetwater: { label: 'Sweetwater Chakram',              icon: 'Sweetwater_Chakram' },
    Absolab:    { label: 'AbsoLab Chakram',                 icon: 'AbsoLab_Chakram' },
    Arcane:     { label: 'Arcane Umbra Chakram',            icon: 'Arcane_Umbra_Chakram' },
    Pitched:    { label: 'Genesis Chakram',                 icon: 'Arcane_Umbra_Chakram' },       // no Genesis Chakram icon available
    Eternal:    { label: 'Destiny Chakram',                 icon: 'Destiny_Chakram' },
  },

  // ── Pirate ─────────────────────────────────────────────────────
  'Knuckle': {
    Pensalir:   { label: 'Utgard Claw',                     icon: 'Utgard_Claw' },
    Fafnir:     { label: 'Fafnir Perry Talon',              icon: 'Fafnir_Perry_Talon' },
    Sweetwater: { label: 'Sweetwater Grip',                 icon: 'Sweetwater_Grip' },
    Absolab:    { label: 'AbsoLab Blast Knuckle',           icon: 'AbsoLab_Blast_Knuckle' },
    Arcane:     { label: 'Arcane Umbra Knuckle',            icon: 'Arcane_Umbra_Knuckle' },
    Pitched:    { label: 'Genesis Claw',                    icon: 'Genesis_Claw' },
    Eternal:    { label: 'Destiny Claw',                    icon: 'Destiny_Claw' },
  },

  'Gun': {
    Pensalir:   { label: 'Utgard Pistol',                   icon: 'Utgard_Pistol' },
    Fafnir:     { label: 'Fafnir Zeliska',                  icon: 'Fafnir_Zeliska' },
    Sweetwater: { label: 'Sweetwater Shooter',              icon: 'Sweetwater_Shooter' },
    Absolab:    { label: 'AbsoLab Point Gun',               icon: 'AbsoLab_Point_Gun' },
    Arcane:     { label: 'Arcane Umbra Pistol',             icon: 'Arcane_Umbra_Pistol' },
    Pitched:    { label: 'Genesis Pistol',                  icon: 'Genesis_Pistol' },
    Eternal:    { label: 'Destiny Pistol',                  icon: 'Destiny_Pistol' },
  },

  'Hand Cannon': {
    Pensalir:   { label: 'Utgard Siege Gun',                icon: 'Utgard_Siege_Gun' },
    Fafnir:     { label: 'Fafnir Lost Cannon',              icon: 'Fafnir_Lost_Cannon' },
    Sweetwater: { label: 'Sweetwater Hand Cannon',          icon: 'Sweetwater_Hand_Cannon' },
    Absolab:    { label: 'AbsoLab Blast Cannon',            icon: 'AbsoLab_Blast_Cannon' },
    Arcane:     { label: 'Arcane Umbra Siege Gun',          icon: 'Arcane_Umbra_Siege_Gun' },
    Pitched:    { label: 'Genesis Siege Gun',               icon: 'Genesis_Siege_Gun' },
    Eternal:    { label: 'Destiny Blast Cannon',            icon: 'Destiny_Blast_Cannon' },
  },

  'Soul Shooter': {
    Pensalir:   { label: 'Utgard Dragon Soul',               icon: 'Utgard_Dragon_Soul' },
    Fafnir:     { label: 'Fafnir Soul Shooter',             icon: 'Fafnir_Angelic_Shooter' },
    Sweetwater: { label: 'Sweetwater Soul Shooter',         icon: 'Sweetwater_Soul_Shooter' },
    Absolab:    { label: 'AbsoLab Soul Shooter',            icon: 'AbsoLab_Soul_Shooter' },
    Arcane:     { label: 'Arcane Umbra Soul Shooter',       icon: 'Arcane_Umbra_Soul_Shooter' },
    Pitched:    { label: 'Genesis Soul Shooter',            icon: 'Genesis_Soul_Shooter' },
    Eternal:    { label: 'Destiny Soul Shooter',            icon: 'Destiny_Soul_Shooter' },
  },

  'Martial Brace': {
    Pensalir:   { label: 'Utgard Martial Brace',            icon: 'Utgard_Martial_Brace' },
    Fafnir:     { label: 'Fafnir Martial Brace',            icon: 'Fafnir_Martial_Brace' },
    Sweetwater: { label: 'Sweetwater Martial Brace',        icon: 'Sweetwater_Martial_Brace' },
    Absolab:    { label: 'AbsoLab Martial Brace',           icon: 'AbsoLab_Martial_Brace' },
    Arcane:     { label: 'Arcane Umbra Martial Brace',      icon: 'Arcane_Umbra_Martial_Brace' },
    Pitched:    { label: 'Genesis Martial Brace',           icon: 'Genesis_Martial_Brace' },
    Eternal:    { label: 'Destiny Martial Brace',           icon: 'Destiny_Martial_Brace' },
  },

  'Fan': {
    // Kanna — weapon type is "Fan"; in-game items are called "Spirit Walker Fan"
    Pensalir:   { label: 'Utgard Spirit Walker Fan',        icon: 'Utgard_Spirit_Walker_Fan' },
    Fafnir:     { label: 'Fafnir Spirit Walker Fan',        icon: 'Fafnir_Spirit_Walker_Fan' },
    Sweetwater: { label: 'Sweetwater Spirit Walker Fan',    icon: 'Sweetwater_Spirit_Walker_Fan' },
    Absolab:    { label: 'AbsoLab Spirit Walker Fan',       icon: 'AbsoLab_Spirit_Walker_Fan' },
    Arcane:     { label: 'Arcane Umbra Spirit Walker Fan',  icon: 'Arcane_Umbra_Spirit_Walker_Fan' },
    Pitched:    { label: 'Genesis Spirit Walker Fan',       icon: 'Genesis_Spirit_Walker_Fan' },
    Eternal:    { label: 'Destiny Spirit Walker Fan',       icon: 'Destiny_Spirit_Walker_Fan' },
  },
};

/* ────────────────────────────────────────────────────────────────
   WEAPON ICON MAP  (label → icon stem for Weapon slot icon lookup)
   Auto-populated from WEAPON_TIER_ITEMS at startup below.
   Used by itemIconCandidates to find class-specific weapon icons.
────────────────────────────────────────────────────────────────── */
const WEAPON_LABEL_ICON = (() => {
  const map = {};
  for (const tiers of Object.values(WEAPON_TIER_ITEMS)) {
    for (const { label, icon } of Object.values(tiers)) {
      if (!map[label]) map[label] = icon;
    }
  }
  return map;
})();

// Register every class-specific weapon label in ITEM_TIER so tier colours and icon paths work
;(() => {
  const tierKeyMap = { Pensalir:'Pensalir', Fafnir:'Fafnir', Sweetwater:'Sweetwater',
                       Absolab:'Absolab', Arcane:'Arcane', Pitched:'Pitched', Eternal:'Eternal' };
  Object.values(WEAPON_TIER_ITEMS).forEach(tiers =>
    Object.entries(tiers).forEach(([k, { label }]) => {
      if (!ITEM_TIER[label]) ITEM_TIER[label] = tierKeyMap[k] ?? k;
    })
  );
})();

// Fill weapon lists for GEAR_SETS so the Sets column counts set pieces correctly
;(() => {
  if (typeof GEAR_SETS === 'undefined') return;
  const tierToSet = { Fafnir: 'CRA', Arcane: 'Arcane', Absolab: 'Absolab', Eternal: 'Eternal' };
  const fafnirLabels = ['CRA Weapon'];
  const arcaneLabels = [];
  const absolabLabels = [];
  const eternalLabels = [];
  Object.values(WEAPON_TIER_ITEMS).forEach(tiers => {
    if (tiers.Fafnir) fafnirLabels.push(tiers.Fafnir.label);
    if (tiers.Arcane) arcaneLabels.push(tiers.Arcane.label);
    if (tiers.Absolab) absolabLabels.push(tiers.Absolab.label);
    if (tiers.Eternal) eternalLabels.push(tiers.Eternal.label);
  });
  if (GEAR_SETS.CRA?.items) GEAR_SETS.CRA.items.Weapon = new Set(fafnirLabels);
  if (GEAR_SETS.Arcane?.items && Array.isArray(GEAR_SETS.Arcane.items.Weapon)) {
    GEAR_SETS.Arcane.items.Weapon = new Set(['Arcane Umbra Weapon', ...arcaneLabels]);
  }
  if (GEAR_SETS.Absolab?.items && Array.isArray(GEAR_SETS.Absolab.items.Weapon)) {
    GEAR_SETS.Absolab.items.Weapon = new Set(['Absolab Weapon', ...absolabLabels]);
  }
  if (GEAR_SETS.Eternal?.items && Array.isArray(GEAR_SETS.Eternal.items.Weapon)) {
    GEAR_SETS.Eternal.items.Weapon = new Set(['Destiny Weapon', ...eternalLabels]);
  }
})();

/* ── Helper: build SLOT_ITEMS-compatible weapon list for a class ───── */
function getWeaponItemsForClass(cls) {
  const data = CLASS_WEAPON_DATA[cls];
  if (!data) return null;    // fall back to generic SLOT_ITEMS['Weapon']
  // Zero: only Long Sword in weapon dropdown; Heavy is forced in Secondary
  const weaponTypes = cls === 'Zero' ? ['Long Sword'] : data.weaponTypes;
  const seen   = new Set();
  const items  = [];
  const TIER_ORDER = ['Pensalir', 'Fafnir', 'Sweetwater', 'Absolab', 'Arcane', 'Pitched', 'Eternal'];
  const TIER_MAP   = { Pensalir: 'Pensalir', Fafnir: 'Fafnir', Sweetwater: 'Sweetwater',
                       Absolab: 'Absolab', Arcane: 'Arcane', Pitched: 'Pitched', Eternal: 'Eternal' };
  for (const tierKey of TIER_ORDER) {
    for (const wType of weaponTypes) {
      const entry = WEAPON_TIER_ITEMS[wType]?.[tierKey];
      if (!entry) continue;
      if (seen.has(entry.label)) continue;
      seen.add(entry.label);
      items.push({ label: entry.label, tier: TIER_MAP[tierKey] });
    }
  }
  return items.length ? items : null;
}

/** Zero: get the Heavy Sword label that pairs with the given Long Sword label. */
function getHeavySwordForLong(longSwordLabel) {
  if (!longSwordLabel || longSwordLabel === 'None') return null;
  const tiers = WEAPON_TIER_ITEMS['Heavy Sword'];
  if (!tiers) return null;
  const longTiers = WEAPON_TIER_ITEMS['Long Sword'];
  if (!longTiers) return null;
  for (const [tierKey, entry] of Object.entries(longTiers)) {
    if (entry.label === longSwordLabel && tiers[tierKey]) return tiers[tierKey].label;
  }
  return null;
}

/** Zero: single-item list for Secondary slot (the Heavy that matches the current Long). */
function getZeroSecondaryItems(longWeaponLabel) {
  const heavyLabel = getHeavySwordForLong(longWeaponLabel);
  const label = heavyLabel || (WEAPON_TIER_ITEMS['Heavy Sword']?.Pensalir?.label) || 'Utgard Heavy Sword';
  const tier = ITEM_TIER[label] || 'Pensalir';
  return [{ label, tier }];
}

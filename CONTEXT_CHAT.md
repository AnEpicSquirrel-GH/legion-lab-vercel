# Legion Lab – Chat context for new session

Use this when starting a new chat to continue work on the project.

## Project
**Legion Lab** – MapleStory gear/accessory tracker webtool (HTML/CSS/JS, no build step). Tracks characters and their equipment (weapons, armor, accessories), star force, presets, and set effects.

## Key files
- **js/data.js** – Slot definitions, `ROW_1_SLOTS` / `ROW_2_SLOTS`, `SLOT_ITEMS`, `SETS`, `GEAR_PRESETS`, `ACCESSORY_PRESETS`, `ITEM_MAX_STARS_OVERRIDES`, `getMaxStars`, `getFixedStars`, `GEAR_PRESET_SLOT_OPTIONS`, `ACCESSORY_PRESET_SLOT_OPTIONS`
- **js/state.js** – `chars`, `save()`/`load()`, custom presets: `getCustomGearPresets`, `saveCustomGearPresets`, `getCustomAccessoryPresets`, `saveCustomAccessoryPresets` (localStorage keys `ll_custom_gear_presets`, `ll_custom_accessory_presets`)
- **js/presets.js** – `applyPreset`, `applyAccessoryPresets`, `getFullGearPresetList`, `getFullAccessoryPresetList`, `getFullAccessoryPresetOrder`, weapon resolution (`resolvePresetWeapon`, `PRESET_WEAPON_TO_TIER`), tier-based overwrite for accessories (`tierRank`, `TIER_ORDER`), `makeGearSelect` (custom dropdown with flip-up when near bottom)
- **js/render.js** – Character/gear UI, star inputs, fixed stars (Genesis/Destiny = 22★), context menu flip-up
- **js/modal.js** – Add/Edit character, Apply Gear Presets (gear dropdown + accessory checkboxes), Custom Presets modal (Equipment / Accessories tabs, list + add/edit/delete)
- **js/app.js** – Top bar (Import, Custom Presets, Gear Backgrounds), dev mode (5 clicks on Legion Lab icon), add/edit and mass-edit preset UI using full preset lists
- **js/import.js** – Import modal (Name List / Screenshots), preset dropdowns use full lists
- **js/weapons.js** – `WEAPON_TIER_ITEMS`, `ITEM_TIER` for weapons, Zero Heavy/Long
- **index.html** – Controls, modals (Import, Custom Presets, Add/Edit, Apply Presets, etc.)

## Features implemented (this session)
- **Max star force** – Per-item overrides in `ITEM_MAX_STARS_OVERRIDES` (e.g. Silver Blossom Ring 10, Condensed Power Crystal 10, Royal Black Metal Shoulder 15, Black Bean Mark 20, Aquatic Letter 8, Mechanator Pendant 15, Stone of Eternal Life 0). Genesis/Destiny weapons: fixed 22★, not editable.
- **Gear presets** – All include Lv. 100 Secondary and Gold Maple Leaf Emblem (user chooses Silver if needed).
- **Accessory presets** – Multi-select with checkboxes (Boss → Dawn → Superior Gollux → Pitched → Brilliant). Fill next available ring/pendant slot; when no space, overwrite by lowest tier (`tierRank` / `TIER_ORDER`).
- **Custom Presets** – Button “Custom Presets” after Import; modal with Equipment and Accessories tabs; list presets, add/edit/delete; save to localStorage; custom presets appear above built-in in all preset dropdowns/checkboxes; apply uses same logic (weapon resolved by class, Zero secondary, etc.).
- **Dev mode** – 5 clicks on Legion Lab icon; shows Gear Backgrounds, Screenshots import tab, title “Legion Labussy”. Resets on refresh.
- **Import** – Name List first tab, Screenshots (WIP) second; default tab Name List.
- **Dropdowns** – Gear slot dropdown and character context menu flip upward when near bottom of viewport.

## Conventions
- Preset order for accessories: custom first (array order), then built-in (Boss, Dawn, Superior Gollux, Pitched, Brilliant).
- Equipment preset: `{ name, gear: { slot: itemLabel } }`. Custom also has `id`. Weapon labels are generic (e.g. “Absolab Weapon”); resolved per class in `applyPreset`.
- Script order in index: utils, data, classes, weapons, legion, icons, state, presets, render, actions, modal, import, app.

## If continuing work
- Check `ITEM_MAX_STARS_OVERRIDES` and `getFixedStars` for any new items that need caps.
- Custom preset options: equipment uses `GEAR_PRESET_SLOT_OPTIONS` (weapon/secondary from presets, rest from `SLOT_ITEMS`); accessories use `ACCESSORY_PRESET_SLOT_OPTIONS`.

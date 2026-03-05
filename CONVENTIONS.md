# Legion Lab – Conventions

Keep the codebase maintainable and avoid bloating the wrong files.

## Where code lives

| Concern | File(s) | Do |
|--------|--------|-----|
| **Markup only** | `index.html` | Structure, IDs, modals. **No** inline `<script>` or new behavior. |
| **Data & rules** | `js/data.js` | Slots, items, sets, `ITEM_META`, `itemHasStars`, `isOzRing`, presets. |
| **Display & DOM** | `js/render.js` | Building sections, chips, slots, set tooltips, display order. |
| **Styles** | `style.css` | All visual styling. |
| **State** | `js/state.js` | `chars`, `save()`, `load()`, migration. |
| **User actions** | `js/actions.js` | Toggle, delete, edit, drag-and-drop. |
| **Modals & wiring** | `js/modal.js`, `js/app.js` | Open/close modals, event listeners, init. |

## Rules of thumb

- **New item/slot rules** (e.g. “this slot can’t have stars”) → `data.js` and `itemHasStars` / `ITEM_META`.
- **New UI or text** (e.g. tooltip text, order of stats) → `render.js` or `style.css`.
- **New modal or top-level control** → add markup in `index.html`, behavior in `js/` (modal in `modal.js` or `app.js`).
- **User-controlled content in DOM** → escape with `escHtml()` before `innerHTML`. User-supplied image URLs → validate with `isSafeImageUrl()` (https/http only).

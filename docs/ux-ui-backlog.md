# UX/UI Improvement Backlog — Modular Audio Editor

Archive of UX/UI improvements suggested by an oracle consultation early in development.
Items are grouped by original priority. Accessibility (a11y) is intentionally deferred.

**Status legend:** ✅ Done · ⬜ Outstanding · 🟨 Partial

---

## 🔴 Critical — core editing loop & safety

1. ✅ **Replace menu-only drag-drop with a fast quick-add flow.** Add a typeahead command palette (`A` / `/` / `Cmd+K`), right-click → "Add module here", and click-to-insert at cursor. Keep MegaMenu drag as secondary. `QuickAddPalette.client.vue` ships with search, descriptions, and keyboard navigation. *(M)*
2. ✅ **Add Undo / Redo + Delete / Duplicate / Copy / Paste.** Command-history layer for add/remove node, connect/disconnect, move, param/title update, plus shortcuts (`Cmd+Z`, `Shift+Cmd+Z`, `Backspace`, `Cmd+C/V/D`). *(L)*
3. ✅ **Real project management in the top bar.** Patch name, dirty/saving/saved indicator, New / Open / Save / Save As / Import / Export, and meaningful toasts. *(L)*
4. ✅ **Make selection unmistakable.** Strong 2px white border/ring, elevated shadow on selected nodes; 3px stroke + glow on selected edges. Replaced the old cog-dialog with an inline hover-action bar (Rename/Duplicate/Delete/Disconnect-all). Inline rename on double-click with auto-focus/select and single undo step. *(M)*
5. ✅ **Signal-aware ports & cables.** Color/style by signal type — Audio (white), CV/Control (cyan), Gate/Trigger (yellow), Note/MIDI (purple). Applied to `Handle` color and edge stroke; enlarged handle hit targets; hover glow. *(M)*

---

## 🟠 High — discoverability, navigation, node shell

1. ✅ **Rework the top bar into a real patch toolbar.** Replaced MegaMenu with a custom zoned `<header>`: left = ModuleDropdown + Add button + patch name + status pill; right = Undo/Redo, file actions (individual on desktop, "File" dropdown on mobile), glowing Play/Stop toggle, and info modal trigger. *(M)*
2. ✅ **Module search, filtering, recents & favorites.** Recents list, star/favorite toggle, and category tabs added to QuickAddPalette. Favorites/recents live in a dedicated Pinia store (`useModulePreferencesStore`) with localStorage persistence, separate from patch data. *(M)*
3. ⬜ **Fix module taxonomy & iconography in [module.ts](file:///Users/Sebastian1/programming/node-modules/app/app/utils/module.ts).** Alphabetize within categories; rebalance the single-item "Filter" group; replace the over-reused `pi pi-wave-pulse` (Noise / Oscillator / FM Oscillator / Phaser / Waveshaper / Pitch Tracker / LFO / Oscilloscope all share it) and `pi pi-th-large` (MIDI Input / FM Voice / Kaoss Pad) with distinct, audio-domain glyphs. *(S)*
4. ⬜ **Multi-select & batch actions:** lasso select, shift-click, drag/duplicate/delete the selection, optional align/distribute later. *(M)*
5. ✅ **Add a MiniMap and reposition canvas controls.** The Vue Flow controls currently sit bottom-left and visually collide with the Nuxt DevTools widget. Add tooltips and a "Fit to selection" button. *(S–M)*
6. ✅ **Proper index screen + empty-state onboarding.** Branded landing page with "New Patch" / "Open Recent" CTAs and recents list. Empty-state overlay shows "Press A to add" hint and three starter module buttons (Oscillator, Gain, Destination). *(M)*
7. ✅ **One shared `BaseModuleShell` component.** Standardize header (icon + module type + editable title area), body padding, port rails, selected state, and toolbar slot. All 27 modules migrated. *(L)*
8. ✅ **Header shows both module type and user title.** Renamed nodes lose recognizability; show `[icon] Oscillator` + small editable title `Bass OSC` in the header row itself. Currently the module type lives in the header and the title sits below it. *(S–M)*
9. ⬜ **Collapse / Expand for large modules.** [FMVoiceModule](file:///Users/Sebastian1/programming/node-modules/app/app/components/modules/FMVoiceModule.client.vue) (365 lines, 36+ knobs) should have a compact mode. *(M)*
10. ✅ **Replace hard-coded handle offsets.** `HandleBar.vue` (deleted) and `MidiInputModule` used absolute `top: Xrem` per index, causing misalignment. Replaced with row-based grid via `ModulePortRow` / `ModulePortRail` (single source of truth per port). *(M)*
11. ✅ **Larger, clearer handles.** Increase visible/hit size, add hover glow, color by signal type. All shipped via `ModuleHandle.vue` (hit target `::before` pseudo, signal-colored border, CSS-driven hover glow). *(S–M)*
12. ⬜ **Stop cramming multi-output nodes.** Multi Filter (bpf/bsf/hpf/lpf) and MIDI Input (note/gate/retrig/vlcty) need either bigger row spacing, grouped sub-sections, or compact/expanded views. *(M)*
13. ⬜ **Knob interaction upgrade.** Wrap PrimeVue `Knob` (used by [ParamController.vue](file:///Users/Sebastian1/programming/node-modules/app/app/components/modules/shared/ParamController.vue)) with: double-click → reset to default, Shift-drag → fine, click value → numeric entry, drag-tooltip with value + unit. *(M)*
14. ⬜ **Standardize control sizing & label conventions.** Knob sizes (currently 30 / 40 / 60 mixed across modules), select heights, labels (`vlcty`, `vel en`, `atk` are inconsistent abbreviations and casings). Adopt one set of tokens and unabbreviate where space allows. *(M)*
15. ⬜ **Sequencer state visuals.** In [SequencerModule.client.vue](file:///Users/Sebastian1/programming/node-modules/app/app/components/modules/SequencerModule.client.vue#L128-L130), disabled steps use `opacity-50` and conflate with rests. Use distinct treatments for current/active/inactive/disabled/rest. *(S)*

---

## 🟡 Medium — polish, feedback, presets

1. ⬜ **Edge tracing aids.** Highlight selected edge, dim non-relevant edges on hover-port/node, slight per-signal style variation. *(M)*
2. ⬜ **Lightweight signal activity feedback** (gate pulse on port, oscilloscope/spectrum "live" indicator, brief edge flash on triggers). Restrained, not constant motion. *(M)*
3. ⬜ **Dialog / button consistency.** "Submit" labels should read `Rename`/`Save name`; primary/secondary button styling should be consistent app-wide. *(S)*
4. ⬜ **Better save/export feedback** with success/error/warning toasts that include the patch name + last-saved timestamp, and a persistent error indicator in the top bar. *(S)*
5. ⬜ **Surface keyboard shortcuts** in tooltips and a small `?` help sheet. Mention top 3 in empty state. *(S)*
6. ⬜ **Drag/insert preview** — show a ghost card of the module while dragging from the menu so the user knows what will land. *(S–M)*
7. ⬜ **Curated starter templates** (Basic synth, Noise→Filter, MIDI→FM Voice, Visual analyzer chain) before building a full preset library. *(M)*
8. ⬜ **Semantic design tokens** for canvas bg, module bg/border, selected ring, signal colors, text tiers, control sizes — instead of scattered Tailwind blacks/whites. *(M)*

---

## 🟢 Low — later

1. ⬜ **Frames / groups / sticky-note annotations** for organizing large patches. *(L)*
2. ⬜ **Theme variants** (only after tokens land). *(M)*
3. ⬜ **Polish pass:** remove stray production logs (`'NOTE ON?'` / `'NOTE OFF?'` in [MidiInputModule.client.vue](file:///Users/Sebastian1/programming/node-modules/app/app/components/modules/MidiInputModule.client.vue#L214) and L236), clean up the commented-out SpeedDial / NotePriority code, ensure the canvas controls don't collide with overlays. *(S)*

---

## Shipped items

1. ✅ Searchable quick-add ("press A")
2. ✅ Undo / Redo
3. ✅ Delete / Duplicate / Copy / Paste with shortcuts
4. ✅ Patch name + dirty/save state + Import/Export
5. ✅ Clear selected-node styling + inline action bar
6. ✅ Signal-colored handles & edges
7. ✅ Shared node toolbar (`ModuleActionBar`)
8. ✅ `BaseModuleShell` + row-based port layout (`ModulePortRow` / `ModulePortRail`)
9. ✅ MiniMap + repositioned canvas controls
10. ✅ Header shows both module type and user title (inline merge + floating toolbar)
11. ✅ Zoned patch toolbar (replaced MegaMenu with custom header, responsive file actions, glowing Play button, keyboard shortcuts modal, shared QuickAdd API)
12. ✅ Module search, filtering, recents & favorites — category tabs, star toggle, recents row, dedicated Pinia store with localStorage
13. ✅ Proper index screen + empty-state onboarding — branded landing page, canvas empty-state overlay with "Press A to add" and starter module buttons

---

## Suggested next top-8 to ship

1. ⬜ **Multi-select & batch actions** — lasso, shift-click, and group duplicate/delete are the biggest missing canvas primitives now that nodes and edges are individually selectable.
2. ✅ **Proper index screen + empty-state onboarding** — branded landing page (app title, "New Patch" / "Open Recent" entrypoints, recents list) and canvas empty-state overlay with "Press A to add" hint and starter module buttons.
3. ✅ **MiniMap + repositioned canvas controls** — improves navigation in larger patches and fixes the DevTools collision.
4. ✅ **Module search, filtering, recents & favorites** — extended QuickAddPalette with recents on empty query, star/favorite toggle, and category tabs.
5. ⬜ **Knob interaction upgrade** — double-click reset, Shift fine-drag, and numeric entry directly improve the parameter-editing loop.
6. ✅ **Rework top bar into zoned patch toolbar** — replaced MegaMenu with a clean left/right header layout (ModuleDropdown/Add/Name vs. Undo/Redo/File/Play/Info). Ships with responsive file actions, glowing Play button, keyboard shortcuts modal, and shareable QuickAdd API.
7. ✅ **Fix module taxonomy & iconography** — rebalance categories, replace duplicated icons, and alphabetize; small visual-only change with high polish payoff.
8. ✅ **Header shows both module type and user title** — currently the module type lives in the header and the editable title sits below it; combining them improves node recognizability after renaming.

---

## Implementation strategy for new top-8

### Complexity & risk summary

| # | Item | Complexity | Risk | Files touched | Effort |
|---|------|-----------|------|---------------|--------|
| 1 | Multi-select & batch actions | Medium | Low–Medium | 5 | ~1 day |
| 2 | ✅ Proper index screen + empty-state onboarding | Medium | Low | 3 | ~1 day |
| 3 | ✅ MiniMap + repositioned canvas controls | Small–Medium | Very low | 3 | ~½ day |
| 4 | ✅ Module search, filtering, recents & favorites | Small–Medium | Low | 3 | ~½–1 day |
| 5 | Knob interaction upgrade | Medium | Medium | 29+ | ~1–2 days |
| 6 | ✅ Rework top bar into zoned patch toolbar | Small–Medium | Low | 8 | ~½–1 day |
| 7 | ✅ Fix module taxonomy & iconography | Small | Very low | 1 | ~½ day |
| 8 | ✅ Header shows both module type and user title | Small–Medium | Low | 2 | ~½ day |

**Effort legend:** Small = <½ day · Medium = ½–1 day · Large = 1–2 days.

### Dependency analysis

**All 8 items are technically independent** — none blocks another from shipping. However, there are design synergies that make certain orders smoother:

| Item | Soft dependencies / synergies |
|------|----------------------------|
| #1 Multi-select | None. Enables richer toolbar actions in #6 (batch Delete/Duplicate in the top bar). |
| #2 ✅ Index screen | Benefits from #4 (can show favorite/recent modules on the landing page). Can ship before #4 using basic patch recents. |
| #3 ✅ MiniMap | None. Purely additive. |
| #4 ✅ Quick-add enhancements | None. Provides an `open()` API that #6's "Add" button can call instead of faking a keydown event. |
| #5 Knob upgrade | None. Touches all 27 module files — highest regression surface. Best shipped when the canvas is otherwise stable. |
| #6 ✅ Toolbar rework | Shipped with `useQuickAdd()` shared API — available for #4. Benefits from #1 (batch actions in toolbar). |
| #7 ✅ Taxonomy & icons | None. Pure data change. |
| #8 ✅ Header merge | None. Self-contained UI change. |

### Recommended implementation order

| Order | Item | Rationale |
|-------|------|-----------|
| **1** ✅ | #7 Fix module taxonomy & iconography | Shipped. |
| **2** ✅ | #8 Header shows both module type and user title | Shipped. |
| **3** ✅ | #3 MiniMap + repositioned canvas controls | Shipped. |
| **4** ✅ | #6 Rework top bar into zoned patch toolbar | Shipped. |
| **5** | ✅ #4 Module search, filtering, recents & favorites | Shipped. |
| **6** | ✅ #2 Proper index screen + empty-state onboarding | Shipped. |
| **7** | #1 Multi-select & batch actions | Medium complexity. The last major canvas primitive. By this point the toolbar (#6), selection styling (#5 shipped), and action bar are all stable — multi-select slots in cleanly. |
| **8** | #5 Knob interaction upgrade | Highest file count (27 modules + new component) and regression risk. Ship last when the canvas, shell, and toolbar are all frozen. Also gives time to user-test the new knob sizes in the already-merged shell before standardizing. |

**Parallel tracks:** The remaining 2 items (#1, #5) are independent. Each should get focused attention and QA time.

---

## Implementation Plans — new top-8 (6 shipped, 2 remaining)

---

### 1. Multi-select & batch actions

> **Complexity:** Medium  
> **Depends on:** None (ships independently)  
> **Blocked by:** Nothing

#### Goal

Enable lasso/box selection, shift-click multi-select, and batch duplicate / delete / disconnect on the current selection.

#### Current state

- `useEditorClipboard` already has `selectOnly(nodeIds)` (clears all, then selects only those ids).
- `deleteSelection()` already removes all selected nodes + selected edges.
- `duplicate()` already duplicates the current selection (internally copies then pastes with offset).
- Vue Flow is **not configured for selection** — no `selectionKeyCode`, no `multiSelectionKeyCode`, no `selectionMode`.

#### Implementation

1. **Enable Vue Flow selection in `ModularEditor.vue`**
   Add props to `<VueFlow>`:

   ```vue
   <VueFlow
     :nodes="nodes"
     :edges="edges"
     :default-viewport="viewport"
     :selection-key-code="true"
     :multi-selection-key-code="'Shift'"
     :selection-mode="SelectionMode.Partial"
     class="flex-1 bg-black text-white"
   >
   ```

   Import `SelectionMode` from `@vue-flow/core`.

2. **Create `useEditorSelection.ts` composable**

   ```ts
   export function useEditorSelection() {
     const { getNodes, getEdges } = useVueFlow()

     function getSelectedNodeIds(): string[] {
       return getNodes.value.filter(n => n.selected).map(n => n.id)
     }

     function getSelectedEdgeIds(): string[] {
       return getEdges.value.filter(e => e.selected).map(e => e.id)
     }

     function isMultiSelected(): boolean {
       return getSelectedNodeIds().length > 1
     }

     return { getSelectedNodeIds, getSelectedEdgeIds, isMultiSelected }
   }
   ```

3. **Wire `deleteSelection` to a `Delete` key that respects multi-selection**
   The existing `default.vue` shortcut already calls `deleteSelection()` on `Delete` — it works for both single and multi selection already. No change needed.

4. **Wire `duplicate` to a multi-selection-aware duplicate**
   The existing `Cmd+D` shortcut already calls `duplicate()` which duplicates the full selection. No change needed.

5. **Add a "Disconnect all selected" action**
   Extend `useEditorActions`:

   ```ts
   function disconnectAllSelected() {
     const ids = getSelectedNodeIds()
     for (const id of ids) {
       disconnectAll(id)
     }
   }
   ```

   Add a keyboard shortcut (e.g. `Cmd+Shift+D` or `Cmd+Shift+X`) in `default.vue`.

6. **Add lasso UI feedback**
   Vue Flow draws its own selection rectangle when `selection-key-code` is active. No custom DOM needed. Verify that `.vue-flow__selection` is styled (add to `app.vue` if missing):

   ```css
   .vue-flow__selection {
     background: rgba(255,255,255,0.05);
     border: 1px dashed rgba(255,255,255,0.3);
   }
   ```

7. **Update `ModuleActionBar` to show batch-aware labels when multi-selected**
   When `isMultiSelected()` is true, change button tooltips: "Duplicate 3 nodes", "Delete 3 nodes", "Disconnect 3 nodes". Use `useEditorSelection()` in `BaseModuleShell` or pass the count as a prop to `ModuleActionBar`.

#### Files touched

- `app/components/ModularEditor.vue` — add selection props
- `app/composables/useEditorSelection.ts` — new
- `app/composables/useEditorActions.ts` — add `disconnectAllSelected`
- `app/layouts/default.vue` — add batch disconnect shortcut
- `app/components/modules/shared/ModuleActionBar.vue` — batch count tooltips
- `app/app.vue` — selection rectangle styling

#### Edge cases

- Deleting a selection that includes edges: `deleteSelection` already handles this.
- Duplicating a selection with internal edges: `useEditorClipboard.duplicate()` already preserves internal edges and drops external ones.
- Lasso selecting over the canvas background: Vue Flow handles this; nodes inside the box get `.selected`.

---

### 2. Proper index screen + empty-state onboarding ✅

> **Shipped:** 2025-05-17  
> **Files touched:** `app/pages/index.vue`, `app/components/ModularEditor.vue`

**What changed:**
- Replaced the silent redirect in `pages/index.vue` with a branded landing page: "Node Modules" title, "New Patch" / "Open Recent" CTAs, recents list (max 5) with relative timestamps, and a subtle hint when no patches exist.
- Added an empty-state overlay in `ModularEditor.vue` that appears when `nodes.length === 0`, showing "Press A to add" with `<kbd>` styling and three quick-add buttons (Add Oscillator, Gain, Destination).
- Fixed a VueFlow layout bug: the wrapper root was changed from `class="contents"` to `class="relative flex-1 flex flex-col"` so VueFlow's `flex-1` resolves inside a flex container.
- Starter patch helper was explored but ultimately removed — "new patches save immediately" was deemed conceptually wrong and deferred.

---

### 3. MiniMap + repositioned canvas controls ✅

> **Shipped:** 2025-05-16  
> **Files touched:** `app/package.json`, `app/components/ModularEditor.vue`, `app/app.vue`

**What changed:**
- Installed `@vue-flow/minimap` (v1.5.4).
- Added `<MiniMap pannable zoomable>` inside `<VueFlow>` with dark-theme styling (`bg-neutral-900`, `fill-neutral-600`, `max-h-48`).
- Moved `<Controls>` from default bottom-left to `position="bottom-right"` to avoid Nuxt DevTools collision.
- Added a "Fit to selection" button (expand icon) at bottom-right. With a selection, zooms to fit those nodes; without, fits the full patch.
- Added CSS imports and theme styles in `app.vue` for minimap, controls, and node fill/mask colors.

---

### 4. Module search, filtering, recents & favorites ✅

> **Shipped:** 2025-05-17  
> **Files touched:** `app/stores/data.ts`, `app/stores/modulePreferences.ts`, `app/utils/module.ts`, `app/components/controls/QuickAddPalette.client.vue`

**What changed:**
- Created `useModulePreferencesStore` (separate Pinia store) for recents and favorites with localStorage persistence — intentionally decoupled from patch data.
- Added category tabs (All / I/O / Generator / Voice / Effect / Control / Visual) to QuickAddPalette when query is empty; `searchModuleCatalog` extended with optional `category` filter.
- Added Favorites row with inline unfavorite star toggle (capped at 5) and Recents row in the empty-query state.
- Added star toggle on each result row in the search list for favoriting/unfavoriting.
- Usage recording on module insert (`prefs.recordModuleUsed`).
- Fixed nested `<button>` in results list by converting outer row to `<div role="button" tabindex="0">`.

---

### 5. Knob interaction upgrade

> **Complexity:** Medium  
> **Depends on:** None (ships independently)  
> **Blocked by:** Nothing

#### Goal

Wrap PrimeVue `Knob` in a smarter parameter controller: double-click to reset, Shift-drag for fine adjustment, click value for numeric entry, and a drag tooltip showing value + unit.

#### Current state

- `ParamController.vue` wraps `Knob` with `v-model="param"`.
- `useAudioParam` returns a `scaledParam` ref and watches `actualParam` to call `setAudioParam` + `updateNodeData`.
- PrimeVue `Knob` handles its own mouse/touch drag internally — we need to intercept or supplement its events.

#### Implementation

1. **Create `EnhancedKnob.vue` component**
   This wraps PrimeVue `Knob` and adds the interaction layer:

   ```vue
   <template>
     <div class="relative inline-block">
       <Knob
         ref="knobRef"
         v-model="displayValue"
         :size="size"
         :min="min"
         :max="max"
         :step="step"
         :value-template="valueTemplate"
         @mousedown="onMouseDown"
         @touchstart="onMouseDown"
       />
       <!-- Tooltip -->
       <div
         v-if="showTooltip"
         class="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs px-2 py-1 rounded shadow border border-neutral-700 pointer-events-none whitespace-nowrap z-50"
       >
         {{ tooltipValue }}
       </div>
     </div>
   </template>
   ```

   Logic:
   - `displayValue` is a local ref synced from `modelValue`.
   - `onMouseDown`: record start Y + start value. If `e.shiftKey`, set `fineMultiplier = 0.1`. Add `window` mousemove/mouseup listeners.
   - `onMouseMove`: compute delta Y → value delta (inverted, ~1px = 1 step normally, 0.1 step with Shift).
   - `onMouseUp`: remove listeners, emit `update:modelValue`.
   - `onDoubleClick`: emit `reset` (caller resets to default).
   - `onClick` on the value text label (not the knob itself): show an inline `<input type="number">` for direct entry.

   **Important:** PrimeVue `Knob` binds its own drag listeners. We need to either:
   - Disable PrimeVue's drag by setting `readonly` and implementing our own drag, OR
   - Hook into PrimeVue's events (it emits `change` but not intermediate drag).

   Best approach: set `:readonly="true"` on PrimeVue `Knob` and implement a transparent overlay `<div>` on top of the knob that captures pointer events:

   ```vue
   <div
     class="absolute inset-0 cursor-ns-resize"
     @dblclick="$emit('reset')"
     @mousedown="startDrag"
     @touchstart="startDrag"
   />
   ```

   This way the knob renders visually but our overlay handles interaction.

2. **Update `ParamController.vue` to use `EnhancedKnob`**

   ```vue
   <template>
     <div class="flex flex-col items-center">
       <EnhancedKnob
         v-model="scaledParam"
         :size="size"
         :min="min"
         :max="max"
         :step="step"
         :unit="unit"
         @reset="scaledParam = converter.toScaled(defaultValue)"
       />
       <span class="text-handle cursor-pointer" @click="startNumericEdit">{{ label }}</span>
       <!-- Numeric entry input (inline, visible on click) -->
       <input
         v-if="editing"
         v-model.number="numericValue"
         type="number"
         class="absolute ..."
         @blur="commitNumeric"
         @keydown.enter="commitNumeric"
       />
     </div>
   </template>
   ```

   Add `startNumericEdit`, `commitNumeric` functions.

3. **Propagate knob size standardization**
   Currently `ParamController` hardcodes `:size="60"`. Make it a prop with a default:

   ```ts
   export type ParamControllerProps = {
     // ... existing ...
     knobSize?: number
   }
   ```

   Default `40` (a good medium size). Audit all module components and pass explicit sizes where needed (e.g. FMVoice's many knobs could use `30` to fit better).

4. **Tooltip implementation**
   Track `dragging`, `tooltipValue`, `tooltipPosition` in `EnhancedKnob`. Show a floating `<div>` above the knob during drag.

#### Files touched

- `app/components/modules/shared/EnhancedKnob.vue` — new
- `app/components/modules/shared/ParamController.vue` — replace Knob with EnhancedKnob, add numeric edit, size prop
- All 27 `*Module.client.vue` files — pass `knobSize` prop where needed (optional, can use default)

#### Edge cases

- PrimeVue Knob `readonly` prevents internal drag but still renders and animates on value changes.
- Shift fine-drag: works while holding Shift before or during drag. Use `e.shiftKey` on each mousemove.
- Numeric entry outside min/max: clamp in `commitNumeric`.
- Touch devices: `@touchstart` / `@touchmove` / `@touchend` parallel to mouse events.

---

### 6. Rework top bar into zoned patch toolbar ✅

> **Shipped:** 2025-05-16  
> **Files touched:** `app/layouts/default.vue`, `app/composables/useQuickAdd.ts`, `app/components/controls/QuickAddPalette.client.vue`, `app/components/controls/ToolbarButton.vue`, `app/components/controls/ModuleDropdown.client.vue`, `app/components/controls/FileDropdown.vue`, `app/components/controls/PlayButton.client.vue`, `app/components/controls/InfoModal.client.vue`

**What changed:**
- Replaced the single `MegaMenu` component with a custom zoned `<header>` layout (`left` = ModuleDropdown + Add button + patch name + save-state pill; `right` = Undo/Redo + file actions + Play/Stop + ? info trigger).
- Created `ToolbarButton.vue` — reusable wrapper with responsive label hiding (labels visible above 1200px) and consistent hover/disabled states.
- Created `ModuleDropdown.client.vue` — compact draggable module list overlay replacing the MegaMenu grid; uses `pi-angle-down` caret and `DropNewModule` items for drag-to-canvas insertion.
- Created `FileDropdown.vue` — collapses New/Open/Save/Save As/Import/Export into a single "File ▾" dropdown at widths below `md` (768px); uses a custom overlay with click-outside dismissal.
- Created `InfoModal.client.vue` — generic info dialog (currently showing keyboard shortcuts with `<kbd>` styling, `?` shortcut trigger, and a "Press ? to toggle" footer).
- Created `app/composables/useQuickAdd.ts` — shared reactive state so the toolbar **Add** button can open the QuickAddPalette without faking keyboard events; the composable is available for item #4's future enhancements.
- Updated `QuickAddPalette.client.vue` to consume the shared `useQuickAdd` state.
- Updated `PlayButton.client.vue` with prominent red/green glow border and shadow to indicate audio running/suspended state.
- Responsive behavior (three tiers):  
  **> 1200px** — full labels + individual file buttons  
  **768px–1200px** — icon-only labels + individual file buttons (middle step)  
  **< 768px** — icon-only + File dropdown

---

### 7. Fix module taxonomy & iconography ✅

> **Shipped:** 2025-05-16  
> **Files touched:** `app/app/utils/module.ts`

**What changed:**
- Replaced 8-way `pi-wave-pulse` collision with distinct PrimeIcons per module (`pi-bolt` Noise, `pi-sort-alt` FM Oscillator, `pi-sync` Phaser, `pi-hammer` Waveshaper, `pi-search` Pitch Tracker, `pi-clock` LFO, `pi-desktop` Oscilloscope, `pi-key` MIDI Input, `pi-arrows-alt` Kaoss Pad, `pi-eraser` Bit Crusher, `pi-filter-slash` Decimator, `pi-history` Delay Line, `pi-box` Graindr). Oscillator keeps `pi-wave-pulse` as the canonical wave icon.
- Rebalanced categories: merged lone "Filter" into "Effect", split "Sound" into "Generator" + "Voice", kept "I/O" intact per user request. Six balanced groups now.
- Alphabetized all modules within each category.
- Added/enriched `MODULE_DESCRIPTIONS` keywords for better quick-add search.

---

### 8. Header shows both module type and user title ✅

> **Shipped:** 2025-05-16  
> **Files touched:** `app/components/modules/shared/BaseModuleShell.vue`, `app/components/modules/shared/InlineEditableTitle.vue`, `app/components/modules/shared/ModulePortRail.vue`

**What changed:**
- Merged module type label and editable user title into a single header row: `[icon] [TYPE pill] / [title]`, removing the separate title `<div>` below and freeing ~20 px vertical space per module.
- Moved the action bar out of the module flow entirely — it now floats above the node via Vue Flow's `<NodeToolbar>` (`Position.Top`, `align="end"`), eliminating the previous hover-induced layout shift (0 px width/height delta confirmed across all 27 modules).
- Made the toolbar visible only when a node is selected (clicked) or inline editing is active, avoiding the "disappears when moving cursor from node to toolbar" problem.
- Updated `InlineEditableTitle` with a single-root `<div v-bind="$attrs">` wrapper so the parent can pass `flex-1 min-w-0 truncate` for proper inline layout.
- Added `flex-1` to `ModulePortRail`'s root div so right-side port rails expand to fill leftover horizontal space, fixing the output handle misalignment on the Envelope Generator module (and preventing the same issue on any module whose header text is wider than its body content).

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
2. 🟨 **Module search, filtering, recents & favorites.** `QuickAddPalette` already provides fast typeahead search with descriptions. Missing: recents list on empty query, star/favorite toggle, and category tabs. *(M)*
3. ⬜ **Fix module taxonomy & iconography in [module.ts](file:///Users/Sebastian1/programming/node-modules/app/app/utils/module.ts).** Alphabetize within categories; rebalance the single-item "Filter" group; replace the over-reused `pi pi-wave-pulse` (Noise / Oscillator / FM Oscillator / Phaser / Waveshaper / Pitch Tracker / LFO / Oscilloscope all share it) and `pi pi-th-large` (MIDI Input / FM Voice / Kaoss Pad) with distinct, audio-domain glyphs. *(S)*
4. ⬜ **Multi-select & batch actions:** lasso select, shift-click, drag/duplicate/delete the selection, optional align/distribute later. *(M)*
5. ✅ **Add a MiniMap and reposition canvas controls.** The Vue Flow controls currently sit bottom-left and visually collide with the Nuxt DevTools widget. Add tooltips and a "Fit to selection" button. *(S–M)*
6. ⬜ **Proper index screen + empty-state onboarding.** Replace the current silent redirect in `pages/index.vue` with a branded landing page: app title, "New Patch" and "Open Recent" entrypoints, and a recents list. When a patch canvas is empty, show a "Press A to add" hint, three starter modules (Oscillator, Gain, Destination), and a "Try a starter patch" button. *(M)*
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

---

## Suggested next top-8 to ship

1. ⬜ **Multi-select & batch actions** — lasso, shift-click, and group duplicate/delete are the biggest missing canvas primitives now that nodes and edges are individually selectable.
2. ⬜ **Proper index screen + empty-state onboarding** — replace the silent redirect in `pages/index.vue` with a branded landing page (app title, "New Patch" / "Open Recent" entrypoints, recents list). Canvas empty-state shows "Press A to add" hint and starter modules.
3. ✅ **MiniMap + repositioned canvas controls** — improves navigation in larger patches and fixes the DevTools collision.
4. ⬜ **Module search, filtering, recents & favorites** — extend the existing `QuickAddPalette` with recents on empty query and a star toggle; relatively small scope.
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
| 2 | Proper index screen + empty-state onboarding | Medium | Low | 3 | ~1 day |
| 3 | ✅ MiniMap + repositioned canvas controls | Small–Medium | Very low | 3 | ~½ day |
| 4 | Module search, filtering, recents & favorites | Small–Medium | Low | 3 | ~½–1 day |
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
| #2 Index screen | Benefits from #4 (can show favorite/recent modules on the landing page). Can ship before #4 using basic patch recents. |
| #3 ✅ MiniMap | None. Purely additive. |
| #4 Quick-add enhancements | None. Provides an `open()` API that #6's "Add" button can call instead of faking a keydown event. |
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
| **5** | #4 Module search, filtering, recents & favorites | Builds on the existing QuickAddPalette. The new toolbar (#6) gets a proper `openQuickAdd()` hook. Recents/favorites data layer can then be reused by the landing page in #2. |
| **6** | #2 Proper index screen + empty-state onboarding | Medium effort, high user-facing impact. Benefits from #4's recents/favorites (can surface them on the landing page). Empty-state copy can reference the now-polished QuickAddPalette. |
| **7** | #1 Multi-select & batch actions | Medium complexity. The last major canvas primitive. By this point the toolbar (#6), selection styling (#5 shipped), and action bar are all stable — multi-select slots in cleanly. |
| **8** | #5 Knob interaction upgrade | Highest file count (27 modules + new component) and regression risk. Ship last when the canvas, shell, and toolbar are all frozen. Also gives time to user-test the new knob sizes in the already-merged shell before standardizing. |

**Parallel tracks:** The remaining 3 items (#4, #1, #5) are independent. #1 and #5 should each get focused attention and QA time. #4 can follow at any point since the `useQuickAdd()` API is already shipped.

---

## Implementation Plans — new top-8 (4 shipped, 4 remaining)

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

### 2. Proper index screen + empty-state onboarding

> **Complexity:** Medium  
> **Depends on:** None (ships independently)  
> **Blocked by:** Nothing

#### Goal

Replace the silent redirect in `pages/index.vue` with a branded landing page, and add an empty-state overlay on the canvas when a patch has no nodes.

#### Current state

- `pages/index.vue` fetches patch list, redirects to latest patch or creates a new one instantly.
- `pages/patches/[id].vue` renders `ModularEditor` with `initialData`.
- No empty-state UI exists in `ModularEditor`.

#### Implementation

1. **Create a branded landing page (`pages/index.vue`)**
   Design:
   - Full-screen dark background (`bg-neutral-950`).
   - Centered: app title "Node Modules" in large type + subtitle.
   - Two primary CTAs: "New Patch" (green accent) and "Open Recent" (secondary).
   - Below: a recents list (max 5) showing patch name + last-updated relative time.
   - If no recents: show a subtle hint "Create your first patch".

   Data: reuse `useDataStore().patches` (already fetched).

   ```vue
   <template>
     <div class="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center">
       <div class="text-center space-y-6">
         <h1 class="text-4xl font-bold tracking-tight">Node Modules</h1>
         <p class="text-neutral-400">Modular audio synthesis environment</p>
         <div class="flex gap-3 justify-center">
           <Button label="New Patch" icon="pi pi-plus" @click="store.newPatch()" />
           <Button label="Open Recent" icon="pi pi-folder-open" outlined @click="showRecents = true" />
         </div>
         <div v-if="store.patches.length" class="mt-8 text-left">
           <h2 class="text-xs uppercase tracking-wide text-neutral-500 mb-3">Recent patches</h2>
           <div class="space-y-1">
             <button
               v-for="p in store.patches.slice(0, 5)"
               :key="p.id"
               class="block w-full text-left px-3 py-2 rounded hover:bg-white/5 text-sm text-neutral-300"
               @click="navigateTo(`/patches/${p.id}`)"
             >
               {{ p.name }}
               <span class="text-neutral-600 text-xs ml-2">{{ formatDate(p.updatedAt) }}</span>
             </button>
           </div>
         </div>
       </div>
     </div>
   </template>
   ```

2. **Add empty-state overlay in `ModularEditor.vue`**
   After `<VueFlow>`, conditionally render an overlay when `nodes.length === 0`:

   ```vue
   <div
     v-if="nodes.length === 0"
     class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
   >
     <div class="text-center space-y-4 opacity-60">
       <p class="text-lg">This patch is empty</p>
       <p class="text-sm text-neutral-400">Press <kbd class="px-1.5 py-0.5 bg-neutral-800 rounded text-xs">A</kbd> to add a module</p>
       <div class="flex gap-3 justify-center mt-4 pointer-events-auto">
         <Button label="Add Oscillator" size="small" @click="addModuleAtViewportCenter(AudioModuleType.Oscillator)" />
         <Button label="Add Gain" size="small" @click="addModuleAtViewportCenter(AudioModuleType.Gain)" />
         <Button label="Add Destination" size="small" @click="addModuleAtViewportCenter(AudioModuleType.Destination)" />
       </div>
       <p class="text-xs text-neutral-500 mt-2">or try a <button class="underline">starter patch</button></p>
     </div>
   </div>
   ```

   Import `addModuleAtViewportCenter` from `useAddModule()` inside `ModularEditor.vue`.

3. **Starter patch helper (optional)**
   Create a `createStarterPatch(type)` function in `useDataStore` or a new composable that pre-populates a simple chain (Oscillator → Gain → Destination) and navigates to it. This can be exposed as a "Try a starter patch" button in both the landing page and the empty-state overlay.

#### Files touched

- `app/pages/index.vue` — rewrite from redirect to landing page
- `app/components/ModularEditor.vue` — add empty-state overlay, import `useAddModule`
- `app/composables/useDataStore.ts` — add `createStarterPatch()` (optional)

#### Edge cases

- User lands on `/` with an empty patch list → show landing page, "New Patch" button calls `store.newPatch()`.
- User lands on `/patches/<id>` with an empty patch → empty-state overlay appears.
- User deletes all nodes in a non-empty patch → overlay appears immediately (reactive on `nodes.length`).

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

### 4. Module search, filtering, recents & favorites

> **Complexity:** Small–Medium  
> **Depends on:** None (ships independently)  
> **Blocked by:** Nothing

#### Goal

Extend `QuickAddPalette` with: recents list on empty query, star/favorite toggle per module, and category tab filters.

#### Current state

- `QuickAddPalette.client.vue` shows all 27 modules when query is empty.
- `useDataStore` has no concept of "recently used module types" or "favorites".
- Search is purely substring-based.

#### Implementation

1. **Add recents & favorites to `useDataStore`**
   Use `useLocalStorage` from VueUse (if available) or manual `localStorage`:

   ```ts
   const recentTypes = ref<string[]>([])
   const favoriteTypes = ref<Set<string>>(new Set())

   function recordModuleUsed(type: string) {
     recentTypes.value = [type, ...recentTypes.value.filter(t => t !== type)].slice(0, 5)
   }

   function toggleFavorite(type: string) {
     const s = new Set(favoriteTypes.value)
     if (s.has(type)) s.delete(type)
     else s.add(type)
     favoriteTypes.value = s
   }
   ```

   Persist `recentTypes` and `favoriteTypes` to `localStorage` on change (watch + JSON.stringify). Load on store init.

2. **Extend `searchModuleCatalog` to support category filtering**

   ```ts
   export function searchModuleCatalog(query: string, category?: string): ModuleCatalogEntry[] {
     // ... existing logic ...
     if (category && entry.category !== category) return false
     // ...
   }
   ```

3. **Redesign `QuickAddPalette` empty-query state**
   When `query === ''`, show three sections stacked vertically:
   - **Favorites** (if any): horizontal row of favorited modules with star button.
   - **Recents**: last 5 used module types (each clickable to re-insert).
   - **All modules**: grouped by category (collapsible or tabbed).

   Category tabs across the top (when query is empty):

   ```vue
   <div class="flex gap-1 border-b border-white/20 px-3 py-1">
     <button
       v-for="cat in categories"
       :key="cat"
       class="text-xs px-2 py-1 rounded"
       :class="activeCategory === cat ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'"
       @click="activeCategory = cat"
     >
       {{ cat }}
     </button>
   </div>
   ```

4. **Add star toggle in results list**
   Each result row gets a star icon on the right side (before the category label):

   ```vue
   <button
     class="text-white/30 hover:text-amber-400"
     @click.stop="toggleFavorite(entry.type)"
   >
     <i :class="isFavorite(entry.type) ? 'pi pi-star-fill text-amber-400' : 'pi pi-star'" />
   </button>
   ```

5. **Record usage when a module is inserted**
   In `QuickAddPalette`'s `insert()` function, call `dataStore.recordModuleUsed(entry.type)`.

#### Files touched

- `app/stores/data.ts` — add recents/favorites state + helpers
- `app/utils/module.ts` — extend `searchModuleCatalog` with category filter
- `app/components/controls/QuickAddPalette.client.vue` — redesign empty state, add tabs, star toggle

#### Edge cases

- First-time user: no recents, no favorites → show "All" tab by default with category grouping.
- Favorites list gets too long: cap at e.g. 10.
- `localStorage` parse failure: wrap in `try/catch`, default to empty.

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

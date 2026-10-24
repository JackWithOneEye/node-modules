import type { EffectScope } from 'vue'

const EDITOR_FLOW_ID = 'modular-editor'
let flowScope: EffectScope | undefined

/**
 * The single Vue Flow instance shared by the editor, the data store and the
 * editor layout (quick-add palette, toolbar).
 *
 * `useVueFlow()` without an id resolves the instance through provide/inject,
 * so callers outside the editor's component tree (or editors mounted after
 * a navigation) would otherwise get a different, empty instance. The fixed
 * id plus an app-lifetime scope makes every caller resolve the same one.
 */
export function useEditorFlow() {
  flowScope ??= effectScope(true)
  return flowScope.run(() => useVueFlow(EDITOR_FLOW_ID))!
}

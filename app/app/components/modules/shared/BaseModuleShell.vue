<script lang="ts" setup>
import { NodeToolbar } from '@vue-flow/node-toolbar'
import { Position } from '@vue-flow/core'

export type BaseModuleShellProps = {
  id: string
  type: string
  title?: string
}

const props = defineProps<BaseModuleShellProps>()

const { getNodes, updateNodeData } = useVueFlow()
const { commit: historyCommit } = useEditorHistory()
const { duplicateNode, deleteNode, disconnectAll } = useEditorActions()

provide(ParentNodeIdKey, props.id)

const moduleEntry = computed(() => getModuleCatalogEntry(props.type))
const moduleLabel = computed(() => moduleEntry.value?.label ?? props.type)
const moduleIcon = computed(() => moduleEntry.value?.icon ?? 'pi pi-box')

const isEditing = ref(false)
const isSelected = computed(() => {
  for (const n of getNodes.value) {
    if (n.id === props.id) {
      return n.selected
    }
  }
  return false
})

function onRename() {
  isEditing.value = true
}

function onTitleCommit(title: string) {
  for (const n of getNodes.value) {
    if (n.id === props.id) {
      updateNodeData(n.id, { title })
      historyCommit()
    }
  }
}

function onEditingDone() {
  isEditing.value = false
}
</script>

<template>
  <section
    class="module-shell rounded-md border border-white/70 bg-black/80 px-2 py-2 shadow-sm transition-[box-shadow,transform,border-color] duration-150"
    :data-node-id="id"
    :data-module-type="type"
  >
    <NodeToolbar
      :is-visible="isSelected || isEditing"
      :position="Position.Top"
      :align="'end'"
      :offset="8"
      class="nodrag"
    >
      <div class="flex items-center gap-1 rounded-md border border-white/10 bg-neutral-900/90 px-1.5 py-1 shadow-lg backdrop-blur-sm">
        <ModuleActionBar
          @rename="onRename"
          @duplicate="duplicateNode(id)"
          @delete="deleteNode(id)"
          @disconnect-all="disconnectAll(id)"
        />
        <slot name="toolbar" />
      </div>
    </NodeToolbar>

    <header class="mb-1.5 flex items-center gap-1.5 min-w-0">
      <i
        class="text-xs opacity-80 shrink-0"
        :class="moduleIcon"
      />
      <span class="shrink-0 text-[11px] uppercase tracking-wide text-white/50 bg-white/5 px-1.5 py-0.5 rounded">{{ moduleLabel }}</span>
      <span class="shrink-0 text-white/30">/</span>
      <InlineEditableTitle
        :model-value="title || moduleLabel"
        :node-id="id"
        :active="isEditing"
        class="flex-1 min-w-0 text-sm text-white truncate"
        @commit="onTitleCommit"
        @done="onEditingDone"
      />
    </header>

    <div class="flex flex-col gap-2">
      <slot />
    </div>
  </section>
</template>

<style>
.vue-flow__node.selected>.module-shell {
  border-color: rgb(255 255 255);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4);
}
</style>

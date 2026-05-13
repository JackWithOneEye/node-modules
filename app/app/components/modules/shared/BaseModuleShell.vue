<script lang="ts" setup>
export type BaseModuleShellProps = {
  id: string
  type: string
  title?: string
}

const props = defineProps<BaseModuleShellProps>()

const { getNodes, updateNodeData } = useVueFlow()
const { commit: historyCommit } = useEditorHistory()
const { duplicateNode, deleteNode, disconnectAll } = useEditorActions()

const moduleEntry = computed(() => getModuleCatalogEntry(props.type))
const moduleLabel = computed(() => moduleEntry.value?.label ?? props.type)
const moduleIcon = computed(() => moduleEntry.value?.icon ?? 'pi pi-box')

const isHovered = ref(false)
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
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <header class="mb-2 flex items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-2">
        <i
          class="text-xs opacity-80"
          :class="moduleIcon"
        />
        <span class="truncate text-[10px] uppercase tracking-wide text-white/70">{{ moduleLabel }}</span>
      </div>
      <div
        v-if="isHovered || isEditing || isSelected"
        class="flex items-center gap-1"
      >
        <ModuleActionBar
          @rename="onRename"
          @duplicate="duplicateNode(id)"
          @delete="deleteNode(id)"
          @disconnect-all="disconnectAll(id)"
        />
        <slot name="toolbar" />
      </div>
    </header>
    <div class="mb-2 text-sm leading-none">
      <InlineEditableTitle
        :model-value="title || moduleLabel"
        :node-id="id"
        :active="isEditing"
        @commit="onTitleCommit"
        @done="onEditingDone"
      />
    </div>
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

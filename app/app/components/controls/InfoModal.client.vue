<script lang="ts" setup>
const visible = ref(false)

defineExpose({
  open: () => {
    visible.value = true
  },
})

function close() {
  visible.value = false
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :closable="false"
    :show-header="false"
    :dismissable-mask="true"
    class="w-[28rem]"
    :pt="{
      root: tw`border border-white/30 rounded-md shadow-2xl overflow-hidden`,
      content: tw`bg-black p-0`,
      mask: tw`backdrop-blur-sm`,
    }"
    @update:visible="(v: boolean) => (visible = v)"
  >
    <div class="flex flex-col">
      <div class="flex items-center justify-between border-b border-white/20 px-4 py-3">
        <h2 class="text-sm font-semibold text-white">
          Keyboard Shortcuts
        </h2>
        <button
          class="text-neutral-400 hover:text-white text-xs"
          @click="close"
        >
          <i class="pi pi-times" />
        </button>
      </div>
      <div class="px-4 py-4 space-y-4 max-h-[32rem] overflow-y-auto">
        <section>
          <h3 class="text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Palette
          </h3>
          <div class="space-y-1.5 text-sm text-neutral-300">
            <div class="flex justify-between items-center">
              <span>Open QuickAdd palette</span>
              <div class="flex gap-1">
                <kbd class="px-1.5 py-0.5 bg-neutral-800 rounded text-xs font-mono">A</kbd>
                <kbd class="px-1.5 py-0.5 bg-neutral-800 rounded text-xs font-mono">/</kbd>
                <kbd class="px-1.5 py-0.5 bg-neutral-800 rounded text-xs font-mono">⌘K</kbd>
              </div>
            </div>
          </div>
        </section>
        <section>
          <h3 class="text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-2">
            History
          </h3>
          <div class="space-y-1.5 text-sm text-neutral-300">
            <div class="flex justify-between items-center">
              <span>Undo</span>
              <kbd class="px-1.5 py-0.5 bg-neutral-800 rounded text-xs font-mono">⌘Z</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span>Redo</span>
              <div class="flex gap-1">
                <kbd class="px-1.5 py-0.5 bg-neutral-800 rounded text-xs font-mono">⇧⌘Z</kbd>
                <kbd class="px-1.5 py-0.5 bg-neutral-800 rounded text-xs font-mono">⌘Y</kbd>
              </div>
            </div>
          </div>
        </section>
        <section>
          <h3 class="text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Editing
          </h3>
          <div class="space-y-1.5 text-sm text-neutral-300">
            <div class="flex justify-between items-center">
              <span>Copy selection</span>
              <kbd class="px-1.5 py-0.5 bg-neutral-800 rounded text-xs font-mono">⌘C</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span>Paste</span>
              <kbd class="px-1.5 py-0.5 bg-neutral-800 rounded text-xs font-mono">⌘V</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span>Duplicate selection</span>
              <kbd class="px-1.5 py-0.5 bg-neutral-800 rounded text-xs font-mono">⌘D</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span>Delete selection</span>
              <kbd class="px-1.5 py-0.5 bg-neutral-800 rounded text-xs font-mono">Delete</kbd>
            </div>
          </div>
        </section>
      </div>
      <div class="border-t border-white/20 px-4 py-2 text-[0.65rem] font-mono text-white/40 text-center">
        Press <kbd class="px-1 bg-neutral-800 rounded">?</kbd> to toggle this dialog
      </div>
    </div>
  </Dialog>
</template>

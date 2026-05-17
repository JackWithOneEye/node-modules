<script lang="ts" setup>
const store = useDataStore()
await store.fetchPatchList()

const showOpenDialog = ref(false)

const sortedPatches = computed(() => {
  return store.patches.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})

function formatRelativeTime(iso: string): string {
  if (!iso) {
    return ''
  }
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) {
    return 'just now'
  }
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return `${diffMin}m ago`
  }
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) {
    return `${diffHour}h ago`
  }
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) {
    return `${diffDay}d ago`
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-4">
    <div class="text-center space-y-8 max-w-md w-full">
      <!-- Title -->
      <div class="space-y-2">
        <h1 class="text-5xl font-bold tracking-tight">
          Node Modules
        </h1>
        <p class="text-neutral-400 text-lg">
          Modular audio synthesis environment
        </p>
      </div>

      <!-- CTAs -->
      <div class="flex gap-3 justify-center">
        <Button
          label="New Patch"
          icon="pi pi-plus"
          class="bg-emerald-600 border-emerald-600 hover:bg-emerald-500 hover:border-emerald-500"
          @click="store.newPatch()"
        />
        <Button
          label="Open Patch"
          icon="pi pi-folder-open"
          outlined
          @click="showOpenDialog = true"
        />
      </div>

      <!-- Recent patches -->
      <div
        v-if="sortedPatches.length > 0"
        class="text-left"
      >
        <h2 class="text-xs uppercase tracking-wide text-neutral-500 mb-3 px-1">
          Recent patches
        </h2>
        <div class="space-y-1">
          <button
            v-for="p in sortedPatches.slice(0, 5)"
            :key="p.id"
            class="block w-full text-left px-3 py-2.5 rounded hover:bg-white/5 transition-colors group"
            @click="navigateTo(`/patches/${p.id}`)"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm text-neutral-300 group-hover:text-white truncate mr-3">
                {{ p.name }}
              </span>
              <span class="text-neutral-600 text-xs whitespace-nowrap">
                {{ formatRelativeTime(p.updatedAt) }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- Empty hint -->
      <div
        v-else
        class="text-neutral-600 text-sm"
      >
        Create your first patch to get started.
      </div>
    </div>

    <!-- Open dialog (local to this page) -->
    <PatchOpenDialog
      :visible="showOpenDialog"
      @update:visible="showOpenDialog = $event"
    />
  </div>
</template>

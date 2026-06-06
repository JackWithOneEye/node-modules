<script lang="ts" setup>
export type ModulePortRailProps = {
  position: 'left' | 'right'
  ports: ModulePort[]
}

defineProps<ModulePortRailProps>()
</script>

<!--
  Side-rail escape hatch for "many-ports + large body" modules.
  Renders one `ModulePortRow` per port, all on the same side, so the rows
  align vertically next to a multi-row body slot in the parent layout.

  Use ModulePortRow for normal modules; reach for ModulePortRail only when
  the body needs to span multiple visual rows alongside many ports.
-->
<template>
  <div class="flex flex-col flex-1">
    <ModulePortRow
      v-for="port in ports"
      :key="port.id"
      :input="position === 'left' ? port : undefined"
      :output="position === 'right' ? port : undefined"
    />
  </div>
</template>

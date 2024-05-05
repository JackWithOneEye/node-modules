<script lang="ts" setup>
import { NodeToolbar } from '@vue-flow/node-toolbar'

const { id, node } = useNode()
const { updateNodeData } = useVueFlow()

const title = ref('')
const visible = ref(false)

// const items = ref([
//     {
//         label: 'Delete',
//         icon: 'pi pi-trash',
//         command: () => {
//             removeNodes(id)
//         },
//     },
//     {
//         label: 'Rename',
//         icon: 'pi pi-pencil',
//         command: () => {
//         },
//     },
// ])

function onOpen() {
  title.value = node.data.title
  visible.value = true
}

function onSubmit() {
  visible.value = false
  updateNodeData(id, { title: title.value })
}
</script>

<template>
  <NodeToolbar
    :position="Position.Top"
    :align="'end'"
    :is-visible="node.selected"
  >
    <Button
      class="pi pi-cog"
      @click="onOpen"
    />
    <!-- <SpeedDial
      class="top-[-2rem]"
      :model="items"
      show-icon="pi pi-cog"
      :radius="60"
      direction="up-right"
      type="quarter-circle"
    /> -->
  </NodeToolbar>
  <Dialog
    class="w-96"
    :visible="visible"
    modal
    header="Edit"
    :closable="false"
    :pt="{
      root: tw`border border-1 rounded-md shadow-xl`,
      header: tw`bg-black`,
      content: tw`bg-black`,
    }"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label
          class="text-sm"
          for="title"
        >Title</label>
        <InputText
          id="title"
          v-model="title"
          class="border border-white/50 focus:border-white text-sm p-2 outline-none"
          autocomplete="off"
        />
      </div>
      <div class="flex justify-end gap-4">
        <Button
          class="hover:opacity-90 border text-sm px-4 py-2"
          label="Cancel"
          @click="() => visible = false"
        />
        <Button
          class="bg-white hover:bg-white/90 text-black text-sm px-4 py-2"
          label="Submit"
          @click="onSubmit"
        />
      </div>
    </div>
  </Dialog>
</template>

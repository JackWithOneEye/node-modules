<script lang="ts" setup>
import { Handle } from '@vue-flow/core'
import type { NoteMessageEvent } from 'webmidi'
import { useMidiStore } from '~/stores/midi'

// const NotePriority = {
//   Newest: 0,
//   Oldest: 1,
//   Highest: 2,
//   Lowest: 3,
// } as const
type NotePriority = 0 | 1 | 2 | 3

export type MidiInputModuleProps = {
  id: string
  type: string
  title?: string
  channel?: number // not yet used!
  deviceId?: string
  priority?: NotePriority// (typeof NotePriority)[keyof typeof NotePriority]
}
const props = withDefaults(defineProps<MidiInputModuleProps>(), {
  title: 'MIDI Input',
  priority: 0,
})

const midiStore = useMidiStore()

await midiStore.enable()

const store = useAudioContextStore()
const gateNode = new ConstantSourceNode(store.audioContext, { offset: 0 })
gateNode.start()
const noteNode = new ConstantSourceNode(store.audioContext, { offset: 0 })
noteNode.start()
const retriggerNode = new ConstantSourceNode(store.audioContext, { offset: 0 })
retriggerNode.start()

const nodesMap: Record<string, ConstantSourceNode> = {
  gate: gateNode,
  note: noteNode,
  retrigger: retriggerNode,
}

store.registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (outputId, target, targetIndex) => {
      const node = nodesMap[outputId]
      if (!node) {
        return
      }
      if (target instanceof AudioParam) {
        node.connect(target, 0)
        return
      }
      node.connect(target, 0, targetIndex)
    },
    disconnect: (outputId, target, targetIndex) => {
      const node = nodesMap[outputId]
      if (!node) {
        return
      }
      if (target instanceof AudioParam) {
        node.disconnect(target, 0)
        return
      }
      node.disconnect(target, 0, targetIndex)
    },
  },
})

const selectedMidiInput = useParam('deviceId', props.deviceId)

const selectedPriority = useParam('priority', props.priority)
const priorities: { label: string, value: NotePriority }[] = [
  { label: 'Newest', value: 0 },
  { label: 'Oldest', value: 1 },
  { label: 'Highest', value: 2 },
  { label: 'Lowest', value: 3 },
]

const currentOnNote = ref(-1)
const onNoteOn = ({ note }: NoteMessageEvent) => {
  if (currentOnNote.value >= 0) {
    // pattern matching would have been nice here
    switch (selectedPriority.value) {
      case 0:
        break
      case 1:
        return
      case 2:
        if (note.number <= currentOnNote.value) {
          return
        }
        break
      case 3:
        if (note.number >= currentOnNote.value) {
          return
        }
        break
    }
  }

  console.log('NOTE ON?', note)

  currentOnNote.value = note.number
  store.setMultipleParamValues(
    [gateNode.offset, 1],
    [noteNode.offset, midiStore.midiNote2FreqLUT[note.number]],
    [retriggerNode.offset, 1, 'pulse'],
  )
}

const onNoteOff = ({ note }: NoteMessageEvent) => {
  if (currentOnNote.value !== note.number) {
    return
  }
  console.log('NOTE OFF?', note)
  currentOnNote.value = -1
  store.setParamValue(gateNode.offset, 0)
}

const currentInput = computed(() => midiStore.midiInputs.find(({ id }) => id === selectedMidiInput.value))
watch(currentInput, (curr, prev) => {
  if (prev) {
    prev.removeListener('noteon', onNoteOn)
    prev.removeListener('noteoff', onNoteOff)
  }
  if (curr) {
    curr.addListener('noteon', onNoteOn)
    curr.addListener('noteoff', onNoteOff)
  }
}, { immediate: true })

onUnmounted(() => {
  gateNode.disconnect()
  gateNode.stop()
  noteNode.disconnect()
  noteNode.stop()
  retriggerNode.disconnect()
  retriggerNode.stop()
})
</script>

<template>
  <ModuleToolbar />
  <div class="flex flex-col gap-2 border pl-2 pr-1 py-2">
    <span class="text-sm">{{ title }}</span>
    <div class="flex">
      <div class="flex flex-col gap-2">
        <Dropdown
          v-model="selectedMidiInput"
          class="border h-8 text-xs w-full"
          :options="midiStore.midiInputs"
          option-label="name"
          option-value="id"
          placeholder="Input Device"
        />
        <Dropdown
          v-model="selectedPriority"
          class="border h-8 text-xs w-full"
          :options="priorities"
          option-label="label"
          option-value="value"
          placeholder="Priority"
        />
      </div>

      <div class="flex flex-col gap-4 pl-2 text-right">
        <HandleLabel>note</HandleLabel>
        <Handle
          id="note"
          class="!top-10"
          type="source"
          :position="Position.Right"
        />
        <HandleLabel>gate</HandleLabel>
        <Handle
          id="gate"
          class="!top-16"
          type="source"
          :position="Position.Right"
        />
        <HandleLabel>retrig</HandleLabel>
        <Handle
          id="retrigger"
          class="!top-[5.5rem]"
          type="source"
          :position="Position.Right"
        />
      </div>
    </div>
  </div>
</template>

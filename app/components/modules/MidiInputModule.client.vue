<script lang="ts" setup>
import { WebMidi, type NoteMessageEvent } from 'webmidi'

export type MidiInputModuleProps = {
  id: string
  type: string
  channel?: number // not yet used!
  deviceId?: string
  priority?: 0 | 1 // newest | oldest
}
const props = defineProps<MidiInputModuleProps>()

if (!WebMidi.enabled) {
  await WebMidi.enable()
}

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

const selectedMidiInput = ref(props.deviceId)
const midiInputs = WebMidi.inputs

const selectedPriority = ref(props.priority ?? 0)
const priorities = [{ label: 'Newest', value: 0 }, { label: 'Oldest', value: 1 }]

const currentOnNote = ref(-1)
const onNoteOn = ({ note }: NoteMessageEvent) => {
  if (currentOnNote.value >= 0 && selectedPriority.value === 1) {
    return
  }
  console.log('NOTE ON?', note, midiNote2FreqLUT[note.number])

  currentOnNote.value = note.number
  store.setMultipleParamValues(
    [gateNode.offset, 1],
    [noteNode.offset, midiNote2FreqLUT[note.number]],
    [retriggerNode.offset, 1, 'pulse'],
  )
}

const onNoteOff = ({ note }: NoteMessageEvent) => {
  if (currentOnNote.value !== note.number) {
    return
  }
  console.log('NOTE OFF?', note)
  currentOnNote.value = -1
  gateNode.offset.setValueAtTime(0, store.audioContext.currentTime)
}

const currentInput = computed(() => WebMidi.inputs.find(({ id }) => id === selectedMidiInput.value))
watch(currentInput, (curr, prev) => {
  if (prev) {
    prev.removeListener('noteon', onNoteOn)
    prev.removeListener('noteoff', onNoteOff)
  }
  if (curr) {
    curr.addListener('noteon', onNoteOn)
    curr.addListener('noteoff', onNoteOff)
  }
})

const { updateNodeData } = useVueFlow()
watch([selectedMidiInput, selectedPriority], ([deviceId, priority]) => {
  updateNodeData<MidiInputModuleProps>(props.id, { deviceId, priority })
})

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
  <div class="flex flex-col gap-2 border pl-2 pr-1 py-2">
    <span class="text-sm">MIDI Input</span>
    <div class="flex">
      <div class="flex flex-col gap-2">
        <Dropdown
          v-model="selectedMidiInput"
          class="border h-8 text-xs w-full"
          :options="midiInputs"
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

<script lang="ts" setup>
import { Handle, Position } from '@vue-flow/core'
import type { NoteMessageEvent, MessageEvent } from 'webmidi'

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
  outputs?: number
  pitchBendRange?: number // semitones, range 1-24
}
const props = withDefaults(defineProps<MidiInputModuleProps>(), {
  title: 'MIDI Input',
  priority: 0,
  outputs: 1,
  pitchBendRange: 12, // default to 12 semitones (one octave)
})

const midiStore = useMidiStore()
await midiStore.enable()
const store = useAudioContextStore()

const selectedOutputCount = useParam('outputs', props.outputs)
const outputOptions = Array.from({ length: 8 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }))

const gateMergerNode = new ChannelMergerNode(store.audioContext, { numberOfInputs: 8 })
const noteMergerNode = new ChannelMergerNode(store.audioContext, { numberOfInputs: 8 })
const retrigMergerNode = new ChannelMergerNode(store.audioContext, { numberOfInputs: 8 })

const gateNodes: ConstantSourceNode[] = []
const noteNodes: ConstantSourceNode[] = []
const retriggerNodes: ConstantSourceNode[] = []

const activeVoices = new Map<number, { note: number, lastPlayed: number, state: 'on' | 'off' }>()
watch(selectedOutputCount, (curr, prev) => {
  prev ??= 0
  if (curr > prev) {
    for (let i = prev; i < curr; i++) {
      const gateNode = new ConstantSourceNode(store.audioContext, { offset: 0 })
      gateNode.start()
      gateNode.connect(gateMergerNode, 0, i)
      gateNodes.push(gateNode)
      const noteNode = new ConstantSourceNode(store.audioContext, { offset: 0 })
      noteNode.start()
      noteNode.connect(noteMergerNode, 0, i)
      noteNodes.push(noteNode)
      const retriggerNode = new ConstantSourceNode(store.audioContext, { offset: 0 })
      retriggerNode.start()
      retriggerNode.connect(retrigMergerNode, 0, i)
      retriggerNodes.push(retriggerNode)

      activeVoices.set(i, { note: 0, lastPlayed: 0, state: 'off' })
    }
  }
  else if (curr < prev) {
    for (const removedGn of gateNodes.splice(curr)) {
      removedGn.disconnect()
      removedGn.stop()
    }
    for (const removedNn of noteNodes.splice(curr)) {
      removedNn.disconnect()
      removedNn.stop()
    }
    for (const removedRn of retriggerNodes.splice(curr)) {
      removedRn.disconnect()
      removedRn.stop()
    }
    for (let i = prev - 1; i >= curr; i--) {
      activeVoices.delete(i)
    }
  }
}, { immediate: true })

const nodesMap: Record<string, ChannelMergerNode> = {
  gate: gateMergerNode,
  note: noteMergerNode,
  retrigger: retrigMergerNode,
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

const selectedPitchBendRange = useParam('pitchBendRange', props.pitchBendRange)
const pitchBendRangeOptions = Array.from({ length: 24 }, (_, i) => ({
  label: `${i + 1} semitone${i === 0 ? '' : 's'}`,
  value: i + 1,
}))

const pitchbendFactor = ref(1)
const onNoteOn = ({ note }: NoteMessageEvent) => {
  let oldestPlayed = Infinity
  let oldestIdx: number | undefined

  let oldestOffPlayed = Infinity
  let oldestOffIdx: number | undefined

  let lowestNote = Infinity
  let lowestPlayed = Infinity
  let lowestIdx: number | undefined

  let highestNote = -Infinity
  let highestLastPlayed = Infinity
  let highestIdx: number | undefined

  for (const [voice, { note: n, lastPlayed, state }] of activeVoices.entries()) {
    if (lastPlayed < oldestPlayed) {
      oldestPlayed = lastPlayed
      oldestIdx = voice
    }
    if (state === 'off') {
      if (lastPlayed < oldestOffPlayed) {
        oldestOffPlayed = lastPlayed
        oldestOffIdx = voice
      }
      continue
    }
    if (n < lowestNote || (n === lowestNote && lastPlayed < lowestPlayed)) {
      lowestNote = n
      lowestPlayed = lastPlayed
      lowestIdx = voice
    }
    if (n > highestNote || (n === highestNote && lastPlayed < highestLastPlayed)) {
      highestNote = n
      highestLastPlayed = lastPlayed
      highestIdx = voice
    }
  }

  let channelIdx: number
  if (oldestOffIdx != null) {
    channelIdx = oldestOffIdx
  }
  else {
    switch (selectedPriority.value) {
      case 0:
        channelIdx = oldestIdx!
        break
      case 1:
        return
      case 2: {
        if (note.number <= lowestNote) {
          return
        }
        channelIdx = lowestIdx!
        break
      }
      case 3: {
        if (note.number >= highestNote) {
          return
        }
        channelIdx = highestIdx!
        break
      }
    }
  }

  console.log('NOTE ON?', note)
  activeVoices.set(channelIdx, { note: note.number, lastPlayed: Date.now(), state: 'on' })
  store.setMultipleParamValues(
    [gateNodes[channelIdx].offset, 1],
    [noteNodes[channelIdx].offset, pitchbendFactor.value * midiStore.midiNote2FreqLUT[note.number]],
    [retriggerNodes[channelIdx].offset, 1, 'pulse'],
  )
}

const onNoteOff = ({ note }: NoteMessageEvent) => {
  let oldestMatchingPlayed = Infinity
  let oldestMatchingVoice: number | undefined
  for (const [voice, { note: n, lastPlayed, state }] of activeVoices.entries()) {
    if (state === 'on' && n === note.number && lastPlayed < oldestMatchingPlayed) {
      oldestMatchingPlayed = lastPlayed
      oldestMatchingVoice = voice
    }
  }
  if (oldestMatchingVoice == null) {
    return
  }
  console.log('NOTE OFF?', note)
  const v = activeVoices.get(oldestMatchingVoice)
  v!.state = 'off'
  activeVoices.set(oldestMatchingVoice, v!)
  store.setParamValue(gateNodes[oldestMatchingVoice].offset, 0)
}

const onPitchBend = ({ value }: MessageEvent) => {
  const semitones = (value as number) * selectedPitchBendRange.value
  pitchbendFactor.value = Math.pow(2, semitones / 12)
}

watch(pitchbendFactor, (curr) => {
  const paramValues: [AudioParam, number][] = []
  for (const [voice, { note }] of activeVoices.entries()) {
    paramValues.push([noteNodes[voice].offset, curr * midiStore.midiNote2FreqLUT[note]])
  }
  store.setMultipleParamValues(...paramValues)
})

const currentInput = computed(() => midiStore.midiInputs.find(({ id }) => id === selectedMidiInput.value))
watch(currentInput, (curr, prev) => {
  if (prev) {
    prev.removeListener('noteon', onNoteOn)
    prev.removeListener('noteoff', onNoteOff)
    prev.removeListener('pitchbend', onPitchBend)
  }
  if (curr) {
    curr.addListener('noteon', onNoteOn)
    curr.addListener('noteoff', onNoteOff)
    curr.addListener('pitchbend', onPitchBend)
  }
}, { immediate: true })

onUnmounted(() => {
  for (const gn of gateNodes) {
    gn.disconnect()
    gn.stop()
  }
  gateMergerNode.disconnect()
  for (const nn of noteNodes) {
    nn.disconnect()
    nn.stop()
  }
  noteMergerNode.disconnect()
  for (const rn of retriggerNodes) {
    rn.disconnect()
    rn.stop()
  }
  retrigMergerNode.disconnect()
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
        <Dropdown
          v-model="selectedOutputCount"
          class="border h-8 text-xs w-full"
          :options="outputOptions"
          option-label="label"
          option-value="value"
          placeholder="Outputs"
        />
        <Dropdown
          v-model="selectedPitchBendRange"
          class="border h-8 text-xs w-full"
          :options="pitchBendRangeOptions"
          option-label="label"
          option-value="value"
          placeholder="Pitch Bend Range"
        />
      </div>

      <div class="flex flex-col gap-4 pl-2 text-right">
        <HandleLabel>note</HandleLabel>
        <Handle
          id="note"
          class="!top-12"
          type="source"
          :position="Position.Right"
        />
        <HandleLabel>gate</HandleLabel>
        <Handle
          id="gate"
          class="!top-20"
          type="source"
          :position="Position.Right"
        />
        <HandleLabel>retrig</HandleLabel>
        <Handle
          id="retrigger"
          class="!top-[7rem]"
          type="source"
          :position="Position.Right"
        />
      </div>
    </div>
  </div>
</template>

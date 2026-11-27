<script lang="ts" setup>
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
const audioContext = store.getAudioContext()

const selectedOutputCount = useParam('outputs', props.outputs)
const outputOptions = Array.from({ length: 8 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }))

const gateMergerNode = new ChannelMergerNode(audioContext, { numberOfInputs: 8 })
const noteMergerNode = new ChannelMergerNode(audioContext, { numberOfInputs: 8 })
const retrigMergerNode = new ChannelMergerNode(audioContext, { numberOfInputs: 8 })
const velocityMergerNode = new ChannelMergerNode(audioContext, { numberOfInputs: 8 })

const gateNodes: ConstantSourceNode[] = []
const noteNodes: ConstantSourceNode[] = []
const retriggerNodes: ConstantSourceNode[] = []
const velocityNodes: ConstantSourceNode[] = []

const activeVoices = new Map<number, { note: number, velocity: number, lastPlayed: number, state: 'on' | 'off' }>()
/** Keys still held without a voice (dropped or stolen), in press order; they sound again when a voice frees up. */
let waitingNotes: { note: number, velocity: number }[] = []
watch(selectedOutputCount, (curr, prev) => {
  prev ??= 0
  if (curr > prev) {
    for (let i = prev; i < curr; i++) {
      const gateNode = new ConstantSourceNode(audioContext, { offset: 0 })
      gateNode.start()
      gateNode.connect(gateMergerNode, 0, i)
      gateNodes.push(gateNode)
      const noteNode = new ConstantSourceNode(audioContext, { offset: 0 })
      noteNode.start()
      noteNode.connect(noteMergerNode, 0, i)
      noteNodes.push(noteNode)
      const retriggerNode = new ConstantSourceNode(audioContext, { offset: 0 })
      retriggerNode.start()
      retriggerNode.connect(retrigMergerNode, 0, i)
      retriggerNodes.push(retriggerNode)
      const velocityNode = new ConstantSourceNode(audioContext, { offset: 0 })
      velocityNode.start()
      velocityNode.connect(velocityMergerNode, 0, i)
      velocityNodes.push(velocityNode)

      activeVoices.set(i, { note: 0, velocity: 0, lastPlayed: 0, state: 'off' })
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
    for (const removedVn of velocityNodes.splice(curr)) {
      removedVn.disconnect()
      removedVn.stop()
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
  velocity: velocityMergerNode,
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

const pitchbendValue = ref(0)
const pitchbendFactor = computed(() => Math.pow(2, pitchbendValue.value * selectedPitchBendRange.value / 12))
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
        waitingNotes.push({ note: note.number, velocity: note.attack })
        return
      case 2: {
        if (note.number <= lowestNote) {
          waitingNotes.push({ note: note.number, velocity: note.attack })
          return
        }
        channelIdx = lowestIdx!
        break
      }
      case 3: {
        if (note.number >= highestNote) {
          waitingNotes.push({ note: note.number, velocity: note.attack })
          return
        }
        channelIdx = highestIdx!
        break
      }
    }
    // the stolen key is still held
    const stolen = activeVoices.get(channelIdx)!
    waitingNotes.push({ note: stolen.note, velocity: stolen.velocity })
  }

  playOnVoice(channelIdx, note.number, note.attack)
}

function playOnVoice(voice: number, note: number, velocity: number) {
  activeVoices.set(voice, { note, velocity, lastPlayed: Date.now(), state: 'on' })
  store.setMultipleParamValues(
    [gateNodes[voice]!.offset, 1],
    [noteNodes[voice]!.offset, pitchbendFactor.value * midiStore.midiNote2FreqLUT[note]!],
    [retriggerNodes[voice]!.offset, 1, 'pulse'],
    [velocityNodes[voice]!.offset, velocity],
  )
}

/** The waiting key the priority prefers: newest, oldest, highest or lowest. */
function takeWaitingNote() {
  if (waitingNotes.length === 0) {
    return undefined
  }
  let idx = waitingNotes.length - 1
  if (selectedPriority.value === 1) {
    idx = 0
  }
  else if (selectedPriority.value !== 0) {
    const pickHigh = selectedPriority.value === 2
    for (let i = 0; i < waitingNotes.length; i++) {
      const n = waitingNotes[i]!.note
      if (pickHigh ? n > waitingNotes[idx]!.note : n < waitingNotes[idx]!.note) {
        idx = i
      }
    }
  }
  return waitingNotes.splice(idx, 1)[0]
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
    // a released key that was waiting for a voice
    const w = waitingNotes.findIndex(w => w.note === note.number)
    if (w >= 0) {
      waitingNotes.splice(w, 1)
    }
    return
  }
  const next = takeWaitingNote()
  if (next) {
    playOnVoice(oldestMatchingVoice, next.note, next.velocity)
    return
  }
  const v = activeVoices.get(oldestMatchingVoice)
  v!.state = 'off'
  activeVoices.set(oldestMatchingVoice, v!)
  store.setParamValue(gateNodes[oldestMatchingVoice]!.offset, 0)
}

const onPitchBend = ({ value }: MessageEvent) => {
  pitchbendValue.value = value as number
}

/** Closes every gate, e.g. when the device whose note-offs they wait for goes away. */
function releaseAllVoices() {
  waitingNotes = []
  for (const [voice, v] of activeVoices.entries()) {
    if (v.state === 'on') {
      v.state = 'off'
      store.setParamValue(gateNodes[voice]!.offset, 0)
    }
  }
  pitchbendValue.value = 0
}

watch(pitchbendFactor, (curr) => {
  const paramValues: Parameters<typeof store.setMultipleParamValues> = []
  for (const [voice, { note }] of activeVoices.entries()) {
    paramValues.push([noteNodes[voice]!.offset, curr * midiStore.midiNote2FreqLUT[note]!, 'exp', 0.01])
  }
  store.setMultipleParamValues(...paramValues)
})

const currentInput = computed(() => midiStore.midiInputs.find(({ id }) => id === selectedMidiInput.value))
function unbind(input: NonNullable<typeof currentInput.value>) {
  input.removeListener('noteon', onNoteOn)
  input.removeListener('noteoff', onNoteOff)
  input.removeListener('pitchbend', onPitchBend)
}
watch(currentInput, (curr, prev) => {
  if (prev) {
    unbind(prev)
    // a switched or unplugged device never sends the note-offs
    releaseAllVoices()
  }
  if (curr) {
    curr.addListener('noteon', onNoteOn)
    curr.addListener('noteoff', onNoteOff)
    curr.addListener('pitchbend', onPitchBend)
  }
}, { immediate: true })

function teardown() {
  // WebMIDI inputs outlive this module
  if (currentInput.value) {
    unbind(currentInput.value)
  }
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
  for (const vn of velocityNodes) {
    vn.disconnect()
    vn.stop()
  }
  velocityMergerNode.disconnect()
  store.unregisterModule(props.id)
}
// Removed while Web MIDI was being enabled: onUnmounted will never run.
if (getCurrentInstance()?.isUnmounted) {
  teardown()
}
else {
  onUnmounted(teardown)
}
</script>

<template>
  <BaseModuleShell
    :id="id"
    :type="type"
    :title="props.title"
  >
    <div class="flex">
      <div class="flex flex-col gap-2">
        <p
          v-if="midiStore.error"
          class="w-40 text-xs text-red-400"
          :title="midiStore.error"
        >
          MIDI unavailable
        </p>
        <USelect
          v-model="selectedMidiInput"
          :items="midiStore.midiInputs"
          label-key="name"
          value-key="id"
          placeholder="Input Device"
          class="nodrag w-full text-xs"
          size="sm"
        />
        <USelect
          v-model="selectedPriority"
          :items="priorities"
          label-key="label"
          value-key="value"
          placeholder="Priority"
          class="nodrag w-full text-xs"
          size="sm"
        />
        <USelect
          v-model="selectedOutputCount"
          :items="outputOptions"
          label-key="label"
          value-key="value"
          placeholder="Outputs"
          class="nodrag w-full text-xs"
          size="sm"
        />
        <USelect
          v-model="selectedPitchBendRange"
          :items="pitchBendRangeOptions"
          label-key="label"
          value-key="value"
          placeholder="Pitch Bend Range"
          class="nodrag w-full text-xs"
          size="sm"
        />
      </div>
      <ModulePortRail
        position="right"
        :ports="[
          { id: 'note', label: 'note', signal: 'midi' },
          { id: 'gate', label: 'gate', signal: 'gate' },
          { id: 'retrigger', label: 'retrig', signal: 'gate' },
          { id: 'velocity', label: 'vlcty', signal: 'cv' },
        ]"
      />
    </div>
  </BaseModuleShell>
</template>

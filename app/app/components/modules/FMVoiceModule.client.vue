<script lang="ts" setup>
export type FMVoiceModuleProps = {
  id: string
  type: string
  title?: string

  // Global parameters
  algorithm?: number

  // Per-operator defaults
  op1PitchShift?: number
  op2PitchShift?: number
  op3PitchShift?: number
  op4PitchShift?: number
  op5PitchShift?: number
  op6PitchShift?: number

  op1FineTune?: number
  op2FineTune?: number
  op3FineTune?: number
  op4FineTune?: number
  op5FineTune?: number
  op6FineTune?: number

  op1Level?: number
  op2Level?: number
  op3Level?: number
  op4Level?: number
  op5Level?: number
  op6Level?: number

  op1Attack?: number
  op2Attack?: number
  op3Attack?: number
  op4Attack?: number
  op5Attack?: number
  op6Attack?: number

  op1Decay?: number
  op2Decay?: number
  op3Decay?: number
  op4Decay?: number
  op5Decay?: number
  op6Decay?: number

  op1Sustain?: number
  op2Sustain?: number
  op3Sustain?: number
  op4Sustain?: number
  op5Sustain?: number
  op6Sustain?: number

  op1Release?: number
  op2Release?: number
  op3Release?: number
  op4Release?: number
  op5Release?: number
  op6Release?: number
}

const props = withDefaults(defineProps<FMVoiceModuleProps>(), {
  title: 'E.Piano 1',
  algorithm: 4,

  // E.Piano 1 pitch shifts - harmonics for electric piano timbre
  op1PitchShift: 0, // Fundamental (1.0x)
  op2PitchShift: 14, // Modulator at ~3.0x ratio (14 semitones ≈ 2.97x)
  op3PitchShift: 0, // Fundamental (1.0x)
  op4PitchShift: 14, // Modulator at ~3.0x ratio
  op5PitchShift: 0, // Unused in algorithm 4
  op6PitchShift: 0, // Unused in algorithm 4

  // Fine tune defaults (0 = no fine tune)
  op1FineTune: 0,
  op2FineTune: 0,
  op3FineTune: 0,
  op4FineTune: 0,
  op5FineTune: 0,
  op6FineTune: 0,

  // E.Piano 1 levels - carriers audible, modulators for FM intensity
  op1Level: 0.8, // Main carrier
  op2Level: 0.6, // Modulator for OP1
  op3Level: 0.4, // Secondary carrier
  op4Level: 0.4, // Modulator for OP3
  op5Level: 0.0, // Unused
  op6Level: 0.0, // Unused

  // E.Piano 1 ADSR - fast attack, characteristic decay
  op1Attack: 0.005, // Very fast attack for carrier
  op2Attack: 0.005, // Very fast attack for modulator
  op3Attack: 0.01, // Slightly slower for secondary carrier
  op4Attack: 0.01, // Slightly slower for secondary modulator
  op5Attack: 0.01, // Unused
  op6Attack: 0.01, // Unused

  op1Decay: 0.8, // Slow decay for sustained tone
  op2Decay: 0.4, // Faster decay for modulator (reduces brightness over time)
  op3Decay: 0.6, // Medium decay for secondary carrier
  op4Decay: 0.3, // Fast decay for secondary modulator
  op5Decay: 0.0, // Unused
  op6Decay: 0.0, // Unused

  op1Sustain: 0.6, // Sustained level for carrier
  op2Sustain: 0.3, // Lower sustain for modulator
  op3Sustain: 0.4, // Medium sustain for secondary carrier
  op4Sustain: 0.2, // Low sustain for secondary modulator
  op5Sustain: 1.0, // Unused
  op6Sustain: 1.0, // Unused

  op1Release: 1.2, // Long release for piano-like sustain
  op2Release: 0.8, // Shorter release for modulator
  op3Release: 1.0, // Medium release for secondary carrier
  op4Release: 0.6, // Short release for secondary modulator
  op5Release: 0.1, // Unused
  op6Release: 0.1, // Unused
})

const { id, title, type, ...paramProps } = props
const { audioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const fmVoiceNode = new FMVoiceWorkletNode(audioContext, { ...paramProps })

// Global parameters
const [algorithm] = useAudioParam('algorithm', props.algorithm, value => setParamValue(fmVoiceNode.algorithm, value))

// Operator parameters arrays for easy iteration
const operatorParams = [
  {
    pitchShift: useAudioParam('op1PitchShift', props.op1PitchShift, value => setParamValue(fmVoiceNode.op1PitchShift, value))[0],
    fineTune: useAudioParam('op1FineTune', props.op1FineTune, value => setParamValue(fmVoiceNode.op1FineTune, value))[0],
    level: useAudioParam('op1Level', props.op1Level, value => setParamValue(fmVoiceNode.op1Level, value))[0],
    attack: useAudioParam('op1Attack', props.op1Attack, value => setParamValue(fmVoiceNode.op1Attack, value))[0],
    decay: useAudioParam('op1Decay', props.op1Decay, value => setParamValue(fmVoiceNode.op1Decay, value))[0],
    sustain: useAudioParam('op1Sustain', props.op1Sustain, value => setParamValue(fmVoiceNode.op1Sustain, value))[0],
    release: useAudioParam('op1Release', props.op1Release, value => setParamValue(fmVoiceNode.op1Release, value))[0],
  },
  {
    pitchShift: useAudioParam('op2PitchShift', props.op2PitchShift, value => setParamValue(fmVoiceNode.op2PitchShift, value))[0],
    fineTune: useAudioParam('op2FineTune', props.op2FineTune, value => setParamValue(fmVoiceNode.op2FineTune, value))[0],
    level: useAudioParam('op2Level', props.op2Level, value => setParamValue(fmVoiceNode.op2Level, value))[0],
    attack: useAudioParam('op2Attack', props.op2Attack, value => setParamValue(fmVoiceNode.op2Attack, value))[0],
    decay: useAudioParam('op2Decay', props.op2Decay, value => setParamValue(fmVoiceNode.op2Decay, value))[0],
    sustain: useAudioParam('op2Sustain', props.op2Sustain, value => setParamValue(fmVoiceNode.op2Sustain, value))[0],
    release: useAudioParam('op2Release', props.op2Release, value => setParamValue(fmVoiceNode.op2Release, value))[0],
  },
  {
    pitchShift: useAudioParam('op3PitchShift', props.op3PitchShift, value => setParamValue(fmVoiceNode.op3PitchShift, value))[0],
    fineTune: useAudioParam('op3FineTune', props.op3FineTune, value => setParamValue(fmVoiceNode.op3FineTune, value))[0],
    level: useAudioParam('op3Level', props.op3Level, value => setParamValue(fmVoiceNode.op3Level, value))[0],
    attack: useAudioParam('op3Attack', props.op3Attack, value => setParamValue(fmVoiceNode.op3Attack, value))[0],
    decay: useAudioParam('op3Decay', props.op3Decay, value => setParamValue(fmVoiceNode.op3Decay, value))[0],
    sustain: useAudioParam('op3Sustain', props.op3Sustain, value => setParamValue(fmVoiceNode.op3Sustain, value))[0],
    release: useAudioParam('op3Release', props.op3Release, value => setParamValue(fmVoiceNode.op3Release, value))[0],
  },
  {
    pitchShift: useAudioParam('op4PitchShift', props.op4PitchShift, value => setParamValue(fmVoiceNode.op4PitchShift, value))[0],
    fineTune: useAudioParam('op4FineTune', props.op4FineTune, value => setParamValue(fmVoiceNode.op4FineTune, value))[0],
    level: useAudioParam('op4Level', props.op4Level, value => setParamValue(fmVoiceNode.op4Level, value))[0],
    attack: useAudioParam('op4Attack', props.op4Attack, value => setParamValue(fmVoiceNode.op4Attack, value))[0],
    decay: useAudioParam('op4Decay', props.op4Decay, value => setParamValue(fmVoiceNode.op4Decay, value))[0],
    sustain: useAudioParam('op4Sustain', props.op4Sustain, value => setParamValue(fmVoiceNode.op4Sustain, value))[0],
    release: useAudioParam('op4Release', props.op4Release, value => setParamValue(fmVoiceNode.op4Release, value))[0],
  },
  {
    pitchShift: useAudioParam('op5PitchShift', props.op5PitchShift, value => setParamValue(fmVoiceNode.op5PitchShift, value))[0],
    fineTune: useAudioParam('op5FineTune', props.op5FineTune, value => setParamValue(fmVoiceNode.op5FineTune, value))[0],
    level: useAudioParam('op5Level', props.op5Level, value => setParamValue(fmVoiceNode.op5Level, value))[0],
    attack: useAudioParam('op5Attack', props.op5Attack, value => setParamValue(fmVoiceNode.op5Attack, value))[0],
    decay: useAudioParam('op5Decay', props.op5Decay, value => setParamValue(fmVoiceNode.op5Decay, value))[0],
    sustain: useAudioParam('op5Sustain', props.op5Sustain, value => setParamValue(fmVoiceNode.op5Sustain, value))[0],
    release: useAudioParam('op5Release', props.op5Release, value => setParamValue(fmVoiceNode.op5Release, value))[0],
  },
  {
    pitchShift: useAudioParam('op6PitchShift', props.op6PitchShift, value => setParamValue(fmVoiceNode.op6PitchShift, value))[0],
    fineTune: useAudioParam('op6FineTune', props.op6FineTune, value => setParamValue(fmVoiceNode.op6FineTune, value))[0],
    level: useAudioParam('op6Level', props.op6Level, value => setParamValue(fmVoiceNode.op6Level, value))[0],
    attack: useAudioParam('op6Attack', props.op6Attack, value => setParamValue(fmVoiceNode.op6Attack, value))[0],
    decay: useAudioParam('op6Decay', props.op6Decay, value => setParamValue(fmVoiceNode.op6Decay, value))[0],
    sustain: useAudioParam('op6Sustain', props.op6Sustain, value => setParamValue(fmVoiceNode.op6Sustain, value))[0],
    release: useAudioParam('op6Release', props.op6Release, value => setParamValue(fmVoiceNode.op6Release, value))[0],
  },
]

const targetHandles = [
  { id: 'trigger', label: 'trig', type: 'target' as const },
  { id: 'retrigger', label: 'retrig', type: 'target' as const },
  { id: 'frequency', label: 'freq', type: 'target' as const },
]

const sourceHandles = [
  { id: 'output', label: 'out', type: 'source' as const },
]

registerModule(id, {
  meta: { id, type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        fmVoiceNode.connect(target, 0)
        return
      }
      fmVoiceNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        fmVoiceNode.disconnect(target, 0)
        return
      }
      fmVoiceNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    frequency: { type: 'audioNode', node: fmVoiceNode, inputIndex: 0 },
    trigger: { type: 'audioNode', node: fmVoiceNode, inputIndex: 1 },
    retrigger: { type: 'audioNode', node: fmVoiceNode, inputIndex: 2 },
  },
  onSuspend: () => {
    fmVoiceNode.reset()
  },
})

onUnmounted(() => {
  fmVoiceNode.destroy()
  unregisterModule(props.id)
})
</script>

<template>
  <ModuleToolbar />
  <div class="flex flex-col gap-2 border px-2 py-2">
    <span class="text-sm pl-1">{{ title }}</span>
    <div class="flex gap-2">
      <HandleBar
        :handles="targetHandles"
        position="left"
      />

      <div class="nodrag flex flex-col gap-3 border border-white rounded-md p-3">
        <!-- Global Parameters Section -->
        <div class="border-b border-white/30 pb-3">
          <div class="text-xs text-white/70 mb-2 uppercase tracking-wide">
            Global
          </div>
          <div class="flex gap-2">
            <ParamController
              name="algorithm"
              :default-value="algorithm"
              label="Algo"
              :min="1"
              :max="32"
              :scaling-factor="1"
              unit=""
              @on-change="value => setParamValue(fmVoiceNode.algorithm, value)"
            />
          </div>
        </div>

        <!-- Operators Section -->
        <div>
          <div class="text-xs text-white/70 mb-2 uppercase tracking-wide">
            Operators
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="(op, index) in operatorParams"
              :key="`op-${index + 1}`"
              class="border border-white/20 rounded-md p-2"
            >
              <div class="text-xs text-white/80 mb-2 text-center">
                OP{{ index + 1 }}
              </div>

              <!-- Pitch, Fine Tune and Level -->
              <div class="flex gap-1 mb-2">
                <ParamController
                  :name="`op${index + 1}PitchShift`"
                  :default-value="op.pitchShift.value"
                  label="Pitch"
                  :min="-24"
                  :max="24"
                  :scaling-factor="1"
                  unit="st"
                  @on-change="(value) => op.pitchShift.value = value"
                />
                <ParamController
                  :name="`op${index + 1}FineTune`"
                  :default-value="op.fineTune.value"
                  label="Fine"
                  :min="-100"
                  :max="100"
                  :scaling-factor="1"
                  unit="c"
                  @on-change="(value) => op.fineTune.value = value"
                />
              </div>
              <div class="flex gap-1 mb-2">
                <ParamController
                  :name="`op${index + 1}Level`"
                  :default-value="op.level.value"
                  label="Level"
                  :min="0"
                  :max="100"
                  :scaling-factor="100"
                  unit="%"
                  @on-change="(value) => op.level.value = value"
                />
              </div>

              <!-- ADSR -->
              <div class="grid grid-cols-2 gap-1">
                <ParamController
                  :name="`op${index + 1}Attack`"
                  :default-value="op.attack.value"
                  label="A"
                  :min="0"
                  :max="2000"
                  :scaling-factor="1000"
                  unit="ms"
                  @on-change="(value) => op.attack.value = value"
                />
                <ParamController
                  :name="`op${index + 1}Decay`"
                  :default-value="op.decay.value"
                  label="D"
                  :min="0"
                  :max="2000"
                  :scaling-factor="1000"
                  unit="ms"
                  @on-change="(value) => op.decay.value = value"
                />
                <ParamController
                  :name="`op${index + 1}Sustain`"
                  :default-value="op.sustain.value"
                  label="S"
                  :min="0"
                  :max="100"
                  :scaling-factor="100"
                  unit="%"
                  @on-change="(value) => op.sustain.value = value"
                />
                <ParamController
                  :name="`op${index + 1}Release`"
                  :default-value="op.release.value"
                  label="R"
                  :min="0"
                  :max="2000"
                  :scaling-factor="1000"
                  unit="ms"
                  @on-change="(value) => op.release.value = value"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <HandleBar
        :handles="sourceHandles"
        position="right"
      />
    </div>
  </div>
</template>

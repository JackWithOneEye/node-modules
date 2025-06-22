import { Destroyable, Resettable } from './mixins'

type ParamOptions = {
  frequency: number
  algorithm: number
  op1PitchShift: number
  op2PitchShift: number
  op3PitchShift: number
  op4PitchShift: number
  op5PitchShift: number
  op6PitchShift: number
  op1FineTune: number
  op2FineTune: number
  op3FineTune: number
  op4FineTune: number
  op5FineTune: number
  op6FineTune: number
  op1Level: number
  op2Level: number
  op3Level: number
  op4Level: number
  op5Level: number
  op6Level: number
  op1Attack: number
  op2Attack: number
  op3Attack: number
  op4Attack: number
  op5Attack: number
  op6Attack: number
  op1Decay: number
  op2Decay: number
  op3Decay: number
  op4Decay: number
  op5Decay: number
  op6Decay: number
  op1Sustain: number
  op2Sustain: number
  op3Sustain: number
  op4Sustain: number
  op5Sustain: number
  op6Sustain: number
  op1Release: number
  op2Release: number
  op3Release: number
  op4Release: number
  op5Release: number
  op6Release: number
}

class FMVoiceWorkletNodeBase extends AudioWorkletNode {
  // Global parameters
  readonly frequency: AudioParam
  readonly algorithm: AudioParam

  // Per-operator pitch shifts
  readonly op1PitchShift: AudioParam
  readonly op2PitchShift: AudioParam
  readonly op3PitchShift: AudioParam
  readonly op4PitchShift: AudioParam
  readonly op5PitchShift: AudioParam
  readonly op6PitchShift: AudioParam

  // Per-operator fine tune
  readonly op1FineTune: AudioParam
  readonly op2FineTune: AudioParam
  readonly op3FineTune: AudioParam
  readonly op4FineTune: AudioParam
  readonly op5FineTune: AudioParam
  readonly op6FineTune: AudioParam

  // Per-operator levels
  readonly op1Level: AudioParam
  readonly op2Level: AudioParam
  readonly op3Level: AudioParam
  readonly op4Level: AudioParam
  readonly op5Level: AudioParam
  readonly op6Level: AudioParam

  // Per-operator ADSR parameters
  readonly op1Attack: AudioParam
  readonly op2Attack: AudioParam
  readonly op3Attack: AudioParam
  readonly op4Attack: AudioParam
  readonly op5Attack: AudioParam
  readonly op6Attack: AudioParam

  readonly op1Decay: AudioParam
  readonly op2Decay: AudioParam
  readonly op3Decay: AudioParam
  readonly op4Decay: AudioParam
  readonly op5Decay: AudioParam
  readonly op6Decay: AudioParam

  readonly op1Sustain: AudioParam
  readonly op2Sustain: AudioParam
  readonly op3Sustain: AudioParam
  readonly op4Sustain: AudioParam
  readonly op5Sustain: AudioParam
  readonly op6Sustain: AudioParam

  readonly op1Release: AudioParam
  readonly op2Release: AudioParam
  readonly op3Release: AudioParam
  readonly op4Release: AudioParam
  readonly op5Release: AudioParam
  readonly op6Release: AudioParam

  constructor(context: AudioContext, options?: Partial<ParamOptions>) {
    super(context, 'fm-voice', {
      numberOfInputs: 3, // trigger, retrigger
      numberOfOutputs: 1,
      outputChannelCount: [2],
      parameterData: options,
    })

    // Global parameters
    this.frequency = this.parameters.get('frequency')!
    this.algorithm = this.parameters.get('algorithm')!

    // Per-operator pitch shifts
    this.op1PitchShift = this.parameters.get('op1PitchShift')!
    this.op2PitchShift = this.parameters.get('op2PitchShift')!
    this.op3PitchShift = this.parameters.get('op3PitchShift')!
    this.op4PitchShift = this.parameters.get('op4PitchShift')!
    this.op5PitchShift = this.parameters.get('op5PitchShift')!
    this.op6PitchShift = this.parameters.get('op6PitchShift')!

    // Per-operator fine tune
    this.op1FineTune = this.parameters.get('op1FineTune')!
    this.op2FineTune = this.parameters.get('op2FineTune')!
    this.op3FineTune = this.parameters.get('op3FineTune')!
    this.op4FineTune = this.parameters.get('op4FineTune')!
    this.op5FineTune = this.parameters.get('op5FineTune')!
    this.op6FineTune = this.parameters.get('op6FineTune')!

    // Per-operator levels
    this.op1Level = this.parameters.get('op1Level')!
    this.op2Level = this.parameters.get('op2Level')!
    this.op3Level = this.parameters.get('op3Level')!
    this.op4Level = this.parameters.get('op4Level')!
    this.op5Level = this.parameters.get('op5Level')!
    this.op6Level = this.parameters.get('op6Level')!

    // Per-operator ADSR parameters
    this.op1Attack = this.parameters.get('op1Attack')!
    this.op2Attack = this.parameters.get('op2Attack')!
    this.op3Attack = this.parameters.get('op3Attack')!
    this.op4Attack = this.parameters.get('op4Attack')!
    this.op5Attack = this.parameters.get('op5Attack')!
    this.op6Attack = this.parameters.get('op6Attack')!

    this.op1Decay = this.parameters.get('op1Decay')!
    this.op2Decay = this.parameters.get('op2Decay')!
    this.op3Decay = this.parameters.get('op3Decay')!
    this.op4Decay = this.parameters.get('op4Decay')!
    this.op5Decay = this.parameters.get('op5Decay')!
    this.op6Decay = this.parameters.get('op6Decay')!

    this.op1Sustain = this.parameters.get('op1Sustain')!
    this.op2Sustain = this.parameters.get('op2Sustain')!
    this.op3Sustain = this.parameters.get('op3Sustain')!
    this.op4Sustain = this.parameters.get('op4Sustain')!
    this.op5Sustain = this.parameters.get('op5Sustain')!
    this.op6Sustain = this.parameters.get('op6Sustain')!

    this.op1Release = this.parameters.get('op1Release')!
    this.op2Release = this.parameters.get('op2Release')!
    this.op3Release = this.parameters.get('op3Release')!
    this.op4Release = this.parameters.get('op4Release')!
    this.op5Release = this.parameters.get('op5Release')!
    this.op6Release = this.parameters.get('op6Release')!
  }
}

export const FMVoiceWorkletNode = Destroyable(Resettable(FMVoiceWorkletNodeBase))

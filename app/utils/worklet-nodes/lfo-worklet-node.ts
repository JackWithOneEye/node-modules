import { Destroyable, Resettable } from './mixins'

export const enum LFOPolarity {
  Bipolar = 0,
  Unipolar = 1,
}

export const enum LFOWaveform {
  Sine = 0,
  Triangle = 1,
  Saw = 2,
  Ramp = 3,
  Square = 4,
  RSH = 5,
}

type ParamOptions = {
  frequency: number
  phase: number
  polarity: LFOPolarity
  waveform: LFOWaveform
}

class LFOOwrkletNodeBase extends AudioWorkletNode {
  readonly frequency: AudioParam
  readonly phase: AudioParam
  readonly polarity: AudioParam
  readonly waveform: AudioParam

  constructor(context: AudioContext, options?: Partial<ParamOptions>) {
    super(context, 'lfo', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      parameterData: options,
    })

    this.frequency = this.parameters.get('frequency')!
    this.phase = this.parameters.get('phase')!
    this.polarity = this.parameters.get('polarity')!
    this.waveform = this.parameters.get('waveform')!
  }
}
export const LFOWorkletNode = Destroyable(Resettable(LFOOwrkletNodeBase))

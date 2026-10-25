import { Destroyable, Resettable } from './mixins'

type AmpParamOptions = {
  gain: number
  bass: number
  mid: number
  treble: number
  bright: number
  master: number
}

class AmpWorkletNodeBase extends AudioWorkletNode {
  readonly gain: AudioParam
  readonly bass: AudioParam
  readonly mid: AudioParam
  readonly treble: AudioParam
  readonly bright: AudioParam
  readonly master: AudioParam

  constructor(context: AudioContext, options?: Partial<AmpParamOptions>) {
    super(context, 'amp', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      parameterData: options,
    })

    this.gain = this.parameters.get('gain')!
    this.bass = this.parameters.get('bass')!
    this.mid = this.parameters.get('mid')!
    this.treble = this.parameters.get('treble')!
    this.bright = this.parameters.get('bright')!
    this.master = this.parameters.get('master')!
  }
}
export const AmpWorkletNode = Destroyable(Resettable(AmpWorkletNodeBase))

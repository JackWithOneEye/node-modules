import { Destroyable, Resettable } from './mixins'

class ADSRWorkletNodeBase extends AudioWorkletNode {
  readonly attack: AudioParam
  readonly decay: AudioParam
  readonly sustain: AudioParam
  readonly release: AudioParam

  constructor(context: AudioContext, options?: Partial<{ attack: number, decay: number, sustain: number, release: number }>) {
    super(context, 'adsr', {
      numberOfInputs: 2,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      parameterData: options,
    })

    this.attack = this.parameters.get('attack')!
    this.decay = this.parameters.get('decay')!
    this.sustain = this.parameters.get('sustain')!
    this.release = this.parameters.get('release')!
  }
}
export const ADSRWorkletNode = Destroyable(Resettable(ADSRWorkletNodeBase))

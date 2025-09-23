import { Destroyable, Resettable } from './mixins'

class EnvelopeGeneratorWorkletNodeBase extends AudioWorkletNode {
  readonly attack: AudioParam
  readonly decay: AudioParam
  readonly sustain: AudioParam
  readonly release: AudioParam
  readonly applyVelocity: AudioParam

  constructor(context: AudioContext, options?: Partial<{ attack: number, decay: number, sustain: number, release: number, applyVelocity: number }>) {
    super(context, 'envelope-generator', {
      numberOfInputs: 3,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      parameterData: options,
    })

    this.attack = this.parameters.get('attack')!
    this.decay = this.parameters.get('decay')!
    this.sustain = this.parameters.get('sustain')!
    this.release = this.parameters.get('release')!
    this.applyVelocity = this.parameters.get('applyVelocity')!
  }
}
export const EnvelopeGeneratorWorkletNode = Destroyable(Resettable(EnvelopeGeneratorWorkletNodeBase))

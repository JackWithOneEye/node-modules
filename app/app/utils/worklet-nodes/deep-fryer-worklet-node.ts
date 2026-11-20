import { Destroyable, Resettable } from './mixins'

type DeepFryerParamOptions = {
  dryWetMix: number
  magnitude: number
  overlap: number
  generations: number
  ampBits: number
  phaseBits: number
  sigBits: number
}

class DeepFryerWorkletNodeBase extends AudioWorkletNode {
  readonly dryWetMix: AudioParam
  readonly magnitude: AudioParam
  readonly overlap: AudioParam
  readonly generations: AudioParam
  readonly ampBits: AudioParam
  readonly phaseBits: AudioParam
  readonly sigBits: AudioParam

  constructor(context: AudioContext, options?: Partial<DeepFryerParamOptions>) {
    super(context, 'deep-fryer', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      parameterData: options,
    })

    this.dryWetMix = this.parameters.get('dryWetMix')!
    this.magnitude = this.parameters.get('magnitude')!
    this.overlap = this.parameters.get('overlap')!
    this.generations = this.parameters.get('generations')!
    this.ampBits = this.parameters.get('ampBits')!
    this.phaseBits = this.parameters.get('phaseBits')!
    this.sigBits = this.parameters.get('sigBits')!
  }
}
export const DeepFryerWorkletNode = Destroyable(Resettable(DeepFryerWorkletNodeBase))

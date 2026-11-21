import { Destroyable, Resettable } from './mixins'

type DeepFryer2ParamOptions = {
  dryWetMix: number
  kbps: number
  hopSize: number
}

/** Hop sizes selectable by the `hopSize` param (an index into this list). */
export const DEEP_FRYER_2_HOP_SIZES = [64, 128, 192, 256, 384, 576, 768, 1024, 1536, 2048]

class DeepFryer2WorkletNodeBase extends AudioWorkletNode {
  readonly dryWetMix: AudioParam
  readonly kbps: AudioParam
  readonly hopSize: AudioParam

  constructor(context: AudioContext, options?: Partial<DeepFryer2ParamOptions>) {
    super(context, 'deep-fryer-2', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      parameterData: options,
    })

    this.dryWetMix = this.parameters.get('dryWetMix')!
    this.kbps = this.parameters.get('kbps')!
    this.hopSize = this.parameters.get('hopSize')!
  }
}
export const DeepFryer2WorkletNode = Destroyable(Resettable(DeepFryer2WorkletNodeBase))

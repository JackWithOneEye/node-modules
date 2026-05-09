import { Destroyable, Resettable } from './mixins'

export const enum NoiseType {
  White,
  Brownian,
}

class NoiseGeneratorWorkletNodeBase extends AudioWorkletNode {
  readonly noiseType: AudioParam
  constructor(context: AudioContext, options?: Partial<{ noiseType: NoiseType }>) {
    super(context, 'noise-generator', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      parameterData: options,
    })

    this.noiseType = this.parameters.get('noiseType')!
  }
}
export const NoiseGeneratorWorkletNode = Destroyable(Resettable(NoiseGeneratorWorkletNodeBase))

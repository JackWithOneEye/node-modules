import { Destroyable, Resettable } from './mixins'

class DecimatorWorkletNodeBase extends AudioWorkletNode {
  readonly reduction: AudioParam
  readonly stereoShift: AudioParam

  constructor(context: AudioContext, options?: Partial<{ reduction: number, stereoShift: number }>) {
    super(context, 'decimator', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      parameterData: options,
    })

    this.reduction = this.parameters.get('reduction')!
    this.stereoShift = this.parameters.get('stereoShift')!
  }
}
export const DecimatorWorkletNode = Destroyable(Resettable(DecimatorWorkletNodeBase))

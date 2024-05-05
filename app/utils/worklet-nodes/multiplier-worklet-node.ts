import { Destroyable } from './mixins'

class MultiplierWorkletNodeBase extends AudioWorkletNode {
  constructor(context: AudioContext) {
    super(context, 'multiplier', {
      numberOfInputs: 2,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    })
  }
}
export const MultiplierWorkletNode = Destroyable(MultiplierWorkletNodeBase)

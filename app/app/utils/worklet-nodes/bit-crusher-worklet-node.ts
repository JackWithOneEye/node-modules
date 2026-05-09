import { Destroyable, Resettable } from './mixins'

class BitCrusherWorkletNodeBase extends AudioWorkletNode {
  readonly bits: AudioParam

  constructor(context: AudioContext, options?: Partial<{ bits: number }>) {
    super(context, 'bit-crusher', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      parameterData: options,
    })

    this.bits = this.parameters.get('bits')!
  }
}
export const BitCrusherWorkletNode = Destroyable(Resettable(BitCrusherWorkletNodeBase))

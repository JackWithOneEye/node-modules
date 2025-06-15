import { Destroyable, Resettable } from './mixins'

class MultiFilterWorklerNodeBase extends AudioWorkletNode {
  readonly cutoff: AudioParam
  readonly q: AudioParam

  constructor(context: AudioContext, options?: Partial<{ cutoff: number, q: number }>) {
    super(context, 'multi-filter', {
      numberOfInputs: 1,
      numberOfOutputs: 4,
      outputChannelCount: [2, 2, 2, 2],
      parameterData: options,
    })

    this.cutoff = this.parameters.get('cutoff')!
    this.q = this.parameters.get('q')!
  }
}
export const MultiFilterWorkletNode = Destroyable(Resettable(MultiFilterWorklerNodeBase))

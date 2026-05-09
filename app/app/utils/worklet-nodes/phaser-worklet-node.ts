import { Destroyable, Resettable } from './mixins'

class PhaserWorkletNodeBase extends AudioWorkletNode {
  readonly rate: AudioParam

  constructor(context: AudioContext, options?: Partial<{ rate: number }>) {
    super(context, 'phaser', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      parameterData: options,
    })

    this.rate = this.parameters.get('rate')!
  }
}
export const PhaserWorkletNode = Destroyable(Resettable(PhaserWorkletNodeBase))

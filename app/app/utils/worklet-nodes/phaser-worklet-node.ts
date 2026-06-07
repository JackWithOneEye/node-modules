import { Destroyable, Resettable } from './mixins'

class PhaserWorkletNodeBase extends AudioWorkletNode {
  readonly modulation: AudioParam
  readonly depth: AudioParam
  readonly intensity: AudioParam
  readonly stages: AudioParam

  constructor(context: AudioContext, options?: Partial<{ depth: number, intensity: number, stages: number }>) {
    super(context, 'phaser', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      parameterData: options,
    })

    this.modulation = this.parameters.get('modulation')!
    this.depth = this.parameters.get('depth')!
    this.intensity = this.parameters.get('intensity')!
    this.stages = this.parameters.get('stages')!
  }
}
export const PhaserWorkletNode = Destroyable(Resettable(PhaserWorkletNodeBase))

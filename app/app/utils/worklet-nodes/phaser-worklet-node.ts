import { Destroyable, Resettable } from './mixins'

export const enum ModulationMapping {
  Linear,
  Exponential,
}

type PhaserParamOptions = {
  depth: number
  intensity: number
  stages: number
  modulationMapping: ModulationMapping
}

class PhaserWorkletNodeBase extends AudioWorkletNode {
  readonly modulation: AudioParam
  readonly depth: AudioParam
  readonly intensity: AudioParam
  readonly stages: AudioParam
  readonly modulationMapping: AudioParam

  constructor(context: AudioContext, options?: Partial<PhaserParamOptions>) {
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
    this.modulationMapping = this.parameters.get('modulationMapping')!
  }
}
export const PhaserWorkletNode = Destroyable(Resettable(PhaserWorkletNodeBase))

import { Destroyable, Resettable } from './mixins'

type DistortionParamOptions = {
  inputGain: number
  wf: number
  wh: number
  uf: number
  uh: number
  bf: number
  outputGain: number
  dcFilter: number
}

class DistortionWorkletNodeBase extends AudioWorkletNode {
  readonly inputGain: AudioParam
  readonly wf: AudioParam
  readonly wh: AudioParam
  readonly uf: AudioParam
  readonly uh: AudioParam
  readonly bf: AudioParam
  readonly outputGain: AudioParam
  readonly dcFilter: AudioParam

  constructor(context: AudioContext, options?: Partial<DistortionParamOptions>) {
    super(context, 'distortion', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      parameterData: options,
    })

    this.inputGain = this.parameters.get('inputGain')!
    this.wf = this.parameters.get('wf')!
    this.wh = this.parameters.get('wh')!
    this.uf = this.parameters.get('uf')!
    this.uh = this.parameters.get('uh')!
    this.bf = this.parameters.get('bf')!
    this.outputGain = this.parameters.get('outputGain')!
    this.dcFilter = this.parameters.get('dcFilter')!
  }
}
export const DistortionWorkletNode = Destroyable(Resettable(DistortionWorkletNodeBase))

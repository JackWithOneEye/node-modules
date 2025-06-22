import { Destroyable, Resettable } from './mixins'

type ParamOptions = {
  frequency: number
  pitchShift: number
  phaseShift: number
}

class FMOscillatorWorkletNodeBase extends AudioWorkletNode {
  readonly frequency: AudioParam
  readonly pitchShift: AudioParam
  readonly phaseShift: AudioParam

  constructor(context: AudioContext, options?: Partial<ParamOptions>) {
    super(context, 'fm-oscillator', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      parameterData: options,
    })

    this.frequency = this.parameters.get('frequency')!
    this.pitchShift = this.parameters.get('pitchShift')!
    this.phaseShift = this.parameters.get('phaseShift')!
  }
}

export const FMOscillatorWorkletNode = Destroyable(Resettable(FMOscillatorWorkletNodeBase))

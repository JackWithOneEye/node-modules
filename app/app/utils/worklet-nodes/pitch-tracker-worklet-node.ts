import { Destroyable, Resettable } from './mixins'

class PitchTrackerWorkletNodeBase extends AudioWorkletNode {
  constructor(context: AudioContext, options: { harmonicThreshold?: number, windowSizeSamples?: number } = {}) {
    if (typeof options.windowSizeSamples !== 'number') {
      throw new Error('PitchTracker requires windowSizeSamples parameter')
    }

    super(context, 'pitch-tracker', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      parameterData: {
        harmonicThreshold: options.harmonicThreshold ?? 0.1,
      },
      processorOptions: {
        windowSizeSamples: options.windowSizeSamples,
      },
    })
  }

  get harmonicThreshold() {
    return this.parameters.get('harmonicThreshold')!
  }
}

export const PitchTrackerWorkletNode = Destroyable(Resettable(PitchTrackerWorkletNodeBase))

import { Destroyable, Resettable } from './mixins'

class EnvelopeTrackerWorkletNodeBase extends AudioWorkletNode {
  constructor(context: AudioContext, options: { sensitivity?: number, threshold?: number } = {}) {
    super(context, 'envelope-tracker', {
      numberOfInputs: 1,
      numberOfOutputs: 2, // modulation and trigger outputs
      outputChannelCount: [1, 1],
      parameterData: {
        sensitivity: options.sensitivity ?? 1.0,
        threshold: options.threshold ?? -60.0,
      },
    })
  }

  get sensitivity() {
    return this.parameters.get('sensitivity')!
  }

  get threshold() {
    return this.parameters.get('threshold')!
  }
}

export const EnvelopeTrackerWorkletNode = Destroyable(Resettable(EnvelopeTrackerWorkletNodeBase))

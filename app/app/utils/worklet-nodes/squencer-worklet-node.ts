import { Destroyable, Resettable } from './mixins'

const NUM_VALUES = 16

type ParamOptions = {
  gateThreshold: number
  numSteps: number
  values: number[]
}

class SequencerWorkletNodeBase extends AudioWorkletNode {
  readonly gateThreshold: AudioParam
  readonly numSteps: AudioParam

  readonly valueParams: AudioParam[]

  private prevStep = -1

  set values(vals: number[]) {
    const currentTime = this.context.currentTime
    for (let i = 0; i < NUM_VALUES; i++) {
      this.valueParams[i].setValueAtTime(vals[i] ?? 0, currentTime)
    }
  }

  constructor(context: AudioContext, options?: Partial<ParamOptions>, currentStepCb?: (step: number) => void) {
    super(context, 'sequencer', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      parameterData: {
        // @ts-expect-error [it be how it be]
        gateThreshold: options?.gateThreshold,
        // @ts-expect-error [it be how it be]
        numSteps: options?.numSteps,
      },
    })

    this.gateThreshold = this.parameters.get('gateThreshold')!
    this.numSteps = this.parameters.get('numSteps')!

    this.valueParams = []
    for (let i = 0; i < NUM_VALUES; i++) {
      this.valueParams.push(this.parameters.get(`value${i}`)!)
    }

    if (currentStepCb) {
      this.port.onmessage = (e) => {
        if ('currentStep' in e.data && this.prevStep !== e.data.currentStep) {
          currentStepCb(e.data.currentStep)
          this.prevStep = e.data.currentStep
        }
      }
    }

    if (options?.values) {
      this.values = options.values
    }
  }
}
export const SequencerWorkletNode = Destroyable(Resettable(SequencerWorkletNodeBase))

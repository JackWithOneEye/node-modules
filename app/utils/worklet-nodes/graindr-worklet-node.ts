import { Destroyable, Resettable } from './mixins'

export const enum Direction {
  Forward,
  Reverse,
  Alternate,
}

export const enum ToneType {
  Digital,
  Tape,
}

type ParamOptions = {
  dryWetMix: number
  grainSizeMs: number
  pitchShift: number
  fineTune: number
  texture: number
  stretch: number
  shimmer: number
  feedback: number
  hicut: number
  playbackDirection: Direction
  toneType: ToneType
}

class GraindrWorkletNodeBase extends AudioWorkletNode {
  readonly dryWetMix: AudioParam
  readonly grainSizeMs: AudioParam
  readonly pitchShift: AudioParam
  readonly fineTune: AudioParam
  readonly texture: AudioParam
  readonly stretch: AudioParam
  readonly shimmer: AudioParam
  readonly feedback: AudioParam
  readonly hiCut: AudioParam
  readonly playbackDirection: AudioParam
  readonly toneType: AudioParam

  constructor(context: AudioContext, options?: Partial<ParamOptions>) {
    super(context, 'graindr', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      parameterData: options,
    })

    this.dryWetMix = this.parameters.get('dryWetMix')!
    this.grainSizeMs = this.parameters.get('grainSizeMs')!
    this.pitchShift = this.parameters.get('pitchShift')!
    this.fineTune = this.parameters.get('fineTune')!
    this.texture = this.parameters.get('texture')!
    this.stretch = this.parameters.get('stretch')!
    this.shimmer = this.parameters.get('shimmer')!
    this.feedback = this.parameters.get('feedback')!
    this.hiCut = this.parameters.get('hiCut')!
    this.playbackDirection = this.parameters.get('playbackDirection')!
    this.toneType = this.parameters.get('toneType')!
  }
}
export const GraindrWorkletNode = Destroyable(Resettable(GraindrWorkletNodeBase))

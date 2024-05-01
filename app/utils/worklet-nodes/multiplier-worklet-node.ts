export class MultiplierWorkletNode extends AudioWorkletNode {
  constructor(context: AudioContext) {
    super(context, 'multiplier', {
      numberOfInputs: 2,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    })
  }

  destroy() {
    this.disconnect()
    this.port.postMessage('destroy')
  }
}

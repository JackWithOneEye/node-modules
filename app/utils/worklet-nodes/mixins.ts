// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AudioWorkletNodeConstructor = new (...args: any[]) => AudioWorkletNode

export function Resettable<N extends AudioWorkletNodeConstructor>(WorkletNode: N) {
  return class ResettableWorkletNode extends WorkletNode {
    reset() {
      this.port.postMessage('reset')
    }
  }
}

export function Destroyable<N extends AudioWorkletNodeConstructor>(WorkletNode: N) {
  return class DestroyableWorkletNode extends WorkletNode {
    destroy() {
      this.disconnect()
      this.port.postMessage('destroy')
    }
  }
}

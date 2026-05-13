import type { SignalType } from '~/utils/module'

function edgeKey(nodeId: string, handleId: string): string {
  return `${nodeId}:${handleId}`
}

export function useHandleSignals(): HandleSignals {
  const signals = new Map<string, SignalType>()

  function register(nodeId: string, handleId: string, signal: SignalType) {
    const k = edgeKey(nodeId, handleId)
    if (signal) {
      signals.set(k, signal)
    }
    else {
      signals.delete(k)
    }
  }

  function unregister(nodeId: string, handleId: string) {
    signals.delete(edgeKey(nodeId, handleId))
  }

  function resolve(
    sourceId: string, sourceHandle: string,
    targetId: string, targetHandle: string,
  ): SignalType {
    return signals.get(edgeKey(targetId, targetHandle))
      ?? signals.get(edgeKey(sourceId, sourceHandle))
      ?? 'audio'
  }

  return { register, unregister, resolve }
}

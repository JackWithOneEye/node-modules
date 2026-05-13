import type { InjectionKey } from 'vue'
import type { SignalType } from './module'

/**
 * Key for the parent Vue Flow node id, provided by `BaseModuleShell`
 * and injected by `ModuleHandle.vue`.
 */
export const ParentNodeIdKey: InjectionKey<string> = Symbol('parentNodeId')

export interface HandleSignals {
  register(nodeId: string, handleId: string, signal: SignalType): void
  unregister(nodeId: string, handleId: string): void
  resolve(sourceId: string, sourceHandle: string, targetId: string, targetHandle: string): SignalType
}

export const HandleSignalsKey: InjectionKey<HandleSignals> = Symbol('HandleSignals')

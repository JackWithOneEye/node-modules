import { defineStore } from 'pinia'

export interface SourceInterfaces {
  connect: (outputId: string, target: AudioNode | AudioWorkletNode | AudioParam, tagetIndex: number) => void
  disconnect: (outputId: string, target: AudioNode | AudioWorkletNode | AudioParam, tagetIndex: number) => void
}

export interface GetTarget {
  (inputId: string): ({ type: 'audioNode', node: AudioNode | AudioWorkletNode, inputIndex: number } | { type: 'param', param: AudioParam }) | undefined
}

export type ModuleRegistration = {
  meta: {
    id: string
    type: string
  }
  sourceInterfaces?: SourceInterfaces
  getTarget?: GetTarget
}

type ModuleId = string

type Ramp = 'none' | 'lin' | 'exp' | 'pulse'

export const useAudioContextStore = defineStore('audioContextStore', () => {
  const ctx = ref(new AudioContext({ latencyHint: 0 }))
  const audioContext = computed(() => ctx.value)
  const state = ref(ctx.value.state)

  async function suspend() {
    if (ctx.value.state === 'suspended') {
      return
    }
    await ctx.value.suspend()
    state.value = ctx.value.state
  }

  async function resume() {
    if (ctx.value.state === 'running') {
      return
    }
    await ctx.value.resume()
    state.value = ctx.value.state
  }

  function setParamValue(param: AudioParam, value: number, ramp: Ramp = 'none') {
    internalSetParamValue(param, value, ramp ?? 'none', ctx.value.currentTime)
  }

  function setMultipleParamValues(...args: Parameters<typeof setParamValue>[]) {
    const currentTime = ctx.value.currentTime
    for (const [param, value, ramp] of args) {
      internalSetParamValue(param, value, ramp ?? 'none', currentTime)
    }
  }

  function internalSetParamValue(param: AudioParam, value: number, ramp: Ramp, currentTime: number) {
    const clampedVal = Math.max(param.minValue, Math.min(param.maxValue, value))
    if (ramp === 'none') {
      param.setValueAtTime(clampedVal, currentTime)
      return
    }
    if (ramp === 'pulse') {
      param.setValueAtTime(clampedVal, currentTime)
        .setValueAtTime(0, currentTime + (2 / ctx.value.sampleRate))
      return
    }

    param.setValueAtTime(param.value, currentTime)
    if (ramp === 'exp') {
      param.exponentialRampToValueAtTime(clampedVal, currentTime + 0.05)
      return
    }
    if (ramp === 'lin') {
      param.linearRampToValueAtTime(clampedVal, currentTime + 0.05)
      return
    }
  }

  const moduleRegistry = ref<Map<ModuleId, ModuleRegistration>>(new Map())

  function registerModule(id: string, registration: ModuleRegistration) {
    console.log(`register module ${id} of type ${registration.meta.type}`)
    moduleRegistry.value.set(id, registration)
  }

  function unregisterModule(id: string) {
    console.log(`unregister module ${id}`)
    moduleRegistry.value.delete(id)
  }

  function getSourceModuleAndTarget(sourceId: string, targetId: string, targetInputId: string) {
    const sourceModule = moduleRegistry.value.get(sourceId)
    if (!sourceModule) {
      console.warn(`Source module ${sourceId} not registered!`)
      return
    }
    if (!sourceModule.sourceInterfaces) {
      console.warn(`Source module ${sourceId} did not register source interfaces!`)
      return
    }
    const targetModule = moduleRegistry.value.get(targetId)
    if (!targetModule) {
      console.warn(`Target module ${targetId} not registered!`)
      return
    }
    if (!targetModule.getTarget) {
      console.warn(`Target module ${targetId} did not register getTarget()!`)
      return
    }
    const target = targetModule.getTarget(targetInputId)
    if (!target) {
      console.warn(`Target module ${targetId} has no target node or param for input Id ${targetInputId}!`)
      return
    }

    return [sourceModule, target] as const
  }

  function connectModules(sourceId: string, sourceOutputId: string, targetId: string, targetInputId: string) {
    const found = getSourceModuleAndTarget(sourceId, targetId, targetInputId)
    if (!found) {
      return
    }
    const [sourceModule, target] = found
    if (target.type === 'audioNode') {
      sourceModule.sourceInterfaces!.connect(sourceOutputId, target.node, target.inputIndex)
    }
    else {
      sourceModule.sourceInterfaces!.connect(sourceOutputId, target.param, 0)
    }
  }

  function disconnectModules(sourceId: string, sourceOutputId: string, targetId: string, targetInputId: string) {
    const found = getSourceModuleAndTarget(sourceId, targetId, targetInputId)
    if (!found) {
      return
    }
    const [sourceModule, target] = found
    if (target.type === 'audioNode') {
      sourceModule.sourceInterfaces!.disconnect(sourceOutputId, target.node, target.inputIndex)
    }
    else {
      sourceModule.sourceInterfaces!.disconnect(sourceOutputId, target.param, 0)
    }
  }

  return {
    audioContext,
    state,

    suspend,
    resume,
    setParamValue,
    setMultipleParamValues,

    connectModules,
    disconnectModules,
    registerModule,
    unregisterModule,
  }
})

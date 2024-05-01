import { defineStore } from 'pinia'

export interface SourceInterfaces {
  connect: (outputId: string, target: AudioNode | AudioWorkletNode | AudioParam, tagetIndex: number) => void
  disconnect: (outputId: string, target: AudioNode | AudioWorkletNode | AudioParam, tagetIndex: number) => void
}

export type Target = { type: 'audioNode', node: AudioNode | AudioWorkletNode, inputIndex: number } | { type: 'param', param: AudioParam }

export interface GetTarget {
  (inputId: string): Target | undefined
}

export type ModuleRegistration = {
  meta: {
    id: string
    type: string
  }
  sourceInterfaces?: SourceInterfaces
  getTarget?: GetTarget
  onResume?: () => void
  onSuspend?: () => void
}

type ModuleId = string

type Ramp = 'none' | 'lin' | 'exp' | 'pulse'

const audioContext = new AudioContext({ latencyHint: 0 })
await audioContext.audioWorklet.addModule('/api/audio-processors-script')

export const useAudioContextStore = defineStore('audioContextStore', () => {
  // const ctx = ref(audioCtx)
  // const audioContext = computed(() => ctx.value)
  const state = ref(audioContext.state)
  const moduleRegistry = ref<Map<ModuleId, ModuleRegistration>>(new Map())

  async function suspend() {
    if (audioContext.state === 'suspended') {
      return
    }

    await audioContext.suspend()
    for (const { onSuspend } of moduleRegistry.value.values()) {
      try {
        onSuspend?.()
      }
      catch (e) {
        console.warn(e)
      }
    }
    state.value = audioContext.state
  }

  async function resume() {
    if (audioContext.state === 'running') {
      return
    }
    await audioContext.resume()
    for (const { onResume } of moduleRegistry.value.values()) {
      try {
        onResume?.()
      }
      catch (e) {
        console.warn(e)
      }
    }
    state.value = audioContext.state
  }

  function setParamValue(param: AudioParam, value: number, ramp: Ramp = 'none') {
    internalSetParamValue(param, value, ramp ?? 'none', audioContext.currentTime)
  }

  function setMultipleParamValues(...args: Parameters<typeof setParamValue>[]) {
    const currentTime = audioContext.currentTime
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
        .setValueAtTime(0, currentTime + (2 / audioContext.sampleRate))
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

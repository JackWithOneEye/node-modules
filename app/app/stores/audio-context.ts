export const useAudioContextStore = defineStore('audioContextStore', () => {
  const audioContext = ref<AudioContext>()
  const state = ref<AudioContextState>('closed')
  const moduleRegistry = ref<Map<ModuleId, ModuleRegistration>>(new Map())

  async function init() {
    const ctx = new AudioContext({ latencyHint: 0 })
    await ctx.audioWorklet.addModule('/api/audio-processors-script')
    audioContext.value = ctx
    state.value = audioContext.value.state
  }

  async function destroy() {
    await audioContext.value!.close()
    moduleRegistry.value.clear()
  }

  function getAudioContext() {
    return audioContext.value!
  }

  async function suspend() {
    if (audioContext.value!.state === 'closed' || audioContext.value!.state === 'suspended') {
      return
    }

    await audioContext.value!.suspend()
    for (const { onSuspend } of moduleRegistry.value.values()) {
      try {
        onSuspend?.()
      }
      catch (e) {
        console.warn(e)
      }
    }
    state.value = audioContext.value!.state
  }

  async function resume() {
    if (audioContext.value!.state === 'closed' || audioContext.value!.state === 'running') {
      return
    }
    await audioContext.value!.resume()
    for (const { onResume } of moduleRegistry.value.values()) {
      try {
        onResume?.()
      }
      catch (e) {
        console.warn(e)
      }
    }
    state.value = audioContext.value!.state
  }

  function setParamValue(param: AudioParam, value: number, ramp: Ramp = 'none', rampTime = 0.5) {
    internalSetParamValue(param, value, ramp ?? 'none', audioContext.value!.currentTime, rampTime)
  }

  function setMultipleParamValues(...args: Parameters<typeof setParamValue>[]) {
    const currentTime = audioContext.value!.currentTime
    for (const [param, value, ramp, rampTime] of args) {
      internalSetParamValue(param, value, ramp ?? 'none', currentTime, rampTime ?? 0.5)
    }
  }

  function internalSetParamValue(param: AudioParam, value: number, ramp: Ramp, currentTime: number, rampTime: number) {
    const clampedVal = Math.max(param.minValue, Math.min(param.maxValue, value))
    if (ramp === 'none') {
      param.setValueAtTime(clampedVal, currentTime)
      return
    }
    if (ramp === 'pulse') {
      param.setValueAtTime(clampedVal, currentTime)
        .setValueAtTime(0, currentTime + (2 / audioContext.value!.sampleRate))
      return
    }

    param.setValueAtTime(param.value, currentTime)
    if (ramp === 'exp') {
      param.exponentialRampToValueAtTime(clampedVal, currentTime + rampTime)
      return
    }
    if (ramp === 'lin') {
      param.linearRampToValueAtTime(clampedVal, currentTime + rampTime)
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
    const target = targetModule.getTarget[targetInputId]
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
      console.log(`connect source module ${sourceId}[${sourceOutputId}] to target ${targetId}[${targetInputId}] (index ${target.inputIndex})`)
      sourceModule.sourceInterfaces!.connect(sourceOutputId, target.node, target.inputIndex)
    }
    else {
      console.log(`connect source module ${sourceId}[${sourceOutputId}] to target param ${targetId}[${targetInputId}]`)
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
      console.log(`disconnect source module ${sourceId}[${sourceOutputId}] from target ${targetId}[${targetInputId}] (index ${target.inputIndex})`)
      sourceModule.sourceInterfaces!.disconnect(sourceOutputId, target.node, target.inputIndex)
    }
    else {
      console.log(`disconnect source module ${sourceId}[${sourceOutputId}] from target param ${targetId}[${targetInputId}]`)
      sourceModule.sourceInterfaces!.disconnect(sourceOutputId, target.param, 0)
    }
  }

  return {
    state,

    init,
    destroy,
    getAudioContext,

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

export interface SourceInterfaces {
  connect: (outputId: string, target: AudioNode | AudioWorkletNode | AudioParam, tagetIndex: number) => void
  disconnect: (outputId: string, target: AudioNode | AudioWorkletNode | AudioParam, tagetIndex: number) => void
}

export type Target = { type: 'audioNode', node: AudioNode | AudioWorkletNode, inputIndex: number } | { type: 'param', param: AudioParam }

export interface GetTarget {
  // (inputId: string): Target | undefined
  [id: string]: Target
}

export type ModuleRegistration = {
  meta: {
    id: string
    type: string
  }
  sourceInterfaces?: {
    connect: (outputId: string, target: AudioNode | AudioWorkletNode | AudioParam, tagetIndex: number) => void
    disconnect: (outputId: string, target: AudioNode | AudioWorkletNode | AudioParam, tagetIndex: number) => void
  }
  getTarget?: GetTarget
  onResume?: () => void
  onSuspend?: () => void
}

type ModuleId = string

type Ramp = 'none' | 'lin' | 'exp' | 'pulse'

import type { SignalType } from './module'

export const SIGNAL_COLORS: Record<SignalType, string> = {
  audio: '#ffffff',
  cv: '#00e5e5',
  gate: '#e5e500',
  trigger: '#e5e500',
  midi: '#aa66cc',
}

/**
 * Get the CSS color string for a signal type.
 * Values in `SIGNAL_COLORS` must be 6-digit hex (e.g. `#00e5e5`).
 */
export function getSignalColor(signal: SignalType): string {
  if (signal && signal in SIGNAL_COLORS) {
    return SIGNAL_COLORS[signal]
  }
  return SIGNAL_COLORS.audio
}

/**
 * Get a CSS color string with 20% opacity for the signal's hover glow.
 * Relies on `SIGNAL_COLORS` values being 6-digit hex.
 */
export function getSignalGlowColor(signal: SignalType): string {
  return `${getSignalColor(signal)}33`
}

export function getEdgeStyle(signal: SignalType): { stroke: string } {
  return {
    stroke: getSignalColor(signal),
  }
}

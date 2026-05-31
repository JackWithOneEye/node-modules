export type ThemeName = 'neutral' | 'amber' | 'emerald' | 'indigo'

export interface ThemeDefinition {
  label: string
  accent: string
  primary: Record<string, string>
}

const THEMES: Record<ThemeName, ThemeDefinition> = {
  neutral: {
    label: 'Neutral',
    accent: '#ffffff',
    primary: {
      50: 'oklch(100% 0 0)',
      100: 'oklch(100% 0 0)',
      200: 'oklch(100% 0 0)',
      300: 'oklch(100% 0 0)',
      400: 'oklch(100% 0 0)',
      500: 'oklch(100% 0 0)',
      600: 'oklch(90% 0 0)',
      700: 'oklch(80% 0 0)',
      800: 'oklch(70% 0 0)',
      900: 'oklch(60% 0 0)',
      950: 'oklch(50% 0 0)',
    },
  },
  amber: {
    label: 'Amber',
    accent: '#f59e0b',
    primary: {
      50: 'oklch(98.7% 0.022 95.3)',
      100: 'oklch(96.2% 0.059 95.3)',
      200: 'oklch(92.4% 0.12 95.3)',
      300: 'oklch(86.9% 0.165 95.3)',
      400: 'oklch(80.5% 0.195 95.3)',
      500: 'oklch(76.9% 0.188 95.3)',
      600: 'oklch(66.6% 0.179 95.3)',
      700: 'oklch(55.5% 0.163 95.3)',
      800: 'oklch(47.2% 0.139 95.3)',
      900: 'oklch(40.8% 0.118 95.3)',
      950: 'oklch(27.5% 0.076 95.3)',
    },
  },
  emerald: {
    label: 'Emerald',
    accent: '#10b981',
    primary: {
      50: 'oklch(97.9% 0.029 160.3)',
      100: 'oklch(95% 0.052 160.3)',
      200: 'oklch(90.5% 0.093 160.3)',
      300: 'oklch(84.5% 0.143 160.3)',
      400: 'oklch(77.3% 0.179 160.3)',
      500: 'oklch(70.7% 0.165 160.3)',
      600: 'oklch(59.5% 0.145 160.3)',
      700: 'oklch(48.7% 0.124 160.3)',
      800: 'oklch(40.8% 0.105 160.3)',
      900: 'oklch(34.8% 0.089 160.3)',
      950: 'oklch(22.5% 0.057 160.3)',
    },
  },
  indigo: {
    label: 'Indigo',
    accent: '#818cf8',
    primary: {
      50: 'oklch(97.3% 0.014 261.5)',
      100: 'oklch(94.2% 0.03 261.5)',
      200: 'oklch(90.2% 0.047 261.5)',
      300: 'oklch(85.5% 0.069 261.5)',
      400: 'oklch(81% 0.101 261.5)',
      500: 'oklch(74.6% 0.161 261.5)',
      600: 'oklch(64.4% 0.207 261.5)',
      700: 'oklch(54.8% 0.195 261.5)',
      800: 'oklch(46.6% 0.162 261.5)',
      900: 'oklch(39.8% 0.128 261.5)',
      950: 'oklch(27.5% 0.082 261.5)',
    },
  },
}

const STORAGE_KEY = 'node-modules-theme'

function getInitialTheme(): ThemeName {
  if (typeof window === 'undefined') {
    return 'neutral'
  }
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && stored in THEMES) {
    return stored as ThemeName
  }
  return 'neutral'
}

export const useThemeStore = defineStore('themeStore', () => {
  const currentTheme = ref<ThemeName>(getInitialTheme())

  const theme = computed(() => THEMES[currentTheme.value])
  const accent = computed(() => theme.value.accent)
  const themes = computed(() => Object.entries(THEMES).map(([key, def]) => ({
    value: key as ThemeName,
    label: def.label,
    accent: def.accent,
  })))

  function setTheme(name: ThemeName) {
    currentTheme.value = name
    localStorage.setItem(STORAGE_KEY, name)
    applyTheme(name)
  }

  function applyTheme(name: ThemeName) {
    const el = document.documentElement
    el.setAttribute('data-theme', name)
    const def = THEMES[name]
    for (const [step, value] of Object.entries(def.primary)) {
      el.style.setProperty(`--ui-color-primary-${step}`, value)
    }
    el.style.setProperty('--theme-accent', def.accent)
    const trackColor = name === 'neutral' ? '#3f3f46' : `${def.accent}33`
    el.style.setProperty('--theme-accent-track', trackColor)
  }

  function init() {
    applyTheme(currentTheme.value)
  }

  return {
    currentTheme,
    theme,
    accent,
    themes,
    setTheme,
    init,
  }
})

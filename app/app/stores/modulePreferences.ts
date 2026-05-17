const MAX_FAVORITES = 5
const MAX_RECENTS = 5
const FAVORITES_KEY = 'node-modules:favorite-types'
const RECENTS_KEY = 'node-modules:recent-types'

export const useModulePreferencesStore = defineStore('module-preferences', () => {
  const recentTypes = ref<string[]>([])
  const favoriteTypes = ref<string[]>([])

  function loadState() {
    if (typeof window === 'undefined') {
      return
    }
    try {
      const favRaw = localStorage.getItem(FAVORITES_KEY)
      if (favRaw) {
        const parsed = JSON.parse(favRaw) as string[]
        favoriteTypes.value = parsed.slice(0, MAX_FAVORITES)
      }
    }
    catch (e) {
      console.warn('Failed to load favorite types from localStorage', e)
      favoriteTypes.value = []
    }
    try {
      const recRaw = localStorage.getItem(RECENTS_KEY)
      if (recRaw) {
        const parsed = JSON.parse(recRaw) as string[]
        recentTypes.value = parsed.slice(0, MAX_RECENTS)
      }
    }
    catch (e) {
      console.warn('Failed to load recent types from localStorage', e)
      recentTypes.value = []
    }
  }

  function saveState(key: string, items: string[]) {
    if (typeof window === 'undefined') {
      return
    }
    try {
      localStorage.setItem(key, JSON.stringify(items))
    }
    catch (e) {
      console.warn(`Failed to save preferences with key ${key} to localStorage`, e)
    }
  }

  watch(favoriteTypes, curr => saveState(FAVORITES_KEY, curr), { deep: true })
  watch(recentTypes, curr => saveState(RECENTS_KEY, curr), { deep: true })

  function recordModuleUsed(type: string) {
    recentTypes.value = [type, ...recentTypes.value.filter(t => t !== type)].slice(0, MAX_RECENTS)
  }

  function toggleFavorite(type: string) {
    const i = favoriteTypes.value.indexOf(type)
    if (i >= 0) {
      favoriteTypes.value.splice(i, 1)
    }
    else if (favoriteTypes.value.length < MAX_FAVORITES) {
      favoriteTypes.value.push(type)
    }
  }

  function isFavorite(type: string): boolean {
    return favoriteTypes.value.includes(type)
  }

  loadState()

  return {
    recentTypes,
    favoriteTypes,
    recordModuleUsed,
    toggleFavorite,
    isFavorite,
  }
})

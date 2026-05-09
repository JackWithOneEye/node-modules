export const useDataStore = defineStore('data', () => {
  const getData = useFetch('/api/data')
  const data = computed(() => getData.data.value ?? { nodes: [], edges: [], viewport: undefined })
  const loading = computed(() => getData.pending.value)

  const { toObject } = useVueFlow()

  async function fetch() {
    await getData.execute()
  }

  async function save() {
    const { nodes, edges, viewport } = toObject()
    console.log(nodes)
    return $fetch('/api/data', { method: 'post', body: { nodes, edges, viewport } })
  }

  return {
    data,
    loading,
    fetch,
    save,
  }
})

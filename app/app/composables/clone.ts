export function clone<T>(value: T): T {
  if (value === undefined || value === null) {
    return value
  }
  // return JSON.parse(JSON.stringify(value))
  try {
    return structuredClone(toRaw(value))
  }
  catch (e) {
    console.error(value)
    throw e
  }
}

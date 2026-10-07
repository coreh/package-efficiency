export async function operation({ items, attempts }) {
  const results = new Array(items.length)
  for (let i = 0; i < items.length; i++) {
    const { value, failures } = items[i]
    let calls = 0
    const job = async () => {
      calls++
      if (calls <= failures) throw new Error('failed')
      return value * 2 + 1
    }
    let out = null
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        out = await job()
        break
      } catch {
        // try again
      }
    }
    results[i] = { attempts: calls, value: out }
  }
  return results
}

import pRetry from 'p-retry'
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
    try {
      const out = await pRetry(job, { retries: attempts - 1, minTimeout: 0, maxTimeout: 0, factor: 1, randomize: false })
      results[i] = { attempts: calls, value: out }
    } catch {
      results[i] = { attempts: calls, value: null }
    }
  }
  return results
}

const fetch = globalThis.fetch || require('node-fetch')
const URL = process.env.TARGET_URL || 'http://localhost:4000'
const PATH = process.env.PATH_TO_TEST || '/api/leaderboard'
const TOTAL = Number(process.env.TOTAL || 200)
const CONCURRENCY = Number(process.env.CONCURRENCY || 20)

async function runBatch(batch) {
  const promises = batch.map(async (i) => {
    const start = Date.now()
    try {
      const res = await fetch(URL + PATH)
      const ms = Date.now() - start
      return { status: res.status, time: ms }
    } catch (e) {
      return { status: 'ERR', error: String(e) }
    }
  })
  return Promise.all(promises)
}

;(async () => {
  console.log(`Running ${TOTAL} requests against ${URL}${PATH} with concurrency ${CONCURRENCY}`)
  const results = []
  const batches = Math.ceil(TOTAL / CONCURRENCY)
  for (let b = 0; b < batches; b++) {
    const batchSize = Math.min(CONCURRENCY, TOTAL - b * CONCURRENCY)
    const batch = Array.from({ length: batchSize }, (_, i) => i + b * CONCURRENCY + 1)
    // eslint-disable-next-line no-await-in-loop
    const res = await runBatch(batch)
    results.push(...res)
    await new Promise(r => setTimeout(r, 50))
  }
  const summary = results.reduce((acc, r) => {
    const code = r.status
    acc.total++
    if (code === 200) acc.ok++
    else if (code === 429) acc.rate++
    else if (code === 'ERR') acc.err++
    else acc.other++
    return acc
  }, { total: 0, ok: 0, rate: 0, err: 0, other: 0 })
  console.log('Summary:', summary)
  const times = results.filter(r => typeof r.time === 'number').map(r => r.time)
  if (times.length) {
    const avg = times.reduce((a,b)=>a+b,0)/times.length
    console.log(`Avg latency (ms): ${Math.round(avg)}`)
  }
})()

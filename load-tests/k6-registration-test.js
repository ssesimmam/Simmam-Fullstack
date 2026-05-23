import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const errorRate = new Rate('errors')
const latency = new Trend('response_latency')

export let options = {
  stages: [
    { duration: '10s', target: 500 },
    { duration: '15s', target: 2000 },
    { duration: '30s', target: 4000 },
    { duration: '30s', target: 4000 },   // hold at peak
    { duration: '10s', target: 0 },      // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    errors: ['rate<0.50'],
  },
}

const API = 'http://127.0.0.1:4000'

/*
 * Simulates the real registration flow a user triggers:
 *
 * 1. GET /api/events            — browse events page
 * 2. GET /api/leaderboard       — leaderboard widget
 * 3. GET /api/houses            — houses sidebar
 * 4. POST /api/registrations    — attempt registration (will get 401/403 without real auth, but stresses the middleware + validation pipeline)
 * 5. GET /api/announcements     — announcements panel
 *
 * This tests the full middleware stack (rate limiter, CORS, auth check, turnstile, validation)
 * under load, which is the real bottleneck during registration rushes.
 */

export default function () {
  const vu = __VU
  const iter = __ITER

  // Step 1: Browse events
  const eventsRes = http.get(`${API}/api/events`)
  check(eventsRes, { 'events 200|503': (r) => r.status === 200 || r.status === 503 })
  latency.add(eventsRes.timings.duration)

  // Step 2: Leaderboard
  const lbRes = http.get(`${API}/api/leaderboard`)
  check(lbRes, { 'leaderboard 200|503': (r) => r.status === 200 || r.status === 503 })
  latency.add(lbRes.timings.duration)

  // Step 3: Houses
  const housesRes = http.get(`${API}/api/houses`)
  check(housesRes, { 'houses 200|503': (r) => r.status === 200 || r.status === 503 })
  latency.add(housesRes.timings.duration)

  // Step 4: Attempt registration (no auth token → 401, but exercises the full pipeline)
  const regPayload = JSON.stringify({
    email: `loadtest_vu${vu}_iter${iter}@test.simmam.com`,
    name: `Load Test User ${vu}`,
    register_number: `LT${String(vu).padStart(4, '0')}`,
    house: ['Phoenix', 'Orion', 'Vega', 'Draco'][vu % 4],
    event_name: 'Coding Challenge',
  })

  const regRes = http.post(`${API}/api/registrations`, regPayload, {
    headers: { 'Content-Type': 'application/json' },
  })
  // 401 (no auth) or 503 (load shed) are both expected — we're testing throughput
  const regOk = check(regRes, {
    'registration handled': (r) => r.status === 401 || r.status === 429 || r.status === 503 || r.status === 201 || r.status === 409,
  })
  latency.add(regRes.timings.duration)
  errorRate.add(!regOk)

  // Step 5: Announcements
  const annRes = http.get(`${API}/api/announcements`)
  check(annRes, { 'announcements 200|503': (r) => r.status === 200 || r.status === 503 })
  latency.add(annRes.timings.duration)

  // Think time: real user reads the page
  sleep(0.5 + Math.random() * 1.0)
}

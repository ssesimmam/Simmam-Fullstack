import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const errorRate = new Rate('errors')
const latency = new Trend('response_latency')

export let options = {
  stages: [
    { duration: '15s', target: 500 },
    { duration: '15s', target: 1500 },
    { duration: '30s', target: 4000 },
    { duration: '1m', target: 4000 },   // hold at 4000 VUs
    { duration: '15s', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.10'],
    errors: ['rate<0.10'],
  },
}

const API = 'http://127.0.0.1:4000'

export default function () {
  // Mix of endpoints to simulate real traffic
  const endpoints = [
    '/api/health',
    '/api/events',
    '/api/houses',
    '/api/leaderboard',
    '/api/announcements',
  ]

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
  const res = http.get(`${API}${endpoint}`)

  latency.add(res.timings.duration)

  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has body': (r) => r.body && r.body.length > 0,
  })

  errorRate.add(!ok)
  sleep(0.3 + Math.random() * 0.7)  // 0.3-1s think time
}

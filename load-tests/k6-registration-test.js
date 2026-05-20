import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: __ENV.VUS ? parseInt(__ENV.VUS) : 50,
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

const TARGET = __ENV.TARGET_URL;
const TOKEN = __ENV.AUTH_TOKEN; // set to a valid user token or use service_role for staging

export default function () {
  const payload = JSON.stringify({ event_id: __ENV.EVENT_ID });
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
  };

  let res = http.post(`${TARGET}/api/registrations`, payload, params);
  check(res, {
    'status is 2xx or 4xx (expected)': (r) => r.status >= 200 && r.status < 500,
  });
  sleep(0.1);
}

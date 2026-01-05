import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Spike to 100 users (should trigger autoscaling)
    { duration: '1m', target: 50 },   // Scale down to 50
    { duration: '30s', target: 0 },   // Ramp down
  ],
};

const BASE_URL = 'http://192.168.49.2:30521'; // Kubernetes Ingress

export default function () {
  // Register a new user
  const timestamp = Date.now();
  const registerPayload = JSON.stringify({
    username: `loadtest_${timestamp}`,
    email: `loadtest_${timestamp}@test.com`,
    password: 'TestPassword123!',
  });

  let response = http.post(`${BASE_URL}/api/Registration/register`, registerPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(response, {
    'Register user status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(2);

  // Health check endpoint (lighter load)
  response = http.get(`${BASE_URL}/api/Registration/health`);
  check(response, {
    'Health check status is 200': (r) => r.status === 200,
  });

  sleep(1);
}

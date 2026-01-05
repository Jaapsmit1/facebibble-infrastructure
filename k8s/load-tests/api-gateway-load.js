import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 80 },   // Ramp up to 80 users
    { duration: '2m', target: 150 },  // Spike to 150 users (should trigger autoscaling)
    { duration: '1m', target: 80 },   // Scale down to 80
    { duration: '30s', target: 0 },   // Ramp down
  ],
};

const BASE_URL = 'http://192.168.49.2:30521'; // Kubernetes Ingress

export default function () {
  // Hit multiple endpoints through the gateway
  
  // Posts endpoint
  let response = http.get(`${BASE_URL}/api/Post`);
  check(response, {
    'Gateway to Posts status is 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // Comments endpoint
  response = http.get(`${BASE_URL}/api/Comment`);
  check(response, {
    'Gateway to Comments status is 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // Users endpoint
  response = http.get(`${BASE_URL}/api/User`);
  check(response, {
    'Gateway to Users status is 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // Registration health check
  response = http.get(`${BASE_URL}/api/Registration/health`);
  check(response, {
    'Gateway to Registration status is 200': (r) => r.status === 200,
  });

  sleep(0.5);
}

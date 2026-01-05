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
  // GET all users
  let response = http.get(`${BASE_URL}/api/User`);
  check(response, {
    'Get users status is 200': (r) => r.status === 200,
  });

  sleep(1);

  // Create a user (this will stress the service more)
  const timestamp = Date.now();
  const userPayload = JSON.stringify({
    username: `loadtest_${timestamp}`,
    email: `loadtest_${timestamp}@test.com`,
    firstName: 'Load',
    lastName: 'Test',
  });

  response = http.post(`${BASE_URL}/api/User`, userPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(response, {
    'Create user status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);

  // Search users (more expensive query)
  response = http.get(`${BASE_URL}/api/User/search?query=loadtest`);
  check(response, {
    'Search users status is 200': (r) => r.status === 200,
  });

  sleep(1);
}

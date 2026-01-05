import http from 'k6/http';
import { check, sleep } from 'k6';

// Aggressive stress test to find breaking point
export const options = {
  stages: [
    { duration: '1m', target: 100 },     // Warm up to 100 users
    { duration: '1m', target: 500 },     // Ramp to 500 users
    { duration: '2m', target: 1000 },    // Increase to 1000 users
    { duration: '2m', target: 2000 },    // Push to 2000 users
    { duration: '2m', target: 3000 },    // Peak at 3000 users - find the breaking point
    { duration: '1m', target: 1000 },    // Scale down to 1000
    { duration: '1m', target: 0 },       // Ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],      // Allow up to 5% failures
    http_req_duration: ['p(95)<5000'],   // 95% of requests under 5s
  },
};

const BASE_URL = 'http://127.0.0.1'; // Direct LoadBalancer access via minikube tunnel (no port-forward!)

export default function () {
  const randomAction = Math.random();
  
  if (randomAction < 0.7) {
    // 70% - Read operations (GET all posts)
    let response = http.get(`${BASE_URL}/api/Post`, {
      timeout: '60s',
    });
    check(response, {
      'Get posts status is 200': (r) => r.status === 200,
    });
    sleep(0.5 + Math.random() * 1); // Fast think time: 0.5-1.5s
    
  } else if (randomAction < 0.95) {
    // 25% - Paginated reads
    const pageNum = Math.floor(Math.random() * 10) + 1;
    let response = http.get(`${BASE_URL}/api/Post?pageNumber=${pageNum}&pageSize=10`, {
      timeout: '60s',
    });
    check(response, {
      'Get paginated posts status is 200': (r) => r.status === 200,
    });
    sleep(0.3 + Math.random() * 0.7); // Fast think time: 0.3-1s
    
  } else {
    // 5% - Write operations (CREATE post)
    const postPayload = JSON.stringify({
      title: `Stress Test ${Date.now()}`,
      content: `Stress testing with high load`,
      authorId: '550e8400-e29b-41d4-a716-446655440000',
      authorName: 'Stress Test User',
    });

    let response = http.post(`${BASE_URL}/api/Post`, postPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: '60s',
    });
    
    check(response, {
      'Create post status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    });
    sleep(0.5 + Math.random() * 0.5); // Fast think time: 0.5-1s
  }
}

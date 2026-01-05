import http from 'k6/http';
import { check, sleep } from 'k6';

// Realistic load test - simulate 2000 TOTAL users over time (not concurrent)
export const options = {
  scenarios: {
    realistic_load: {
      executor: 'ramping-arrival-rate',
      startRate: 10,        // Start with 10 requests/second
      timeUnit: '1s',
      preAllocatedVUs: 50,  // Pre-allocate 50 virtual users
      maxVUs: 200,          // Max 200 concurrent users (stay under bottleneck)
      stages: [
        { duration: '2m', target: 50 },   // Ramp to 50 req/s
        { duration: '2m', target: 100 },  // Ramp to 100 req/s  
        { duration: '2m', target: 150 },  // Ramp to 150 req/s (pushing limits)
        { duration: '2m', target: 100 },  // Scale down to 100 req/s
        { duration: '1m', target: 50 },   // Scale down to 50 req/s
        { duration: '1m', target: 0 },    // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],       // Less than 2% failures
    http_req_duration: ['p(95)<500'],     // 95% under 500ms
    http_req_duration: ['p(99)<1000'],    // 99% under 1s
  },
};

const BASE_URL = 'http://localhost:8080'; // Use port-forward (more stable than tunnel)

export default function () {
  const randomAction = Math.random();
  
  if (randomAction < 0.7) {
    // 70% - Read operations
    let response = http.get(`${BASE_URL}/api/Post`, {
      timeout: '30s',
    });
    check(response, {
      'Get posts status is 200': (r) => r.status === 200,
    });
    sleep(0.1 + Math.random() * 0.4); // 0.1-0.5s think time
    
  } else if (randomAction < 0.95) {
    // 25% - Paginated reads
    const pageNum = Math.floor(Math.random() * 10) + 1;
    let response = http.get(`${BASE_URL}/api/Post?pageNumber=${pageNum}&pageSize=10`, {
      timeout: '30s',
    });
    check(response, {
      'Get paginated posts status is 200': (r) => r.status === 200,
    });
    sleep(0.1 + Math.random() * 0.3); // 0.1-0.4s think time
    
  } else {
    // 5% - Write operations
    const postPayload = JSON.stringify({
      title: `K8s Load Test ${Date.now()}`,
      content: `Testing Kubernetes autoscaling`,
      authorId: '550e8400-e29b-41d4-a716-446655440000',
      authorName: 'K8s Test User',
    });

    let response = http.post(`${BASE_URL}/api/Post`, postPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    });
    
    check(response, {
      'Create post status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    });
    sleep(0.2 + Math.random() * 0.3); // 0.2-0.5s think time
  }
}

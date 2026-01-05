import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },    // Ramp up to 20 users
    { duration: '1m', target: 50 },     // Ramp up to 50 users
    { duration: '1m', target: 150 },    // Increase to 150 users
    { duration: '1m30s', target: 300 }, // Peak at 300 users (should scale to 3-4 pods)
    { duration: '1m', target: 80 },     // Scale down to 80
    { duration: '30s', target: 0 },     // Ramp down
  ],
};

const BASE_URL = 'http://localhost:8080'; // Kubernetes Ingress via port-forward

export default function () {
  // Simulate realistic user behavior with random actions
  const randomAction = Math.random();
  
  if (randomAction < 0.7) {
    // 70% - Read operations (GET all posts)
    let response = http.get(`${BASE_URL}/api/Post`);
    check(response, {
      'Get posts status is 200': (r) => r.status === 200,
    });
    sleep(3 + Math.random() * 4); // 3-7 seconds think time (realistic browsing)
    
  } else if (randomAction < 0.95) {
    // 25% - Paginated reads
    const pageNum = Math.floor(Math.random() * 5) + 1;
    let response = http.get(`${BASE_URL}/api/Post?pageNumber=${pageNum}&pageSize=10`);
    check(response, {
      'Get paginated posts status is 200': (r) => r.status === 200,
    });
    sleep(2 + Math.random() * 3); // 2-5 seconds think time
    
  } else {
    // 5% - Write operations (CREATE post)
    const postPayload = JSON.stringify({
      title: `Load Test Post ${Date.now()}`,
      content: `This is a load test post created at ${new Date().toISOString()}`,
      authorId: '550e8400-e29b-41d4-a716-446655440000',
      authorName: 'Load Test User',
    });

    let response = http.post(`${BASE_URL}/api/Post`, postPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(response, {
      'Create post status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    });
    sleep(4 + Math.random() * 3); // 4-7 seconds think time after creating
  }
}

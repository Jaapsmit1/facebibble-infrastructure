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

// You'll need to replace this with an actual post ID from your database
const TEST_POST_ID = '6917003d3d2255057420ff21'; // Replace with a valid post ID

export default function () {
  // GET comments for a post
  let response = http.get(`${BASE_URL}/api/Comment/post/${TEST_POST_ID}`);
  check(response, {
    'Get comments status is 200': (r) => r.status === 200,
  });

  sleep(1);

  // Create a comment (this will stress the service more)
  const commentPayload = JSON.stringify({
    postId: TEST_POST_ID,
    content: `Load test comment created at ${new Date().toISOString()}`,
    authorId: 'load-test-user',
  });

  response = http.post(`${BASE_URL}/api/Comment`, commentPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(response, {
    'Create comment status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);

  // GET all comments (more expensive query)
  response = http.get(`${BASE_URL}/api/Comment`);
  check(response, {
    'Get all comments status is 200': (r) => r.status === 200,
  });

  sleep(1);
}

# Kubernetes Autoscaling Load Tests

These K6 load tests are designed to stress individual microservices and demonstrate Horizontal Pod Autoscaler (HPA) behavior in your Minikube cluster.

## Prerequisites

1. **Install K6**: https://k6.io/docs/getting-started/installation/
   ```powershell
   choco install k6
   ```

2. **Minikube Running**: Ensure your Minikube cluster is running
   ```powershell
   minikube status
   ```

3. **Services Deployed**: All services should be deployed in the `facebibble` namespace
   ```powershell
   kubectl get pods -n facebibble
   ```

## Test Files

- `api-gateway-load.js` - Tests API Gateway (routes to all services)
- `post-service-load.js` - Tests Post Service specifically
- `comment-service-load.js` - Tests Comment Service specifically
- `registration-service-load.js` - Tests Registration Service
- `user-management-load.js` - Tests User Management Service

## Load Test Stages

Each test follows this pattern:
1. **30s**: Ramp up to 10-20 users (warm-up)
2. **1m**: Increase to 50-80 users (steady load)
3. **2m**: Spike to 100-150 users (trigger autoscaling)
4. **1m**: Scale down to 50-80 users
5. **30s**: Ramp down to 0 (cool down)

## Running Tests

### Test Individual Services

```powershell
# Test Post Service
k6 run post-service-load.js

# Test Comment Service (update TEST_POST_ID first!)
k6 run comment-service-load.js

# Test Registration Service
k6 run registration-service-load.js

# Test User Management Service
k6 run user-management-load.js

# Test API Gateway (all routes)
k6 run api-gateway-load.js
```

### Monitor Autoscaling While Testing

**In a separate PowerShell window**, watch the HPA in real-time:

```powershell
kubectl get hpa -n facebibble -w
```

**Or watch pods scaling:**

```powershell
kubectl get pods -n facebibble -w
```

**Or use the dashboard:**

```powershell
minikube dashboard
```

## Expected Behavior

### Phase 1: Initial State (Before Test)
- Pods: 1 replica per service
- CPU: 0-5%
- Memory: 9-15%

### Phase 2: Warm-up (30s - 1m)
- Pods: Still 1 replica
- CPU: 10-30%
- Memory: 15-30%

### Phase 3: Load Spike (1m - 3m)
- **CPU crosses 70% threshold** → HPA triggers scale-up
- Pods: Increases to 2, 3, 4... up to 10 replicas
- Response time improves as more pods handle load

### Phase 4: Cool Down (3m - 4.5m)
- Load decreases
- CPU drops below 70%
- **After 5-minute stabilization**: HPA scales down to 1-2 replicas

## Autoscaling Configuration

Your services are configured with:

```yaml
minReplicas: 1
maxReplicas: 10  # (8 for registration-service)
metrics:
  - CPU: 70%
  - Memory: 80%
```

**Scale-up**: Immediate when threshold exceeded  
**Scale-down**: 5-minute stabilization window

## Tips for Best Results

1. **Start with one service**: Test Post Service first, it's straightforward
2. **Watch the metrics**: Keep `kubectl get hpa -n facebibble -w` running
3. **Be patient**: Scale-up happens in ~30s, scale-down takes ~5 minutes
4. **Use the dashboard**: Visual feedback is easier to understand
5. **Update comment-service-load.js**: Replace `TEST_POST_ID` with a real post ID from your database

## Troubleshooting

**No autoscaling happening?**
```powershell
# Check if metrics-server is running
kubectl get deployment metrics-server -n kube-system

# Check HPA status
kubectl describe hpa post-service-hpa -n facebibble
```

**Tests failing?**
```powershell
# Verify API Gateway is accessible
curl http://192.168.49.2:30080/api/Post

# Check service logs
kubectl logs -f deployment/post-service -n facebibble
```

**Wrong Minikube IP?**
```powershell
minikube ip
# Update BASE_URL in test files if different from 192.168.49.2
```

## Example Output

```
     ✓ Get posts status is 200
     ✓ Create post status is 200 or 201

     checks.........................: 100.00% ✓ 4820  ✗ 0
     data_received..................: 2.4 MB  53 kB/s
     data_sent......................: 1.2 MB  26 kB/s
     http_req_duration..............: avg=245ms  min=12ms  max=1.2s
     http_reqs......................: 2410    53/s
     vus............................: 100     min=0    max=100
```

While watching HPA:
```
NAME              REFERENCE              TARGETS                  REPLICAS
post-service-hpa  Deployment/post-service  cpu: 85%/70%, memory: 45%/80%   3
post-service-hpa  Deployment/post-service  cpu: 78%/70%, memory: 52%/80%   5
post-service-hpa  Deployment/post-service  cpu: 65%/70%, memory: 48%/80%   7
```

## Recommended Testing Order

1. **Start**: `k6 run post-service-load.js` (simple, no dependencies)
2. **Monitor**: `kubectl get hpa -n facebibble -w` (watch scaling)
3. **Observe**: Wait for scale-up (30-60s) and scale-down (5+ min)
4. **Next**: Try other services once you understand the pattern

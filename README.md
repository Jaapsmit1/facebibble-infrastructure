# Facebibble Infrastructure

Kubernetes manifests and Docker Compose configuration for Facebibble microservices.

## Services

- **Frontend**: Next.js (Docker Hub: jaapsmit1/facebibble-frontend)
- **API Gateway**: ASP.NET Core
- **Post Service**: ASP.NET Core + MongoDB
- **Comment Service**: ASP.NET Core + MongoDB
- **User Management**: ASP.NET Core
- **Registration Service**: ASP.NET Core
- **Keycloak**: Identity Provider
- **MongoDB**: Post & Comment databases
- **Kafka**: Message broker

## Deployment

### Google Cloud with Minikube

```bash
# Clone the repo on your VM
git clone https://github.com/Jaapsmit1/facebibble-infrastructure.git
cd facebibble-infrastructure

# Deploy all services
sudo kubectl apply -f k8s/manifests/

# Check status
sudo kubectl get pods -n facebibble

# Access services
# Frontend: http://YOUR_VM_IP:30000
# Keycloak: http://YOUR_VM_IP:30080
```

### Local Development

```bash
# Run with Docker Compose
docker-compose up -d

# Stop all services
docker-compose down
```

## Configuration

All services are in the `facebibble` namespace.

### External Access Ports

- Frontend: 30000
- Keycloak: 30080

### Internal Service URLs

- API Gateway: http://api-gateway:8001
- Post Service: http://post-service:8003
- Comment Service: http://comment-service:8004
- User Management: http://user-management-service:8002
- Registration: http://registration-service:8005
- Keycloak: http://keycloak:8080
- MongoDB Post: mongodb://mongodb-post:27017
- MongoDB Comment: mongodb://mongodb-comment:27017
- Kafka: kafka:9092

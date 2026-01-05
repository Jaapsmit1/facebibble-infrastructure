# ⚠️ SECURITY WARNING ⚠️

## Important: Change All Default Passwords Before Deployment!

This repository contains Kubernetes manifests with **placeholder passwords**. These MUST be changed before deploying to any environment.

### Files Containing Secrets That Need To Be Updated:

1. **mongodb.yaml**
   - `MONGO_INITDB_ROOT_PASSWORD` (2 instances)

2. **keycloak.yaml**
   - `POSTGRES_PASSWORD`
   - `KEYCLOAK_ADMIN_PASSWORD`
   - `KC_DB_PASSWORD`

3. **post-service.yaml**
   - Secret: `mongodb-post-secret`
     - `password`
     - `root-password`

4. **comment-service.yaml**
   - Secret: `mongodb-comment-secret`
     - `password`
     - `root-password`

### Recommended Approach:

For production deployments, use Kubernetes Secrets with base64-encoded values or integrate with a secrets management solution like:
- **Sealed Secrets**
- **External Secrets Operator**
- **HashiCorp Vault**
- **Google Secret Manager** (for GKE)
- **AWS Secrets Manager** (for EKS)

### Quick Fix for Development:

Search for `CHANGE_ME_BEFORE_DEPLOYMENT` in all manifest files and replace with strong, unique passwords.

```bash
# Example: Generate random passwords
openssl rand -base64 32
```

**Never commit real passwords to version control!**

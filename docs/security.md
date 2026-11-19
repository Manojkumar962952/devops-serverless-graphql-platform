# Enterprise Security, IAM & Governance Architecture .

## 1. Security Architecture Principles

This project adheres to the **AWS Well-Architected Security Pillar** and **Zero Trust Architecture**:
1. **Least-Privilege Access Control**: IAM policies grant only the minimum permissions required for specific resource ARNs.
2. **Defense in Depth**: Multi-layer security across DNS, Edge CDN, Ingress, VPC Subnets, Container Users, and Database.
3. **Data Protection at Rest and in Transit**: All traffic is encrypted in transit via TLS 1.3 / HTTPS. All data at rest is encrypted via AWS KMS.
4. **Air-Gapped Database**: Amazon RDS PostgreSQL is completely isolated in private subnets with no public IP and no internet gateway route.

---

## 2. IAM Role & Policy Matrix

| IAM Role Name | Principal (Trusted Entity) | Granted Capabilities | Security Boundaries |
|---|---|---|---|
| `ecsTaskExecutionRole` | `ecs-tasks.amazonaws.com` | ECR image pull (`ecr:BatchGetImage`), CloudWatch log streaming | Scoped to backend ECR repository and CloudWatch log group |
| `ecsTaskRole` | `ecs-tasks.amazonaws.com` | Synchronous AWS Lambda invocation (`lambda:InvokeFunction`) | Explicitly restricted to the 5 Employee CRUD Lambda function ARNs |
| `lambdaExecutionRole` | `lambda.amazonaws.com` | VPC ENI creation (`ec2:*NetworkInterface*`), Secrets Manager read, CloudWatch logging | Scoped to `devops/rds/credentials` secret ARN |
| `githubActionsRole` | `token.actions.githubusercontent.com` | OIDC-based deployment permissions (S3 sync, CloudFront invalidation, ECR push, ECS service update, Lambda code update) | Condition restricted to specific GitHub repository and branch `main` |

---

## 3. GitHub Actions OIDC Authentication (No Long-Lived Keys)

### Why OIDC?
Traditional CI/CD pipelines store static AWS Access Keys (`AKIA...`) in repository secrets. If compromised, these credentials can lead to severe security breaches.

With **OpenID Connect (OIDC)**:
- No static AWS credentials or secret access keys are stored in GitHub.
- GitHub Actions requests a short-lived JSON Web Token (JWT) from GitHub's OIDC provider.
- AWS STS validates the JWT against the IAM Identity Provider and issues temporary credentials valid for 1 hour.
- Authentication is strictly conditioned to the exact repository:
```json
"Condition": {
  "StringEquals": {
    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
  },
  "StringLike": {
    "token.actions.githubusercontent.com:sub": "repo:YourOrg/devops-assessment-repo:*"
  }
}
```

---

## 4. Secrets Management: AWS Secrets Manager

Database credentials are never hardcoded in source code, committed to Git, or exposed in plain-text environment variables.

- **Storage**: AWS Secrets Manager encrypts secrets using AWS KMS.
- **Access Pattern**:
  - The Lambda function initializes the connection pool by reading the secret `devops/rds/credentials` on cold start.
  - The secret is cached in memory across warm invocations.
  - SSL is enforced on all PostgreSQL connections (`ssl: { rejectUnauthorized: false }`).

---

## 5. CloudFront Origin Access Control (OAC)

The React SPA bucket blocks 100% of public internet traffic. Direct access to `https://s3.amazonaws.com/<bucket>` returns **403 Forbidden**.

Only CloudFront's service principal can read files from S3, verified via AWS SigV4:
```json
{
  "Version": "2012-10-17",
  "Statement": {
    "Sid": "AllowCloudFrontServicePrincipalReadOnly",
    "Effect": "Allow",
    "Principal": {
      "Service": "cloudfront.amazonaws.com"
    },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::devops-frontend-bucket/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::<ACCOUNT_ID>:distribution/<DISTRIBUTION_ID>"
      }
    }
  }
}
```

---

## 6. Container Security (DevSecOps)

The backend `Dockerfile` enforces container hardening best practices:
1. **Multi-Stage Build**: Development dependencies, TypeScript compiler, and build tools are completely eliminated from the production runner stage.
2. **Alpine Minimal Base Image**: Reduces attack surface to minimal required libraries (`node:20-alpine`).
3. **Non-Root Execution**: Runs as unprivileged user `node` (`USER node`), preventing container escape vulnerabilities.
4. **Native Health Checks**: Uses built-in `curl -f http://localhost:4000/health` matching ECS orchestration parameters.

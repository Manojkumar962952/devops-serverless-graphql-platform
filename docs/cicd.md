# CI/CD Pipeline Implementation Guide

## 1. Pipeline Overview

The CI/CD system utilizes **GitHub Actions** with two decoupled, automated deployment workflows:
1. `frontend-deploy.yml`: Builds and deploys the React SPA to Amazon S3 and invalidates CloudFront.
2. `backend-deploy.yml`: Compiles TypeScript, bundles Lambda functions, builds & pushes Docker images to Amazon ECR, updates ECS Fargate services, and deploys Lambda updates.

---

## 2. GitHub Repository Secrets & Variables Setup

Navigate to your GitHub repository: **Settings** -> **Secrets and variables** -> **Actions**.

### Repository Secrets (`secrets.<NAME>`)
| Secret Name | Description | Example Value |
|---|---|---|
| `AWS_ROLE_TO_ASSUME` | ARN of the IAM role configured with GitHub OIDC | `arn:aws:iam::123456789012:role/githubActionsRole` |
| `S3_BUCKET_NAME` | Name of the Amazon S3 bucket hosting frontend assets | `devops-frontend-alex-2026` |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront Distribution ID for cache invalidation | `E1A2B3C4D5E6F7` |
| `ECR_REPOSITORY` | Amazon ECR private repository name | `devops-graphql-backend` |
| `ECS_CLUSTER_NAME` | ECS Cluster Name | `devops-ecs-cluster` |
| `ECS_SERVICE_NAME` | ECS Fargate Service Name | `devops-graphql-backend-service` |

### Repository Variables (`vars.<NAME>`)
| Variable Name | Description | Default Value |
|---|---|---|
| `AWS_REGION` | Target AWS deployment region | `ap-south-1` |
| `VITE_GRAPHQL_HTTP_URL` | API Gateway endpoint or ALB URL for GraphQL queries | `https://xxxx.execute-api.ap-south-1.amazonaws.com/graphql` |
| `VITE_GRAPHQL_WS_URL` | WebSocket endpoint for GraphQL subscriptions | `wss://xxxx.execute-api.ap-south-1.amazonaws.com/graphql` |

---

## 3. Frontend Deployment Pipeline (`frontend-deploy.yml`)

### Step-by-Step Execution Flow:
1. **Trigger**: Push to `main` branch modifying files in `frontend/**` or manual execution (`workflow_dispatch`).
2. **Environment**: Ubuntu Latest with Node.js 20.
3. **Typecheck & Lint**: Runs `tsc --noEmit` to ensure TypeScript compile integrity.
4. **Vite Production Build**: Compiles React components into static distribution assets (`./frontend/dist`).
5. **AWS OIDC Authentication**: Authenticates with AWS STS without storing static access keys.
6. **Smart S3 Sync**:
   - Static hashed assets (`.js`, `.css`, images) are synced with `Cache-Control: public, max-age=31536000, immutable`.
   - `index.html` is synced with `Cache-Control: no-cache, no-store, must-revalidate` ensuring clients immediately receive updates without stale cached files.
7. **CloudFront Invalidation**: Triggers `aws cloudfront create-invalidation --paths "/*"` to purge edge caches worldwide.

---

## 4. Backend Deployment Pipeline (`backend-deploy.yml`)

### Step-by-Step Execution Flow:
1. **Lambda Bundling & Deployment**:
   - Installs dependencies and runs `tsc --noEmit`.
   - Compiles each of the 5 Lambda functions into a standalone `index.js` using `esbuild`.
   - Zips each function individually (`createEmployee.zip`, etc.).
   - Calls `aws lambda update-function-code --publish` to update code and create an immutable version.
2. **ECR Docker Build & Push**:
   - Logs into Amazon ECR via `aws-actions/amazon-ecr-login`.
   - Builds multi-stage production Docker image.
   - Tags image with commit SHA (`$GITHUB_SHA`) and `latest`.
   - Pushes both tags to ECR.
3. **ECS Rolling Deployment**:
   - Invokes `aws ecs update-service --force-new-deployment`.
   - Waits for the ECS service to reach steady state (`aws ecs wait services-stable`).
   - ECS spins up new Fargate tasks, verifies target group health checks on `/health`, and drains old tasks with zero downtime.
4. **Automated Rollback Hook**:
   - If ECS fails to stabilize within the timeout window, the failure hook fetches the previous active task definition revision and automatically triggers a rollback.

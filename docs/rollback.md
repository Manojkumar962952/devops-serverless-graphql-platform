# Deployment Rollback Strategy & Runbooks

## 1. Overview

In enterprise production environments, deployments must have deterministic, automated, and tested rollback procedures. This document defines actionable rollback runbooks across all architectural components.

---

## 2. ECS Fargate Service Rollback Runbook

If a newly deployed container fails health checks, introduces high latency, or crashes on startup:

### Method A: Automated Rollback via GitHub Actions
The backend CI/CD pipeline includes a post-deployment failure hook. If the service fails to reach steady state, the pipeline automatically detects the previous active task definition revision and reverts the deployment:
```bash
PREV_TASK_DEF=$(aws ecs describe-services \
  --cluster devops-ecs-cluster \
  --services devops-graphql-backend-service \
  --query "services[0].deployments[?status=='ACTIVE'].taskDefinition" \
  --output text | head -n 1)

aws ecs update-service \
  --cluster devops-ecs-cluster \
  --service devops-graphql-backend-service \
  --task-definition "$PREV_TASK_DEF"
```

### Method B: Manual AWS Console Rollback
1. Open **Amazon ECS** -> Clusters -> `devops-ecs-cluster`.
2. Click the **Services** tab and select `devops-graphql-backend-service`.
3. Click **Update service**.
4. In **Revision**, select the previous stable revision number (e.g. `devops-graphql-backend:1`).
5. Click **Update**. ECS immediately rolls back tasks.

---

## 3. AWS Lambda Rollback Runbook

AWS Lambda functions publish an immutable version on every build (`--publish`).

### Method A: Version Aliasing (Zero-Downtime Rollback)
1. In the Lambda console, navigate to the target function (e.g. `createEmployee`).
2. Go to **Aliases** -> Select alias `live` (or `production`).
3. Click **Edit alias**.
4. Change the version pointing from Version `N` back to Version `N-1`.
5. Click **Save**. All traffic immediately shifts to the previous version with 0ms downtime.

### Method B: Redeploy Previous Zip Artifact
```bash
aws lambda update-function-code \
  --function-name createEmployee \
  --zip-file fileb://backups/createEmployee-v1.0.0.zip
```

---

## 4. Frontend SPA Rollback Runbook

### Method A: S3 Versioning Restore
Because S3 Bucket Versioning is enabled:
1. Open the S3 Console -> Bucket `devops-frontend-...`.
2. Click **List versions** toggle.
3. Delete the latest version marker of `index.html` to instantly expose the previous version.
4. Issue a CloudFront cache invalidation:
```bash
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

### Method B: Re-run Previous GitHub Actions Workflow
1. Navigate to the GitHub repository -> **Actions** tab.
2. Select the last successful **Frontend CI/CD Pipeline** run.
3. Click **Re-run all jobs**. The previous build artifacts are rebuilt and deployed to S3.

---

## 5. Database Rollback Strategy (Safe Schema Evolution)

### Rule 1: Expand-and-Contract Migration Pattern
Never execute destructive schema changes (e.g. dropping columns or altering data types directly) in a single deployment.
- **Phase 1 (Expand)**: Add new columns as optional/nullable. Both old and new application versions function normally.
- **Phase 2 (Migrate)**: Deploy new backend version that writes to the new column.
- **Phase 3 (Contract)**: Drop legacy column only after validating new version stability.

### Rule 2: Point-In-Time Recovery (PITR)
Amazon RDS automated backups allow restoring the database to any second within the retention window:
1. In RDS Console -> Databases -> Select `devops-employee-rds`.
2. Click **Actions** -> **Restore to point in time**.
3. Select the timestamp prior to the failed migration.
4. Specify target DB instance identifier: `devops-employee-rds-restored`.
5. Update Secrets Manager host string to the new restored instance endpoint.

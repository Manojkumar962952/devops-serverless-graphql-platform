# AWS Resource Cleanup & Cost Optimization Guide

## 1. Hourly Cost Breakdown (Assessment Workload)

| Service | Configuration | Estimated Cost | Cost Optimization Strategy |
|---|---|---|---|
| **NAT Gateway** | 1 Public NAT Gateway | ~$0.045 / hour ($1.08/day) | **Delete immediately** after testing or use VPC Endpoints |
| **Application Load Balancer** | 1 Internal ALB | ~$0.0225 / hour ($0.54/day) | Terminate when evaluation is complete |
| **Amazon RDS PostgreSQL** | `db.t4g.micro` (Single-AZ, 20GB gp3) | ~$0.016 / hour ($0.38/day) | Stop DB when not actively testing |
| **AWS ECS Fargate** | 1 task (0.5 vCPU, 1GB RAM) | ~$0.025 / hour ($0.60/day) | Scale desired tasks to `0` when idle |
| **AWS Lambda** | Invocations + Compute | Free Tier covers 1M requests | Almost $0.00 |
| **Amazon S3 & CloudFront** | Storage & Data Transfer | Free Tier covers 1TB transfer | ~$0.01 / month |
| **Total Estimated Run Cost** | 24-hour assessment window | **~$2.60 total** | Extremely cost-efficient |

---

## 2. Temporary Cost-Saving Pauses (While Keeping Infrastructure)

If you need to pause work without deleting resources:
1. **Scale ECS Fargate tasks to 0**:
   - Go to ECS Console -> Service `devops-graphql-backend-service` -> Click **Update** -> Change **Desired tasks** to `0` -> Update.
2. **Stop RDS Database instance**:
   - Go to RDS Console -> Select `devops-employee-rds` -> **Actions** -> **Stop temporarily**. (RDS can remain stopped for up to 7 days).

---

## 3. Complete Teardown Checklist (Post-Assessment)

Follow this reverse order to avoid dependency-locking errors:

### Step 1: ECS Cluster & Services
- [ ] Go to ECS Console -> `devops-ecs-cluster`.
- [ ] Delete Service `devops-graphql-backend-service` (check *Force delete*).
- [ ] Delete Cluster `devops-ecs-cluster`.
- [ ] In Task Definitions, deregister `devops-graphql-backend`.

### Step 2: Application Load Balancer
- [ ] Go to EC2 Console -> **Load Balancers** -> Select `devops-internal-alb` -> Click **Actions** -> **Delete**.
- [ ] Go to **Target Groups** -> Select `ecs-graphql-tg` -> Click **Actions** -> **Delete**.

### Step 3: API Gateway & VPC Link
- [ ] Go to API Gateway Console -> Select `devops-graphql-api` -> **Delete**.
- [ ] Go to **VPC Links** -> Select `devops-vpc-link` -> **Delete**.

### Step 4: AWS Lambda Functions
- [ ] In Lambda Console, delete functions:
  - `createEmployee`
  - `getEmployees`
  - `getEmployee`
  - `updateEmployee`
  - `deleteEmployee`

### Step 5: Amazon RDS & Secrets Manager
- [ ] In RDS Console -> Databases -> Select `devops-employee-rds`.
- [ ] Click **Actions** -> **Delete**.
- [ ] Uncheck *Create final snapshot*, check *I acknowledge*, enter `delete me`, and confirm.
- [ ] In RDS Subnet Groups, delete `devops-rds-subnet-group`.
- [ ] In Secrets Manager, delete secret `devops/rds/credentials` (schedule deletion with 7-day window or immediate via CLI).

### Step 6: Amazon ECR
- [ ] Go to ECR Console -> Repositories -> Select `devops-graphql-backend`.
- [ ] Click **Delete** (check *Delete all images*).

### Step 7: CloudFront & S3
- [ ] Go to CloudFront Console -> Select distribution -> Click **Disable**.
- [ ] Once status changes to *Disabled* (~5 mins), select it and click **Delete**.
- [ ] Go to S3 Console -> Select `devops-frontend-...` -> Click **Empty** -> Confirm -> Click **Delete**.

### Step 8: VPC, NAT Gateway & Elastic IP
- [ ] Go to VPC Console -> **NAT Gateways** -> Select `devops-nat-gw` -> Click **Actions** -> **Delete NAT gateway**.
- [ ] Go to **Elastic IPs** -> Select the allocated EIP -> Click **Actions** -> **Release Elastic IP address**.
- [ ] Go to **Your VPCs** -> Select `devops-assessment-vpc` -> Click **Actions** -> **Delete VPC**.
  *(Deleting the VPC automatically deletes all attached subnets, route tables, and security groups!)*

### Step 9: IAM Roles
- [ ] In IAM Console, delete created roles:
  - `ecsTaskExecutionRole`
  - `ecsTaskRole`
  - `lambdaExecutionRole`
  - `githubActionsRole`

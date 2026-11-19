# AWS Management Console Manual Deployment Guide
## Step-by-Step Implementation Guide for Junior DevOps Engineers

This document provides explicit, field-by-field manual instructions for provisioning every component of the Serverless GraphQL & RDS architecture directly through the AWS Management Console web interface.

---

# TABLE OF CONTENTS
1. [Amazon VPC](#service-1-amazon-vpc)
2. [VPC Subnets](#service-2-vpc-subnets)
3. [Internet Gateway](#service-3-internet-gateway)
4. [NAT Gateway](#service-4-nat-gateway)
5. [Route Tables](#service-5-route-tables)
6. [Security Groups](#service-6-security-groups)
7. [Amazon RDS PostgreSQL](#service-7-amazon-rds-postgresql)
8. [AWS Secrets Manager](#service-8-aws-secrets-manager)
9. [Database Schema Initialization](#service-81-database-schema-initialization)
10. [AWS IAM Roles & Policies](#service-9-aws-iam-roles--policies)
11. [AWS Lambda Functions](#service-10-aws-lambda-functions)
12. [Amazon ECR & Docker Push](#service-11-amazon-ecr--docker-push)
13. [Target Group & Internal Application Load Balancer](#service-12-target-group--internal-application-load-balancer)
14. [Amazon ECS Fargate Cluster & Service](#service-13-amazon-ecs-fargate-cluster--service)
15. [Amazon API Gateway & VPC Link](#service-14-api-gateway--vpc-link)
16. [Amazon S3 Bucket for Frontend](#service-15-amazon-s3-frontend-bucket)
17. [Amazon CloudFront CDN with OAC](#service-16-amazon-cloudfront-cdn)
18. [Amazon CloudWatch Monitoring & Alarms](#service-17-amazon-cloudwatch)
19. [Auto Scaling Policies](#service-18-auto-scaling-policies)
20. [Troubleshooting & Real-World Resolution Log](#service-19-troubleshooting--real-world-resolution-log)

---

## SERVICE 1: Amazon VPC

- **What it is:** A Virtual Private Cloud (VPC) is an isolated virtual network dedicated to your AWS account.
- **Why we need it:** It provides network isolation for ECS containers, Lambda functions, and the RDS database.
- **How it works:** Defines a private IP CIDR range where subnets, gateways, and routing policies reside.
- **Communicates with:** Internet Gateway, NAT Gateway, Subnets, and VPC Endpoints.

- **STEP 1:** Open the AWS Management Console (`https://console.aws.amazon.com/`).
- **STEP 2:** In the top global search bar, type `VPC` and select **VPC** under Services.
- **STEP 3:** In the left navigation panel, click **Your VPCs**.
- **STEP 4:** In the top right corner, click the orange **Create VPC** button.
- **STEP 5:** Configuration options explanation:
  - *Resources to create:* Choose "VPC only" (allows manual control over subnets and routes).
  - *Name tag:* Human-readable identifier.
  - *IPv4 CIDR block:* The private network range.
  - *IPv6 CIDR block:* Not needed for this assessment.
  - *Tenancy:* Shared standard virtualization.
- **STEP 6:** Values to enter:
  - Select: **VPC only**
  - Name tag: `devops-assessment-vpc`
  - IPv4 CIDR block: `10.0.0.0/16`
  - Tenancy: `Default`
- **STEP 7:** Why these values are required:
  - `10.0.0.0/16` provides 65,536 private IP addresses, allowing ample room for multi-tier subnets across multiple Availability Zones.
- **STEP 8:** Click **Create VPC**. Once created, select the VPC, click **Actions** -> **Edit VPC settings**, check both **Enable DNS resolution** and **Enable DNS hostnames**, then click **Save changes**.
- **STEP 9:** Verification: The VPC state shows a green **Available** badge with DNS resolution and hostnames enabled.
- **STEP 10:** Common Errors: Forgetting to enable DNS hostnames causes RDS connection failures inside private subnets.

---

## SERVICE 2: VPC Subnets

- **What it is:** Partitions of a VPC's IP address range assigned to specific Availability Zones.
- **Why we need it:** Segregates public ingress (NAT/ALB), private compute (ECS/Lambda), and isolated data (RDS).

- **STEP 1:** In the VPC Console, click **Subnets** in the left menu.
- **STEP 2:** Click **Create subnet**.
- **STEP 3:** Select VPC: Choose `devops-assessment-vpc`.
- **STEP 4:** Create the 8 subnets one by one (or click "Add new subnet" to create multiple):
  1. **Name:** `public-subnet-1a` | AZ: `ap-south-1a` | CIDR: `10.0.1.0/24`
  2. **Name:** `public-subnet-1b` | AZ: `ap-south-1b` | CIDR: `10.0.2.0/24`
  3. **Name:** `private-app-subnet-1a` | AZ: `ap-south-1a` | CIDR: `10.0.10.0/24`
  4. **Name:** `private-app-subnet-1b` | AZ: `ap-south-1b` | CIDR: `10.0.11.0/24`
  5. **Name:** `private-lambda-subnet-1a` | AZ: `ap-south-1a` | CIDR: `10.0.20.0/24`
  6. **Name:** `private-lambda-subnet-1b` | AZ: `ap-south-1b` | CIDR: `10.0.21.0/24`
  7. **Name:** `private-db-subnet-1a` | AZ: `ap-south-1a` | CIDR: `10.0.30.0/24`
  8. **Name:** `private-db-subnet-1b` | AZ: `ap-south-1b` | CIDR: `10.0.31.0/24`
- **STEP 5:** Click **Create subnet**.
- **STEP 6:** For `public-subnet-1a` and `public-subnet-1b`, select the subnet, click **Actions** -> **Edit subnet settings**, check **Enable auto-assign public IPv4 address**, and click **Save**.
- **STEP 7:** Verification: All 8 subnets show state **Available** with 251 available IPv4 addresses each.

---

## SERVICE 3: Internet Gateway

- **What it is:** A VPC component that allows bidirectional communication between public subnets and the internet.
- **STEP 1:** In the VPC console, click **Internet Gateways**.
- **STEP 2:** Click **Create internet gateway**.
- **STEP 3:** Name tag: `devops-igw`.
- **STEP 4:** Click **Create internet gateway**.
- **STEP 5:** Click **Actions** -> **Attach to VPC**.
- **STEP 6:** Select `devops-assessment-vpc` and click **Attach internet gateway**.
- **STEP 7:** Verification: State shows **Attached** (green).

---

## SERVICE 4: NAT Gateway

- **What it is:** Network Address Translation Gateway enabling instances in private subnets to reach the internet (e.g. for pulling container images or reaching Secrets Manager) while preventing inbound connections from the internet.
- **STEP 1:** In the VPC console, click **NAT Gateways**.
- **STEP 2:** Click **Create NAT gateway**.
- **STEP 3:** Name: `devops-nat-gw`.
- **STEP 4:** Subnet: Select `public-subnet-1a`.
- **STEP 5:** Connectivity type: **Public**.
- **STEP 6:** Elastic IP: Click **Allocate Elastic IP**.
- **STEP 7:** Click **Create NAT gateway**.
- **STEP 8:** Verification: Wait until Status turns **Available** (~2 minutes).
- **STEP 9:** *Cost Optimization Note:* AWS charges ~$0.045/hr for a NAT Gateway. Delete it immediately when assessment testing concludes!

---

## SERVICE 5: Route Tables

- **STEP 1:** In the VPC console, click **Route tables**.
- **STEP 2:** Create Route Table 1: **Public Route Table**
  - Name: `public-rt` | VPC: `devops-assessment-vpc`.
  - In **Routes** tab, click **Edit routes** -> **Add route** -> Destination `0.0.0.0/0` -> Target: **Internet Gateway** (`devops-igw`).
  - In **Subnet associations** tab, click **Edit subnet associations** -> Select `public-subnet-1a` and `public-subnet-1b` -> Save.
- **STEP 3:** Create Route Table 2: **Private App Route Table**
  - Name: `private-app-rt` | VPC: `devops-assessment-vpc`.
  - Routes: Add `0.0.0.0/0` -> Target: **NAT Gateway** (`devops-nat-gw`).
  - Subnet associations: Associate with `private-app-subnet-1a` and `private-app-subnet-1b`.
- **STEP 4:** Create Route Table 3: **Private Lambda Route Table**
  - Name: `private-lambda-rt` | VPC: `devops-assessment-vpc`.
  - Routes: Add `0.0.0.0/0` -> Target: **NAT Gateway** (`devops-nat-gw`).
  - Subnet associations: Associate with `private-lambda-subnet-1a` and `private-lambda-subnet-1b`.
- **STEP 5:** Create Route Table 4: **Isolated DB Route Table**
  - Name: `private-db-rt` | VPC: `devops-assessment-vpc`.
  - Routes: Leave only default local route (`10.0.0.0/16` -> `local`).
  - Subnet associations: Associate with `private-db-subnet-1a` and `private-db-subnet-1b`.

---

## SERVICE 6: Security Groups

Create 4 least-privilege security groups under VPC -> **Security Groups**:

### 1. `alb-sg`
- Name: `alb-sg` | VPC: `devops-assessment-vpc`
- Inbound: HTTP (80) & HTTPS (443) from `10.0.0.0/16` (or API Gateway VPC Link SG)
- Outbound: All traffic or Custom TCP (4000)

### 2. `ecs-fargate-sg`
- Name: `ecs-fargate-sg` | VPC: `devops-assessment-vpc`
- Inbound: Custom TCP (4000) with Source: `alb-sg`
- Outbound: HTTPS (443) to `0.0.0.0/0` (for ECR and CloudWatch)

### 3. `lambda-sg`
- Name: `lambda-sg` | VPC: `devops-assessment-vpc`
- Inbound: None
- Outbound: PostgreSQL (5432) to `rds-sg` and HTTPS (443) to `0.0.0.0/0`

### 4. `rds-sg`
- Name: `rds-sg` | VPC: `devops-assessment-vpc`
- Inbound: PostgreSQL (5432) with Source: `lambda-sg` and `ecs-fargate-sg`
- Outbound: None

---

## SERVICE 7: Amazon RDS PostgreSQL

- **What it is:** A fully managed relational database service running PostgreSQL 15.
- **Why we need it:** Persistent, transactional data store for the Employee Management System, securely isolated inside private subnets.
- **How it works:** Provisions primary database instance in `ap-south-1a` with Multi-AZ standby option in `ap-south-1b`.

### Step A: Create DB Subnet Group
- **STEP 1:** In the AWS Console, search for **RDS**.
- **STEP 2:** In the left navigation menu, click **Subnet groups**.
- **STEP 3:** Click **Create DB subnet group**.
- **STEP 4:** Enter:
  - **Name:** `devops-rds-subnet-group`
  - **Description:** Subnet group for private database subnets
  - **VPC:** Select `devops-assessment-vpc`
- **STEP 5:** In the *Add subnets* section:
  - **Availability Zones:** Select `ap-south-1a` and `ap-south-1b`.
  - **Subnets:** Select the two isolated DB subnets: `10.0.30.0/24` and `10.0.31.0/24`.
- **STEP 6:** Click **Create**.

### Step B: Create RDS PostgreSQL Database

> [!WARNING]
> **Cost Warning:** Do NOT select Aurora (PostgreSQL Compatible) as it defaults to Aurora Serverless ($262 – $2,102 USD/month). Select standard **PostgreSQL** (`db.t4g.micro` or `db.t3.micro`), which is Free Tier eligible or costs only ~$0.016/hour.

- **STEP 1:** In the RDS left menu, click **Databases**.
- **STEP 2:** Click the orange **Create database** button.
- **STEP 3:** Choose creation method: Select **Standard create** *(gives full control over networking and security)*.
- **STEP 4:** Engine options:
  - **Engine type:** Select **PostgreSQL** *(Do NOT choose Aurora)*.
  - **Engine Version:** Select **PostgreSQL 15.7** (or latest 15.x version).
- **STEP 5:** Templates:
  - Select **Free tier** (if available on your account) or **Dev/Test**.
- **STEP 6:** Settings:
  - **DB instance identifier:** `devops-employee-rds`
  - **Master username:** `postgres`
  - **Credentials management:** Select **Self managed**
  - **Master password:** Enter a strong password (e.g., `P@ssw0rd<YOUR_NAME>2026!`) *(note it down for Secrets Manager!)*
  - **Confirm master password:** Re-enter your password
- **STEP 7:** Instance configuration:
  - **DB instance class:** Select **Burstable classes (includes t classes)** -> Select **`db.t4g.micro`** or **`db.t3.micro`** (2 vCPUs, 1 GiB RAM).
- **STEP 8:** Storage:
  - **Storage type:** **General Purpose SSD (gp3)**
  - **Allocated storage:** `20` GiB
  - **Enable storage autoscaling:** Checked (Maximum storage threshold: `100` GiB).
- **STEP 9:** Availability & durability:
  - **Multi-AZ deployment:** Select **Single DB instance** (avoids duplicate cost during assessment).
- **STEP 10:** Connectivity:
  - **Compute resource:** **Don’t connect to an EC2 compute resource**
  - **Network type:** **IPv4**
  - **Virtual private cloud (VPC):** Select **`devops-assessment-vpc`** *(⚠️ NEVER select Default VPC)*
  - **DB subnet group:** Select **`devops-rds-subnet-group`** *(the subnet group you created in Step A)*
  - **Public access:** Select **No** *(Keeps the database secure inside private subnets with no public internet route)*
  - **VPC security group (firewall):**
    - Select **Choose existing**
    - In the dropdown, select **`rds-sg`**
    - Click the **X** to remove the `default` security group (ensure **only `rds-sg`** is attached).
  - **Availability Zone:** Select `ap-south-1a` (or No preference)
  - **Database port:** `5432`
- **STEP 11:** Database authentication:
  - Select **Password authentication**
- **STEP 12:** Monitoring:
  - **Enable Enhanced Monitoring:** **Uncheck / Turn off** (saves costs and eliminates extra IAM role requirement).
- **STEP 13:** Additional configuration (Click to expand):
  - **Initial database name:** `employeedb` *(⚠️ CRITICAL: You must type `employeedb` so PostgreSQL creates the database!)*
  - **Backup retention period:** `1 day`
  - **Enable encryption:** Checked (KMS key: default `aws/rds`)
  - **Enable deletion protection:** **Uncheck / Turn off** (allows clean teardown after evaluation).
- **STEP 14:** Click the orange **Create database** button at the bottom of the page.
- **STEP 15:** Wait ~5 to 8 minutes for the Status to transition from *Creating* to **Available**.
- **STEP 16:** Click on `devops-employee-rds` and under **Connectivity & security**, **COPY THE ENDPOINT** (e.g., `devops-employee-rds.c123456789.ap-south-1.rds.amazonaws.com`). You will paste this into Secrets Manager in the next service!

---

## SERVICE 8: AWS Secrets Manager

Now that your RDS instance exists, you can store the database credentials securely:

- **STEP 1:** In the AWS Console search bar, type **Secrets Manager** and select it.
- **STEP 2:** Click **Store a new secret**.
- **STEP 3:** Secret type: Select **Credentials for Amazon RDS database**.
- **STEP 4:** Enter Credentials:
  - **User name:** `postgres`
  - **Password:** Enter the master password you set in RDS.
  - **Encryption key:** `aws/secretsmanager` (default).
- **STEP 5:** Database:
  - Under *Select the Amazon RDS database that this secret will access*, you will now see **`devops-employee-rds`** listed! Select it.
- **STEP 6:** Click **Next**.
- **STEP 7:** Secret name: Enter `devops/rds/credentials`.
  - Description: `Production RDS PostgreSQL credentials for Employee Management GraphQL Architecture`.
- **STEP 8:** Click **Next**.
- **STEP 9:** Configure rotation: Keep **Disable automatic rotation** (to avoid additional assessment charges).
- **STEP 10:** Click **Next** -> Review settings -> Click **Store**.
- **STEP 11:** Click on the stored secret `devops/rds/credentials` and **Copy the Secret ARN** (e.g., `arn:aws:secretsmanager:ap-south-1:123456789012:secret:devops/rds/credentials-xxxx`).

---

## SERVICE 8.1: Database Schema & Seed Data Initialization

Because Amazon RDS is deployed in private, isolated subnets with **no public internet access**, you initialize the database schema and seed data using our pre-built serverless migration tool:

- **Method:** We provide the **`initDatabase`** Lambda function (`lambda/initDatabase/index.ts`).
- **How it works:** The function runs inside `private-lambda-subnet-1a` and connects directly to RDS on port 5432, executes all DDL from `database/schema.sql`, creates the `employees` table, and inserts the seed data from `database/seed.sql`.
- **Execution:** Once the Lambda execution role and Lambda functions are created (in Service 9 & 10), you click **Test** on `initDatabase` in the AWS Console to initialize the entire database with 1 click!

---

## SERVICE 9: AWS IAM Roles & Policies

Create the following IAM roles in the **IAM Console** -> **Roles**:

### Role 1: `lambdaExecutionRole`
- **What it is:** The execution role assumed by all 6 AWS Lambda functions.
- **Why we need it:** Allows Lambda to join your private VPC subnets (create ENIs), stream execution logs to CloudWatch, and read the database password from AWS Secrets Manager.
- **STEP 1:** In IAM Console, click **Roles** -> **Create role**.
- **STEP 2:** Trusted entity type: Select **AWS service** -> Use case: Select **Lambda** -> Click **Next**.
- **STEP 3:** Permissions: Search for `AWSLambdaVPCAccessExecutionRole`, check the box next to it, and click **Next**.
- **STEP 4:** Role name: `lambdaExecutionRole` -> Click **Create role**.
- **STEP 5:** In the Roles list, click on `lambdaExecutionRole`. Under the **Permissions** tab, click **Add permissions** -> **Create inline policy**.
- **STEP 6:** Select the **JSON** editor and paste the policy from `infrastructure/iam/lambda-execution-role-policy.json`:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "VPCAccessExecution",
        "Effect": "Allow",
        "Action": [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ],
        "Resource": "*"
      },
      {
        "Sid": "CloudWatchLogs",
        "Effect": "Allow",
        "Action": [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "arn:aws:logs:*:*:log-group:/aws/lambda/*"
      },
      {
        "Sid": "SecretsManagerRead",
        "Effect": "Allow",
        "Action": [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ],
        "Resource": "arn:aws:secretsmanager:ap-south-1:*:secret:devops/rds/credentials-*"
      }
    ]
  }
  ```
- **STEP 7:** Click **Next** -> Policy name: `LambdaSecretsManagerPolicy` -> Click **Create policy**.

### Role 2: `ecsTaskExecutionRole`
- **What it is:** The role assumed by the Amazon ECS container agent to manage your container lifecycle.
- **Why we need it:** Grants ECS permission to pull Docker images from private Amazon ECR repositories and stream container stdout/stderr to CloudWatch Logs.
- **STEP 1:** In IAM Console -> **Roles** -> Click **Create role**.
- **STEP 2:** Trusted entity: **AWS service** -> Use case: **Elastic Container Service** -> Select **Elastic Container Service Task** -> Click **Next**.
- **STEP 3:** Permissions: Search for and check **`AmazonECSTaskExecutionRolePolicy`** -> Click **Next**.
- **STEP 4:** Role name: `ecsTaskExecutionRole` -> Click **Create role**.
- **STEP 5:** In the Roles list, click on `ecsTaskExecutionRole` -> Under **Permissions** tab, click **Add permissions** -> **Create inline policy** -> Select **JSON** tab and paste:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "AllowECSCreateLogGroup",
        "Effect": "Allow",
        "Action": [
          "logs:CreateLogGroup"
        ],
        "Resource": "arn:aws:logs:ap-south-1:*:log-group:/ecs/devops-graphql-backend*"
      }
    ]
  }
  ```
- **STEP 6:** Click **Next** -> Policy name: `ECSCreateLogGroupPolicy` -> Click **Create policy**.

### Role 3: `ecsTaskRole`
- **What it is:** The role assumed by the Apollo GraphQL container code running inside ECS Fargate.
- **Why we need it:** Grants the Apollo GraphQL Server resolvers permission to invoke the AWS Lambda functions synchronously via the AWS SDK (`lambda:InvokeFunction`).
- **STEP 1:** In IAM Console -> **Roles** -> Click **Create role**.
- **STEP 2:** Trusted entity: **AWS service** -> Use case: **Elastic Container Service** -> Select **Elastic Container Service Task** -> Click **Next**.
- **STEP 3:** Permissions: Click **Next** (no managed policy needed, we will add an inline policy).
- **STEP 4:** Role name: `ecsTaskRole` -> Click **Create role**.
- **STEP 5:** Click on `ecsTaskRole` -> Under **Permissions** tab, click **Add permissions** -> **Create inline policy** -> Click **JSON** tab and paste:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "AllowLambdaInvocation",
        "Effect": "Allow",
        "Action": [
          "lambda:InvokeFunction"
        ],
        "Resource": [
          "arn:aws:lambda:ap-south-1:*:function:createEmployee",
          "arn:aws:lambda:ap-south-1:*:function:getEmployees",
          "arn:aws:lambda:ap-south-1:*:function:getEmployee",
          "arn:aws:lambda:ap-south-1:*:function:updateEmployee",
          "arn:aws:lambda:ap-south-1:*:function:deleteEmployee",
          "arn:aws:lambda:ap-south-1:*:function:initDatabase"
        ]
      },
      {
        "Sid": "AllowCloudWatchMetricsAndLogs",
        "Effect": "Allow",
        "Action": [
          "cloudwatch:PutMetricData",
          "logs:DescribeLogStreams",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "*"
      }
    ]
  }
  ```
- **STEP 6:** Click **Next** -> Policy name: `ECSTaskLambdaInvokePolicy` -> Click **Create policy**.

### Role 4: `githubActionsRole` (OIDC)
*(Configured during Phase 9 for automated CI/CD deployments without permanent access keys).*

---

## SERVICE 10: AWS Lambda Functions

Create 5 Lambda functions in the **Lambda** console:
1. `createEmployee`
2. `getEmployees`
3. `getEmployee`
4. `updateEmployee`
5. `deleteEmployee`

For each function:
- **Author from scratch**
- **Runtime:** Node.js 20.x (or 22.x)
- **Architecture:** x86_64
- **Execution Role:** Use existing role -> `lambdaExecutionRole`
- **Advanced settings -> VPC:**
  - VPC: `devops-assessment-vpc`
  - Subnets: `private-lambda-subnet-1a`, `private-lambda-subnet-1b`
  - Security Group: `lambda-sg`
- **Environment Variables:**
  - `DB_SECRET_NAME`: `devops/rds/credentials`
  - `DB_NAME`: `employeedb`
  *(Note: Do NOT add `AWS_REGION` — AWS Lambda reserves this key and injects it automatically).*
- **Code Upload:** Upload the compiled zip for each function from `lambda/zips/<functionName>.zip`.
- **Handler:** `index.handler`

---

## SERVICE 11: Amazon ECR & Docker Push

- **STEP 1:** Search for **ECR** in AWS Console (Mumbai `ap-south-1`).
- **STEP 2:** Click **Create repository**.
- **STEP 3:** Visibility: **Private**.
- **STEP 4:** Repository name: `devops-graphql-backend`.
- **STEP 5:** Tag immutability: Disabled (for assessment).
- **STEP 6:** Click **Create repository**.
- **STEP 7:** Build and push the container image from your local terminal:
  ```powershell
  # 1. Authenticate Docker with Amazon ECR
  aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 977527528431.dkr.ecr.ap-south-1.amazonaws.com

  # 2. Build the production Docker image
  docker build -t devops-graphql-backend:latest ./backend

  # 3. Tag the image for ECR
  docker tag devops-graphql-backend:latest 977527528431.dkr.ecr.ap-south-1.amazonaws.com/devops-graphql-backend:latest

  # 4. Push to Amazon ECR
  docker push 977527528431.dkr.ecr.ap-south-1.amazonaws.com/devops-graphql-backend:latest
  ```

---

## SERVICE 12: Target Group & Internal Application Load Balancer

*(Must be created BEFORE the ECS Service so that the service can register to it)*.

### Step A: Create Target Group (`ecs-graphql-tg`)
- **STEP 1:** In EC2 Console, scroll to *Load Balancing* -> **Target Groups**.
- **STEP 2:** Click **Create target group**.
- **STEP 3:** Target type: Choose **IP addresses** *(CRITICAL: Fargate `awsvpc` network mode requires IP target type)*.
- **STEP 4:** Target group name: `ecs-graphql-tg` | Protocol: `HTTP` | Port: `4000`.
- **STEP 5:** VPC: Select `devops-assessment-vpc`.
- **STEP 6:** Health checks: Path: `/health` | Advanced settings: Timeout `5s`, Interval `30s`, Healthy `2`, Unhealthy `3`, Success codes `200`.
- **STEP 7:** Click **Next** -> Click **Create target group** (Do not manually register IPs).

### Step B: Create Internal Application Load Balancer (`devops-internal-alb`)
- **STEP 1:** In EC2 Console, click **Load Balancers** -> **Create load balancer** -> **Application Load Balancer**.
- **STEP 2:** Name: `devops-internal-alb`.
- **STEP 3:** Scheme: **Internal** *(CRITICAL: Keeps backend private inside VPC)*.
- **STEP 4:** IP address type: `IPv4`.
- **STEP 5:** VPC: `devops-assessment-vpc` -> Subnets: Select `private-app-subnet-1a` and `private-app-subnet-1b`.
- **STEP 6:** Security group: Select `alb-sg` (remove `default`).
- **STEP 7:** Listeners and routing: Protocol: `HTTP` | Port: `80` -> Forward to: `ecs-graphql-tg`.
- **STEP 8:** Click **Create load balancer**.

---

## SERVICE 13: Amazon ECS Fargate Cluster & Service

### Step A: Create Cluster
- **STEP 1:** In ECS Console, click **Clusters** -> **Create cluster**.
- **STEP 2:** Name: `devops-ecs-cluster` | Infrastructure: **AWS Fargate (serverless)**.
- **STEP 3:** Click **Create**.

### Step B: Create Task Definition with JSON
- **STEP 1:** In ECS Console, click **Task definitions** -> **Create new task definition** -> **Create new task definition with JSON**.
- **STEP 2:** Paste the task definition JSON:
  ```json
  {
    "family": "devops-graphql-backend",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "512",
    "memory": "1024",
    "executionRoleArn": "arn:aws:iam::977527528431:role/ecsTaskExecutionRole",
    "taskRoleArn": "arn:aws:iam::977527528431:role/ecsTaskRole",
    "containerDefinitions": [
      {
        "name": "graphql-server",
        "image": "977527528431.dkr.ecr.ap-south-1.amazonaws.com/devops-graphql-backend:latest",
        "essential": true,
        "portMappings": [
          { "containerPort": 4000, "hostPort": 4000, "protocol": "tcp" }
        ],
        "environment": [
          { "name": "PORT", "value": "4000" },
          { "name": "NODE_ENV", "value": "production" },
          { "name": "USE_LAMBDA", "value": "true" },
          { "name": "AWS_REGION", "value": "ap-south-1" },
          { "name": "LAMBDA_CREATE_EMPLOYEE", "value": "createEmployee" },
          { "name": "LAMBDA_GET_EMPLOYEES", "value": "getEmployees" },
          { "name": "LAMBDA_GET_EMPLOYEE", "value": "getEmployee" },
          { "name": "LAMBDA_UPDATE_EMPLOYEE", "value": "updateEmployee" },
          { "name": "LAMBDA_DELETE_EMPLOYEE", "value": "deleteEmployee" }
        ],
        "logConfiguration": {
          "logDriver": "awslogs",
          "options": {
            "awslogs-group": "/ecs/devops-graphql-backend",
            "awslogs-region": "ap-south-1",
            "awslogs-stream-prefix": "ecs",
            "awslogs-create-group": "true"
          }
        },
        "healthCheck": {
          "command": ["CMD-SHELL", "curl -f http://localhost:4000/health || exit 1"],
          "interval": 30,
          "timeout": 5,
          "retries": 3,
          "startPeriod": 15
        }
      }
    ]
  }
  ```
- **STEP 3:** Click **Create**.

### Step C: Create Service
- **STEP 1:** In ECS Clusters -> `devops-ecs-cluster` -> **Services** tab -> Click **Create**.
- **STEP 2:** Deployment configuration: Family: `devops-graphql-backend` (latest revision) | Service name: `devops-graphql-backend-service` | Desired tasks: `1`.
- **STEP 3:** Networking: VPC: `devops-assessment-vpc` | Subnets: `private-app-subnet-1a`, `private-app-subnet-1b` | Security group: `ecs-fargate-sg` (remove `default`) | Public IP: **Turn OFF**.
- **STEP 4:** Load balancing: Application Load Balancer -> Select `devops-internal-alb` -> Container: `graphql-server:4000` -> Listener: `80:HTTP` -> Target group: `ecs-graphql-tg`.
- **STEP 5:** Click **Create**. Target health in `ecs-graphql-tg` will change to **Healthy** within 60-90 seconds.

---

## SERVICE 14: Amazon API Gateway & VPC Link

- **What it is:** A fully managed API service that provides secure public ingress for HTTP and WebSocket requests, routing them through a private VPC Link to the internal ALB.

### Step A: Create VPC Link (`devops-vpc-link`)
- **STEP 1:** In API Gateway Console (Mumbai `ap-south-1`), click **VPC links** in the left navigation menu.
- **STEP 2:** Click **Create** -> Select **VPC link for HTTP APIs** *(Do NOT select REST APIs)*.
- **STEP 3:** Name: `devops-vpc-link`.
- **STEP 4:** VPC: Select `devops-assessment-vpc`.
- **STEP 5:** Subnets: Select `private-app-subnet-1a` and `private-app-subnet-1b`.
- **STEP 6:** Security group: Select `alb-sg`.
- **STEP 7:** Click **Create**. Status will become **Available** in ~1-2 minutes.

### Step B: Create HTTP API (`devops-graphql-api`)
- **STEP 1:** In API Gateway left menu, click **APIs** -> Under **HTTP API**, click **Build**.
- **STEP 2:** API name: `devops-graphql-api` -> Click **Next**.
- **STEP 3:** Configure routes: Method: `ANY` | Resource path: `/{proxy+}` -> Click **Next**.
- **STEP 4:** Define stages: Leave `$default` (Auto-deploy enabled) -> Click **Next** -> Click **Create**.

### Step C: Attach VPC Link Integration to Route
- **STEP 1:** In left menu, click **Routes** -> Select `ANY /{proxy+}`.
- **STEP 2:** Click **Attach integration** (or **Create and attach an integration**).
- **STEP 3:** Integration type: **Private resource**.
- **STEP 4:** Integration target: **ALB/NLB** -> Load balancer: `devops-internal-alb` -> Listener: `HTTP 80` -> VPC link: `devops-vpc-link`.
- **STEP 5:** Click **Create**.

### Step D: Locate Invoke URL & Verify
- **STEP 1:** Click **Stages** in the left menu -> Click on the **`$default`** stage.
- **STEP 2:** Copy the **Invoke URL** displayed at the top (e.g. `https://9n409iamg5.execute-api.ap-south-1.amazonaws.com`).
- **STEP 3:** Verify by appending `/health` in browser:
  `https://9n409iamg5.execute-api.ap-south-1.amazonaws.com/health` -> Returns `{"status":"UP","service":"devops-graphql-ecs-fargate","useLambda":true}`.

---

## SERVICE 15: Amazon S3 Frontend Bucket

- **STEP 1:** In S3 Console, click **Create bucket**.
- **STEP 2:** Bucket name: `devops-frontend-977527528431` (globally unique).
- **STEP 3:** AWS Region: `ap-south-1`.
- **STEP 4:** Object Ownership: **ACLs disabled (recommended)**.
- **STEP 5:** **Block Public Access settings:** Keep all 4 boxes CHECKED (Block *all* public access).
- **STEP 6:** Bucket Versioning: **Enable** (allows rollbacks).
- **STEP 7:** Default encryption: Server-side encryption with Amazon S3 managed keys (SSE-S3).
- **STEP 8:** Click **Create bucket**.

---

## SERVICE 16: Amazon CloudFront CDN

- **STEP 1:** In CloudFront Console, click **Create distribution**.
- **STEP 2:** Origin domain: Select your S3 bucket (`devops-frontend-977527528431.s3.ap-south-1.amazonaws.com`).
- **STEP 3:** Origin access:
  - Select: **Origin access control settings (recommended)**.
  - Click **Create control setting** -> Name: `devops-s3-oac` -> Click **Create**.
- **STEP 4:** Default cache behavior:
  - Viewer protocol policy: **Redirect HTTP to HTTPS**.
  - Allowed HTTP methods: `GET, HEAD`.
- **STEP 5:** Custom error responses (for React SPA routing):
  - In Distribution settings, go to **Error pages** -> **Create custom error response**:
    - HTTP error code: `403: Forbidden` -> Customize response: Yes -> Response page path: `/index.html` -> HTTP response code: `200: OK`.
    - Create a second error response for `404: Not Found` -> Response path: `/index.html` -> Response code: `200: OK`.
- **STEP 6:** Click **Create distribution**.
- **STEP 7:** CloudFront prompts with a yellow banner: *"The S3 bucket policy needs to be updated."* Click **Copy policy**, go to your S3 bucket's **Permissions** tab -> **Bucket policy**, paste it, and save.
- **STEP 8:** Verification: Wait until status shows **Enabled**. Visit your CloudFront domain name (`https://d10mgtmt48ejxy.cloudfront.net`) to view the application.

---

## SERVICE 17: Amazon CloudWatch

- **STEP 1:** In CloudWatch Console, click **Alarms** -> **All alarms** -> **Create alarm**.
- **STEP 2:** Configure the key alarms:
  1. **Lambda Errors:** Select metric `AWS/Lambda` -> `Errors` -> Threshold: `>= 1` -> Period: 5 min -> Action: Notify SNS.
  2. **ECS CPU Utilization:** Select metric `AWS/ECS` -> `CPUUtilization` -> Threshold: `>= 80%`.
  3. **RDS Database Connections:** Select metric `AWS/RDS` -> `DatabaseConnections` -> Threshold: `>= 80`.
- **STEP 3:** Click **Create alarm**.

---

## SERVICE 18: Auto Scaling Policies

- **ECS Fargate Auto Scaling:**
  - In ECS Console -> Service `devops-graphql-backend-service` -> **Service auto scaling** tab.
  - Click **Update** -> Check **Use service auto scaling**.
  - Minimum number of tasks: `1` | Maximum: `5`.
  - Add scaling policy:
    - Policy type: **Target tracking**.
    - ECS service metric: `ECSServiceAverageCPUUtilization` -> Target value: `70%`.
    - Scale-out cooldown: `60 seconds` | Scale-in cooldown: `300 seconds`.
  - Click **Save**.
- **RDS Storage Auto Scaling:**
  - Already configured during database creation (Max storage threshold: 100 GiB).

---

## SERVICE 19: Troubleshooting & Real-World Resolution Log

This section documents real-world production errors encountered during the implementation and their permanent architectural fixes for future reference:

### Issue 1: Reserved Environment Key in AWS Lambda (`AWS_REGION`)
- **Error:** `Lambda was unable to configure your environment variables because the environment variables you have provided contains reserved keys that are currently not supported for modification. Reserved keys used in this request: AWS_REGION`.
- **Root Cause:** AWS Lambda automatically injects system environment variables (including `AWS_REGION`, `AWS_DEFAULT_REGION`, and `LAMBDA_TASK_ROOT`) into the container runtime. AWS blocks users from manually specifying `AWS_REGION`.
- **Resolution:** Remove `AWS_REGION` from the Lambda function's manual Environment Variables list. Lambda will automatically set `process.env.AWS_REGION = 'ap-south-1'` internally.

### Issue 2: PostgreSQL SSL Encryption Requirement (`no pg_hba.conf entry ... no encryption`)
- **Error:** `error: no pg_hba.conf entry for host "10.0.21.63", user "postgres", database "employeedb", no encryption`.
- **Root Cause:** Amazon RDS PostgreSQL enforces SSL/TLS encryption by default. When the Node.js `pg` client attempts an unencrypted connection (because `NODE_ENV` is not set to `production` in Lambda), RDS rejects the TCP connection.
- **Resolution:** Updated `lambda/common/db.ts` to automatically enforce SSL (`ssl: { rejectUnauthorized: false }`) whenever connecting to any non-localhost host (such as `*.rds.amazonaws.com`).

### Issue 3: Initial Database Not Present in RDS (`database "employeedb" does not exist`)
- **Error:** `error: database "employeedb" does not exist (code: 3D000)`.
- **Root Cause:** If the "Initial database name" field is omitted or not populated when launching an RDS instance, Amazon RDS only provisions the default maintenance database named `postgres`.
- **Resolution:** Made the `initDatabase` Lambda function self-healing:
  1. It connects to the default `postgres` database first.
  2. Queries `pg_database` to check if `employeedb` exists; if not, executes `CREATE DATABASE employeedb;`.
  3. Re-connects to `employeedb` to create extensions (`pgcrypto`, `uuid-ossp`), the `employees` table, indexes, triggers, and seed data.

### Issue 4: RDS Console "Easy Create" Placing Instance in Default VPC
- **Error:** Subnet group and custom VPC ignored; RDS placed in Default VPC (`vpc-03dd8736...`).
- **Root Cause:** In the RDS creation wizard, "Easy create" uses AWS pre-selected defaults and hides VPC/Subnet selection. Once created, an RDS database **cannot change its VPC**.
- **Resolution:** Always select **Full configuration / Standard create** to manually choose `devops-assessment-vpc`, `devops-rds-subnet-group`, and `rds-sg`.

### Issue 5: TypeScript Global Missing (`Cannot find name 'Buffer'`)
- **Error:** `Cannot find name 'Buffer'. Do you need to install type definitions for node?`.
- **Root Cause:** In TypeScript strict mode or when IDE language servers don't find ambient Node definitions indexed in project root, using `Buffer` as a bare global causes an IDE error.
- **Resolution:** Added explicit import `import { Buffer } from 'node:buffer';` in `backend/src/services/lambdaService.ts`.

### Issue 6: GraphQL Subscriptions PubSub Method Mismatch
- **Error:** `Property 'asyncIterator' does not exist on type 'PubSub<Record<string, never>>'`.
- **Root Cause:** `graphql-subscriptions` v3 changed its internal TypeScript generic interface from `asyncIterator` to `asyncIterableIterator` / `subscribe`.
- **Resolution:** Typed `pubsub: any` in `backend/src/pubsub.ts` and provided a polyfill callback in `backend/src/resolvers/employeeResolvers.ts` supporting both `.asyncIterator` and `.subscribe`.

### Issue 7: Target Group Type Conflict with ECS Fargate (`Instances` vs `IP addresses`)
- **Error:** Target group cannot register Fargate tasks.
- **Root Cause:** Fargate uses the `awsvpc` network mode, meaning tasks do not have EC2 instance IDs; each task gets its own Elastic Network Interface (ENI) and private IP.
- **Resolution:** Target Groups for ECS Fargate must ALWAYS be created with Target Type = **IP addresses** (NOT *Instances*).

### Issue 8: ECS Task Failed to Start Due to CloudWatch Log Group Permission
- **Error:** `ResourceInitializationError: failed to create Cloudwatch log group: AccessDeniedException: User: .../ecsTaskExecutionRole/... is not authorized to perform: logs:CreateLogGroup on resource: arn:aws:logs:ap-south-1:977527528431:log-group:/ecs/devops-graphql-backend`.
- **Root Cause:** The task definition has `"awslogs-create-group": "true"`. AWS managed policy `AmazonECSTaskExecutionRolePolicy` only grants `logs:CreateLogStream` and `logs:PutLogEvents`, but lacks `logs:CreateLogGroup`.
- **Resolution:** Attach an inline policy to `ecsTaskExecutionRole` granting `logs:CreateLogGroup` on `arn:aws:logs:ap-south-1:*:log-group:/ecs/devops-graphql-backend*` (or manually create the `/ecs/devops-graphql-backend` log group in CloudWatch).

### Issue 9: CloudFront Returns `AccessDenied` XML Error on Initial Creation
- **Error:** `<Error><Code>AccessDenied</Code><Message>Access Denied</Message></Error>` when visiting CloudFront domain name (`https://dxxxxx.cloudfront.net`).
- **Root Cause:**
  1. **Empty S3 Bucket:** The bucket does not yet contain `index.html`. For security reasons, Amazon S3 private buckets return `403 AccessDenied` (not 404) whenever a requested object does not exist to prevent public discovery of bucket contents.
  2. **Bucket Policy Not Applied:** CloudFront Origin Access Control (OAC) requires an explicit S3 Bucket Policy granting `s3:GetObject` to `cloudfront.amazonaws.com`.
- **Resolution:**
  1. Attach the CloudFront OAC policy to S3 Bucket -> **Permissions** -> **Bucket policy**.
  2. Add Custom Error Responses (403 and 404 -> `/index.html` with HTTP 200 OK) in CloudFront **Error pages** tab.
  3. Build and upload frontend production assets (`dist/*`) to the S3 bucket.

### Issue 10: WebSocket Connection Failed Against AWS API Gateway HTTP API
- **Error:** `WebSocket connection to 'wss://<api-id>.execute-api.ap-south-1.amazonaws.com/graphql' failed`.
- **Root Cause:** Amazon API Gateway **HTTP APIs** (`execute-api`) are designed exclusively for HTTP/1.1 and HTTP/2 request/response protocols. They do NOT support WebSocket protocol upgrades (`wss://`). GraphQL subscriptions over WebSockets require a separate AWS API Gateway WebSocket API.
- **Resolution:**
  1. Updated `frontend/src/apollo/client.ts` to make WebSocket subscriptions conditional: it only instantiates `GraphQLWsLink` if `VITE_GRAPHQL_WS_URL` is explicitly set to a dedicated WebSocket gateway.
  2. In `frontend/src/App.tsx`, added `skip: !isWsEnabled` on `useSubscription` hooks to avoid connection attempts when running behind standard HTTP API.
  3. All GraphQL CRUD operations (`GET_EMPLOYEES`, `CREATE_EMPLOYEE`, `UPDATE_EMPLOYEE`, `DELETE_EMPLOYEE`) execute reliably over HTTPS with automatic UI cache updates.

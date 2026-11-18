# Security Groups Specification Matrix

Least-privilege isolation matrix ensuring no service exposes unauthorized ports or accepts traffic from untrusted sources.

---

## 🛡️ Security Group Overview

| Security Group Name | Purpose | Inbound Source | Inbound Port | Outbound Destination | Outbound Port |
|---|---|---|---|---|---|
| `api-gw-vpclink-sg` | VPC Link ENIs | API Gateway Managed | All | `alb-sg` | TCP 80/443 |
| `alb-sg` | Internal Application Load Balancer | `api-gw-vpclink-sg` | TCP 80 / 443 | `ecs-fargate-sg` | TCP 4000 |
| `ecs-fargate-sg` | ECS Fargate GraphQL Task | `alb-sg` | TCP 4000 | ECR / Logs / AWS APIs | TCP 443 |
| `lambda-sg` | AWS Lambda VPC ENIs | None (Invoked via AWS SDK / API) | None | `rds-sg` / VPC Endpoints | TCP 5432 / TCP 443 |
| `rds-sg` | Amazon RDS PostgreSQL | `lambda-sg`, `ecs-fargate-sg` | TCP 5432 | None | None |

---

## Detailed Rule Definitions

### 1. `alb-sg` (Internal Application Load Balancer)
- **Inbound Rules:**
  - Type: HTTP (Port 80) | Source: Custom -> `api-gw-vpclink-sg` (or `10.0.0.0/16` internal VPC)
  - Type: HTTPS (Port 443) | Source: Custom -> `api-gw-vpclink-sg`
- **Outbound Rules:**
  - Type: Custom TCP (Port 4000) | Destination: `ecs-fargate-sg`

### 2. `ecs-fargate-sg` (GraphQL Server Tasks)
- **Inbound Rules:**
  - Type: Custom TCP (Port 4000) | Source: `alb-sg` ONLY
- **Outbound Rules:**
  - Type: HTTPS (Port 443) | Destination: `0.0.0.0/0` (for ECR image pulls, CloudWatch logs, AWS SDK Lambda invocation)
  - Type: PostgreSQL (Port 5432) | Destination: `rds-sg` (for direct fallback queries)

### 3. `lambda-sg` (Lambda VPC Execution)
- **Inbound Rules:**
  - **No Inbound Rules** (Lambda functions are invoked over the AWS Control Plane, not via direct TCP connection)
- **Outbound Rules:**
  - Type: PostgreSQL (Port 5432) | Destination: `rds-sg`
  - Type: HTTPS (Port 443) | Destination: `0.0.0.0/0` (or VPC Interface Endpoints for Secrets Manager & CloudWatch)

### 4. `rds-sg` (Amazon RDS Database)
- **Inbound Rules:**
  - Type: PostgreSQL (TCP 5432) | Source: `lambda-sg`
  - Type: PostgreSQL (TCP 5432) | Source: `ecs-fargate-sg`
- **Outbound Rules:**
  - **None required** (stateful security group automatically returns response traffic)

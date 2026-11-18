# VPC Subnet & IP Addressing Plan

## VPC Overview
- **VPC Name:** `devops-assessment-vpc`
- **IPv4 CIDR Block:** `10.0.0.0/16` (65,536 addresses)
- **Tenancy:** Default
- **DNS Resolution:** Enabled
- **DNS Hostnames:** Enabled

---

## Subnet Allocation Table

| Subnet Name | Type | Availability Zone | CIDR Block | Usable IPs | Primary Workload |
|---|---|---|---|---|---|
| `public-subnet-1a` | Public | `ap-south-1a` | `10.0.1.0/24` | 251 | Internet Gateway, NAT Gateway AZ-A, Public ALB (optional) |
| `public-subnet-1b` | Public | `ap-south-1b` | `10.0.2.0/24` | 251 | High-availability redundant public tier |
| `private-app-subnet-1a` | Private | `ap-south-1a` | `10.0.10.0/24`| 251 | ECS Fargate Tasks (AZ-A), Internal ALB, VPC Link |
| `private-app-subnet-1b` | Private | `ap-south-1b` | `10.0.11.0/24`| 251 | ECS Fargate Tasks (AZ-B), Internal ALB |
| `private-lambda-subnet-1a`| Private | `ap-south-1a` | `10.0.20.0/24`| 251 | AWS Lambda ENIs (AZ-A) |
| `private-lambda-subnet-1b`| Private | `ap-south-1b` | `10.0.21.0/24`| 251 | AWS Lambda ENIs (AZ-B) |
| `private-db-subnet-1a` | Isolated| `ap-south-1a` | `10.0.30.0/24`| 251 | Amazon RDS PostgreSQL Primary |
| `private-db-subnet-1b` | Isolated| `ap-south-1b` | `10.0.31.0/24`| 251 | Amazon RDS Multi-AZ Standby / Read Replica |

---

## Route Tables

### 1. Public Route Table (`public-rt`)
- Associated with: `public-subnet-1a`, `public-subnet-1b`
- Routes:
  - `10.0.0.0/16` -> `local`
  - `0.0.0.0/0` -> `Internet Gateway (igw-xxxx)`

### 2. Private App Route Table (`private-app-rt`)
- Associated with: `private-app-subnet-1a`, `private-app-subnet-1b`
- Routes:
  - `10.0.0.0/16` -> `local`
  - `0.0.0.0/0` -> `NAT Gateway (nat-xxxx)` (or VPC Endpoints for S3, ECR, CloudWatch, Secrets Manager for cost optimization)

### 3. Private Lambda Route Table (`private-lambda-rt`)
- Associated with: `private-lambda-subnet-1a`, `private-lambda-subnet-1b`
- Routes:
  - `10.0.0.0/16` -> `local`
  - `0.0.0.0/0` -> `NAT Gateway` (or VPC Endpoints to reach Secrets Manager / CloudWatch)

### 4. Isolated Database Route Table (`private-db-rt`)
- Associated with: `private-db-subnet-1a`, `private-db-subnet-1b`
- Routes:
  - `10.0.0.0/16` -> `local`
  - **No route to `0.0.0.0/0`** (strictly air-gapped database tier)

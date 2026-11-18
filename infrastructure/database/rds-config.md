# Amazon RDS PostgreSQL Configuration Specification

## 1. Instance Configuration
- **Engine:** PostgreSQL
- **Version:** PostgreSQL 15.7 (or latest 15.x / 16.x)
- **Template:** Dev/Test (or Free tier eligible if on fresh account)
- **DB Instance Identifier:** `devops-employee-rds`
- **Instance Class:** `db.t4g.micro` or `db.t3.micro` (Cost optimized: ~$0.016/hour)
- **Storage Type:** General Purpose SSD (`gp3`)
- **Allocated Storage:** 20 GiB (Minimum)
- **Storage Autoscaling:** Enabled, max threshold 100 GiB

## 2. Connectivity & Network Isolation
- **Virtual Private Cloud (VPC):** `devops-assessment-vpc`
- **DB Subnet Group:** `devops-rds-subnet-group`
  - Subnets: `private-db-subnet-1a` (`10.0.30.0/24`), `private-db-subnet-1b` (`10.0.31.0/24`)
- **Public Access:** **NO** (Strictly isolated in private tier)
- **VPC Security Group:** Select `rds-sg` (inbound 5432 only from `lambda-sg` and `ecs-fargate-sg`)
- **Port:** `5432`

## 3. Database Authentication & Settings
- **Master Username:** `postgres`
- **Master Password:** Stored in AWS Secrets Manager (`devops/rds/credentials`)
- **Initial Database Name:** `employeedb`
- **Backup Retention Period:** 7 days (Automated snapshots)
- **Encryption:** Enabled (KMS default key `aws/rds`)
- **Performance Insights:** Disabled (to minimize cost during assessment)
- **Deletion Protection:** Disabled (for easy cleanup after evaluation)

## 4. Connection Pooling (RDS Proxy)
- **Proxy Name:** `devops-rds-proxy`
- **Engine Family:** PostgreSQL
- **Target Database:** `devops-employee-rds`
- **IAM Role:** `rdsProxyExecutionRole` (reads secret from Secrets Manager)
- **Idle Client Timeout:** 1800 seconds
- **Max Idle Connections Percent:** 50%

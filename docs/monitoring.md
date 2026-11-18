# CloudWatch Monitoring, Alerting & Scaling Strategy

## 1. Observability Overview

Comprehensive observability is implemented across all tiers using **Amazon CloudWatch**:
- **Logging**: Structured JSON logs shipped to CloudWatch Log Groups with defined retention policies.
- **Metrics**: Standard and custom metrics tracked for Compute, Network, and Database layers.
- **Alarms**: Automated alerts triggering SNS notifications on critical operational thresholds.

---

## 2. CloudWatch Log Groups & Retention

| Log Group Name | Source | Retention Period | Description |
|---|---|---|---|
| `/ecs/devops-graphql-backend` | ECS Fargate Tasks | 14 days | Apollo Server access logs, GraphQL errors, request IDs |
| `/aws/lambda/createEmployee` | AWS Lambda | 7 days | Function execution logs, DB query latency, invocation payloads |
| `/aws/lambda/getEmployees` | AWS Lambda | 7 days | Pagination and query logs |
| `/aws/lambda/getEmployee` | AWS Lambda | 7 days | Query logs by ID |
| `/aws/lambda/updateEmployee` | AWS Lambda | 7 days | Dynamic update execution logs |
| `/aws/lambda/deleteEmployee` | AWS Lambda | 7 days | Deletion logs |
| `/aws/rds/instance/devops-employee-rds/postgresql` | Amazon RDS | 14 days | PostgreSQL engine logs, slow queries, connection errors |

*DevOps Best Practice:* Setting explicit retention periods prevents runaway CloudWatch storage costs.

---

## 3. Key Metrics & CloudWatch Alarms

| Alarm Name | Namespace | Metric | Threshold | Evaluation | Action |
|---|---|---|---|---|---|
| `devops-lambda-errors` | `AWS/Lambda` | `Errors` | `>= 1` in 5 mins | 1 period | Immediate email alert via SNS |
| `devops-lambda-duration` | `AWS/Lambda` | `Duration` | `> 3000ms` | 2 consecutive | Warns on database/network latency degradation |
| `devops-ecs-cpu-high` | `AWS/ECS` | `CPUUtilization` | `>= 80%` | 2 consecutive | Triggers ECS Auto Scaling scale-out |
| `devops-ecs-memory-high` | `AWS/ECS` | `MemoryUtilization` | `>= 80%` | 2 consecutive | Warns of potential container memory leak |
| `devops-rds-cpu-high` | `AWS/RDS` | `CPUUtilization` | `>= 85%` | 2 consecutive | Warns on unindexed queries / CPU exhaustion |
| `devops-rds-connections` | `AWS/RDS` | `DatabaseConnections` | `>= 80` | 1 period | Warns when approaching max connection limit |

---

## 4. Scaling Strategy

### 4.1. Lambda Concurrency Strategy
- **Reserved Concurrency**: Set reserved concurrency (e.g. 50 invocations per function) to prevent runaway Lambdas from overwhelming the RDS PostgreSQL database connections.
- **Provisioned Concurrency**: Optional for latency-critical production workloads to eliminate cold start latency. Not required for dev/test assessment.

### 4.2. ECS Fargate Auto Scaling (Target Tracking)
- **Metric**: `ECSServiceAverageCPUUtilization` maintained at **70%**.
- **Minimum Capacity**: 1 task (can be set to 2 for Multi-AZ High Availability).
- **Maximum Capacity**: 5 tasks.
- **Scale-Out Cooldown**: 60 seconds (rapid response to traffic bursts).
- **Scale-In Cooldown**: 300 seconds (prevents thrashing and flapping).

### 4.3. RDS PostgreSQL Scaling Strategy
- **Storage Auto Scaling**: Configured with a baseline of 20 GiB and an autoscaling limit of 100 GiB. RDS automatically expands storage volume without downtime when free space falls below 10%.
- **Read Replica Strategy**: In high-read scenarios, read traffic (`getEmployees`, `getEmployee`) is routed to an Amazon RDS Read Replica deployed in a secondary Availability Zone, while write mutations (`createEmployee`, `updateEmployee`, `deleteEmployee`) target the Primary instance.
- **Scaling vs. High Availability Distinction**:
  - *High Availability (Multi-AZ)*: Synchronous standby replica in another AZ for instant disaster recovery and automated failover. Does NOT serve read traffic.
  - *Read Replicas (Scaling)*: Asynchronous replicas in other AZs that offload read query volume from the primary database to handle higher throughput.

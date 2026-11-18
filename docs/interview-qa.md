# DevOps Technical Assessment: Interview Questions & Answers

This guide prepares you for the technical evaluation and architectural defense interview with the hiring panel.

---

### Q1: Why did you choose a hybrid architecture with ECS Fargate hosting the GraphQL server and AWS Lambda executing the database operations?
**Answer:**
This architecture balances the strengths of long-running containerized servers and event-driven serverless functions:
- **Apollo GraphQL Server on ECS Fargate**: GraphQL requires maintaining persistent WebSocket connections for real-time Subscriptions, introspection, and centralized schema validation. Running this on ECS Fargate gives us dedicated compute without managing underlying EC2 hosts, while maintaining persistent socket connections.
- **AWS Lambda for Business Logic & Mutations**: Resolvers delegate individual query and mutation workloads to stateless, independently scalable Lambda functions. This allows individual endpoints (e.g. `getEmployees` vs. `createEmployee`) to scale, deploy, and fail independently without impacting the entire application.

---

### Q2: How does the ECS Fargate GraphQL server communicate with the AWS Lambda functions?
**Answer:**
Instead of exposing the Lambda functions through separate public HTTP API endpoints, the Apollo Server invokes them directly using the **AWS SDK v3 (`@aws-sdk/client-lambda`)** via the `InvokeCommand` with `InvocationType: RequestResponse`.
- The ECS Task assumes an IAM Role (`ecsTaskRole`) that has explicit permission (`lambda:InvokeFunction`) restricted only to the 5 Employee CRUD Lambda ARNs.
- This approach avoids unnecessary network hops through public API Gateways, reduces latency, eliminates public exposure, and maintains strict least-privilege IAM security.

---

### Q3: How do you handle PostgreSQL connection exhaustion in a serverless AWS Lambda environment?
**Answer:**
Serverless functions scale rapidly by creating concurrent runtime environments. If 100 Lambda instances spin up simultaneously, opening direct connections to PostgreSQL would immediately exhaust the database's `max_connections` limit.
We solve this using a two-tier strategy:
1. **Connection Caching in Lambda**: The `pg.Pool` connection pool instance is declared globally outside the Lambda handler function. During warm container reuses, the existing connection is reused rather than opening a new TCP and SSL handshake.
2. **Amazon RDS Proxy**: RDS Proxy sits between the Lambda functions and the RDS PostgreSQL instance. It pools and multiplexes database connections, queueing incoming requests and preventing connection floods while maintaining sub-millisecond response times.

---

### Q4: How does GitHub Actions authenticate with AWS without using permanent IAM Access Keys?
**Answer:**
We utilize **OpenID Connect (OIDC)**:
- We configure GitHub's OIDC Identity Provider (`token.actions.githubusercontent.com`) in AWS IAM.
- When the GitHub Actions workflow runs, GitHub issues a short-lived OIDC JSON Web Token (JWT).
- The action `aws-actions/configure-aws-credentials` exchanges this token with AWS Security Token Service (STS) using `AssumeRoleWithWebIdentity`.
- STS validates that the repository and branch match the trust policy condition and issues temporary credentials valid for 1 hour.
- This eliminates the risk of leaked long-term credentials (`AKIA...`) in source code or CI secrets.

---

### Q5: How do you achieve zero-downtime rolling updates in ECS Fargate?
**Answer:**
ECS Fargate implements rolling deployments using the Application Load Balancer and Target Group health checks:
1. When a new task definition is deployed, ECS launches a new task alongside the existing running task (minimum healthy percent: 100%, maximum percent: 200%).
2. The ALB target group sends health check probes (`GET /health`) to the new task.
3. Only after the new container responds with HTTP `200 OK` for consecutive probes is it registered to receive live user traffic.
4. The ALB then begins deregistering the old task, honoring the deregistration delay (connection draining) to allow inflight requests to complete cleanly before terminating the container.

---

### Q6: What is the difference between CloudFront Origin Access Control (OAC) and legacy Origin Access Identity (OAI)?
**Answer:**
- **Origin Access Identity (OAI)** is a legacy mechanism that only supported standard S3 buckets in specific regions and did not support KMS customer-managed keys (SSE-KMS), all HTTP methods, or modern AWS regions.
- **Origin Access Control (OAC)** uses AWS Signature Version 4 (SigV4) to authenticate CloudFront requests to S3. It supports all S3 buckets across all AWS regions, supports dynamic KMS encryption, offers fine-grained policy conditions (`AWS:SourceArn`), and delivers higher security.

---

### Q7: What is the difference between Amazon RDS Multi-AZ and Read Replicas?
**Answer:**
- **Multi-AZ (High Availability)**: Synchronous physical replication to a standby instance in a different Availability Zone. The standby instance does NOT accept read or write traffic; its sole purpose is automated failover (~60-120 seconds) in case of an AZ outage or hardware failure.
- **Read Replicas (Scalability)**: Asynchronous replication to one or more active database instances. Read Replicas serve read-only queries (e.g. `SELECT`), allowing us to scale read throughput horizontally and offload work from the primary instance.

---

### Q8: How is the application secured against common GraphQL vulnerabilities?
**Answer:**
1. **Query Depth & Complexity Limiting**: In production, Apollo Server plugins enforce maximum query depth to prevent malicious deeply nested queries from causing denial-of-service (DoS).
2. **Pagination Enforcement**: The `employees` query enforces strict upper bounds on pagination (`limit` capped at 200) to prevent unbounded memory allocation.
3. **Parameterized SQL Queries**: All database queries inside Lambda and backend services use parameterized placeholders (`$1, $2`), preventing SQL injection attacks entirely.
4. **Non-Root Containers**: The Docker container executes as the unprivileged `node` user to prevent container breakout exploits.

---

### Q9: If a production deployment fails in the CI/CD pipeline, what is the automated rollback process?
**Answer:**
- In the backend GitHub Actions workflow, the deployment step is monitored by `aws ecs wait services-stable`.
- If the new task fails health checks or crashes within the timeout window, the pipeline triggers the `if: failure()` hook.
- The hook queries the ECS service for the previous active task definition revision and automatically issues `aws ecs update-service --task-definition $PREV_TASK_DEF`, reverting the cluster to the last known stable version without manual intervention.

---

### Q10: How do you monitor and alert on system performance?
**Answer:**
We use **Amazon CloudWatch**:
- **ECS**: Tracking `CPUUtilization` and `MemoryUtilization`. An alarm at 80% triggers automated ECS target tracking scale-out.
- **Lambda**: Monitoring `Errors` and `Duration`. Any error (`>= 1` in 5 mins) triggers an SNS email notification. High duration (`> 3000ms`) warns of database connection or query latency issues.
- **RDS**: Monitoring `DatabaseConnections` and `CPUUtilization`. An alarm triggers before connections reach database capacity.
- **Structured Logging**: All logs are emitted in JSON format with correlation IDs (`x-request-id`) to enable distributed tracing from frontend request through GraphQL server to Lambda.

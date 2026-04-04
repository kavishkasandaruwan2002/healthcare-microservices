# Docker Issues Analysis

An analysis of the Docker configuration (`docker-compose.yml` and `Dockerfile`s) revealed several issues that could lead to connectivity problems, performance overhead, or lack of clarity.

## Critical Issues

### 1. Client-Backend Connectivity Mismatch
- **Mismatch in Environment Variable Name**: In `docker-compose.yml`, the client environment variable is named `NEXT_PUBLIC_API_URL`, but in `client/services/api.ts`, it is referenced as `NEXT_PUBLIC_API_BASE_URL`.
- **Hostname Resolution**: In `docker-compose.yml`, `NEXT_PUBLIC_API_URL` is set to `http://api-gateway:8085`. If the client-side code (running in the browser) uses this, it will NOT resolve because `api-gateway` is only known inside the Docker network. For browser access, it should be `http://localhost:8085` or the public address.
- **Port Inconsistency**: The default fallback in `api.ts` is `8080`, while the gateway runs on `8085`.

### 2. Incorrect EXPOSE Ports
- Almost all backend `Dockerfile`s have `EXPOSE 8080`, yet the services are configured to run on different internal ports in their `application.yml`:
  - `auth-service`: Port 8081
  - `patient-service`: Port 8082
  - `doctor-service`: Port 8083
  - `appointment-service`: Port 8084
  - `payment-service`: Port 8085
  - `notification-service`: Port 8086
  - `telemedicine-service`: Port 8087
  - `ai-service`: Port 8088
  - `gateway`: Port 8085

## Optimization & Best Practice Issues

### 3. Redundant Database Dependency for Eureka
- In `docker-compose.yml`, the `eureka` service contains a `depends_on` for both `mysql` and `mongo`.
- **Reasoning**: Eureka server acts as a service registry and does not require a database. Removing these redundant dependencies will speed up the startup sequence.

### 4. MySQL Root User Usage
- The `auth-service` and potentially others use the `root` MySQL user for database access.
- **Recommendation**: Use the `MYSQL_USER` (`healthcare_user`) and `MYSQL_PASSWORD` configured in the `mysql` service for better security.

### 5. Dockerfile Robustness (Build Process)
- Currently, the `Dockerfile`s rely on the JAR files already existing in the `target/` directories.
- **Issue**: If `docker-compose build` is run before `mvn clean package`, it will fail.
- **Recommendation**: Convert Dockerfiles to multi-stage builds that perform the Maven build inside the container, or at least document the requirement to build JARs first.

### 6. Port Overlap (Internal)
- Both the `gateway` and the `payment-service` are configured to use internal port `8085`. While Docker keeps them isolated, it's best practice to give each microservice a unique internal port to avoid confusion.

---

## Proposed Fixes

### Step 1: Fix Gateway Port Documentation
Update `gateway/Dockerfile` to `EXPOSE 8085` to match `application.yml`.

### Step 2: Fix Client Environment Connection
Update `docker-compose.yml` to use `NEXT_PUBLIC_API_BASE_URL` and set it to `http://localhost:8085` for local development.

### Step 3: Streamline Eureka
Remove unnecessary database dependencies from the `eureka` service in `docker-compose.yml`.

### Step 4: Correct EXPOSE across Microservices
Update each `Dockerfile` to accurately reflect its service's port.

---
Would you like me to proceed with fixing these issues?

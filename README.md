# 🏥 Smart Healthcare Appointment & Telemedicine Platform

A cloud-native, microservices-based healthcare platform that lets patients book appointments, consult doctors over video, manage prescriptions and payments, and get AI-assisted symptom triage — all through a single web application backed by independently deployable Spring Boot services.

<p align="left">
  <img alt="Java" src="https://img.shields.io/badge/Java-17-orange">
  <img alt="Spring Boot" src="https://img.shields.io/badge/Spring%20Boot-2.7%20%2F%203.2-brightgreen">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-blue">
  <img alt="Kubernetes" src="https://img.shields.io/badge/Kubernetes-ready-326CE5">
  <img alt="License" src="https://img.shields.io/badge/license-Unspecified-lightgrey">
</p>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Services](#services)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick Start (Docker Compose)](#quick-start-docker-compose)
  - [Running Services Locally (without Docker)](#running-services-locally-without-docker)
- [Environment Variables](#environment-variables)
- [Kubernetes Deployment](#kubernetes-deployment)
- [CI/CD](#cicd)
- [Known Issues](#known-issues)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

---

## Overview

This platform digitizes the end-to-end patient–doctor journey:

- **Patients** can register, search doctors, book appointments, join video consultations, view prescriptions and medical records, pay for consultations, and get preliminary AI symptom checks.
- **Doctors** can manage their availability/schedule, view and accept appointments, issue prescriptions, and hold telemedicine sessions.
- **Admins** get a dashboard to oversee platform activity.

The backend is decomposed into independently deployable Spring Boot microservices, registered with a Eureka service registry and fronted by a single Spring Cloud Gateway, so the Next.js frontend only ever talks to one entry point.

## Architecture

```
                                   ┌───────────────────────┐
                                   │   Next.js Frontend     │
                                   │   (client, port 3000)  │
                                   └───────────┬────────────┘
                                               │  HTTP
                                               ▼
                                   ┌───────────────────────┐
                                   │   API Gateway           │
                                   │ (Spring Cloud Gateway,  │
                                   │      port 8085)         │
                                   └───────────┬────────────┘
                                               │  service discovery
                                               ▼
                                   ┌───────────────────────┐
                                   │   Eureka Server         │
                                   │      (port 8761)        │
                                   └───────────┬────────────┘
                     ┌───────────────┬─────────┼─────────┬───────────────┬─────────────────┐
                     ▼               ▼         ▼         ▼               ▼                 ▼
              Auth Service   Patient Service  Doctor   Appointment  Notification      Payment Service
               (MySQL)         (MongoDB)     Service    Service       Service           (Stripe,
              port 8090       port 8092    (MongoDB)  (MongoDB +   (MongoDB +          PostgreSQL)
                                            port 8082  RabbitMQ)    RabbitMQ, Email)     port 8089
                                                        port 8083    port 8088
                                                                                              │
                     ┌────────────────────────────────────────────────────────────────────────┘
                     ▼                                   ▼
          Telemedicine Service                      AI Service
        (Agora video, PostgreSQL,                 (MongoDB, rules
         RabbitMQ) — port 8084                    engine / Gemini)
                                                     — port 8087
```

Supporting infrastructure: **MySQL** (auth data), **MongoDB** (patient/doctor/appointment/notification/AI data), **PostgreSQL** (payments and telemedicine sessions), and **RabbitMQ** (async messaging for appointments, notifications, and telemedicine events).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Zustand, TanStack Query, Radix UI, Leaflet (maps), Recharts, Framer Motion |
| Backend services | Java 17, Spring Boot 2.7.x / 3.2.x, Spring Cloud Gateway, Spring Cloud Netflix Eureka, Spring Data JPA / MongoDB |
| Databases | MySQL 8, MongoDB, PostgreSQL 14 |
| Messaging | RabbitMQ (management plugin) |
| Video/Telemedicine | Agora RTC |
| Payments | Stripe |
| AI | Rules-based engine, optional Google Gemini integration |
| Containerization | Docker, Docker Compose |
| Orchestration | Kubernetes (manifests in `k8s/`) |
| CI/CD | GitHub Actions |

## Services

| Service | Port | Database | Responsibility |
|---|---|---|---|
| `eureka-server` | 8761 | — | Service registry / discovery |
| `gateway` | 8085 | — | Single entry point, routes requests to downstream services |
| `auth-service` | 8090 | MySQL | User registration, login, JWT issuance |
| `patient-service` | 8092 | MongoDB | Patient profiles and medical records |
| `doctor-service` | 8082 | MongoDB | Doctor profiles, specializations, availability |
| `appointment-service` | 8083 | MongoDB + RabbitMQ | Appointment booking/scheduling, calls doctor/patient/notification services |
| `notification-service` | 8088 | MongoDB + RabbitMQ + SMTP | Email/queue-driven notifications |
| `payment-service` | 8089 | PostgreSQL | Stripe-based payment processing |
| `telemedicine-service` | 8084 | PostgreSQL + RabbitMQ | Agora-powered video consultation sessions |
| `ai-service` | 8087 | MongoDB | AI symptom checker (rules engine or Gemini) |
| `client` | 3000 | — | Next.js frontend for patients, doctors, and admins |

> ℹ️ See [`docs/docker_analysis.md`](docs/docker_analysis.md) for a documented review of current Docker/port configuration issues.

## Project Structure

```
healthcare-microservices/
├── client/              # Next.js frontend (patient, doctor, admin portals)
├── services/
│   ├── auth-service/
│   ├── patient-service/
│   ├── doctor-service/
│   ├── appointment-service/
│   ├── notification-service/
│   ├── payment-service/
│   ├── telemedicine-service/
│   ├── ai-service/
│   └── eureka-server/
├── gateway/             # Spring Cloud API Gateway
├── databases/           # MySQL/Mongo init scripts
├── docker/              # Shared Docker assets
├── k8s/                 # Kubernetes manifests (per-service deployments/services, ingress)
├── scripts/             # build.sh, deploy.sh, cleanup.sh, config helpers
├── docs/                # Architecture notes and analysis
├── report/              # Project report
├── docker-compose.yml   # Full local stack definition
└── .github/workflows/   # CI/CD pipeline
```

## Getting Started

### Prerequisites

- Java 17 (Temurin recommended) and Maven
- Node.js 20+ and npm
- Docker & Docker Compose
- (Optional) `kubectl` and a Kubernetes cluster for `k8s/` manifests

### Quick Start (Docker Compose)

1. **Clone the repository**
   ```bash
   git clone https://github.com/kavishkasandaruwan2002/healthcare-microservices.git
   cd healthcare-microservices
   ```

2. **Configure environment variables**

   Create a `.env` file in the project root (see [Environment Variables](#environment-variables)). At minimum, supply your own MongoDB URI, mail credentials, Stripe keys, and JWT/service secrets — **do not reuse the placeholder credentials committed in `docker-compose.yml`.**

3. **Build the Java services**
   ```bash
   ./mvnw clean package -DskipTests
   # or use the helper script
   ./scripts/build.sh
   ```

4. **Start the full stack**
   ```bash
   docker-compose up --build
   ```

5. **Access the platform**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - API Gateway: [http://localhost:8085](http://localhost:8085)
   - Eureka dashboard: [http://localhost:8761](http://localhost:8761)
   - RabbitMQ management UI: [http://localhost:15672](http://localhost:15672) (default guest/guest)

6. **Tear down**
   ```bash
   docker-compose down
   # or
   ./scripts/cleanup.sh
   ```

### Running Services Locally (without Docker)

1. Start infrastructure only:
   ```bash
   docker-compose up mysql mongo postgres rabbitmq
   ```
2. Run `eureka-server` first, then start each Spring Boot service from its module:
   ```bash
   cd services/eureka-server && ../../mvnw spring-boot:run
   ```
3. Start the gateway, then any backend services you need.
4. Run the frontend:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Environment Variables

Key variables consumed by `docker-compose.yml` (set these in a root-level `.env` file):

| Variable | Used by | Purpose |
|---|---|---|
| `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` | `mysql`, `auth-service` | Auth database credentials |
| `SPRING_DATA_MONGODB_URI` / `AI_MONGODB_URI` | `patient`, `doctor`, `appointment`, `notification`, `ai` services | MongoDB connection string |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | `payment-service` | Stripe payment integration |
| `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_NAME` | `notification-service` | SMTP email sending |
| `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE` | `telemedicine-service` | Video call token generation |
| `JWT_SECRET`, `SERVICE_SECRET` | `payment-service`, `telemedicine-service` | Token signing / inter-service auth |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `APP_AI_PROVIDER` | `ai-service` | Optional LLM-backed symptom checking |
| `EUREKA_PORT`, `GATEWAY_PORT`, `FRONTEND_PORT` | infra | Port overrides |

> ⚠️ **Security note:** the current `docker-compose.yml` has sample database and mail credentials hardcoded as defaults. Before deploying anywhere beyond local development, move all secrets into a `.env` file (already `.gitignore`d) or a secrets manager, and rotate any credentials that were previously committed.

## Kubernetes Deployment

Manifests for every service (Deployment + Service) plus `namespace.yaml` and `ingress.yaml` live in [`k8s/`](k8s/):

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
kubectl get pods -n healthcare
```

`scripts/deploy.sh` wraps this for convenience.

## CI/CD

[`.github/workflows/main.yml`](.github/workflows/main.yml) defines a GitHub Actions pipeline that:

1. Builds all Java services with Maven (JDK 17).
2. Builds and pushes Docker images to Docker Hub.
3. Deploys manifests to Kubernetes via `kubectl apply -f k8s/`.

Required repository secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `KUBECONFIG`.

## Known Issues

The project already tracks a documented set of Docker/config issues in [`docs/docker_analysis.md`](docs/docker_analysis.md), including:

- Mismatched frontend/backend environment variable names (`NEXT_PUBLIC_API_URL` vs `NEXT_PUBLIC_API_BASE_URL`).
- Backend `Dockerfile`s all `EXPOSE 8080` regardless of each service's actual configured port.
- `eureka` unnecessarily depends on MySQL/MongoDB at startup.
- `auth-service` connects as MySQL `root` instead of the dedicated `healthcare_user`.
- Dockerfiles assume a pre-built `target/*.jar` rather than performing a multi-stage build.

Contributions addressing these are welcome — see [Roadmap](#roadmap).

## Roadmap

- [ ] Fix Docker port/env mismatches documented in `docs/docker_analysis.md`
- [ ] Move all embedded credentials out of `docker-compose.yml` into `.env`/secrets management
- [ ] Add automated tests to the CI pipeline (currently built with `-DskipTests`)
- [ ] Multi-stage Dockerfiles for backend services
- [ ] API documentation (OpenAPI/Swagger) aggregated at the gateway

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push and open a Pull Request against `main`

---

*This README was generated from an inspection of the repository's source (Docker Compose, Maven POMs, service configuration files, and the Next.js client) and may need updates as the codebase evolves.*

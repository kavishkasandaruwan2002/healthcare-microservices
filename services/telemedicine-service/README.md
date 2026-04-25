# Telemedicine Service

This microservice handles telemedicine video consultation sessions for the MediSync platform.

## Features
- Eureka client for service discovery
- OpenFeign client to call appointment-service
- RabbitMQ consumer for appointment confirmed events
- RabbitMQ publisher for session started/ended events
- PostgreSQL persistence with Spring Data JPA
- JWT authentication and service-secret authorization
- Agora RTC token generation for video sessions
- SpringDoc OpenAPI documentation
- Actuator and Prometheus metrics

## Configuration
Environment variables are loaded from `.env`.

Required settings:
- `SERVER_PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USERNAME`
- `DB_PASSWORD`
- `EUREKA_URL`
- `RABBITMQ_HOST`
- `RABBITMQ_PORT`
- `RABBITMQ_USERNAME`
- `RABBITMQ_PASSWORD`
- `AGORA_APP_ID`
- `AGORA_APP_CERTIFICATE`
- `JWT_SECRET`
- `SERVICE_SECRET`

## Build

```bash
cd services/telemedicine-service
./mvnw clean package -DskipTests
```

## Run

```bash
cd services/telemedicine-service
./mvnw spring-boot:run
```

## Docker

```bash
cd services/telemedicine-service
docker compose up --build
```

## API

- `GET /api/v1/sessions/{sessionId}`
- `GET /api/v1/sessions/appointment/{appointmentId}`
- `GET /api/v1/sessions/my-sessions`
- `GET /api/v1/sessions/{sessionId}/token`
- `GET /api/v1/sessions/{sessionId}/token/refresh`
- `PUT /api/v1/sessions/{sessionId}/end`
- `PUT /api/v1/sessions/{sessionId}/cancel`
- `GET /api/v1/sessions`
- `GET /api/v1/sessions/{sessionId}/participants`
- `GET /api/v1/sessions/stats`

## Documentation
- Swagger UI: `/swagger-ui.html`
- OpenAPI docs: `/v3/api-docs`
- Prometheus metrics: `/actuator/prometheus`
- Health: `/actuator/health`

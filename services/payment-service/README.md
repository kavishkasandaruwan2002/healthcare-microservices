# MediSync Payment Microservice

Production-ready Payment Microservice for a healthcare platform.

## Technology Stack
- **Framework:** Spring Boot 3.2.4
- **Java:** 17
- **Database:** PostgreSQL (port 5435)
- **Payment Gateway:** Stripe (API v24.3.0)
- **Messaging:** RabbitMQ
- **Discovery:** Eureka
- **Security:** JWT + Spring Security

## Key Features
- **Stripe Checkout Integration:** Uses Payment Intents API for secure, PCI-compliant payments.
- **Async Events:** Listens for `appointment.confirmed` to initialize payments; publishes `payment.completed`/`payment.failed`.
- **Admin Dashboard Support:** Refund management, detailed transaction logs, and revenue metrics.
- **Monitoring:** Spring Boot Actuator + Prometheus metrics.

## API Endpoints
- `POST /api/v1/payments/initiate` - Create Stripe PaymentIntent
- `POST /api/v1/payments/webhook` - Stripe Webhook handler
- `GET /api/v1/payments/{id}` - Get payment details
- `POST /api/v1/payments/{id}/refund` - Issue refund (ADMIN)
- `GET /api/v1/payments/stats` - Platform revenue stats (ADMIN)

## Setup
1. Configure Stripe keys in `.env`
2. Run with Docker: `docker-compose up -d`
3. Access Swagger UI: `http://localhost:8085/swagger-ui.html`

# Payment Service - MediSync Healthcare Platform

Production-ready Payment Microservice for handling consultation fee payments using Stripe (sandbox mode).

## Technology Stack

- **Framework**: Spring Boot 3.2.4
- **Java**: 17
- **Database**: PostgreSQL (port 5435)
- **Payment Gateway**: Stripe Java SDK 24.3.0 (Sandbox mode)
- **Message Queue**: RabbitMQ
- **Service Discovery**: Eureka
- **Security**: JWT (JJWT 0.11.5) + Spring Security

## Prerequisites

1. Docker and Docker Compose
2. Java 17
3. Maven 3.8+
4. Stripe test account (for API keys)
5. Running Eureka Server and RabbitMQ on `medisync-network`

## Stripe Sandbox Setup

1. Get test API keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Install Stripe CLI for webhook testing:
   ```bash
   stripe login
   stripe listen --forward-to localhost:8085/api/v1/payments/webhook
   ```
3. Copy the webhook secret from Stripe CLI output

## Configuration

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required environment variables:
- `STRIPE_SECRET_KEY` - Stripe secret key (starts with `sk_test_`)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (starts with `pk_test_`)
- `STRIPE_WEBHOOK_SECRET` - Webhook secret from Stripe CLI (starts with `whsec_`)
- `JWT_SECRET` - Shared JWT secret (min 32 characters)
- `SERVICE_SECRET` - Internal service-to-service auth secret

## Running the Service

### Using Docker Compose

```bash
docker-compose up --build
```

### Local Development

```bash
mvn spring-boot:run
```

## API Endpoints

Base URL: `http://localhost:8085/api/v1/payments`

### Payment Flow

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/initiate` | PATIENT | Create Stripe PaymentIntent |
| POST | `/webhook` | None | Stripe webhook handler |
| GET | `/{paymentId}` | Owner/Admin | Get payment details |
| GET | `/appointment/{appointmentId}` | Owner/Admin | Get payment by appointment |
| GET | `/my-payments` | PATIENT | Get patient's payments |

### Refund

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/{paymentId}/refund` | ADMIN | Issue full/partial refund |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ADMIN | List all payments |
| GET | `/stats` | ADMIN | Payment statistics |

## Test Cards (Stripe Sandbox)

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Decline |
| 4000 0025 0000 3155 | Requires authentication |

Use any future expiry date and any 3-digit CVV.

## RabbitMQ Configuration

### Consumes From
- **Exchange**: `appointment.exchange`
- **Queue**: `payment.appointment.confirmed`
- **Routing Key**: `appointment.confirmed`

### Publishes To
- **Exchange**: `payment.exchange`
- **Routing Keys**: `payment.completed`, `payment.failed`

## Health Checks

- **Health**: `GET http://localhost:8085/actuator/health`
- **Metrics**: `GET http://localhost:8085/actuator/prometheus`
- **Swagger UI**: `http://localhost:8085/swagger-ui.html`

## Database Schema

### payments table
- paymentId (UUID, PK)
- appointmentId (UUID)
- patientId (UUID)
- doctorId (UUID)
- stripePaymentIntentId (String, unique)
- stripeClientSecret (String)
- amount (BigDecimal)
- currency (String)
- status (PaymentStatus)
- description (String)
- failureReason (String)
- createdAt (LocalDateTime)
- updatedAt (LocalDateTime)

### payment_refunds table
- refundId (UUID, PK)
- payment_id (UUID, FK)
- stripeRefundId (String, unique)
- amount (BigDecimal)
- reason (String)
- status (RefundStatus)
- createdAt (LocalDateTime)

## Payment Statuses

- `PENDING` - Payment record created, awaiting Stripe confirmation
- `SUCCESS` - Payment completed successfully
- `FAILED` - Payment failed (card declined, etc.)
- `REFUNDED` - Payment refunded

## Refund Statuses

- `PENDING` - Refund initiated
- `SUCCEEDED` - Refund completed
- `FAILED` - Refund failed

## Testing

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=PaymentServiceTest

# Skip tests and compile
mvn -DskipTests compile
```

## Importing Postman Collection

1. Open Postman
2. Click Import
3. Select `payment-api.postman_collection.json`
4. Set collection variables:
   - `base_url`: `http://localhost:8085`
   - `token`: Patient JWT token
   - `admin_token`: Admin JWT token
   - `service_secret`: Internal service secret

## Troubleshooting

### Webhook signature verification fails
- Ensure you're using the latest webhook secret from Stripe CLI
- Check that the raw request body is being read (not parsed by Spring)

### Service not registering with Eureka
- Verify Eureka server is running at the configured URL
- Check network connectivity to `medisync-network`

### Database connection errors
- Ensure `payment-postgres` container is healthy
- Verify credentials in `.env` file

## License

Proprietary - MediSync Healthcare Platform

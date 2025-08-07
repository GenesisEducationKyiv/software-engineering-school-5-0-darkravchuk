# Subscription Service

A standalone microservice for managing weather subscription functionality using Clean Architecture principles and Domain-Driven Design.

## 🏗 Architecture

This service follows **Clean Architecture** with **Domain-Driven Design** principles:

```
src/
├── domain/               # Enterprise Business Rules
│   ├── entities/        # Domain entities (Subscription)
│   ├── value-objects/   # Value objects (Email, City, etc.)
│   ├── repositories/    # Repository interfaces
│   └── services/        # Domain service interfaces
├── application/         # Application Business Rules
│   ├── use-cases/       # Use case implementations
│   ├── dto/            # Data transfer objects
│   └── errors/         # Application-specific errors
├── infrastructure/     # Frameworks & Drivers
│   ├── database/       # Database connection & models
│   ├── repositories/   # Repository implementations
│   └── external/       # External service clients
└── presentation/       # Interface Adapters
    ├── controllers/    # HTTP controllers
    ├── middleware/     # Express middleware
    └── routes/         # Route definitions
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (if running locally)

### Development Setup

1. **Install dependencies:**
   ```bash
   cd microservices/subscription-service
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose:**
   ```bash
   # From project root
   docker-compose -f docker-compose.microservices.yml up subscription-service
   ```

4. **Or run locally:**
   ```bash
   npm run dev
   ```

### API Endpoints

- **Health Check:** `GET /health`
- **Create Subscription:** `POST /api/v1/subscriptions`
- **Confirm Subscription:** `POST /api/v1/subscriptions/confirm`
- **Unsubscribe:** `DELETE /api/v1/subscriptions`

## 🧠 Design Decisions

### Why Clean Architecture?

1. **Independence of Frameworks:** The business logic doesn't depend on Express.js or Sequelize
2. **Testable:** Each layer can be unit tested in isolation
3. **Independent of Database:** Can switch from PostgreSQL to MongoDB without changing business logic
4. **Independent of External Services:** Weather and Email services are abstracted behind interfaces

### Key Patterns Used

- **Repository Pattern:** Abstracts data access
- **Dependency Injection:** Uses Inversify for IoC container
- **Value Objects:** Encapsulate validation and business rules
- **Domain Events:** Enable event-driven communication
- **Use Case Pattern:** Clear application boundaries

### Microservice Benefits

- **Independent Deployment:** Deploy without affecting other services
- **Technology Diversity:** Can use different tech stack per service
- **Fault Isolation:** Failures don't cascade to other services
- **Team Autonomy:** Teams can work independently on different services

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Service port | `3001` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_USER` | Database user | `postgres` |
| `DB_NAME` | Database name | `subscription_service_db` |
| `WEATHER_SERVICE_URL` | Weather service endpoint | `http://localhost:3002` |
| `EMAIL_SERVICE_URL` | Email service endpoint | `http://localhost:3003` |

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## 📦 Production Deployment

### Docker Build

```bash
docker build -t subscription-service .
```

### Health Checks

The service exposes a health check endpoint at `/health` for container orchestration.

## 🤔 Trade-offs & Considerations

### Advantages
- **Maintainable:** Clear separation of concerns
- **Testable:** Mockable dependencies
- **Scalable:** Independent scaling
- **Flexible:** Easy to swap implementations

### Considerations
- **Complexity:** More complex than simple CRUD
- **Learning Curve:** Requires understanding of DDD/Clean Architecture
- **Overhead:** Additional abstractions add some runtime cost

## 🔄 Migration from Monolith

This service demonstrates how to:
1. Extract domain logic from existing monolith
2. Create proper service boundaries
3. Handle inter-service communication
4. Maintain data consistency across services

The original Observer pattern has been replaced with event-driven communication suitable for distributed systems.

## 🚧 Future Enhancements

- [ ] Add distributed caching (Redis)
- [ ] Implement circuit breaker pattern
- [ ] Add comprehensive monitoring/observability
- [ ] Implement event sourcing
- [ ] Add API versioning strategy
- [ ] Implement distributed tracing

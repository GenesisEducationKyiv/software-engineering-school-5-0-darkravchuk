# Subscription Service - Observability Features

## Overview
Subscription Service з розширеними можливостями observability, включаючи структуроване логування, метрики, семплінг логів та business-oriented логування.

## Observability Features

### 1. Structured Logging
- **Logger**: Winston з JSON форматом
- **Log Levels**: error, warn, info, debug
- **Correlation ID**: Автоматичне додавання correlation ID до всіх запитів та business операцій
- **File Rotation**: Автоматична ротація лог-файлів (5MB, 5 файлів)
- **Business Operations**: Спеціалізоване логування для business операцій
- **Domain Events**: Логування domain events з контекстом

### 2. Log Sampling
- **Sampling Rate**: Конфігурується через `LOG_SAMPLING_RATE` (0.0 - 1.0)
- **Smart Sampling**: Errors та warnings завжди логуються, семплінг застосовується до info та debug
- **Performance**: Зменшує навантаження на логування при високому трафіку

### 3. Advanced Metrics Collection

#### Subscription-Specific Metrics
- **Total Subscriptions**: Загальна кількість створених підписок
- **Active Subscriptions**: Кількість підтверджених підписок
- **Pending Confirmations**: Кількість очікуючих підтвердження
- **Unsubscribes**: Кількість відписок
- **Confirmation Rate**: Процент підтверджених підписок
- **Subscriptions by City**: Розподіл підписок по містах
- **Subscriptions by Frequency**: Розподіл підписок по частоті

#### Request Metrics
- **Request Count**: Загальна кількість запитів
- **Response Time**: Середній час відповіді
- **Error Rate**: Процент помилок
- **Endpoint Metrics**: Метрики по кожному endpoint
- **Status Codes**: Розподіл HTTP статус кодів

#### External Service Metrics
- **Email Service**: Кількість викликів та помилок
- **Weather Service**: Кількість викликів та помилок
- **Event Publisher**: Кількість викликів та помилок

### 4. Endpoints

#### Health Check
```
GET /health
```
Повертає стан сервісу та базову інформацію.

#### Metrics
```
GET /metrics
```
Повертає детальні метрики роботи системи.

#### API Info
```
GET /api/v1
```
Повертає інформацію про API та observability features.

## Configuration

### Environment Variables
```bash
# Logging
LOG_SAMPLING_RATE=1.0          # 1.0 = log everything, 0.5 = log 50%
ENABLE_DEBUG=false             # Enable debug logs
NODE_ENV=development           # development/production

# Database
DATABASE_URL=postgresql://...

# External Services
EMAIL_SERVICE_URL=...
WEATHER_SERVICE_URL=...
```

## Log Format Examples

### Business Operations
```json
{
  "timestamp": "2024-01-01 12:00:00.000",
  "level": "info",
  "service": "subscription-service",
  "message": "CreateSubscription completed successfully",
  "correlationId": "uuid-v4",
  "operation": "CreateSubscription",
  "success": true,
  "duration": "150ms",
  "subscriptionId": "uuid-v4",
  "email": "tes***@***",
  "city": "Kyiv",
  "frequency": "daily"
}
```

### Domain Events
```json
{
  "timestamp": "2024-01-01 12:00:00.000",
  "level": "info",
  "service": "subscription-service",
  "message": "Domain event: SubscriptionCreatedEvent",
  "correlationId": "uuid-v4",
  "eventType": "SubscriptionCreatedEvent",
  "entityId": "uuid-v4",
  "email": "tes***@***",
  "city": "Kyiv",
  "frequency": "daily"
}
```

### External Service Calls
```json
{
  "timestamp": "2024-01-01 12:00:00.000",
  "level": "debug",
  "service": "subscription-service",
  "message": "External call to weather.validateCity succeeded",
  "correlationId": "uuid-v4",
  "externalService": "weather",
  "operation": "validateCity",
  "success": true,
  "responseTime": "45ms",
  "city": "Kyiv",
  "isValid": true
}
```

### HTTP Requests
```json
{
  "timestamp": "2024-01-01 12:00:00.000",
  "level": "info",
  "service": "subscription-service",
  "message": "HTTP 201 - POST /api/v1/subscriptions",
  "correlationId": "uuid-v4",
  "method": "POST",
  "url": "/api/v1/subscriptions",
  "statusCode": 201,
  "responseTime": "150ms",
  "userAgent": "Mozilla/5.0...",
  "ip": "127.0.0.1"
}
```

## Metrics Example

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "subscriptions": {
    "total": 1500,
    "active": 1200,
    "pending": 150,
    "unsubscribes": 150,
    "confirmationRate": 80.0,
    "byCity": {
      "Kyiv": 500,
      "Lviv": 300,
      "Odesa": 200
    },
    "byFrequency": {
      "daily": 800,
      "weekly": 400,
      "monthly": 300
    }
  },
  "requests": {
    "total": 5000,
    "errors": 50,
    "errorRate": 1.0,
    "averageResponseTime": 125.5,
    "endpoints": {
      "POST /api/v1/subscriptions": {
        "count": 1500,
        "errors": 30,
        "errorRate": 2.0,
        "avgResponseTime": 150.2
      },
      "POST /api/v1/subscriptions/confirm/:token": {
        "count": 1200,
        "errors": 10,
        "errorRate": 0.83,
        "avgResponseTime": 80.5
      }
    }
  },
  "externalServices": {
    "email": {
      "calls": 1500,
      "errors": 15,
      "errorRate": 1.0
    },
    "weather": {
      "calls": 1500,
      "errors": 5,
      "errorRate": 0.33
    },
    "eventPublisher": {
      "calls": 2700,
      "errors": 0,
      "errorRate": 0.0
    }
  },
  "statusCodes": {
    "200": 3200,
    "201": 1500,
    "400": 200,
    "404": 80,
    "500": 20
  },
  "memory": {
    "used": 125,
    "total": 256
  }
}
```

## Features

### Correlation ID Tracking
- Автоматично генерується для кожного запиту
- Передається через всі business операції
- Логується у всіх domain events
- Допомагає в трасуванні запитів від початку до кінця

### Business Operation Logging
- Структуроване логування для кожної business операції
- Вимірювання часу виконання
- Контекстна інформація про операцію
- Результати операції з деталями

### External Service Monitoring
- Детальне логування викликів зовнішніх сервісів
- Вимірювання часу відповіді
- Tracking success/failure rates
- Metrics collection для monitoring

### Privacy-Aware Logging
- Email addresses маскуються у логах
- Sensitive information не логується
- GDPR-compliant logging practices

## Integration with Use Cases

### CreateSubscriptionUseCase
- Логування кожного кроку створення підписки
- Validation logging
- External service call tracking
- Business metrics recording

### ConfirmSubscriptionUseCase
- Confirmation process tracking
- Token validation logging
- State change logging

### UnsubscribeUseCase
- Unsubscribe process tracking
- Event publishing monitoring
- Cleanup operation logging

## Best Practices

1. **Log Sampling**: Використовуйте LOG_SAMPLING_RATE < 1.0 в production для high-traffic систем
2. **Correlation ID**: Завжди передавайте correlation ID через business layers
3. **Business Metrics**: Регулярно аналізуйте business metrics для insights
4. **Error Monitoring**: Налаштуйте alerting на high error rates
5. **Privacy**: Завжди маскуйте sensitive information у логах

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t subscription-service .
docker run -p 3001:3001 subscription-service
```

## Monitoring and Alerting

### Key Metrics to Monitor
- **Confirmation Rate**: < 50% потребує уваги
- **External Service Error Rate**: > 10% потребує investigation
- **Response Time**: > 500ms може вказувати на проблеми
- **Memory Usage**: > 80% потребує уваги

### Recommended Alerts
- High error rate (> 5%)
- Low confirmation rate (< 50% при > 10 subscriptions)
- High external service errors (> 10%)
- High memory usage (> 200MB)
- High response times (> 1000ms)

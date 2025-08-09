# API Gateway - Observability Features

## Overview
API Gateway з розширеними можливостями observability, включаючи структуроване логування, метрики та семплінг логів.

## Observability Features

### 1. Structured Logging
- **Logger**: Winston з JSON форматом
- **Log Levels**: error, warn, info, debug
- **Correlation ID**: Автоматичне додавання correlation ID до всіх запитів
- **File Rotation**: Автоматична ротація лог-файлів (5MB, 5 файлів)

### 2. Log Sampling
- **Sampling Rate**: Конфігурується через `LOG_SAMPLING_RATE` (0.0 - 1.0)
- **Smart Sampling**: Errors та warnings завжди логуються, семплінг застосовується до info та debug
- **Performance**: Зменшує навантаження на логування при високому трафіку

### 3. Metrics Collection
- **Request Metrics**: Кількість запитів, час відповіді, коди статусу
- **Service Health**: Моніторинг здоров'я мікросервісів
- **Error Tracking**: Підрахунок помилок по сервісах
- **Memory Usage**: Моніторинг використання пам'яті

### 4. Endpoints

#### Health Check
```
GET /health
```
Повертає стан API Gateway та конфігурацію сервісів.

#### Metrics
```
GET /metrics
```
Повертає детальні метрики роботи системи.

## Configuration

### Environment Variables
```bash
# Logging
LOG_SAMPLING_RATE=1.0          # 1.0 = log everything, 0.5 = log 50%
ENABLE_DEBUG=false             # Enable debug logs
NODE_ENV=development           # development/production

# Request timeout
REQUEST_TIMEOUT=10000          # Request timeout in ms

# Services
SUBSCRIPTION_SERVICE_URL=http://subscription-service:3001
WEATHER_SERVICE_URL=http://weather-service:3002
SCHEDULING_SERVICE_URL=http://scheduling-service:3003
NOTIFICATION_SERVICE_URL=http://notification-service:3004
```

## Log Format

### Structure
```json
{
  "timestamp": "2024-01-01 12:00:00.000",
  "level": "info",
  "service": "api-gateway",
  "message": "HTTP 200 - GET /health",
  "correlationId": "uuid-v4",
  "method": "GET",
  "url": "/health",
  "statusCode": 200,
  "responseTime": "15ms",
  "sampled": false
}
```

### Log Files
- `logs/combined.log` - Всі логи
- `logs/error.log` - Тільки помилки
- Console output - Форматований вивід для розробки

## Metrics Example

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "requests": {
    "total": 1500,
    "errors": 45,
    "errorRate": 3.0,
    "averageResponseTime": 125.5
  },
  "services": {
    "healthy": 4,
    "total": 4,
    "healthPercentage": 100,
    "status": {
      "subscription-service": true,
      "weather-service": true,
      "scheduling-service": true,
      "notification-service": true
    }
  },
  "statusCodes": {
    "200": 1200,
    "404": 30,
    "500": 15
  },
  "serviceErrors": {
    "weather-service": 10,
    "subscription-service": 5
  },
  "memory": {
    "used": 85,
    "total": 128
  }
}
```

## Features

### Correlation ID
- Автоматично генерується для кожного запиту
- Передається до downstream сервісів
- Повертається в response headers
- Допомагає в трасуванні запитів

### Proxy Logging
- Детальне логування всіх proxy операцій
- Трекінг запитів та відповідей
- Моніторинг здоров'я сервісів
- Error handling з proper logging

### Performance Monitoring
- Response time tracking
- Memory usage monitoring
- Service health checking
- Error rate calculation

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
docker build -t api-gateway .
docker run -p 3000:3000 api-gateway
```

## Best Practices

1. **Log Sampling**: Використовуйте LOG_SAMPLING_RATE < 1.0 в production для high-traffic систем
2. **Correlation ID**: Завжди передавайте correlation ID між сервісами
3. **Metrics Monitoring**: Регулярно перевіряйте `/metrics` endpoint
4. **Health Checks**: Використовуйте `/health` для health checks
5. **Error Handling**: Всі помилки логуються з повним stack trace

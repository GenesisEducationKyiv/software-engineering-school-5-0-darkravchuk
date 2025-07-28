# Testing Instructions

This guide explains how to run all tests (unit, integration, and E2E) for the project with a single command or individually.

## Prerequisites
- **Node.js**: Version 20. Install dependencies with `npm ci`.
- **Docker**: Required for integration and E2E tests.
- **Environment**: Create `.env.test` in the project root with:
  ```
  DB_USER=postgres
  DB_PASSWORD=secret
  DB_HOST=db
  DB_PORT=5432
  DB_NAME=weather_db
  ```
- **Build**: Run `npm run build` to compile TypeScript.

## Run All Tests
To execute unit, integration, and E2E tests sequentially:

```bash
npm run test
```

This runs:
- Unit tests (`npm run test:unit`)
- Integration tests with Docker (`npm run test:integration`)
- E2E tests with Docker (`npm run test:e2e`)

**Cleanup**:
```bash
docker compose -f docker-compose.test.yml down --volumes
docker compose -f docker-compose.e2e.yml down --volumes
```

## Run Tests by Type

### Unit Tests
Run Jest unit tests (no Docker required):

```bash
npm run test:unit
```

Tests are located in `/tests/unit/*.test.ts`.

### Integration Tests
Run Jest integration tests with PostgreSQL (port `5434:5432`):

```bash
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

**Cleanup**:
```bash
docker compose -f docker-compose.test.yml down --volumes
```

Tests are located in `/tests/integration/*.test.ts`. Migrations are applied via `npm run test:migrate`.

### E2E Tests
Run Playwright E2E tests (port `3001`):

```bash
npm run test:e2e
```

**Cleanup**:
```bash
docker compose -f docker-compose.e2e.yml down --volumes
```

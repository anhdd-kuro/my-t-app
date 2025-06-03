# Docker Setup

This project includes Docker configurations for both development and production environments.

## Development Environment

The development environment includes PostgreSQL and is configured for hot-reloading.

### Prerequisites

- Docker and Docker Compose
- Node.js 22+ (for local development without Docker)
- pnpm

### Getting Started

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Start the development environment:

   ```bash
   docker-compose -f docker-compose.postgres.yml up --build
   ```

3. Access the applications:
   - Web App: <http://localhost:3001>
   - Server API: <http://localhost:3000>
   - PostgreSQL: localhost:5432

4. Run database migrations:

   ```bash
   docker-compose -f docker-compose.postgres.yml exec server pnpm db:migrate
   ```

## Production Environment

```bash
docker-compose build --no-cache server
docker-compose up -d
```

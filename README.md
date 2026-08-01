# Glyde Curtains E-Commerce Platform

A full-stack e-commerce platform for Glyde Curtains, featuring a Spring Boot backend and React frontend with comprehensive admin functionality, customer shopping experience, and employee management.

## Tech Stack

### Backend
- Java 21
- Spring Boot 3.4.x
- Spring Security with JWT authentication
- Spring Data JPA with H2 embedded database
- Maven build system

### Frontend
- React 18 with TypeScript
- Vite build tool
- Redux Toolkit for state management
- Material UI (MUI) component library
- Tailwind CSS for utility styling
- Framer Motion for animations

### Infrastructure
- Docker with multi-stage builds
- GitHub Actions CI/CD
- H2 embedded database (file-based in production)

## Prerequisites

- Java 21 (JDK)
- Node.js 20+ and npm
- Docker & Docker Compose (for containerized deployment)
- Maven 3.9+ (or use included Maven wrapper)

## Local Development Setup

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

The backend starts on `http://localhost:8080`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:5173`.

## Docker Deployment

### Build and run with Docker Compose

```bash
docker-compose up --build
```

### Build individual images

```bash
# Backend
docker build -t glydecurtains-backend:latest ./backend

# Frontend
docker build -t glydecurtains-frontend:latest ./frontend
```

## Default Credentials

| Role        | Email                        | Password |
|-------------|------------------------------|----------|
| Super Admin | admin@glydecurtains.com      | admin123 |

> **Warning**: Change default credentials immediately in production environments.

## Environment Configuration

| Variable              | Description                     | Default              |
|-----------------------|---------------------------------|----------------------|
| `SERVER_PORT`         | Backend server port             | 8080                 |
| `JWT_SECRET`          | JWT signing secret              | (configured in app)  |
| `JWT_EXPIRATION`      | Access token TTL (ms)           | 900000 (15 min)      |
| `SPRING_PROFILES`     | Active Spring profile           | dev                  |
| `CORS_ORIGINS`        | Allowed CORS origins            | http://localhost:5173 |
| `H2_DB_PATH`          | H2 database file path           | ./data/glydecurtains |

### Environment Files

- `.env.example` — Template for local environment variables
- Application profiles: `dev`, `staging`, `production`

## Branching Strategy

This project follows **Git Flow**:

| Branch          | Purpose                                      | Deploys To    |
|-----------------|----------------------------------------------|---------------|
| `main`          | Production-ready code                        | Production    |
| `develop`       | Integration branch for features              | Integration   |
| `feature/*`     | New features (branch from `develop`)         | —             |
| `release/*`     | Release preparation and QA                   | QA            |
| `hotfix/*`      | Critical production fixes (branch from `main`) | Production  |

### Workflow

1. Create feature branches from `develop`: `feature/add-wishlist`
2. Open PR to `develop` when feature is complete
3. CI runs tests automatically on all PRs
4. Merge to `develop` triggers integration deployment
5. Create `release/*` branch for QA validation
6. Merge `release/*` to `main` for production (requires manual approval)

## Project Structure

```
glydecurtains/
├── backend/               # Spring Boot application
│   ├── src/main/java/     # Java source code
│   ├── src/main/resources/# Configuration files
│   ├── src/test/          # Tests
│   ├── Dockerfile         # Backend container
│   └── pom.xml            # Maven configuration
├── frontend/              # React application
│   ├── src/               # TypeScript source code
│   ├── public/            # Static assets
│   ├── Dockerfile         # Frontend container
│   └── package.json       # Node dependencies
├── .github/workflows/     # CI/CD pipelines
├── docker-compose.yml     # Multi-container orchestration
├── VERSION                # Semantic version
├── CHANGELOG.md           # Release history
└── README.md              # This file
```

## License

Proprietary — Glyde Curtains. All rights reserved.

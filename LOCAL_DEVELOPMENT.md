# Local Development Guide

This repo uses two separate apps in one repository:
- `backend/` — Spring Boot API
- `frontend/` — React + Vite storefront/admin client

## Prerequisites

- Java 21
- Maven or Maven wrapper
- Node.js 20+
- npm

## Start backend

From the repo root:

```bash
cd backend
./mvnw spring-boot:run
```

The backend listens on:
- `http://localhost:8080`

## Start frontend

From the repo root:

```bash
cd frontend
npm install
npm run dev
```

The frontend listens on:
- `http://localhost:5173`

## Admin route

Open:
- `http://localhost:5173/admin`

This redirects to:
- `http://localhost:5173/admin/dashboard`

## Docker local stack

```bash
docker-compose up --build
```

This starts:
- backend container on `http://localhost:8080`
- frontend container on `http://localhost:80`

## Important runtime note

Authentication is intentionally disabled in the current backend configuration. The security setup currently allows all requests (`permitAll()`) for local development. This is not a production-ready security configuration.

## Validate frontend build

```bash
cd frontend
npm run build
```

## Validate backend build/tests

```bash
cd backend
./mvnw test
```

# Glyde Curtains

This repository contains a full-stack e-commerce application for Glyde Curtains with a separate Spring Boot backend and a separate React + Vite frontend. It is a monorepo, not a single app package.

## Current implementation

### Backend
- Java 21
- Spring Boot 3.4.x
- Spring Web, JPA, H2, security config, JWT support classes
- Maven build
- Embedded H2 database for local development

### Frontend
- React 18
- TypeScript
- Vite
- Redux Toolkit
- Material UI
- i18n support for English, Hindi, and Gujarati

### Deployment/runtime
- Dockerfiles are present for both backend and frontend containers
- `docker-compose.yml` runs backend and frontend together for local development
- `render.yaml` is included for Render deployment configuration

## Important status

Authentication is intentionally disabled in the current backend security configuration:
- `backend/src/main/java/com/glydecurtains/security/SecurityConfig.java`
- `authorizeHttpRequests(auth -> auth.anyRequest().permitAll())`

This means all routes are currently open in development and should not be treated as production security.

## Local setup

### 1) Backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend runs on:
- `http://localhost:8080`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:
- `http://localhost:5173`

### 3) Admin route

The admin entry route is:
- `http://localhost:5173/admin`
- This redirects to `http://localhost:5173/admin/dashboard`

## Docker

Build and run the stack:

```bash
docker-compose up --build
```

Dockerfiles in this repo:
- `backend/Dockerfile`
- `frontend/Dockerfile`

## Project structure

```text
glydecurtains/
├── backend/                    # Spring Boot API
│   ├── src/main/java/          # Java source code
│   ├── src/main/resources/     # App config, profiles, static files
│   ├── src/test/               # Backend tests
│   ├── Dockerfile              # Backend container image
│   ├── mvnw                   # Maven wrapper
│   └── pom.xml                # Maven config
├── frontend/                   # React frontend
│   ├── src/                   # React app source
│   ├── public/                # Static assets
│   ├── Dockerfile             # Frontend container image
│   ├── vite.config.ts        # Vite config with proxy setup
│   ├── package.json          # Frontend dependencies/scripts
│   └── tsconfig*.json        # TypeScript config
├── .github/                   # Repo automation and Copilot instructions
├── docker-compose.yml         # Local multi-container setup
├── docker-compose.prod.yml    # Production overrides
├── render.yaml                # Render deployment config
├── CHANGELOG.md               # Release notes
├── LOCAL_DEVELOPMENT.md       # Local dev instructions
├── README.md                  # Project overview
├── VERSION                    # Version number
├── .env.example               # Example environment variables
├── .gitignore                 # Git exclusions
└── Makefile                   # Common task commands
```

## Notes

- Product media and static backend assets are resolved from the frontend through the Vite proxy config and media helper utilities.
- The project includes admin/customer storefront flows, CMS-like pages, and order/user management views.
- The repository is intentionally kept aligned with the actual code in the current branch; stale Kiro specification files were removed.

## License

Proprietary — Glyde Curtains. All rights reserved.

# Copilot instructions for Glyde Curtains

## Project layout
- This is a monorepo with two active apps:
  - `backend/` — Spring Boot 3.4.x app with Java 21 and Maven
  - `frontend/` — React 18 + TypeScript + Vite app
- Treat them as separate projects even though they live in the same repository.
- Do not recreate or document stale Kiro spec artifacts in this repo.

## Current code reality
- The backend security configuration currently allows all requests (`permitAll()`) for development.
- JWT auth is present in the codebase but not enforced in the active security config.
- The frontend uses Vite and serves product/media assets through local proxy rules.
- The admin entry route is `/admin`, which redirects to `/admin/dashboard`.

## Documentation rules
- Keep README and local development docs aligned with the current code.
- Do not keep old design-spec or task files from earlier planning phases unless they are still actively used.
- If a feature or setup step is not present in the repo, it should not be described as current or required.

## Deployment rules
- Keep Dockerfiles in the actual app folders (`backend/Dockerfile`, `frontend/Dockerfile`) when modifying deployment config.
- Use `docker-compose.yml` for local orchestration and `render.yaml` for Render-related deployment configuration.
- Do not add speculative deployment files that are not used by the project.

## Coding expectations
- Prefer small, direct fixes in the relevant app folder.
- When changing frontend media, route, or theme behavior, verify the frontend still builds.
- When changing backend Java code or security configuration, validate with the backend Maven test/build flow.

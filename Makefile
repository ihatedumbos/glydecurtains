.PHONY: build run test docker-build docker-up docker-down clean

# === Local Development ===

build: ## Build backend and frontend locally
	cd backend && mvn package -DskipTests -B
	cd frontend && npm ci && npm run build

run: ## Run backend locally with INT profile
	cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=int

test: ## Run all tests
	cd backend && mvn test
	cd frontend && npm run lint

clean: ## Clean build artifacts
	cd backend && mvn clean
	rm -rf frontend/dist frontend/node_modules

# === Docker ===

docker-build: ## Build Docker images
	docker compose build

docker-up: ## Start services in development mode
	docker compose up -d

docker-down: ## Stop and remove containers
	docker compose down

docker-prod: ## Start services with production overrides
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

docker-logs: ## Tail logs from all services
	docker compose logs -f

# === Utilities ===

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

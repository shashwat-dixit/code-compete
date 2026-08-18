.PHONY: api web workers compose compose-down test

api:
	go run ./apps/api

workers:
	go build -o /tmp/worker-runner ./apps/worker-runner
	go build -o /tmp/worker-resolver ./apps/worker-resolver
	go build -o /tmp/worker-elo ./apps/worker-elo

web:
	cd apps/web && bun run dev

compose:
	docker compose -f infra/docker/docker-compose.yml up -d

compose-down:
	docker compose -f infra/docker/docker-compose.yml down

test:
	go test ./...

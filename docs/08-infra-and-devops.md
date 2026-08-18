# 08 — Infra and devops

Locked: Docker Compose locally (Postgres + Redis only for now), SQL migrations, CI, env-based config, **AWS (one region)** for first deploy. Not VPS, not multi-region, not Kafka/Redpanda.

## Local development

```bash
docker compose -f infra/docker/docker-compose.yml up -d
make api    # Go healthz on :8080
make web    # Vite on :5173
```

| Service | Image / build | Port |
| --- | --- | --- |
| postgres | postgres 16 | 5432 |
| redis | redis 7 | 6379 |
| api | `go run ./apps/api` on the host | 8080 |
| workers | host processes later | n/a |
| web | `apps/web` Vite | 5173 |

No Redpanda. Streams live in Redis.

### Runner + Docker

Early on: compose for postgres + redis; **[gobox](https://github.com/shashwat-dixit/gobox) on the host** so it can use the host Docker engine. AWS: dedicated worker with Docker, still not privileged Judge0. See [13](./13-judge-runner.md).

## Config

- 12-factor env vars
- Commit `.env.example` with dummy values
- Never commit secrets
- Same variable names across api and workers (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `OAUTH_*`)

## Migrations

- SQL files in `infra/db/migrations` (or `apps/api/migrations`)
- Tool: `golang-migrate` or `atlas` — pick one and use it in CI
- No “migrate on API boot” in production without a lock; OK for local

Do not revive Prisma unless we abandon Go.

## CI (GitHub Actions)

Minimum on every PR:

1. `web`: install, lint, `tsc`, build
2. `go`: fmt/vet/test
3. Optional: compose smoke test later

Deploy workflow from 2024 (Node 14 → S3 → CloudFront) is obsolete. Do not revive it.

## Production (AWS, one region)

Decide EC2 vs ECS in the first deploy PR. Until then:

- ALB or CloudFront in front of the web static assets + API
- RDS Postgres + ElastiCache Redis (or a single EC2 running compose for the first spike)
- Worker on a host that can run Docker sandboxes
- Pre-pull language images
- Daily Postgres dump

Multi-region (issue #5) stays out of scope.

## Observability

- JSON logs with `request_id`, `match_id`, `submission_id`
- Prometheus later: WS gauge, queue depth, judge latency histogram

## What “containerize everything” (issue #3) means here

- Sandbox images: yes, mandatory, in [gobox](https://github.com/shashwat-dixit/gobox)
- API/web: yes, for deploy
- Local everything-in-compose including DinD: nice, not a blocker for first playable match

## Terraform / CDK

Parked until a first AWS deploy actually exists. Do not revive the 2024 CDK Fargate-per-language sketch as-is.

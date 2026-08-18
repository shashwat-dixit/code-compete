# 08 — Infra and devops

README target: Docker Compose locally, single-node Redpanda, Postgres migrations, CI, env-based config, **VPS** deploy. Older issues/CDK assumed **AWS multi-region**. Those conflict. Pick one deploy story (see open questions).

## Local development (goal)

One command from repo root:

```bash
docker compose -f infra/docker/docker-compose.yml up
```

Services for the recommended MVP stack:

| Service | Image / build | Port |
| --- | --- | --- |
| postgres | postgres 16 | 5432 |
| redis | redis 7 | 6379 |
| api | `apps/api` | 8080 |
| worker-runner | `apps/worker-runner` + Docker-in-Docker or sibling docker.sock **carefully** | n/a |
| worker-resolver | same binary family | n/a |
| worker-elo | same | n/a |
| web | `apps/web` vite or nginx preview | 5173 / 80 |

If we keep Kafka: add Redpanda. If we use Redis Streams, skip it.

### Runner + Docker nesting

This is the awkward local problem. Options:

1. **DinD** in the runner container — isolated, slower, more setup
2. **Bind-mount docker.sock** — convenient, dangerous if a bug escapes the worker (the worker is trusted code, the submission is not; still easy to misconfigure)
3. **Run runner on the host** during dev, compose only for postgres/redis

**Recommendation:** compose for postgres + redis (+ redpanda if chosen). Run API and workers on the host in early development. Add a locked-down DinD path before first deploy.

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

Deploy workflow from 2024 (Node 14 → S3 → CloudFront) is obsolete. Delete/replace when we add CI; do not revive it.

## Production (choose one)

| Option | Pros | Cons |
| --- | --- | --- |
| **Single VPS** (README) | Cheap, simple, matches “ship it” | Ops is you; backups and TLS to set up |
| Fly.io / Railway / Render | Fast, less SSH | Cost; docker-in-docker may be painful |
| AWS ECS/Fargate (old CDK) | Familiar from history | Slowest to iterate; issue #5 “all regions” is not MVP |

**Recommendation:** one VPS or one Fly.io app for API+workers, managed Postgres/Redis if budget allows, Cloudflare in front of the web static build. Multi-region is out of scope.

### Rough VPS layout

- Caddy or Traefik for TLS
- `web` static on the same host or object storage
- `api` + workers as systemd or compose
- Daily Postgres dump
- Docker images for sandboxes pre-pulled

## Observability

- JSON logs with `request_id`, `match_id`, `submission_id`
- Prometheus later: WS gauge, queue depth, judge latency histogram
- PostHog optional for landing metrics (issue #4)

## What “containerize everything” (issue #3) means here

- Sandbox images: yes, mandatory
- API/web: yes, for deploy
- Local everything-in-compose including DinD: nice, not a blocker for first playable match

## Terraform / CDK

Parked. Add when production exists and is annoying to recreate by hand. The empty `infra/terraform` in the README is a placeholder, not a task.

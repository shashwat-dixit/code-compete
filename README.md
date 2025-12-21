# Code Compete

A real-time competitive coding platform inspired by TypeRacer, designed for algorithmic problem solving.
Players compete head-to-head in live coding battles with ELO-based matchmaking, real-time leaderboards, and isolated code execution.

---

## Core Features

- [ ] Real-time coding battles
- [ ] Live leaderboard updates
- [ ] ELO-based matchmaking
- [ ] Battle Royale mode (last valid submission gets eliminated)
- [ ] Secure & isolated code execution
- [ ] Match replays
- [ ] VS Code extension

---

## Architecture Overview

**High-level components**

- **Frontend**: React (Vite)
- **API Gateway**: Go (REST + WebSocket)
- **Workers**: Go (event-driven via Kafka)
- **Event Bus**: Kafka / Redpanda
- **State Store**: Redis
- **Persistent Store**: PostgreSQL
- **Infra**: Docker, Docker Compose

**Core principles**

- Event-driven execution
- Real-time state via Redis
- Async isolation of code execution
- Deterministic match state machine

---

## 📁 Monorepo Structure

```
code-compete/
├── apps/
│   ├── api/                 # Go API Gateway
│   ├── worker-runner/       # Code execution worker
│   ├── worker-resolver/     # Match resolution logic
│   ├── worker-elo/          # ELO / ranking updates
│   └── web/                 # Frontend (React + Vite)
│
├── packages/
│   ├── contracts/           # Shared Kafka / WS / API schemas
│   ├── config/              # Shared config loader
│   ├── utils/               # Shared utilities
│   └── observability/       # Logging & metrics
│
├── infra/
│   ├── docker/              # Docker Compose & service configs
│   ├── db/                  # SQL schema & migrations
│   └── terraform/           # (Optional) infra as code
│
├── scripts/                 # Dev & automation scripts
└── README.md
```

---

## System Flow

- [ ] Player joins match
- [ ] Match state stored in Redis
- [ ] Code submission → Kafka event
- [ ] Execution worker runs code in sandbox
- [ ] Execution result → Kafka
- [ ] Match resolver updates state
- [ ] Leaderboard updated in Redis
- [ ] WebSocket pushes updates to clients

---

## Backend (Go)

### API Gateway

- [ ] JWT authentication
- [ ] Match creation & join
- [ ] WebSocket battle updates
- [ ] Rate limiting (Redis)
- [ ] Input validation

### Workers

- [ ] Code execution worker
- [ ] Match resolution worker
- [ ] ELO update worker
- [ ] Retry & failure handling

---

## Code Execution & Security

- [ ] Docker / gVisor sandbox
- [ ] CPU & memory limits
- [ ] Execution timeout
- [ ] No network access
- [ ] Read-only filesystem
- [ ] Language-agnostic runner interface

---

## Match Logic

- [ ] Deterministic match state machine

  - [ ] WAITING
  - [ ] COUNTDOWN
  - [ ] RUNNING
  - [ ] FINISHED
- [ ] Battle Royale elimination logic
- [ ] Tie-breaking rules
- [ ] Submission cooldowns

---

## Ranking & Matchmaking

- [ ] ELO rating system
- [ ] Skill-based matchmaking
- [ ] Global leaderboard
- [ ] Match-scoped leaderboard
- [ ] Rating history tracking

---

## Real-Time Layer (Redis)

- [ ] Match state storage
- [ ] Leaderboard sorted sets
- [ ] Pub/Sub for WebSocket fanout
- [ ] TTL-based cleanup
- [ ] Token-bucket rate limiting

---

## Frontend (React)

- [ ] Match lobby
- [ ] Live coding editor
- [ ] Real-time leaderboard
- [ ] Match results screen
- [ ] Replays viewer
- [ ] Authentication flow
- [ ] WebSocket integration

---

## VS Code Extension

- [ ] Auth with platform
- [ ] Join live match
- [ ] Submit code directly
- [ ] Real-time feedback
- [ ] Match results inside editor

---

## Observability

- [ ] Structured logging
- [ ] Metrics (Prometheus)
- [ ] Execution latency tracking
- [ ] Match lifecycle metrics
- [ ] Error & retry visibility

---

## Infrastructure & DevOps

- [ ] Docker Compose local setup
- [ ] Single-node Redpanda
- [ ] PostgreSQL migrations
- [ ] CI pipeline
- [ ] Environment-based configs
- [ ] Cloud deployment (VPS)

---

## Future Enhancements

- [ ] Multi-language support
- [ ] Spectator mode
- [ ] Tournament brackets
- [ ] Anti-cheating heuristics
- [ ] Firecracker microVMs
- [ ] Horizontal scaling

---

## Local Development

```bash
docker compose up
```

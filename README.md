# Disaster Resource Coordination 

A web service that lets shelters, coordinators, field officers, and donors
report and track disaster-relief resources (food, water, medicine, beds) in
real time — engineered specifically to survive the bad networks and traffic
spikes that a real disaster creates, rather than assuming ideal conditions.

## Status

Early setup phase — repository structure, docs, and planning in progress.

## Repository structure

```
disaster-resource-coordination/
├── README.md          ← you are here
├── docs/               ← design docs: brief, API contracts, architecture notes
├── server/             ← Node.js + Express backend (added as work progresses)
└── client/             ← React frontend (added as work progresses)
```

## Docs

- [`docs/brief.md`](docs/brief.md) — one-page project brief: what it does, who
  uses it, its nouns (resources) and verbs (actions).

## Stack (planned)

- Frontend: React.js
- Backend: Node.js, Express.js
- Databases: PostgreSQL (shelters, inventory, resource-transfer requests —
  transactional data) and MongoDB (field reports, alerts — high-volume,
  variable-shape data)
- Auth: JWT, role-based (admin, coordinator/manager, field officer, volunteer,
  donor, public)
- Payments: Razorpay (donations)
- Maps: Google Maps (shelter locations, radius search)
- Docs: hand-written OpenAPI + Swagger UI, GraphQL alongside REST
- Resilience: idempotency keys, circuit breaker + timeouts on the external
  disaster-declaration/weather SOAP feed, rate limiting, correlation-ID
  structured logging

## Local development

Setup instructions will be added here once the `server/` and `client/`
scaffolds are committed.
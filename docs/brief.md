# Disaster Resource Coordination  — Project Brief

## What the system does

During disasters — floods, earthquakes, cyclones — relief operations are run
by a patchwork of actors (government agencies, NGOs, shelters, volunteers)
who typically track resources on disconnected tools: spreadsheets, phone
calls, WhatsApp, paper logs. This causes duplicate or misdirected aid,
delayed response to shortages, and lost/unreliable field reports on bad
networks.

This platform gives every shelter a simple way to report resource status and
requests, gives coordinators a live aggregated view across all shelters, and
is engineered specifically to survive the unreliable network conditions and
traffic spikes a disaster itself creates — idempotent submissions so retries
on flaky connections don't double-count, a circuit breaker around the
external government disaster-feed integration, rate limiting during report
spikes, and correlation-ID tracing so a stuck request can be traced in
seconds, not hours.

## Who uses it

- **Disaster Administrator** — registers/authenticates users, assesses the
  disaster situation, identifies resource needs, manages the resource
  catalog, allocates resources, monitors and tracks status, generates
  reports and analytics.
- **Manager / Coordinator** — maintains resource inventory (add/update/
  remove/view resources), assigns resources to locations, approves transfers.
- **Field Officer** — receives assigned resources, updates resource status
  from the field (often on a weak connection).
- **Volunteer** — receives assignments, helps move/distribute resources at a
  location.
- **Donor / Supplier** — donates funds or supplies, views what's needed.
- **Government Agency** — supplies the external disaster-declaration/
  weather-alert feed the platform consumes; may also receive reports.
- **Affected People / Public** — requests assistance, receives alerts and
  notifications, shares situational information, views public status
  (e.g., "is this shelter accepting people").

## Nouns — the things/services in the system

- **User** — an account with a role (admin, coordinator, field officer,
  volunteer, donor, public viewer).
- **Shelter** — a physical relief site: location, capacity, current
  inventory.
- **Resource** — a trackable supply item (food, water, medicine, beds,
  blankets) with a quantity and status, tied to a shelter.
- **ResourceRequest** — a shelter's or coordinator's request to allocate or
  transfer resources to a location.
- **FieldReport** — an unstructured situation update from a field worker
  (free text, timestamp, photo metadata) — lives in the NoSQL store.
- **Alert / Notification** — a broadcast about a shortage, disaster
  declaration, or status change.
- **Donation** — a monetary or supply contribution from a donor, tied to a
  payment transaction.
- **DisasterDeclaration** — an external record pulled from the government
  SOAP/WSDL feed, auto-flagging active disaster zones.

## Verbs — the actions/contracts in the system

- **Register / Login / Authenticate** — create an account, get a JWT,
  authorize by role.
- **Assess disaster & identify resource needs** — admin evaluates the
  situation and records what's needed where.
- **Manage resource inventory** — `POST/PATCH/DELETE /resources`,
  `GET /shelters/:id/inventory` — add, update, remove, and view resources;
  cacheable via ETag/Cache-Control since dashboards poll frequently.
- **Allocate / assign resources to location** — `POST /resource-requests` —
  idempotent submission so a retried request on a bad connection doesn't
  double-allocate the same 20 beds twice.
- **Monitor & track resource status** — `PATCH /shelters/:id/status`,
  `GET /shelters?near=lat,lng&radius=10km` — coordinators watch aggregated
  status; the GraphQL endpoint fetches shelters + inventory + last 3 reports
  in one round trip.
- **Submit field report** — `POST /reports` — free-text situation update from
  a field worker, stored in MongoDB, idempotent and retry-safe with backoff.
- **Generate reports & analytics** — `GET /reports?cursor=...` — paginated
  read of historical field reports and resource trends.
- **Request assistance** — affected people/shelters flag an unmet need.
- **Send alerts & notifications** — coordinators broadcast shortages or
  status changes to relevant roles.
- **Share information** — any actor posts a situational update visible to
  coordinators.
- **Manage donations & supplies** — `POST /donations` — donor contributes;
  triggers a Razorpay payment flow, updates the SQL donations ledger.
- **Consume external disaster feed** — a scheduled/on-demand SOAP call to the
  government WSDL service, wrapped in a timeout + circuit breaker so a slow
  or down government service degrades gracefully instead of hanging every
  request that depends on it.

## Why this fits a Web Services course project

The domain naturally demands everything the course checklist asks for: an
idempotent POST (field reports and resource allocation must survive retries
on bad networks without double-counting), a real external SOAP/WSDL
integration wrapped in a circuit breaker and timeout (the government
disaster-declaration feed), role-based JWT auth across six distinct actor
types, a SQL store where integrity matters (you can't allocate the same beds
twice) alongside a NoSQL store for high-volume free-text field reports, REST
+ GraphQL side by side (GraphQL specifically for the coordinator dashboard's
multi-resource query), and rate limiting to survive the report-submission
spikes a real crisis produces.
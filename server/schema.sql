-- Disaster Resource Coordination Platform
-- PostgreSQL Database Schema
-- Six logically separated services

BEGIN;

CREATE SCHEMA IF NOT EXISTS shelter;
CREATE SCHEMA IF NOT EXISTS reports;
CREATE SCHEMA IF NOT EXISTS transfers;
CREATE SCHEMA IF NOT EXISTS alerts;
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS api;

-- =====================================================
-- S1: SHELTER & INVENTORY SERVICE
-- =====================================================

CREATE TABLE shelter.shelters (
    shelter_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    capacity_total INTEGER NOT NULL CHECK (capacity_total >= 0),
    capacity_available INTEGER NOT NULL CHECK (
        capacity_available >= 0
        AND capacity_available <= capacity_total
    ),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'FULL', 'CLOSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shelter.inventory_items (
    item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    shelter_id BIGINT NOT NULL
        REFERENCES shelter.shelters(shelter_id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0
        CHECK (quantity_on_hand >= 0),
    reorder_threshold INTEGER NOT NULL DEFAULT 0
        CHECK (reorder_threshold >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (shelter_id, item_name, unit)
);

CREATE TABLE shelter.inventory_transactions (
    transaction_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    item_id BIGINT NOT NULL
        REFERENCES shelter.inventory_items(item_id) ON DELETE RESTRICT,
    transaction_type VARCHAR(20) NOT NULL
        CHECK (transaction_type IN (
            'RECEIPT', 'ISSUE', 'ADJUSTMENT',
            'RESERVATION', 'RELEASE'
        )),
    quantity_delta INTEGER NOT NULL CHECK (quantity_delta <> 0),
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shelter.resource_reservations (
    reservation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    item_id BIGINT NOT NULL
        REFERENCES shelter.inventory_items(item_id) ON DELETE RESTRICT,
    -- Cross-service reference to S3; intentionally no FK.
    request_id BIGINT NOT NULL,
    quantity_reserved INTEGER NOT NULL CHECK (quantity_reserved > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'RESERVED'
        CHECK (status IN (
            'RESERVED', 'RELEASED', 'CONSUMED', 'CANCELLED'
        )),
    reserved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMPTZ,
    UNIQUE (request_id, item_id)
);

CREATE INDEX idx_shelters_status
    ON shelter.shelters(status);

CREATE INDEX idx_inventory_items_shelter
    ON shelter.inventory_items(shelter_id);

CREATE INDEX idx_inventory_transactions_item_date
    ON shelter.inventory_transactions(item_id, created_at DESC);

CREATE INDEX idx_resource_reservations_request
    ON shelter.resource_reservations(request_id);


-- =====================================================
-- S2: FIELD REPORT SERVICE
-- =====================================================

CREATE TABLE reports.field_reports (
    report_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- Cross-service reference to S1; intentionally no FK.
    shelter_id BIGINT NOT NULL,
    -- Cross-service reference to S5; intentionally no FK.
    reported_by BIGINT NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL
        CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    occupancy_count INTEGER CHECK (occupancy_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reports.report_photos (
    photo_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    report_id BIGINT NOT NULL
        REFERENCES reports.field_reports(report_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size_bytes INTEGER CHECK (file_size_bytes >= 0),
    storage_path TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reports.report_idempotency (
    idempotency_key UUID PRIMARY KEY,
    report_id BIGINT UNIQUE
        REFERENCES reports.field_reports(report_id) ON DELETE SET NULL,
    request_hash VARCHAR(64) NOT NULL,
    response_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_field_reports_shelter_date
    ON reports.field_reports(shelter_id, created_at DESC);

CREATE INDEX idx_field_reports_reported_by
    ON reports.field_reports(reported_by);

CREATE INDEX idx_report_photos_report
    ON reports.report_photos(report_id);

CREATE INDEX idx_report_idempotency_expiry
    ON reports.report_idempotency(expires_at);


-- =====================================================
-- S3: RESOURCE REQUEST & TRANSFER SERVICE
-- =====================================================

CREATE TABLE transfers.resource_requests (
    request_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- Cross-service references to S1 and S5; intentionally no FK.
    shelter_id BIGINT NOT NULL,
    requested_by BIGINT NOT NULL,
    item_category VARCHAR(50) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    quantity_requested INTEGER NOT NULL
        CHECK (quantity_requested > 0),
    priority VARCHAR(20) NOT NULL
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN (
            'PENDING', 'APPROVED', 'REJECTED', 'RESERVED',
            'IN_TRANSIT', 'FULFILLED', 'CANCELLED'
        )),
    justification TEXT,
    idempotency_key UUID NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transfers.transfer_decisions (
    decision_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_id BIGINT NOT NULL
        REFERENCES transfers.resource_requests(request_id)
        ON DELETE RESTRICT,
    decision VARCHAR(10) NOT NULL
        CHECK (decision IN ('APPROVE', 'REJECT')),
    -- Cross-service reference to S5; intentionally no FK.
    decided_by BIGINT NOT NULL,
    reason TEXT,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (request_id)
);

CREATE TABLE transfers.resource_transfers (
    transfer_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    decision_id BIGINT NOT NULL UNIQUE
        REFERENCES transfers.transfer_decisions(decision_id)
        ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED'
        CHECK (status IN (
            'PLANNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED'
        )),
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_resource_requests_shelter_status
    ON transfers.resource_requests(shelter_id, status);

CREATE INDEX idx_resource_requests_priority_date
    ON transfers.resource_requests(priority, created_at DESC);

CREATE INDEX idx_transfer_decisions_request
    ON transfers.transfer_decisions(request_id);


-- =====================================================
-- S4: DISASTER ALERT INTEGRATION SERVICE
-- =====================================================

CREATE TABLE alerts.disaster_alerts (
    alert_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    external_alert_id VARCHAR(100) NOT NULL UNIQUE,
    source VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL
        CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    area_description TEXT NOT NULL,
    effective_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    raw_payload JSONB,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alerts.alert_snapshots (
    snapshot_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payload JSONB NOT NULL,
    alert_count INTEGER NOT NULL DEFAULT 0 CHECK (alert_count >= 0),
    is_last_known_good BOOLEAN NOT NULL DEFAULT FALSE,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alerts.integration_state (
    integration_id VARCHAR(50) PRIMARY KEY,
    last_good_snapshot_id BIGINT
        REFERENCES alerts.alert_snapshots(snapshot_id) ON DELETE SET NULL,
    circuit_state VARCHAR(20) NOT NULL DEFAULT 'CLOSED'
        CHECK (circuit_state IN ('CLOSED', 'OPEN', 'HALF_OPEN')),
    failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ
);

CREATE INDEX idx_disaster_alerts_active_severity
    ON alerts.disaster_alerts(is_active, severity);

CREATE INDEX idx_disaster_alerts_expiry
    ON alerts.disaster_alerts(expires_at);

CREATE INDEX idx_alert_snapshots_captured
    ON alerts.alert_snapshots(captured_at DESC);


-- =====================================================
-- S5: IDENTITY & ACCESS SERVICE
-- =====================================================

CREATE TABLE identity.users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE identity.roles (
    role_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE identity.user_roles (
    user_id BIGINT NOT NULL
        REFERENCES identity.users(user_id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL
        REFERENCES identity.roles(role_id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE identity.shelter_assignments (
    assignment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL
        REFERENCES identity.users(user_id) ON DELETE CASCADE,
    -- shelter_id belongs to S1; intentionally no FK.
    shelter_id BIGINT NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (user_id, shelter_id)
);

CREATE TABLE identity.refresh_sessions (
    session_id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL
        REFERENCES identity.users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_shelter_assignments_shelter
    ON identity.shelter_assignments(shelter_id);

CREATE INDEX idx_refresh_sessions_user
    ON identity.refresh_sessions(user_id);

CREATE INDEX idx_refresh_sessions_expiry
    ON identity.refresh_sessions(expires_at);

INSERT INTO identity.roles (role_name, description, permissions)
VALUES
(
    'Shelter Staff',
    'Manages assigned shelter information and resource requests.',
    '{"shelter.read": true, "inventory.update": true, "resource_request.create": true}'::JSONB
),
(
    'Coordinator',
    'Coordinates shelter status and resource approvals.',
    '{"shelter.read": true, "resource_request.review": true, "transfer.manage": true}'::JSONB
),
(
    'Public Viewer',
    'Reads approved non-sensitive public information.',
    '{"shelter.public_read": true, "alerts.read": true}'::JSONB
),
(
    'Admin',
    'Manages platform configuration and authorized operations.',
    '{"admin": true}'::JSONB
)
ON CONFLICT (role_name) DO NOTHING;


-- =====================================================
-- S6: API & COORDINATION QUERY SERVICE
-- =====================================================

CREATE TABLE api.api_config (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE api.query_cache_metadata (
    cache_key VARCHAR(255) PRIMARY KEY,
    query_name VARCHAR(100) NOT NULL,
    source_service VARCHAR(50) NOT NULL,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    hit_count INTEGER NOT NULL DEFAULT 0 CHECK (hit_count >= 0),
    is_stale BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_query_cache_expiry
    ON api.query_cache_metadata(expires_at);

CREATE INDEX idx_query_cache_source
    ON api.query_cache_metadata(source_service);

COMMIT;

-- NOTES:
-- 1. Cross-service references are intentionally not enforced as foreign keys.
-- 2. Internal foreign keys are enforced within the owning service.
-- 3. This is a proposed schema. Verify it against schema.drawio and
--    test it in a development PostgreSQL database before deployment.
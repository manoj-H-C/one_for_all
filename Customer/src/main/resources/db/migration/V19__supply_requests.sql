-- Lets a project member ask for more of a material without needing
-- INVENTORY_MANAGE themselves - a request sits as PENDING until someone who
-- can manage inventory approves/rejects it, then separately fulfills an
-- approved one. Fulfilling creates a normal ALLOCATED row in
-- inventory_movement (see fulfilled_movement_id) rather than duplicating
-- audit fields on this table - the movement itself is the record of who
-- fulfilled it and when, same "ledger is the source of truth" approach as
-- everything else in V18.
create table supply_request (
    id                    uuid primary key default gen_random_uuid(),
    project_id            uuid not null references project(id) on delete cascade,
    material_id           uuid not null references inventory_material(id),
    location_id           uuid not null references inventory_location(id),
    quantity              numeric(12,2) not null,
    status                varchar(20) not null default 'PENDING',
    note                  varchar(500),
    requested_by          uuid not null references app_user(id),
    requested_at          timestamptz not null default now(),
    decision_note         varchar(500),
    decided_by            uuid references app_user(id),
    decided_at            timestamptz,
    fulfilled_movement_id uuid references inventory_movement(id)
);

create index idx_supply_request_project on supply_request (project_id);
create index idx_supply_request_project_status on supply_request (project_id, status);
create index idx_supply_request_requested_by on supply_request (project_id, requested_by);

-- reuses INVENTORY_MANAGE (seeded in V18) for approve/reject/fulfill/cancel -
-- raising a request itself only needs project membership, not this
-- permission, so no new permission row is needed here.

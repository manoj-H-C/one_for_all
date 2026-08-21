-- Org-level bulk buying: an org admin bundles several approved supply
-- requests - even from different projects, even for different materials -
-- into one purchase order placed with a vendor. Deliberately simple for a
-- first cut: no separate Vendor entity (just a name), no line-item quantity
-- overrides (each line is just its supply_request's own quantity), no
-- partial receiving. Receiving one fulfills every request on it in one go,
-- via the same "create an ALLOCATED movement, mark FULFILLED" path
-- SupplyRequestServiceImpl.fulfillRequest already uses for a single request.
create table purchase_order (
    id              uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organization(id) on delete cascade,
    vendor_name     varchar(200) not null,
    note            varchar(500),
    status          varchar(20) not null default 'ORDERED',
    created_by      uuid not null references app_user(id),
    created_at      timestamptz not null default now(),
    closed_by       uuid references app_user(id),
    closed_at       timestamptz
);

create index idx_purchase_order_org on purchase_order (organization_id);
create index idx_purchase_order_org_status on purchase_order (organization_id, status);

-- the supply request this line belongs to, once bundled into a PO - cleared
-- back to null if the PO is cancelled so the request (now APPROVED again)
-- can be picked up by a different order later.
alter table supply_request
    add column purchase_order_id uuid references purchase_order(id);

create index idx_supply_request_purchase_order on supply_request (purchase_order_id);

-- Optional, project-scoped inventory tracking: hierarchical locations
-- (building/floor/room, or whatever depth and labels a given project needs -
-- not a fixed 3-level table, since a wiring company, a construction company,
-- and anyone else this gets used for won't all share the same shape),
-- a material catalog, and an append-only movement ledger. Off by default -
-- see project.inventory_enabled - so it costs existing projects nothing.
alter table project
    add column inventory_enabled          boolean not null default false,
    add column inventory_label_singular   varchar(100) not null default 'Material',
    add column inventory_label_plural     varchar(100) not null default 'Materials';

create table inventory_location (
    id                  uuid primary key default gen_random_uuid(),
    project_id          uuid not null references project(id) on delete cascade,
    parent_location_id  uuid references inventory_location(id),
    name                varchar(150) not null,
    created_at          timestamptz not null default now()
);

create index idx_inventory_location_project on inventory_location (project_id);
create index idx_inventory_location_parent on inventory_location (parent_location_id);

create table inventory_material (
    id                   uuid primary key default gen_random_uuid(),
    project_id           uuid not null references project(id) on delete cascade,
    name                 varchar(150) not null,
    unit                 varchar(50) not null,
    sku                  varchar(100),
    low_stock_threshold  numeric(12,2),
    description          varchar(500),
    created_at           timestamptz not null default now(),
    constraint uk_inventory_material_name unique (project_id, name)
);

create index idx_inventory_material_project on inventory_material (project_id);

-- append-only ledger, not a mutable running total - every allocation, use,
-- and return is its own row so there's a full audit trail of who moved what
-- material where and when. Rows are never updated or deleted; a correction
-- is a new offsetting entry, same as any real inventory/accounting system.
-- work_item_id is optional - lets a movement be tied to the task it was
-- used for, without requiring it (most industries using this won't care).
create table inventory_movement (
    id            uuid primary key default gen_random_uuid(),
    material_id   uuid not null references inventory_material(id),
    location_id   uuid not null references inventory_location(id),
    work_item_id  uuid references work_item(id) on delete set null,
    quantity      numeric(12,2) not null,
    type          varchar(20) not null,
    note          varchar(500),
    recorded_by   uuid not null references app_user(id),
    recorded_at   timestamptz not null default now()
);

create index idx_inventory_movement_material on inventory_movement (material_id);
create index idx_inventory_movement_location on inventory_movement (location_id);

insert into permission (code, description) values
    ('INVENTORY_MANAGE', 'Manage inventory locations, materials, and log allocations/usage');

-- backfill existing projects' Admin roles, same as every other permission
-- added after the initial seed (see V6) - otherwise an existing project's
-- Admin can see the new tab but not use it.
insert into project_role_permission (role_id, permission_code)
select id, 'INVENTORY_MANAGE' from project_role where name = 'Admin'
on conflict do nothing;

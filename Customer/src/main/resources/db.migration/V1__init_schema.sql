-- V1: core schema for the generic, cross-industry work-management engine.
-- Every table here is deliberately industry-agnostic - see custom_field_definition
-- and the custom_fields jsonb column on work_item for how per-industry
-- flexibility is achieved without schema changes.

create extension if not exists "pgcrypto";

create table organization (
    id          uuid primary key default gen_random_uuid(),
    name        varchar(255) not null,
    created_at  timestamptz  not null default now()
);

create table app_user (
    id             uuid primary key default gen_random_uuid(),
    org_id         uuid not null references organization(id) on delete cascade,
    email          varchar(255) not null,
    name           varchar(255) not null,
    password_hash  varchar(255) not null,
    created_at     timestamptz  not null default now(),
    unique (org_id, email)
);

create table project (
    id                          uuid primary key default gen_random_uuid(),
    org_id                      uuid not null references organization(id) on delete cascade,
    name                        varchar(255) not null,
    key                         varchar(50)  not null,
    template_type               varchar(100),
    item_display_name_singular  varchar(100) default 'Work item',
    item_display_name_plural    varchar(100) default 'Work items',
    created_at                  timestamptz  not null default now(),
    unique (org_id, key)
);

create table project_member (
    project_id  uuid not null references project(id) on delete cascade,
    user_id     uuid not null references app_user(id) on delete cascade,
    role        varchar(20) not null check (role in ('ADMIN', 'MEMBER', 'VIEWER')),
    primary key (project_id, user_id)
);

create table workflow_status (
    id          uuid primary key default gen_random_uuid(),
    project_id  uuid not null references project(id) on delete cascade,
    name        varchar(100) not null,
    sort_order  int not null default 0,
    category    varchar(20) not null check (category in ('TODO', 'IN_PROGRESS', 'DONE'))
);

create table custom_field_definition (
    id          uuid primary key default gen_random_uuid(),
    project_id  uuid not null references project(id) on delete cascade,
    name        varchar(100) not null,
    field_type  varchar(30) not null check (
        field_type in ('TEXT','NUMBER','DATE','BOOLEAN','DROPDOWN','USER_REFERENCE','PHOTO','GEOLOCATION')
    ),
    required    boolean not null default false,
    options     jsonb
);

create table work_item (
    id             uuid primary key default gen_random_uuid(),
    project_id     uuid not null references project(id) on delete cascade,
    status_id      uuid not null references workflow_status(id),
    assignee_id    uuid references app_user(id),
    reporter_id    uuid not null references app_user(id),
    title          varchar(500) not null,
    description    text,
    custom_fields  jsonb not null default '{}'::jsonb,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

-- speeds up filtering/searching work items by custom field values,
-- e.g. WHERE custom_fields @> '{"severity": "high"}'
create index idx_work_item_custom_fields on work_item using gin (custom_fields);
create index idx_work_item_project on work_item (project_id);
create index idx_work_item_status on work_item (status_id);
create index idx_work_item_assignee on work_item (assignee_id);

create table comment (
    id            uuid primary key default gen_random_uuid(),
    work_item_id  uuid not null references work_item(id) on delete cascade,
    author_id     uuid not null references app_user(id),
    body          text not null,
    timecode_ms   bigint,
    created_at    timestamptz not null default now()
);

create index idx_comment_work_item on comment (work_item_id);

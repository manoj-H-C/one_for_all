-- V2: password reset / email verification tokens, work item activity log,
-- work item relations, native priority/due_date, and notifications.

create table user_token (
                            id           uuid primary key default gen_random_uuid(),
                            user_id      uuid not null references app_user(id) on delete cascade,
                            token        varchar(255) not null,
                            purpose      varchar(30) not null check (purpose in ('PASSWORD_RESET', 'EMAIL_VERIFICATION')),
                            expires_at   timestamptz not null,
                            used_at      timestamptz,
                            created_at   timestamptz not null default now(),
                            constraint uk_user_token_token unique (token)
);

create index idx_user_token_user on user_token (user_id);

-- one row per field change on a work item - who changed what, from what
-- value to what value, and when. field_name is free-form ("status",
-- "assignee", "customFields.severity") so this covers native columns and
-- custom fields alike without a schema change per field.
create table work_item_activity (
                                    id            uuid primary key default gen_random_uuid(),
                                    work_item_id  uuid not null references work_item(id) on delete cascade,
                                    actor_id      uuid not null references app_user(id),
                                    field_name    varchar(100) not null,
                                    old_value     text,
                                    new_value     text,
                                    created_at    timestamptz not null default now()
);

create index idx_work_item_activity_work_item on work_item_activity (work_item_id);
create index idx_work_item_activity_actor on work_item_activity (actor_id);

-- directed relation (source, link_type, target) between two work items.
-- subtasks, "blocks", and "duplicate of" are all instances of this same
-- generic shape instead of a dedicated parent_id column.
create table work_item_link (
                                id                    uuid primary key default gen_random_uuid(),
                                source_work_item_id   uuid not null references work_item(id) on delete cascade,
                                target_work_item_id   uuid not null references work_item(id) on delete cascade,
                                link_type             varchar(30) not null check (link_type in ('PARENT_OF', 'BLOCKS', 'DUPLICATES', 'RELATES_TO')),
                                created_by            uuid not null references app_user(id),
                                created_at            timestamptz not null default now(),
                                constraint uk_work_item_link unique (source_work_item_id, target_work_item_id, link_type),
                                constraint ck_work_item_link_not_self check (source_work_item_id <> target_work_item_id)
);

create index idx_work_item_link_source on work_item_link (source_work_item_id);
create index idx_work_item_link_target on work_item_link (target_work_item_id);

-- native columns rather than custom fields because every industry template
-- needs them, so leaving them to custom_fields would mean redefining the
-- same field over and over per template.
alter table work_item
    add column priority varchar(20) not null default 'MEDIUM' check (priority in ('LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST')),
    add column due_date date;

-- something a recipient should be alerted about - assigned, mentioned, a
-- status change, a new comment. work_item_id/actor_id are nullable so future
-- notification types that aren't work-item-scoped don't need a new table.
create table notification (
                              id            uuid primary key default gen_random_uuid(),
                              recipient_id  uuid not null references app_user(id) on delete cascade,
                              work_item_id  uuid references work_item(id) on delete cascade,
                              actor_id      uuid references app_user(id),
                              type          varchar(30) not null check (type in ('ASSIGNED', 'MENTIONED', 'STATUS_CHANGED', 'COMMENT_ADDED')),
                              message       varchar(500),
                              read_at       timestamptz,
                              created_at    timestamptz not null default now()
);

create index idx_notification_recipient on notification (recipient_id);
create index idx_notification_work_item on notification (work_item_id);

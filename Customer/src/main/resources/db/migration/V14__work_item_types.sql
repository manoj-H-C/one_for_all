-- Optional per-project categorization of work items (Bug/Task/Story, or
-- whatever a project defines) - same "optional, project-scoped, user-named
-- list" shape as Sprint, just without a date range. type_id is nullable and
-- ON DELETE SET NULL so removing a type doesn't block or cascade-delete the
-- work items that used it, mirroring how sprint_id behaves.
create table work_item_type (
                                id           uuid primary key default gen_random_uuid(),
                                project_id   uuid not null references project(id) on delete cascade,
                                name         varchar(100) not null,
                                created_at   timestamptz not null default now(),
                                constraint uk_work_item_type_name unique (project_id, name)
);

create index idx_work_item_type_project on work_item_type (project_id);

alter table work_item add column type_id uuid references work_item_type(id) on delete set null;
create index idx_work_item_type on work_item (type_id);

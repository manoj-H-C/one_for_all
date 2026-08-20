-- Optional time-boxing for work items - a project doesn't have to define any
-- sprints, and a work item doesn't have to belong to one (sprint_id is
-- nullable, ON DELETE SET NULL so deleting a sprint just unassigns its
-- items back to the backlog rather than being blocked like workflow_status
-- deletion is - a sprint isn't a board column an item needs to render).
-- "Sprint" is deliberately just a name + optional date range, so the same
-- mechanism covers quarterly planning too (e.g. name it "Q1 2026").
create table sprint (
                        id           uuid primary key default gen_random_uuid(),
                        project_id   uuid not null references project(id) on delete cascade,
                        name         varchar(100) not null,
                        start_date   date,
                        end_date     date,
                        created_at   timestamptz not null default now(),
                        constraint uk_sprint_name unique (project_id, name)
);

create index idx_sprint_project on sprint (project_id);

alter table work_item add column sprint_id uuid references sprint(id) on delete set null;
create index idx_work_item_sprint on work_item (sprint_id);

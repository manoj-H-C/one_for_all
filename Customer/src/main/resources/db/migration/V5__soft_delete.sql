-- Soft delete for project and work_item: deleting either no longer destroys
-- the row (and, transitively, everything it owns via on-delete-cascade) - it
-- just sets deleted_at. Application code filters deleted_at is null wherever
-- these tables are read. Children (comment/attachment/work_item_activity/
-- work_item_link) keep no deleted_at of their own; they're only ever reached
-- through a work_item lookup, which already excludes deleted parents.

alter table project add column deleted_at timestamptz;
alter table work_item add column deleted_at timestamptz;

-- partial indexes: every hot-path query filters deleted_at is null, so only
-- that subset needs to be indexed.
create index idx_project_org_active on project (org_id) where deleted_at is null;
create index idx_work_item_project_active on work_item (project_id) where deleted_at is null;

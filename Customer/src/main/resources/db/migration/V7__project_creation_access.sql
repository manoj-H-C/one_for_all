-- Narrow delegation for project creation: org owner stays the only one who
-- can create projects by default (see ProjectServiceImpl.create), but the
-- owner can grant this flag to specific trusted members so they aren't the
-- sole bottleneck once the org is big enough that everything routing through
-- one person doesn't scale. Deliberately not a second isOwner - it only
-- covers project creation, not the owner's full bypass of every permission
-- check everywhere (see ProjectAccessServiceImpl.requirePermission).

alter table app_user add column can_create_projects boolean not null default false;

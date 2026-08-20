-- Project rename/delete used to be hard-gated to the org owner in code
-- (ProjectServiceImpl.requireOrgOwner) because no permission code existed
-- for it. This adds one so it can be granted per-role like everything else.

insert into permission (code, description) values
    ('PROJECT_MANAGE', 'Rename or delete this project');

-- Every project's seeded "Admin" role already gets every permission that
-- exists at creation time (see ProjectServiceImpl.create) - new projects
-- pick this up automatically. Existing projects' Admin roles predate this
-- permission, so backfill it there too, or an existing project's Admin
-- would silently lose the ability to rename/delete it once the org-owner
-- bypass in ProjectServiceImpl is removed.
insert into project_role_permission (role_id, permission_code)
select id, 'PROJECT_MANAGE' from project_role where name = 'Admin'
on conflict do nothing;

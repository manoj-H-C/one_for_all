-- Lets an org actually grow past its owner: an owner-issued invitation that
-- creates a brand-new app_user under the OWNER'S EXISTING org, instead of
-- the self-serve /api/auth/register path (which always mints a fresh org).
-- Only works for emails that don't already have an account anywhere - see
-- AuthServiceImpl.acceptOrganizationInvitation - since app_user.org_id is a
-- single fixed reference, not a many-to-many membership.

alter table app_user add column can_manage_members boolean not null default false;

create table organization_invitation (
                                          id                    uuid primary key default gen_random_uuid(),
                                          org_id                uuid not null references organization(id) on delete cascade,
                                          email                 varchar(255) not null,
                                          invited_by            uuid not null references app_user(id),
                                          can_create_projects   boolean not null default false,
                                          can_manage_members    boolean not null default false,
                                          token                 varchar(255) not null,
                                          status                varchar(20) not null check (status in ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
                                          expires_at            timestamptz not null,
                                          created_at            timestamptz not null default now(),
                                          constraint uk_org_invitation_token unique (token)
);

create index idx_org_invitation_org on organization_invitation (org_id);
create index idx_org_invitation_email on organization_invitation (email);

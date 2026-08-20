-- Supports directly-created org members (see OrganizationServiceImpl.createMember):
-- they get a system-generated temporary password and must set a real one
-- before doing anything else, enforced both client-side and in
-- JwtAuthenticationFilter.
alter table app_user add column must_reset_password boolean not null default false;

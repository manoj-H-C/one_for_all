-- V3: lets the email-verification flow (UserToken, purpose EMAIL_VERIFICATION)
-- actually record the outcome somewhere.
alter table app_user
    add column email_verified boolean not null default false;

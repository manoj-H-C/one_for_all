-- V4: lightweight session-revocation mechanism. Every issued JWT (access and
-- refresh alike) carries the app_user's token_version as a claim; bumping
-- this column instantly invalidates every token issued before the bump,
-- without needing a token table to look up on every request.
alter table app_user
    add column token_version int not null default 0;

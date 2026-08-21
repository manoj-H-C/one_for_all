-- A personal "remind me about this" utility on a work item - always for the
-- person who creates it (no assigning a reminder to a teammate in this
-- first cut, see ReminderServiceImpl). Delivered through the same
-- notification bell everything else uses, via a scheduled job
-- (ReminderSchedulerService) rather than a new email/push channel.
create table reminder (
    id            uuid primary key default gen_random_uuid(),
    work_item_id  uuid not null references work_item(id) on delete cascade,
    recipient_id  uuid not null references app_user(id) on delete cascade,
    remind_at     timestamptz not null,
    note          varchar(500),
    status        varchar(20) not null default 'PENDING' check (status in ('PENDING', 'SENT', 'DISMISSED')),
    created_at    timestamptz not null default now()
);

create index idx_reminder_work_item on reminder (work_item_id);
create index idx_reminder_recipient_status on reminder (recipient_id, status);
-- what the scheduled job scans: every still-pending reminder whose time has
-- arrived, across all users.
create index idx_reminder_due_scan on reminder (status, remind_at);

-- widen notification.type again (see V21, which did the same for the supply
-- request types) for the new scheduled REMINDER notification.
alter table notification drop constraint notification_type_check;
alter table notification add constraint notification_type_check
    check (type in (
        'ASSIGNED', 'MENTIONED', 'STATUS_CHANGED', 'COMMENT_ADDED',
        'SUPPLY_REQUEST_APPROVED', 'SUPPLY_REQUEST_REJECTED', 'SUPPLY_REQUEST_FULFILLED',
        'REMINDER'
    ));

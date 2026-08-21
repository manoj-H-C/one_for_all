-- reminders no longer have to be about a work item - a bare "remind me to
-- follow up with the vendor" with no ticket behind it is now valid too, so
-- work_item_id drops its NOT NULL and a standalone reminder gets its own
-- free-text title instead of borrowing one from a work item that doesn't
-- exist. The check constraint keeps a reminder from having neither.
alter table reminder alter column work_item_id drop not null;
alter table reminder add column title varchar(200);
alter table reminder add constraint reminder_has_target_check
    check (work_item_id is not null or title is not null);

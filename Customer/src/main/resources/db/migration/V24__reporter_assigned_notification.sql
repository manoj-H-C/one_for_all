-- widen notification.type again (see V21, V23) for the new REPORTER_ASSIGNED
-- notification, mirroring ASSIGNED but for the reporter field.
alter table notification drop constraint notification_type_check;
alter table notification add constraint notification_type_check
    check (type in (
        'ASSIGNED', 'MENTIONED', 'STATUS_CHANGED', 'COMMENT_ADDED',
        'SUPPLY_REQUEST_APPROVED', 'SUPPLY_REQUEST_REJECTED', 'SUPPLY_REQUEST_FULFILLED',
        'REMINDER', 'REPORTER_ASSIGNED'
    ));

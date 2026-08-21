-- V2's notification.type check constraint only whitelisted the original 4
-- work-item-scoped types. Supply request approve/reject/fulfill (see
-- SupplyRequestServiceImpl.notifyRequester, PurchaseOrderServiceImpl.
-- notifyRequester) need three more - widen the constraint to match.
alter table notification drop constraint notification_type_check;
alter table notification add constraint notification_type_check
    check (type in (
        'ASSIGNED', 'MENTIONED', 'STATUS_CHANGED', 'COMMENT_ADDED',
        'SUPPLY_REQUEST_APPROVED', 'SUPPLY_REQUEST_REJECTED', 'SUPPLY_REQUEST_FULFILLED'
    ));

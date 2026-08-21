package com.postman.alt.enums;

public enum SupplyRequestStatus {
    PENDING,
    APPROVED,
    // bundled into an org-level PurchaseOrder, awaiting receipt - see
    // PurchaseOrderServiceImpl. Reverts to APPROVED if that order is
    // cancelled, moves to FULFILLED (same as a directly-fulfilled request)
    // once it's received.
    ORDERED,
    REJECTED,
    FULFILLED,
    CANCELLED
}

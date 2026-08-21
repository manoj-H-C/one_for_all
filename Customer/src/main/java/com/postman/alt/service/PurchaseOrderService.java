package com.postman.alt.service;

import com.postman.alt.service.dto.PurchaseOrderCreateRequest;
import com.postman.alt.service.dto.PurchaseOrderResponse;
import com.postman.alt.service.dto.SupplyRequestResponse;

import java.util.List;
import java.util.UUID;

/**
 * Org-level bulk buying: bundles approved SupplyRequests from any of the
 * org's projects into one order placed with a vendor. Every method requires
 * the org owner or canCreateProjects (see PurchaseOrderServiceImpl.
 * requireAdmin) - deliberately not canManageMembers, since this isn't a
 * member-administration feature - and the org must have purchase orders
 * turned on (Organization.purchaseOrdersEnabled), which a disabled org
 * blocks for everyone regardless of permission.
 */
public interface PurchaseOrderService {

    // the candidate pool for "New purchase order" - every APPROVED request,
    // across every project in the requester's org, not already sitting on
    // some other order.
    List<SupplyRequestResponse> listOrderableRequests(UUID requesterId);

    // statusFilter is an optional raw PurchaseOrderStatus name.
    List<PurchaseOrderResponse> listOrders(UUID requesterId, String statusFilter);

    // moves every request in request.requestIds() from APPROVED to ORDERED.
    PurchaseOrderResponse createOrder(UUID requesterId, PurchaseOrderCreateRequest request);

    // fulfills every request on the order (ALLOCATED movement at each
    // request's own project/location, same as SupplyRequestService.
    // fulfillRequest) and marks the order RECEIVED. Only valid from ORDERED.
    PurchaseOrderResponse receiveOrder(UUID requesterId, UUID orderId);

    // reverts every request on the order back to APPROVED so it can be
    // picked up by a future order, and marks this one CANCELLED. Only valid
    // from ORDERED.
    PurchaseOrderResponse cancelOrder(UUID requesterId, UUID orderId);
}

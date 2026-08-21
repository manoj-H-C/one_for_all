package com.postman.alt.service;

import com.postman.alt.service.dto.SupplyRequestCreateRequest;
import com.postman.alt.service.dto.SupplyRequestDecisionRequest;
import com.postman.alt.service.dto.SupplyRequestResponse;

import java.util.List;
import java.util.UUID;

/**
 * Lets any project member ask for more of a material without needing
 * INVENTORY_MANAGE themselves; approving, rejecting, fulfilling, or
 * cancelling someone else's request still requires it. Every method 404s if
 * the project hasn't enabled inventory tracking, same as InventoryService.
 */
public interface SupplyRequestService {

    // statusFilter is an optional raw status name; mineOnly forces the
    // result down to the requester's own requests even for a manager -
    // members without INVENTORY_MANAGE are always restricted to their own
    // regardless of what they pass here.
    List<SupplyRequestResponse> listRequests(UUID projectId, UUID requesterId, String statusFilter, boolean mineOnly);

    SupplyRequestResponse createRequest(UUID projectId, UUID requesterId, SupplyRequestCreateRequest request);

    // all four below require the request to currently be in the state that
    // action makes sense from (PENDING for approve/reject, APPROVED for
    // fulfill, PENDING or APPROVED for cancel) - see SupplyRequestServiceImpl.
    SupplyRequestResponse approveRequest(UUID projectId, UUID requestId, UUID requesterId, SupplyRequestDecisionRequest request);

    SupplyRequestResponse rejectRequest(UUID projectId, UUID requestId, UUID requesterId, SupplyRequestDecisionRequest request);

    // creates an ALLOCATED movement at the request's location for its
    // quantity, and links it back onto the request - see SupplyRequest.fulfill.
    SupplyRequestResponse fulfillRequest(UUID projectId, UUID requestId, UUID requesterId, SupplyRequestDecisionRequest request);

    // the original requester can cancel their own pending/approved request
    // without INVENTORY_MANAGE; cancelling anyone else's still requires it.
    SupplyRequestResponse cancelRequest(UUID projectId, UUID requestId, UUID requesterId, SupplyRequestDecisionRequest request);
}

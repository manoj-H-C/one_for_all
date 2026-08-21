package com.postman.alt.repository;

import com.postman.alt.entity.SupplyRequest;
import com.postman.alt.enums.SupplyRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SupplyRequestRepository extends JpaRepository<SupplyRequest, UUID> {
    List<SupplyRequest> findByProject_IdOrderByRequestedAtDesc(UUID projectId);

    List<SupplyRequest> findByProject_IdAndStatusOrderByRequestedAtDesc(UUID projectId, SupplyRequestStatus status);

    List<SupplyRequest> findByProject_IdAndRequestedBy_IdOrderByRequestedAtDesc(UUID projectId, UUID requestedById);

    List<SupplyRequest> findByProject_IdAndRequestedBy_IdAndStatusOrderByRequestedAtDesc(
            UUID projectId, UUID requestedById, SupplyRequestStatus status
    );

    // org-wide (not project-scoped like everything above) - the candidate
    // pool PurchaseOrderServiceImpl.listOrderableRequests offers an org
    // admin to bundle into a new order: approved, not already sitting on
    // some other order.
    List<SupplyRequest> findByProject_Organization_IdAndStatusAndPurchaseOrderIsNullOrderByRequestedAtDesc(
            UUID organizationId, SupplyRequestStatus status
    );

    // a purchase order's line items.
    List<SupplyRequest> findByPurchaseOrder_Id(UUID purchaseOrderId);
}

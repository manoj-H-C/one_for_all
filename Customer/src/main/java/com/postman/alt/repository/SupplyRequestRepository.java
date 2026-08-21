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
}

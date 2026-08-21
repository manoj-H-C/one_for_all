package com.postman.alt.repository;

import com.postman.alt.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {
    List<PurchaseOrder> findByOrganization_IdOrderByCreatedAtDesc(UUID organizationId);
}

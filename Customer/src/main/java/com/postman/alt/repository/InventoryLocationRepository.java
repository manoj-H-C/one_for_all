package com.postman.alt.repository;

import com.postman.alt.entity.InventoryLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InventoryLocationRepository extends JpaRepository<InventoryLocation, UUID> {
    List<InventoryLocation> findByProjectIdOrderByNameAsc(UUID projectId);

    // guards against deleting a location that still has children - see
    // InventoryServiceImpl.deleteLocation.
    boolean existsByParent_Id(UUID parentId);
}

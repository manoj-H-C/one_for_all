package com.postman.alt.repository;

import com.postman.alt.entity.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {
    List<InventoryMovement> findByMaterial_Project_IdOrderByRecordedAtDesc(UUID projectId);

    List<InventoryMovement> findByMaterial_Project_IdAndLocation_IdOrderByRecordedAtDesc(UUID projectId, UUID locationId);

    List<InventoryMovement> findByMaterial_Project_IdAndMaterial_IdOrderByRecordedAtDesc(UUID projectId, UUID materialId);

    // both filters at once - e.g. "the full history for Cat6 Cable at 3rd
    // Floor specifically", not just one or the other.
    List<InventoryMovement> findByMaterial_Project_IdAndMaterial_IdAndLocation_IdOrderByRecordedAtDesc(
            UUID projectId, UUID materialId, UUID locationId
    );

    // "still in use" guards for deleting a material/location - a ledger row
    // referencing either must never be able to dangle.
    boolean existsByMaterial_Id(UUID materialId);

    boolean existsByLocation_Id(UUID locationId);
}

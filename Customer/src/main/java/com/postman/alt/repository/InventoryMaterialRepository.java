package com.postman.alt.repository;

import com.postman.alt.entity.InventoryMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InventoryMaterialRepository extends JpaRepository<InventoryMaterial, UUID> {
    List<InventoryMaterial> findByProjectIdOrderByNameAsc(UUID projectId);
}

package com.postman.alt.repository;

import com.postman.alt.entity.StatusCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StatusCategoryRepository extends JpaRepository<StatusCategory, UUID> {
    List<StatusCategory> findByProjectId(UUID projectId);

    // used to auto-assign the next palette color (round-robin) when a new
    // category is created without an explicit one.
    long countByProjectId(UUID projectId);
}

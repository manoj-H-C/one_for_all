package com.postman.alt.repository;

import com.postman.alt.entity.StatusCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StatusCategoryRepository extends JpaRepository<StatusCategory, UUID> {
    List<StatusCategory> findByProjectId(UUID projectId);
}

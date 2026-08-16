package com.postman.alt.repository;

import com.postman.alt.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface StatusCategoryRepository extends JpaRepository<AppUser, UUID> {
}

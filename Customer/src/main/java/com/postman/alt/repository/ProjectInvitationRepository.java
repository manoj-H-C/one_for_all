package com.postman.alt.repository;

import com.postman.alt.entity.ProjectInvitation;
import com.postman.alt.enums.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, UUID> {

    Optional<ProjectInvitation> findByToken(String token);

    List<ProjectInvitation> findByProjectIdAndStatus(UUID projectId, InvitationStatus status);

    boolean existsByProjectIdAndEmailAndStatus(UUID projectId, String email, InvitationStatus status);
}
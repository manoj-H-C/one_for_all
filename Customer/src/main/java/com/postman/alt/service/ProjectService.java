package com.postman.alt.service;

import com.postman.alt.service.dto.ProjectCreateRequest;
import com.postman.alt.service.dto.ProjectResponse;
import com.postman.alt.service.dto.ProjectUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface ProjectService {

    ProjectResponse create(UUID requesterId, ProjectCreateRequest request);

    List<ProjectResponse> listForOrg(UUID requesterId);

    ProjectResponse get(UUID projectId, UUID requesterId);

    ProjectResponse update(UUID projectId, UUID requesterId, ProjectUpdateRequest request);

    void delete(UUID projectId, UUID requesterId);
}

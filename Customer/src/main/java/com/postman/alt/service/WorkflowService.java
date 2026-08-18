package com.postman.alt.service;

import com.postman.alt.service.dto.StatusCategoryCreateRequest;
import com.postman.alt.service.dto.StatusCategoryResponse;
import com.postman.alt.service.dto.StatusCategoryUpdateRequest;
import com.postman.alt.service.dto.WorkflowStatusCreateRequest;
import com.postman.alt.service.dto.WorkflowStatusResponse;
import com.postman.alt.service.dto.WorkflowStatusUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface WorkflowService {

    List<StatusCategoryResponse> listCategories(UUID projectId, UUID requesterId);

    StatusCategoryResponse createCategory(UUID projectId, UUID requesterId, StatusCategoryCreateRequest request);

    StatusCategoryResponse updateCategory(UUID projectId, UUID categoryId, UUID requesterId, StatusCategoryUpdateRequest request);

    void deleteCategory(UUID projectId, UUID categoryId, UUID requesterId);

    List<WorkflowStatusResponse> listStatuses(UUID projectId, UUID requesterId);

    WorkflowStatusResponse createStatus(UUID projectId, UUID requesterId, WorkflowStatusCreateRequest request);

    WorkflowStatusResponse updateStatus(UUID projectId, UUID statusId, UUID requesterId, WorkflowStatusUpdateRequest request);

    void deleteStatus(UUID projectId, UUID statusId, UUID requesterId);
}

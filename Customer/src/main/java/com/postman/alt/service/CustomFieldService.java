package com.postman.alt.service;

import com.postman.alt.service.dto.CustomFieldCreateRequest;
import com.postman.alt.service.dto.CustomFieldResponse;
import com.postman.alt.service.dto.CustomFieldUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface CustomFieldService {

    List<CustomFieldResponse> list(UUID projectId, UUID requesterId);

    CustomFieldResponse create(UUID projectId, UUID requesterId, CustomFieldCreateRequest request);

    CustomFieldResponse update(UUID projectId, UUID fieldId, UUID requesterId, CustomFieldUpdateRequest request);

    void delete(UUID projectId, UUID fieldId, UUID requesterId);
}

package com.postman.alt.service.impl;

import com.postman.alt.entity.CustomFieldDefinition;
import com.postman.alt.entity.Project;
import com.postman.alt.enums.FieldType;
import com.postman.alt.exception.BadRequestException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.CustomFieldDefinitionRepository;
import com.postman.alt.repository.ProjectRepository;
import com.postman.alt.service.CustomFieldService;
import com.postman.alt.service.ProjectAccessService;
import com.postman.alt.service.dto.CustomFieldCreateRequest;
import com.postman.alt.service.dto.CustomFieldResponse;
import com.postman.alt.service.dto.CustomFieldUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CustomFieldServiceImpl implements CustomFieldService {

    private static final String CUSTOM_FIELD_MANAGE = "CUSTOM_FIELD_MANAGE";

    private final CustomFieldDefinitionRepository customFieldDefinitionRepository;
    private final ProjectRepository projectRepository;
    private final ProjectAccessService projectAccessService;

    public CustomFieldServiceImpl(
            CustomFieldDefinitionRepository customFieldDefinitionRepository,
            ProjectRepository projectRepository,
            ProjectAccessService projectAccessService
    ) {
        this.customFieldDefinitionRepository = customFieldDefinitionRepository;
        this.projectRepository = projectRepository;
        this.projectAccessService = projectAccessService;
    }

    @Override
    public List<CustomFieldResponse> list(UUID projectId, UUID requesterId) {
        projectAccessService.requireMember(projectId, requesterId);
        return customFieldDefinitionRepository.findByProjectId(projectId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public CustomFieldResponse create(UUID projectId, UUID requesterId, CustomFieldCreateRequest request) {
        projectAccessService.requirePermission(projectId, requesterId, CUSTOM_FIELD_MANAGE);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        CustomFieldDefinition field = new CustomFieldDefinition(project, request.name(), parseFieldType(request.fieldType()), request.required());
        field.setOptions(request.options());

        return toResponse(customFieldDefinitionRepository.save(field));
    }

    @Override
    @Transactional
    public CustomFieldResponse update(UUID projectId, UUID fieldId, UUID requesterId, CustomFieldUpdateRequest request) {
        projectAccessService.requirePermission(projectId, requesterId, CUSTOM_FIELD_MANAGE);
        CustomFieldDefinition field = getField(projectId, fieldId);

        if (request.name() != null) {
            field.setName(request.name());
        }
        if (request.required() != null) {
            field.setRequired(request.required());
        }
        if (request.options() != null) {
            field.setOptions(request.options());
        }

        return toResponse(field);
    }

    @Override
    @Transactional
    public void delete(UUID projectId, UUID fieldId, UUID requesterId) {
        projectAccessService.requirePermission(projectId, requesterId, CUSTOM_FIELD_MANAGE);
        customFieldDefinitionRepository.delete(getField(projectId, fieldId));
    }

    private FieldType parseFieldType(String raw) {
        try {
            return FieldType.valueOf(raw);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Unknown field type: " + raw);
        }
    }

    private CustomFieldDefinition getField(UUID projectId, UUID fieldId) {
        CustomFieldDefinition field = customFieldDefinitionRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("CustomFieldDefinition", fieldId));
        if (!field.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("CustomFieldDefinition", fieldId);
        }
        return field;
    }

    private CustomFieldResponse toResponse(CustomFieldDefinition field) {
        return new CustomFieldResponse(
                field.getId(), field.getProject().getId(), field.getName(),
                field.getFieldType().name(), field.isRequired(), field.getOptions()
        );
    }
}

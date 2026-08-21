package com.postman.alt.service.impl;

import com.postman.alt.entity.AppUser;
import com.postman.alt.entity.InventoryLocation;
import com.postman.alt.entity.InventoryMaterial;
import com.postman.alt.entity.InventoryMovement;
import com.postman.alt.entity.Notification;
import com.postman.alt.entity.Project;
import com.postman.alt.entity.SupplyRequest;
import com.postman.alt.enums.MovementType;
import com.postman.alt.enums.NotificationType;
import com.postman.alt.enums.SupplyRequestStatus;
import com.postman.alt.exception.BadRequestException;
import com.postman.alt.exception.ConflictException;
import com.postman.alt.exception.ForbiddenException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.AppUserRepository;
import com.postman.alt.repository.InventoryLocationRepository;
import com.postman.alt.repository.InventoryMaterialRepository;
import com.postman.alt.repository.InventoryMovementRepository;
import com.postman.alt.repository.NotificationRepository;
import com.postman.alt.repository.ProjectRepository;
import com.postman.alt.repository.SupplyRequestRepository;
import com.postman.alt.service.ProjectAccessService;
import com.postman.alt.service.SupplyRequestService;
import com.postman.alt.service.dto.SupplyRequestCreateRequest;
import com.postman.alt.service.dto.SupplyRequestDecisionRequest;
import com.postman.alt.service.dto.SupplyRequestResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class SupplyRequestServiceImpl implements SupplyRequestService {

    private static final String INVENTORY_MANAGE = "INVENTORY_MANAGE";

    private final SupplyRequestRepository supplyRequestRepository;
    private final InventoryMaterialRepository materialRepository;
    private final InventoryLocationRepository locationRepository;
    private final InventoryMovementRepository movementRepository;
    private final ProjectRepository projectRepository;
    private final AppUserRepository appUserRepository;
    private final NotificationRepository notificationRepository;
    private final ProjectAccessService projectAccessService;

    public SupplyRequestServiceImpl(
            SupplyRequestRepository supplyRequestRepository,
            InventoryMaterialRepository materialRepository,
            InventoryLocationRepository locationRepository,
            InventoryMovementRepository movementRepository,
            ProjectRepository projectRepository,
            AppUserRepository appUserRepository,
            NotificationRepository notificationRepository,
            ProjectAccessService projectAccessService
    ) {
        this.supplyRequestRepository = supplyRequestRepository;
        this.materialRepository = materialRepository;
        this.locationRepository = locationRepository;
        this.movementRepository = movementRepository;
        this.projectRepository = projectRepository;
        this.appUserRepository = appUserRepository;
        this.notificationRepository = notificationRepository;
        this.projectAccessService = projectAccessService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplyRequestResponse> listRequests(UUID projectId, UUID requesterId, String statusFilter, boolean mineOnly) {
        getEnabledProject(projectId);
        projectAccessService.requireMemberOrOwner(projectId, requesterId);

        boolean restrictToMine = mineOnly || !hasManagePermission(projectId, requesterId);
        SupplyRequestStatus status = parseStatus(statusFilter);

        List<SupplyRequest> requests;
        if (restrictToMine && status != null) {
            requests = supplyRequestRepository.findByProject_IdAndRequestedBy_IdAndStatusOrderByRequestedAtDesc(projectId, requesterId, status);
        } else if (restrictToMine) {
            requests = supplyRequestRepository.findByProject_IdAndRequestedBy_IdOrderByRequestedAtDesc(projectId, requesterId);
        } else if (status != null) {
            requests = supplyRequestRepository.findByProject_IdAndStatusOrderByRequestedAtDesc(projectId, status);
        } else {
            requests = supplyRequestRepository.findByProject_IdOrderByRequestedAtDesc(projectId);
        }
        return requests.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public SupplyRequestResponse createRequest(UUID projectId, UUID requesterId, SupplyRequestCreateRequest request) {
        Project project = getEnabledProject(projectId);
        projectAccessService.requireMemberOrOwner(projectId, requesterId);

        if (request.quantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }

        InventoryMaterial material = getMaterial(projectId, request.materialId());
        InventoryLocation location = getLocation(projectId, request.locationId());
        AppUser requestedBy = getUser(requesterId);
        String note = request.note() != null && !request.note().isBlank() ? request.note().trim() : null;

        SupplyRequest supplyRequest = supplyRequestRepository.save(
                new SupplyRequest(project, material, location, request.quantity(), note, requestedBy)
        );
        return toResponse(supplyRequest);
    }

    @Override
    @Transactional
    public SupplyRequestResponse approveRequest(UUID projectId, UUID requestId, UUID requesterId, SupplyRequestDecisionRequest request) {
        getEnabledProject(projectId);
        projectAccessService.requirePermission(projectId, requesterId, INVENTORY_MANAGE);
        SupplyRequest supplyRequest = getRequest(projectId, requestId);

        if (supplyRequest.getStatus() != SupplyRequestStatus.PENDING) {
            throw new ConflictException("Only a pending request can be approved");
        }

        AppUser decidedBy = getUser(requesterId);
        supplyRequest.decide(SupplyRequestStatus.APPROVED, decidedBy, noteOf(request));
        notifyRequester(supplyRequest, decidedBy, NotificationType.SUPPLY_REQUEST_APPROVED,
                "Your request for " + supplyRequest.getQuantity() + " " + supplyRequest.getMaterial().getUnit()
                        + " of " + supplyRequest.getMaterial().getName() + " was approved");
        return toResponse(supplyRequest);
    }

    @Override
    @Transactional
    public SupplyRequestResponse rejectRequest(UUID projectId, UUID requestId, UUID requesterId, SupplyRequestDecisionRequest request) {
        getEnabledProject(projectId);
        projectAccessService.requirePermission(projectId, requesterId, INVENTORY_MANAGE);
        SupplyRequest supplyRequest = getRequest(projectId, requestId);

        if (supplyRequest.getStatus() != SupplyRequestStatus.PENDING) {
            throw new ConflictException("Only a pending request can be rejected");
        }

        AppUser decidedBy = getUser(requesterId);
        String decisionNote = noteOf(request);
        supplyRequest.decide(SupplyRequestStatus.REJECTED, decidedBy, decisionNote);
        notifyRequester(supplyRequest, decidedBy, NotificationType.SUPPLY_REQUEST_REJECTED,
                "Your request for " + supplyRequest.getQuantity() + " " + supplyRequest.getMaterial().getUnit()
                        + " of " + supplyRequest.getMaterial().getName() + " was rejected"
                        + (decisionNote != null ? " — " + decisionNote : ""));
        return toResponse(supplyRequest);
    }

    @Override
    @Transactional
    public SupplyRequestResponse fulfillRequest(UUID projectId, UUID requestId, UUID requesterId, SupplyRequestDecisionRequest request) {
        getEnabledProject(projectId);
        projectAccessService.requirePermission(projectId, requesterId, INVENTORY_MANAGE);
        SupplyRequest supplyRequest = getRequest(projectId, requestId);

        if (supplyRequest.getStatus() != SupplyRequestStatus.APPROVED) {
            throw new ConflictException("Only an approved request can be fulfilled");
        }

        AppUser fulfilledBy = getUser(requesterId);
        String userNote = noteOf(request);
        String movementNote = userNote != null
                ? "Fulfilled supply request — " + userNote
                : "Fulfilled supply request";
        InventoryMovement movement = movementRepository.save(new InventoryMovement(
                supplyRequest.getMaterial(), supplyRequest.getLocation(), null,
                supplyRequest.getQuantity(), MovementType.ALLOCATED, movementNote, fulfilledBy
        ));
        supplyRequest.fulfill(movement);
        notifyRequester(supplyRequest, fulfilledBy, NotificationType.SUPPLY_REQUEST_FULFILLED,
                "Your request for " + supplyRequest.getQuantity() + " " + supplyRequest.getMaterial().getUnit()
                        + " of " + supplyRequest.getMaterial().getName() + " was fulfilled");
        return toResponse(supplyRequest);
    }

    // no-op if the requester is deciding on their own request (an INVENTORY_
    // MANAGE holder can also raise requests) - nobody needs to be told about
    // their own action.
    private void notifyRequester(SupplyRequest supplyRequest, AppUser actor, NotificationType type, String message) {
        AppUser recipient = supplyRequest.getRequestedBy();
        if (recipient.getId().equals(actor.getId())) {
            return;
        }
        notificationRepository.save(new Notification(recipient, null, actor, type, message));
    }

    @Override
    @Transactional
    public SupplyRequestResponse cancelRequest(UUID projectId, UUID requestId, UUID requesterId, SupplyRequestDecisionRequest request) {
        getEnabledProject(projectId);
        projectAccessService.requireMemberOrOwner(projectId, requesterId);
        SupplyRequest supplyRequest = getRequest(projectId, requestId);

        boolean isOwnRequest = supplyRequest.getRequestedBy().getId().equals(requesterId);
        if (!isOwnRequest) {
            projectAccessService.requirePermission(projectId, requesterId, INVENTORY_MANAGE);
        }
        if (supplyRequest.getStatus() != SupplyRequestStatus.PENDING && supplyRequest.getStatus() != SupplyRequestStatus.APPROVED) {
            throw new ConflictException("Only a pending or approved request can be cancelled");
        }

        supplyRequest.decide(SupplyRequestStatus.CANCELLED, getUser(requesterId), noteOf(request));
        return toResponse(supplyRequest);
    }

    private String noteOf(SupplyRequestDecisionRequest request) {
        if (request == null || request.note() == null || request.note().isBlank()) {
            return null;
        }
        return request.note().trim();
    }

    private SupplyRequestStatus parseStatus(String statusFilter) {
        if (statusFilter == null || statusFilter.isBlank()) {
            return null;
        }
        try {
            return SupplyRequestStatus.valueOf(statusFilter);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Unknown request status: " + statusFilter);
        }
    }

    // no boolean-returning check exists on ProjectAccessService (every
    // method there throws) - listRequests needs one to decide whether to
    // scope the query down to "mine only", so this adapts requirePermission
    // rather than adding a new throwing/non-throwing pair to that interface
    // for a single caller.
    private boolean hasManagePermission(UUID projectId, UUID userId) {
        try {
            projectAccessService.requirePermission(projectId, userId, INVENTORY_MANAGE);
            return true;
        } catch (ForbiddenException e) {
            return false;
        }
    }

    private Project getEnabledProject(UUID projectId) {
        Project project = projectRepository.findByIdAndDeletedAtIsNull(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        if (!project.isInventoryEnabled()) {
            throw new ForbiddenException("Inventory tracking is not enabled for this project");
        }
        return project;
    }

    private SupplyRequest getRequest(UUID projectId, UUID requestId) {
        SupplyRequest supplyRequest = supplyRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplyRequest", requestId));
        if (!supplyRequest.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("SupplyRequest", requestId);
        }
        return supplyRequest;
    }

    private InventoryMaterial getMaterial(UUID projectId, UUID materialId) {
        InventoryMaterial material = materialRepository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryMaterial", materialId));
        if (!material.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("InventoryMaterial", materialId);
        }
        return material;
    }

    private InventoryLocation getLocation(UUID projectId, UUID locationId) {
        InventoryLocation location = locationRepository.findById(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryLocation", locationId));
        if (!location.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("InventoryLocation", locationId);
        }
        return location;
    }

    private AppUser getUser(UUID id) {
        return appUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AppUser", id));
    }

    private SupplyRequestResponse toResponse(SupplyRequest r) {
        AppUser decidedBy = r.getDecidedBy();
        return new SupplyRequestResponse(
                r.getId(), r.getProject().getId(), r.getProject().getName(),
                r.getMaterial().getId(), r.getMaterial().getName(), r.getMaterial().getUnit(),
                r.getLocation().getId(), r.getLocation().getName(),
                r.getQuantity(), r.getStatus().name(), r.getNote(),
                r.getRequestedBy().getId(), r.getRequestedBy().getName(), r.getRequestedAt(),
                r.getDecisionNote(),
                decidedBy != null ? decidedBy.getId() : null,
                decidedBy != null ? decidedBy.getName() : null,
                r.getDecidedAt(),
                r.getFulfilledMovement() != null ? r.getFulfilledMovement().getId() : null
        );
    }
}

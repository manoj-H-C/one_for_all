package com.postman.alt.service.impl;

import com.postman.alt.entity.AppUser;
import com.postman.alt.entity.InventoryLocation;
import com.postman.alt.entity.InventoryMaterial;
import com.postman.alt.entity.InventoryMovement;
import com.postman.alt.entity.Project;
import com.postman.alt.entity.WorkItem;
import com.postman.alt.enums.MovementType;
import com.postman.alt.exception.BadRequestException;
import com.postman.alt.exception.ConflictException;
import com.postman.alt.exception.ForbiddenException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.AppUserRepository;
import com.postman.alt.repository.InventoryLocationRepository;
import com.postman.alt.repository.InventoryMaterialRepository;
import com.postman.alt.repository.InventoryMovementRepository;
import com.postman.alt.repository.ProjectRepository;
import com.postman.alt.repository.WorkItemRepository;
import com.postman.alt.service.InventoryService;
import com.postman.alt.service.ProjectAccessService;
import com.postman.alt.service.dto.InventoryBalanceResponse;
import com.postman.alt.service.dto.InventoryLocationCreateRequest;
import com.postman.alt.service.dto.InventoryLocationResponse;
import com.postman.alt.service.dto.InventoryLocationUpdateRequest;
import com.postman.alt.service.dto.InventoryMaterialCreateRequest;
import com.postman.alt.service.dto.InventoryMaterialResponse;
import com.postman.alt.service.dto.InventoryMaterialUpdateRequest;
import com.postman.alt.service.dto.InventoryMovementCreateRequest;
import com.postman.alt.service.dto.InventoryMovementResponse;
import com.postman.alt.service.dto.InventoryTransferRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class InventoryServiceImpl implements InventoryService {

    private static final String INVENTORY_MANAGE = "INVENTORY_MANAGE";

    private final InventoryLocationRepository locationRepository;
    private final InventoryMaterialRepository materialRepository;
    private final InventoryMovementRepository movementRepository;
    private final ProjectRepository projectRepository;
    private final AppUserRepository appUserRepository;
    private final WorkItemRepository workItemRepository;
    private final ProjectAccessService projectAccessService;

    public InventoryServiceImpl(
            InventoryLocationRepository locationRepository,
            InventoryMaterialRepository materialRepository,
            InventoryMovementRepository movementRepository,
            ProjectRepository projectRepository,
            AppUserRepository appUserRepository,
            WorkItemRepository workItemRepository,
            ProjectAccessService projectAccessService
    ) {
        this.locationRepository = locationRepository;
        this.materialRepository = materialRepository;
        this.movementRepository = movementRepository;
        this.projectRepository = projectRepository;
        this.appUserRepository = appUserRepository;
        this.workItemRepository = workItemRepository;
        this.projectAccessService = projectAccessService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryLocationResponse> listLocations(UUID projectId, UUID requesterId) {
        getEnabledProject(projectId);
        projectAccessService.requireMemberOrOwner(projectId, requesterId);
        return locationRepository.findByProjectIdOrderByNameAsc(projectId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public InventoryLocationResponse createLocation(UUID projectId, UUID requesterId, InventoryLocationCreateRequest request) {
        Project project = getEnabledProject(projectId);
        projectAccessService.requirePermission(projectId, requesterId, INVENTORY_MANAGE);

        InventoryLocation parent = request.parentLocationId() != null ? getLocation(projectId, request.parentLocationId()) : null;
        InventoryLocation location = locationRepository.save(new InventoryLocation(project, parent, request.name()));
        return toResponse(location);
    }

    @Override
    @Transactional
    public InventoryLocationResponse updateLocation(UUID projectId, UUID locationId, UUID requesterId, InventoryLocationUpdateRequest request) {
        getEnabledProject(projectId);
        projectAccessService.requirePermission(projectId, requesterId, INVENTORY_MANAGE);
        InventoryLocation location = getLocation(projectId, locationId);

        if (request.name() != null) {
            location.setName(request.name());
        }

        return toResponse(location);
    }

    @Override
    @Transactional
    public void deleteLocation(UUID projectId, UUID locationId, UUID requesterId) {
        getEnabledProject(projectId);
        projectAccessService.requirePermission(projectId, requesterId, INVENTORY_MANAGE);
        InventoryLocation location = getLocation(projectId, locationId);

        if (locationRepository.existsByParent_Id(locationId)) {
            throw new ConflictException("This location still has sub-locations under it");
        }
        if (movementRepository.existsByLocation_Id(locationId)) {
            throw new ConflictException("This location still has movement history recorded against it");
        }

        locationRepository.delete(location);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryMaterialResponse> listMaterials(UUID projectId, UUID requesterId) {
        getEnabledProject(projectId);
        projectAccessService.requireMemberOrOwner(projectId, requesterId);
        return materialRepository.findByProjectIdOrderByNameAsc(projectId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public InventoryMaterialResponse createMaterial(UUID projectId, UUID requesterId, InventoryMaterialCreateRequest request) {
        Project project = getEnabledProject(projectId);
        projectAccessService.requirePermission(projectId, requesterId, INVENTORY_MANAGE);

        InventoryMaterial material = new InventoryMaterial(project, request.name(), request.unit());
        material.setSku(request.sku());
        material.setLowStockThreshold(request.lowStockThreshold());
        material.setDescription(request.description());
        material = materialRepository.save(material);
        return toResponse(material);
    }

    @Override
    @Transactional
    public InventoryMaterialResponse updateMaterial(UUID projectId, UUID materialId, UUID requesterId, InventoryMaterialUpdateRequest request) {
        getEnabledProject(projectId);
        projectAccessService.requirePermission(projectId, requesterId, INVENTORY_MANAGE);
        InventoryMaterial material = getMaterial(projectId, materialId);

        if (request.name() != null) {
            material.setName(request.name());
        }
        if (request.unit() != null) {
            material.setUnit(request.unit());
        }
        if (request.sku() != null) {
            material.setSku(request.sku());
        }
        if (request.lowStockThreshold() != null) {
            material.setLowStockThreshold(request.lowStockThreshold());
        }
        if (request.description() != null) {
            material.setDescription(request.description());
        }

        return toResponse(material);
    }

    @Override
    @Transactional
    public void deleteMaterial(UUID projectId, UUID materialId, UUID requesterId) {
        getEnabledProject(projectId);
        projectAccessService.requirePermission(projectId, requesterId, INVENTORY_MANAGE);
        InventoryMaterial material = getMaterial(projectId, materialId);

        if (movementRepository.existsByMaterial_Id(materialId)) {
            throw new ConflictException("This material still has movement history recorded against it");
        }

        materialRepository.delete(material);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryMovementResponse> listMovements(UUID projectId, UUID requesterId, UUID locationId, UUID materialId) {
        getEnabledProject(projectId);
        projectAccessService.requireMemberOrOwner(projectId, requesterId);

        List<InventoryMovement> movements;
        if (locationId != null && materialId != null) {
            movements = movementRepository.findByMaterial_Project_IdAndMaterial_IdAndLocation_IdOrderByRecordedAtDesc(projectId, materialId, locationId);
        } else if (locationId != null) {
            movements = movementRepository.findByMaterial_Project_IdAndLocation_IdOrderByRecordedAtDesc(projectId, locationId);
        } else if (materialId != null) {
            movements = movementRepository.findByMaterial_Project_IdAndMaterial_IdOrderByRecordedAtDesc(projectId, materialId);
        } else {
            movements = movementRepository.findByMaterial_Project_IdOrderByRecordedAtDesc(projectId);
        }
        return movements.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public InventoryMovementResponse createMovement(UUID projectId, UUID requesterId, InventoryMovementCreateRequest request) {
        getEnabledProject(projectId);
        projectAccessService.requirePermission(projectId, requesterId, INVENTORY_MANAGE);

        if (request.quantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }
        MovementType type;
        try {
            type = MovementType.valueOf(request.type());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Unknown movement type: " + request.type());
        }

        InventoryMaterial material = getMaterial(projectId, request.materialId());
        InventoryLocation location = getLocation(projectId, request.locationId());
        WorkItem workItem = null;
        if (request.workItemId() != null) {
            workItem = workItemRepository.findByIdAndDeletedAtIsNull(request.workItemId())
                    .filter(w -> w.getProject().getId().equals(projectId))
                    .orElseThrow(() -> new ResourceNotFoundException("WorkItem", request.workItemId()));
        }
        AppUser recordedBy = getUser(requesterId);

        InventoryMovement movement = movementRepository.save(
                new InventoryMovement(material, location, workItem, request.quantity(), type, request.note(), recordedBy)
        );
        return toResponse(movement);
    }

    @Override
    @Transactional
    public List<InventoryMovementResponse> transferStock(UUID projectId, UUID requesterId, InventoryTransferRequest request) {
        getEnabledProject(projectId);
        projectAccessService.requirePermission(projectId, requesterId, INVENTORY_MANAGE);

        if (request.quantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }
        if (request.fromLocationId().equals(request.toLocationId())) {
            throw new BadRequestException("Source and destination locations must be different");
        }

        InventoryMaterial material = getMaterial(projectId, request.materialId());
        InventoryLocation fromLocation = getLocation(projectId, request.fromLocationId());
        InventoryLocation toLocation = getLocation(projectId, request.toLocationId());
        AppUser recordedBy = getUser(requesterId);
        String userNote = request.note() != null && !request.note().isBlank() ? request.note() : null;

        InventoryMovement outMovement = movementRepository.save(new InventoryMovement(
                material, fromLocation, null, request.quantity(), MovementType.USED,
                withUserNote("Transferred to " + toLocation.getName(), userNote), recordedBy
        ));
        InventoryMovement inMovement = movementRepository.save(new InventoryMovement(
                material, toLocation, null, request.quantity(), MovementType.ALLOCATED,
                withUserNote("Transferred from " + fromLocation.getName(), userNote), recordedBy
        ));

        return List.of(toResponse(outMovement), toResponse(inMovement));
    }

    private String withUserNote(String autoNote, String userNote) {
        return userNote != null ? autoNote + " — " + userNote : autoNote;
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryBalanceResponse> listBalances(UUID projectId, UUID requesterId, UUID locationId) {
        getEnabledProject(projectId);
        projectAccessService.requireMemberOrOwner(projectId, requesterId);

        List<InventoryMovement> movements = locationId != null
                ? movementRepository.findByMaterial_Project_IdAndLocation_IdOrderByRecordedAtDesc(projectId, locationId)
                : movementRepository.findByMaterial_Project_IdOrderByRecordedAtDesc(projectId);

        record Key(UUID materialId, UUID locationId) {
        }

        Map<Key, BigDecimal[]> sums = new LinkedHashMap<>();
        Map<Key, InventoryMovement> sample = new LinkedHashMap<>();

        for (InventoryMovement mv : movements) {
            Key key = new Key(mv.getMaterial().getId(), mv.getLocation().getId());
            BigDecimal[] totals = sums.computeIfAbsent(key, k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO});
            switch (mv.getType()) {
                case ALLOCATED -> totals[0] = totals[0].add(mv.getQuantity());
                case USED -> totals[1] = totals[1].add(mv.getQuantity());
                case RETURNED -> totals[2] = totals[2].add(mv.getQuantity());
            }
            sample.putIfAbsent(key, mv);
        }

        return sums.entrySet().stream().map(entry -> {
            InventoryMovement mv = sample.get(entry.getKey());
            BigDecimal allocated = entry.getValue()[0];
            BigDecimal used = entry.getValue()[1];
            BigDecimal returned = entry.getValue()[2];
            BigDecimal remaining = allocated.subtract(used).subtract(returned);
            return new InventoryBalanceResponse(
                    mv.getMaterial().getId(), mv.getMaterial().getName(), mv.getMaterial().getUnit(),
                    mv.getLocation().getId(), mv.getLocation().getName(),
                    allocated, used, returned, remaining
            );
        }).toList();
    }

    // 403s regardless of the requester's role or permissions - a disabled
    // feature is unreachable by anyone, not just under-permissioned members.
    private Project getEnabledProject(UUID projectId) {
        Project project = projectRepository.findByIdAndDeletedAtIsNull(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        if (!project.isInventoryEnabled()) {
            throw new ForbiddenException("Inventory tracking is not enabled for this project");
        }
        return project;
    }

    private InventoryLocation getLocation(UUID projectId, UUID locationId) {
        InventoryLocation location = locationRepository.findById(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryLocation", locationId));
        if (!location.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("InventoryLocation", locationId);
        }
        return location;
    }

    private InventoryMaterial getMaterial(UUID projectId, UUID materialId) {
        InventoryMaterial material = materialRepository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryMaterial", materialId));
        if (!material.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("InventoryMaterial", materialId);
        }
        return material;
    }

    private AppUser getUser(UUID id) {
        return appUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AppUser", id));
    }

    private InventoryLocationResponse toResponse(InventoryLocation location) {
        return new InventoryLocationResponse(
                location.getId(), location.getProject().getId(),
                location.getParent() != null ? location.getParent().getId() : null,
                location.getName(), location.getCreatedAt()
        );
    }

    private InventoryMaterialResponse toResponse(InventoryMaterial material) {
        return new InventoryMaterialResponse(
                material.getId(), material.getProject().getId(), material.getName(), material.getUnit(),
                material.getSku(), material.getLowStockThreshold(), material.getDescription(), material.getCreatedAt()
        );
    }

    private InventoryMovementResponse toResponse(InventoryMovement movement) {
        return new InventoryMovementResponse(
                movement.getId(),
                movement.getMaterial().getId(), movement.getMaterial().getName(), movement.getMaterial().getUnit(),
                movement.getLocation().getId(), movement.getLocation().getName(),
                movement.getQuantity(), movement.getType().name(), movement.getNote(),
                movement.getWorkItem() != null ? movement.getWorkItem().getId() : null,
                movement.getRecordedBy().getId(), movement.getRecordedBy().getName(),
                movement.getRecordedAt()
        );
    }
}

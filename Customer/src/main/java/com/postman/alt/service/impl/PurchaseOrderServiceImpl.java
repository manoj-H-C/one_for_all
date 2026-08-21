package com.postman.alt.service.impl;

import com.postman.alt.entity.AppUser;
import com.postman.alt.entity.InventoryMovement;
import com.postman.alt.entity.Notification;
import com.postman.alt.entity.PurchaseOrder;
import com.postman.alt.entity.SupplyRequest;
import com.postman.alt.enums.MovementType;
import com.postman.alt.enums.NotificationType;
import com.postman.alt.enums.PurchaseOrderStatus;
import com.postman.alt.enums.SupplyRequestStatus;
import com.postman.alt.exception.BadRequestException;
import com.postman.alt.exception.ConflictException;
import com.postman.alt.exception.ForbiddenException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.AppUserRepository;
import com.postman.alt.repository.InventoryMovementRepository;
import com.postman.alt.repository.NotificationRepository;
import com.postman.alt.repository.PurchaseOrderRepository;
import com.postman.alt.repository.SupplyRequestRepository;
import com.postman.alt.service.PurchaseOrderService;
import com.postman.alt.service.dto.PurchaseOrderCreateRequest;
import com.postman.alt.service.dto.PurchaseOrderLineResponse;
import com.postman.alt.service.dto.PurchaseOrderResponse;
import com.postman.alt.service.dto.SupplyRequestResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplyRequestRepository supplyRequestRepository;
    private final InventoryMovementRepository movementRepository;
    private final AppUserRepository appUserRepository;
    private final NotificationRepository notificationRepository;

    public PurchaseOrderServiceImpl(
            PurchaseOrderRepository purchaseOrderRepository,
            SupplyRequestRepository supplyRequestRepository,
            InventoryMovementRepository movementRepository,
            AppUserRepository appUserRepository,
            NotificationRepository notificationRepository
    ) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.supplyRequestRepository = supplyRequestRepository;
        this.movementRepository = movementRepository;
        this.appUserRepository = appUserRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplyRequestResponse> listOrderableRequests(UUID requesterId) {
        AppUser requester = requireAdmin(requesterId);
        return supplyRequestRepository
                .findByProject_Organization_IdAndStatusAndPurchaseOrderIsNullOrderByRequestedAtDesc(
                        requester.getOrganization().getId(), SupplyRequestStatus.APPROVED
                )
                .stream().map(this::toSupplyRequestResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> listOrders(UUID requesterId, String statusFilter) {
        AppUser requester = requireAdmin(requesterId);
        PurchaseOrderStatus status = parseStatus(statusFilter);
        return purchaseOrderRepository.findByOrganization_IdOrderByCreatedAtDesc(requester.getOrganization().getId())
                .stream()
                .filter(po -> status == null || po.getStatus() == status)
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public PurchaseOrderResponse createOrder(UUID requesterId, PurchaseOrderCreateRequest request) {
        AppUser requester = requireAdmin(requesterId);
        String vendorName = request.vendorName() == null ? "" : request.vendorName().trim();
        if (vendorName.isBlank()) {
            throw new BadRequestException("Vendor name is required");
        }

        List<SupplyRequest> requests = request.requestIds().stream().distinct().map(id -> getOrderableRequest(requester, id)).toList();

        PurchaseOrder order = purchaseOrderRepository.save(new PurchaseOrder(
                requester.getOrganization(), vendorName,
                request.note() != null && !request.note().isBlank() ? request.note().trim() : null,
                requester
        ));
        requests.forEach(r -> r.markOrdered(order));

        return toResponse(order, requests);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse receiveOrder(UUID requesterId, UUID orderId) {
        AppUser requester = requireAdmin(requesterId);
        PurchaseOrder order = getOrder(requester, orderId);
        if (order.getStatus() != PurchaseOrderStatus.ORDERED) {
            throw new ConflictException("Only an ordered purchase order can be received");
        }

        List<SupplyRequest> lines = supplyRequestRepository.findByPurchaseOrder_Id(orderId);
        for (SupplyRequest line : lines) {
            InventoryMovement movement = movementRepository.save(new InventoryMovement(
                    line.getMaterial(), line.getLocation(), null, line.getQuantity(), MovementType.ALLOCATED,
                    "Received on purchase order from " + order.getVendorName(), requester
            ));
            line.fulfill(movement);
            notifyRequester(line, requester);
        }
        order.close(PurchaseOrderStatus.RECEIVED, requester);

        return toResponse(order, lines);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse cancelOrder(UUID requesterId, UUID orderId) {
        AppUser requester = requireAdmin(requesterId);
        PurchaseOrder order = getOrder(requester, orderId);
        if (order.getStatus() != PurchaseOrderStatus.ORDERED) {
            throw new ConflictException("Only an ordered purchase order can be cancelled");
        }

        List<SupplyRequest> lines = supplyRequestRepository.findByPurchaseOrder_Id(orderId);
        lines.forEach(SupplyRequest::revertToApproved);
        order.close(PurchaseOrderStatus.CANCELLED, requester);

        return toResponse(order, lines);
    }

    // an APPROVED request, not already on another order, belonging to a
    // project in the requester's own org - mirrors the guard rails
    // createOrder needs to bundle it safely.
    private SupplyRequest getOrderableRequest(AppUser requester, UUID requestId) {
        SupplyRequest request = supplyRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplyRequest", requestId));
        if (!request.getProject().getOrganization().getId().equals(requester.getOrganization().getId())) {
            throw new ResourceNotFoundException("SupplyRequest", requestId);
        }
        if (request.getStatus() != SupplyRequestStatus.APPROVED) {
            throw new ConflictException("\"" + request.getMaterial().getName() + "\" for " + request.getProject().getName() + " isn't approved and available to order");
        }
        return request;
    }

    // same "don't notify someone about their own action" rule
    // SupplyRequestServiceImpl.notifyRequester uses - here that means an
    // admin receiving an order that includes a request they themselves
    // raised.
    private void notifyRequester(SupplyRequest line, AppUser actor) {
        AppUser recipient = line.getRequestedBy();
        if (recipient.getId().equals(actor.getId())) {
            return;
        }
        notificationRepository.save(new Notification(
                recipient, null, actor, NotificationType.SUPPLY_REQUEST_FULFILLED,
                "Your request for " + line.getQuantity() + " " + line.getMaterial().getUnit()
                        + " of " + line.getMaterial().getName() + " was fulfilled"
        ));
    }

    // owner or a delegated admin (canManageMembers) - same gate
    // OrganizationServiceImpl uses for every other org-administration
    // action, since bulk purchasing is one too and there's no per-project
    // role to check at this level.
    private AppUser requireAdmin(UUID requesterId) {
        AppUser requester = appUserRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("AppUser", requesterId));
        if (!requester.isOwner() && !requester.isCanManageMembers()) {
            throw new ForbiddenException("You don't have permission to manage purchase orders for this organization");
        }
        return requester;
    }

    private PurchaseOrder getOrder(AppUser requester, UUID orderId) {
        PurchaseOrder order = purchaseOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", orderId));
        if (!order.getOrganization().getId().equals(requester.getOrganization().getId())) {
            throw new ResourceNotFoundException("PurchaseOrder", orderId);
        }
        return order;
    }

    private PurchaseOrderStatus parseStatus(String statusFilter) {
        if (statusFilter == null || statusFilter.isBlank()) {
            return null;
        }
        try {
            return PurchaseOrderStatus.valueOf(statusFilter);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Unknown purchase order status: " + statusFilter);
        }
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder order) {
        return toResponse(order, supplyRequestRepository.findByPurchaseOrder_Id(order.getId()));
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder order, List<SupplyRequest> lines) {
        AppUser closedBy = order.getClosedBy();
        return new PurchaseOrderResponse(
                order.getId(), order.getOrganization().getId(), order.getVendorName(), order.getNote(),
                order.getStatus().name(),
                order.getCreatedBy().getId(), order.getCreatedBy().getName(), order.getCreatedAt(),
                closedBy != null ? closedBy.getId() : null,
                closedBy != null ? closedBy.getName() : null,
                order.getClosedAt(),
                lines.stream().map(this::toLineResponse).toList()
        );
    }

    private PurchaseOrderLineResponse toLineResponse(SupplyRequest r) {
        return new PurchaseOrderLineResponse(
                r.getId(), r.getProject().getId(), r.getProject().getName(),
                r.getMaterial().getName(), r.getMaterial().getUnit(), r.getLocation().getName(),
                r.getQuantity(), r.getRequestedBy().getId(), r.getRequestedBy().getName(), r.getNote()
        );
    }

    private SupplyRequestResponse toSupplyRequestResponse(SupplyRequest r) {
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

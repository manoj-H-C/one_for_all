package com.postman.alt.entity;

import com.postman.alt.enums.SupplyRequestStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * A member's ask for more of a material at a location - PENDING until a
 * manager approves/rejects it, then an approved one is separately fulfilled.
 * Unlike InventoryMovement this is mutable by design (status/decision fields
 * change as the request moves through its lifecycle); fulfilling one still
 * creates a normal append-only movement row - see fulfilledMovement - so the
 * ledger itself never loses its "never updated" guarantee.
 */
@Entity
@Table(name = "supply_request")
public class SupplyRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "material_id", nullable = false)
    private InventoryMaterial material;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_id", nullable = false)
    private InventoryLocation location;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SupplyRequestStatus status = SupplyRequestStatus.PENDING;

    @Column(length = 500)
    private String note;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requested_by", nullable = false)
    private AppUser requestedBy;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt = Instant.now();

    @Column(name = "decision_note", length = 500)
    private String decisionNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by")
    private AppUser decidedBy;

    @Column(name = "decided_at")
    private Instant decidedAt;

    // set only on fulfillment - the movement it produced. Who fulfilled it
    // and when is read off that movement (recordedBy/recordedAt) rather than
    // duplicated here.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fulfilled_movement_id")
    private InventoryMovement fulfilledMovement;

    // set once this request is bundled into an org-level PurchaseOrder (see
    // markOrdered/revertToApproved) - cleared again if that order is
    // cancelled, so the request goes back to being available for a
    // different one.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id")
    private PurchaseOrder purchaseOrder;

    protected SupplyRequest() {
        // JPA
    }

    public SupplyRequest(Project project, InventoryMaterial material, InventoryLocation location, BigDecimal quantity, String note, AppUser requestedBy) {
        this.project = project;
        this.material = material;
        this.location = location;
        this.quantity = quantity;
        this.note = note;
        this.requestedBy = requestedBy;
    }

    /** Moves this request to a terminal-or-not decision state (APPROVED/REJECTED/CANCELLED), recording who decided and why. */
    public void decide(SupplyRequestStatus status, AppUser decidedBy, String decisionNote) {
        this.status = status;
        this.decidedBy = decidedBy;
        this.decidedAt = Instant.now();
        this.decisionNote = decisionNote;
    }

    public void fulfill(InventoryMovement movement) {
        this.status = SupplyRequestStatus.FULFILLED;
        this.fulfilledMovement = movement;
    }

    public void markOrdered(PurchaseOrder purchaseOrder) {
        this.status = SupplyRequestStatus.ORDERED;
        this.purchaseOrder = purchaseOrder;
    }

    /** Called when the PurchaseOrder this was bundled into gets cancelled - makes the request available for a future one. */
    public void revertToApproved() {
        this.status = SupplyRequestStatus.APPROVED;
        this.purchaseOrder = null;
    }

    public UUID getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public InventoryMaterial getMaterial() {
        return material;
    }

    public InventoryLocation getLocation() {
        return location;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public SupplyRequestStatus getStatus() {
        return status;
    }

    public String getNote() {
        return note;
    }

    public AppUser getRequestedBy() {
        return requestedBy;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public String getDecisionNote() {
        return decisionNote;
    }

    public AppUser getDecidedBy() {
        return decidedBy;
    }

    public Instant getDecidedAt() {
        return decidedAt;
    }

    public InventoryMovement getFulfilledMovement() {
        return fulfilledMovement;
    }

    public PurchaseOrder getPurchaseOrder() {
        return purchaseOrder;
    }
}

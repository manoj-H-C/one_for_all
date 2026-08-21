package com.postman.alt.entity;

import com.postman.alt.enums.MovementType;
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
 * One row in the append-only inventory ledger: a quantity of a material
 * moved at a location, in one direction (ALLOCATED/USED/RETURNED). Never
 * updated or deleted once created - current balances are always computed by
 * summing, not stored, so there's a full audit trail of every movement.
 */
@Entity
@Table(name = "inventory_movement")
public class InventoryMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "material_id", nullable = false)
    private InventoryMaterial material;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_id", nullable = false)
    private InventoryLocation location;

    // optional - ties this movement to the task it was used for, without
    // requiring every movement to have one.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_item_id")
    private WorkItem workItem;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MovementType type;

    @Column(length = 500)
    private String note;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recorded_by", nullable = false)
    private AppUser recordedBy;

    @Column(name = "recorded_at", nullable = false, updatable = false)
    private Instant recordedAt = Instant.now();

    protected InventoryMovement() {
        // JPA
    }

    public InventoryMovement(
            InventoryMaterial material, InventoryLocation location, WorkItem workItem,
            BigDecimal quantity, MovementType type, String note, AppUser recordedBy
    ) {
        this.material = material;
        this.location = location;
        this.workItem = workItem;
        this.quantity = quantity;
        this.type = type;
        this.note = note;
        this.recordedBy = recordedBy;
    }

    public UUID getId() {
        return id;
    }

    public InventoryMaterial getMaterial() {
        return material;
    }

    public InventoryLocation getLocation() {
        return location;
    }

    public WorkItem getWorkItem() {
        return workItem;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public MovementType getType() {
        return type;
    }

    public String getNote() {
        return note;
    }

    public AppUser getRecordedBy() {
        return recordedBy;
    }

    public Instant getRecordedAt() {
        return recordedAt;
    }
}

package com.postman.alt.entity;

import com.postman.alt.enums.PurchaseOrderStatus;
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

import java.time.Instant;
import java.util.UUID;

/**
 * An org-level bulk order placed with a vendor, bundling several approved
 * SupplyRequests (see SupplyRequest.purchaseOrder) - even from different
 * projects, even for different materials. Unlike InventoryMovement this is
 * mutable (status/closedBy/closedAt change as the order moves through its
 * lifecycle); receiving one still creates normal append-only movement rows
 * for each bundled request, same as fulfilling a single request would.
 */
@Entity
@Table(name = "purchase_order")
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "vendor_name", nullable = false, length = 200)
    private String vendorName;

    @Column(length = 500)
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PurchaseOrderStatus status = PurchaseOrderStatus.ORDERED;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private AppUser createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "closed_by")
    private AppUser closedBy;

    @Column(name = "closed_at")
    private Instant closedAt;

    protected PurchaseOrder() {
        // JPA
    }

    public PurchaseOrder(Organization organization, String vendorName, String note, AppUser createdBy) {
        this.organization = organization;
        this.vendorName = vendorName;
        this.note = note;
        this.createdBy = createdBy;
    }

    public void close(PurchaseOrderStatus status, AppUser closedBy) {
        this.status = status;
        this.closedBy = closedBy;
        this.closedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Organization getOrganization() {
        return organization;
    }

    public String getVendorName() {
        return vendorName;
    }

    public String getNote() {
        return note;
    }

    public PurchaseOrderStatus getStatus() {
        return status;
    }

    public AppUser getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public AppUser getClosedBy() {
        return closedBy;
    }

    public Instant getClosedAt() {
        return closedAt;
    }
}

package com.postman.alt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "organization")
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "purchase_orders_enabled", nullable = false)
    private boolean purchaseOrdersEnabled = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Organization() {
        // JPA
    }

    public Organization(String name) {
        this.name = name;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isPurchaseOrdersEnabled() {
        return purchaseOrdersEnabled;
    }

    public void setPurchaseOrdersEnabled(boolean purchaseOrdersEnabled) {
        this.purchaseOrdersEnabled = purchaseOrdersEnabled;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

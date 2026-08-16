package com.postman.alt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project", uniqueConstraints = @UniqueConstraint(columnNames = {"org_id", "key"}))
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization organization;

    @Column(nullable = false)
    private String name;

    // short unique code, e.g. "ELEC", "SALES" - used in work item references
    @Column(nullable = false)
    private String key;

    // which starter template this project was seeded from, e.g. "software",
    // "construction", "electrical", "sales", "video". Purely informational -
    // all actual behaviour comes from the WorkflowStatus / CustomFieldDefinition
    // rows that were seeded, not from this string.
    @Column(name = "template_type")
    private String templateType;

    // lets the UI say "Punch List Item" instead of "Work Item" without any
    // schema change - terminology is a display concern, not a data concern.
    @Column(name = "item_display_name_singular")
    private String itemDisplayNameSingular = "Work item";

    @Column(name = "item_display_name_plural")
    private String itemDisplayNamePlural = "Work items";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Project() {
        // JPA
    }

    public Project(Organization organization, String name, String key, String templateType) {
        this.organization = organization;
        this.name = name;
        this.key = key;
        this.templateType = templateType;
    }

    public UUID getId() {
        return id;
    }

    public Organization getOrganization() {
        return organization;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getKey() {
        return key;
    }

    public String getTemplateType() {
        return templateType;
    }

    public String getItemDisplayNameSingular() {
        return itemDisplayNameSingular;
    }

    public void setItemDisplayNameSingular(String itemDisplayNameSingular) {
        this.itemDisplayNameSingular = itemDisplayNameSingular;
    }

    public String getItemDisplayNamePlural() {
        return itemDisplayNamePlural;
    }

    public void setItemDisplayNamePlural(String itemDisplayNamePlural) {
        this.itemDisplayNamePlural = itemDisplayNamePlural;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

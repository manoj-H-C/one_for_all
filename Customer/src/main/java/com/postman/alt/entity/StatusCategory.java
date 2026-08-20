package com.postman.alt.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(
        name = "status_category",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_status_category_name",
                        columnNames = {"project_id", "name"}
                )
        }
)
public class StatusCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    // one of the fixed palette keys (see color-hash.ts's PALETTE_KEYS on the
    // frontend) - null means nobody has explicitly chosen one yet, in which
    // case the frontend falls back to the same by-position color every
    // category used to get before this was configurable.
    @Column(length = 20)
    private String color;

    protected StatusCategory() {
        // JPA
    }

    public StatusCategory(
            Project project,
            String name,
            String description,
            String color
    ) {
        this.project = project;
        this.name = name;
        this.description = description;
        this.color = color;
    }

    public UUID getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}
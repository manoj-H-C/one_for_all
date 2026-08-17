package com.postman.alt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "permission")
public class Permission {

    // fixed catalog, seeded by Flyway - not created via the app, so the id
    // is a stable code (e.g. "WORK_ITEM_DELETE"), not a generated UUID
    @Id
    @Column(length = 60)
    private String code;

    @Column(nullable = false)
    private String description;

    protected Permission() {
        // JPA
    }

    public Permission(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
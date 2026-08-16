package com.yourco.platform.domain.enums;

/**
 * The set of value types a CustomFieldDefinition can take.
 * Adding a new field type here is the ONLY code change needed to support
 * a new kind of data across every industry template - the schema itself
 * (custom_fields JSONB column) never changes.
 */
public enum FieldType {
    TEXT,
    NUMBER,
    DATE,
    BOOLEAN,
    DROPDOWN,       // options stored alongside the definition
    USER_REFERENCE, // points at an AppUser id, e.g. "licensed electrician"
    PHOTO,          // file/image reference, e.g. inspection evidence
    GEOLOCATION      // "lat,lng" or address string, e.g. job site / panel location
}

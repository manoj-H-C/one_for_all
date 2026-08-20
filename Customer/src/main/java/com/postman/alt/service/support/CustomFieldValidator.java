package com.postman.alt.service.support;

import com.postman.alt.entity.CustomFieldDefinition;
import com.postman.alt.exception.BadRequestException;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Validates a WorkItem.customFields map against the project's
 * CustomFieldDefinition catalog: unknown keys, missing required fields, and
 * values that don't match their declared FieldType are rejected here rather
 * than silently stored, since the JSONB column itself accepts anything.
 */
public final class CustomFieldValidator {

    private CustomFieldValidator() {
    }

    public static void validate(List<CustomFieldDefinition> definitions, Map<String, Object> values) {
        Map<String, CustomFieldDefinition> byName = definitions.stream()
                .collect(Collectors.toMap(CustomFieldDefinition::getName, d -> d));
        List<String> errors = new ArrayList<>();

        for (String key : values.keySet()) {
            if (!byName.containsKey(key)) {
                errors.add("Unknown custom field: " + key);
            }
        }

        for (CustomFieldDefinition definition : definitions) {
            Object value = values.get(definition.getName());
            if (value == null) {
                if (definition.isRequired()) {
                    errors.add(definition.getName() + " is required");
                }
                continue;
            }
            String typeError = checkType(definition, value);
            if (typeError != null) {
                errors.add(definition.getName() + " " + typeError);
            }
        }

        if (!errors.isEmpty()) {
            throw new BadRequestException(String.join("; ", errors));
        }
    }

    private static String checkType(CustomFieldDefinition definition, Object value) {
        return switch (definition.getFieldType()) {
            case TEXT, PHOTO, GEOLOCATION -> (value instanceof String s && !s.isBlank())
                    ? null : "must be a non-empty string";
            case NUMBER -> value instanceof Number ? null : "must be a number";
            case BOOLEAN -> value instanceof Boolean ? null : "must be true or false";
            case DATE -> checkDate(value);
            case DROPDOWN -> checkDropdown(definition, value);
            case USER_REFERENCE -> checkUserReference(value);
        };
    }

    private static String checkDate(Object value) {
        if (!(value instanceof String s)) {
            return "must be a date string (yyyy-MM-dd)";
        }
        try {
            LocalDate.parse(s);
            return null;
        } catch (DateTimeParseException e) {
            return "must be a valid ISO date (yyyy-MM-dd)";
        }
    }

    private static String checkDropdown(CustomFieldDefinition definition, Object value) {
        if (!(value instanceof String s)) {
            return "must be a string";
        }
        List<String> options = definition.getOptions();
        return (options != null && options.contains(s)) ? null : "must be one of " + options;
    }

    // format only, not existence - resolving every USER_REFERENCE against
    // AppUserRepository would mean an extra query per such field on every
    // work item write for what's mostly a display-time lookup.
    private static String checkUserReference(Object value) {
        if (!(value instanceof String s)) {
            return "must be a user id string";
        }
        try {
            UUID.fromString(s);
            return null;
        } catch (IllegalArgumentException e) {
            return "must be a valid user id (UUID)";
        }
    }
}

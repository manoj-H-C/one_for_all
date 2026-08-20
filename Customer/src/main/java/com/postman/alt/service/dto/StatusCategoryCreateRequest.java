package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * color is optional - omit it to have the backend auto-assign the next
 * palette color (round-robin, same behavior as before this was
 * configurable). When given, it must be one of WorkflowServiceImpl's known
 * palette keys.
 */
public record StatusCategoryCreateRequest(
        @NotBlank String name,
        String description,
        String color
) {
}

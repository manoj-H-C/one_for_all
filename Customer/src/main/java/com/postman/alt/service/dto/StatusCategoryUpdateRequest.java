package com.postman.alt.service.dto;

public record StatusCategoryUpdateRequest(
        String name,
        String description,
        String color
) {
}

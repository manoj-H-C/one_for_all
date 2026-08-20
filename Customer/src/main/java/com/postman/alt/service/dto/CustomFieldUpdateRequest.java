package com.postman.alt.service.dto;

import java.util.List;

public record CustomFieldUpdateRequest(
        String name,
        Boolean required,
        List<String> options
) {
}

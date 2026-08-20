package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.CustomFieldService;
import com.postman.alt.service.dto.CustomFieldCreateRequest;
import com.postman.alt.service.dto.CustomFieldResponse;
import com.postman.alt.service.dto.CustomFieldUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(path = "/api/projects/{projectId}/custom-fields", version = "1")
public class CustomFieldController {

    private final CustomFieldService customFieldService;

    public CustomFieldController(CustomFieldService customFieldService) {
        this.customFieldService = customFieldService;
    }

    @GetMapping
    public List<CustomFieldResponse> list(@PathVariable UUID projectId) {
        return customFieldService.list(projectId, CurrentUser.id());
    }

    @PostMapping
    public ResponseEntity<CustomFieldResponse> create(
            @PathVariable UUID projectId, @Valid @RequestBody CustomFieldCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                customFieldService.create(projectId, CurrentUser.id(), request)
        );
    }

    @PatchMapping("/{fieldId}")
    public CustomFieldResponse update(
            @PathVariable UUID projectId, @PathVariable UUID fieldId, @RequestBody CustomFieldUpdateRequest request
    ) {
        return customFieldService.update(projectId, fieldId, CurrentUser.id(), request);
    }

    @DeleteMapping("/{fieldId}")
    public ResponseEntity<Void> delete(@PathVariable UUID projectId, @PathVariable UUID fieldId) {
        customFieldService.delete(projectId, fieldId, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }
}

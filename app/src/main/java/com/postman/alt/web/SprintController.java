package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.SprintService;
import com.postman.alt.service.dto.SprintCreateRequest;
import com.postman.alt.service.dto.SprintResponse;
import com.postman.alt.service.dto.SprintUpdateRequest;
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
@RequestMapping(path = "/api/projects/{projectId}/sprints", version = "1")
public class SprintController {

    private final SprintService sprintService;

    public SprintController(SprintService sprintService) {
        this.sprintService = sprintService;
    }

    @GetMapping
    public List<SprintResponse> list(@PathVariable UUID projectId) {
        return sprintService.list(projectId, CurrentUser.id());
    }

    @PostMapping
    public ResponseEntity<SprintResponse> create(
            @PathVariable UUID projectId, @Valid @RequestBody SprintCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                sprintService.create(projectId, CurrentUser.id(), request)
        );
    }

    @PatchMapping("/{sprintId}")
    public SprintResponse update(
            @PathVariable UUID projectId, @PathVariable UUID sprintId, @RequestBody SprintUpdateRequest request
    ) {
        return sprintService.update(projectId, sprintId, CurrentUser.id(), request);
    }

    @DeleteMapping("/{sprintId}")
    public ResponseEntity<Void> delete(@PathVariable UUID projectId, @PathVariable UUID sprintId) {
        sprintService.delete(projectId, sprintId, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }
}

package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.WorkItemTypeService;
import com.postman.alt.service.dto.WorkItemTypeCreateRequest;
import com.postman.alt.service.dto.WorkItemTypeResponse;
import com.postman.alt.service.dto.WorkItemTypeUpdateRequest;
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
@RequestMapping(path = "/api/projects/{projectId}/work-item-types", version = "1")
public class WorkItemTypeController {

    private final WorkItemTypeService workItemTypeService;

    public WorkItemTypeController(WorkItemTypeService workItemTypeService) {
        this.workItemTypeService = workItemTypeService;
    }

    @GetMapping
    public List<WorkItemTypeResponse> list(@PathVariable UUID projectId) {
        return workItemTypeService.list(projectId, CurrentUser.id());
    }

    @PostMapping
    public ResponseEntity<WorkItemTypeResponse> create(
            @PathVariable UUID projectId, @Valid @RequestBody WorkItemTypeCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                workItemTypeService.create(projectId, CurrentUser.id(), request)
        );
    }

    @PatchMapping("/{typeId}")
    public WorkItemTypeResponse update(
            @PathVariable UUID projectId, @PathVariable UUID typeId, @RequestBody WorkItemTypeUpdateRequest request
    ) {
        return workItemTypeService.update(projectId, typeId, CurrentUser.id(), request);
    }

    @DeleteMapping("/{typeId}")
    public ResponseEntity<Void> delete(@PathVariable UUID projectId, @PathVariable UUID typeId) {
        workItemTypeService.delete(projectId, typeId, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }
}

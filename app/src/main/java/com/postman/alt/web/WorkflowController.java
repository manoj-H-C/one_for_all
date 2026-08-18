package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.WorkflowService;
import com.postman.alt.service.dto.StatusCategoryCreateRequest;
import com.postman.alt.service.dto.StatusCategoryResponse;
import com.postman.alt.service.dto.StatusCategoryUpdateRequest;
import com.postman.alt.service.dto.WorkflowStatusCreateRequest;
import com.postman.alt.service.dto.WorkflowStatusResponse;
import com.postman.alt.service.dto.WorkflowStatusUpdateRequest;
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
@RequestMapping(path = "/api/projects/{projectId}", version = "1")
public class WorkflowController {

    private final WorkflowService workflowService;

    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping("/status-categories")
    public List<StatusCategoryResponse> listCategories(@PathVariable UUID projectId) {
        return workflowService.listCategories(projectId, CurrentUser.id());
    }

    @PostMapping("/status-categories")
    public ResponseEntity<StatusCategoryResponse> createCategory(
            @PathVariable UUID projectId, @Valid @RequestBody StatusCategoryCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                workflowService.createCategory(projectId, CurrentUser.id(), request)
        );
    }

    @PatchMapping("/status-categories/{categoryId}")
    public StatusCategoryResponse updateCategory(
            @PathVariable UUID projectId, @PathVariable UUID categoryId, @RequestBody StatusCategoryUpdateRequest request
    ) {
        return workflowService.updateCategory(projectId, categoryId, CurrentUser.id(), request);
    }

    @DeleteMapping("/status-categories/{categoryId}")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID projectId, @PathVariable UUID categoryId) {
        workflowService.deleteCategory(projectId, categoryId, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/workflow-statuses")
    public List<WorkflowStatusResponse> listStatuses(@PathVariable UUID projectId) {
        return workflowService.listStatuses(projectId, CurrentUser.id());
    }

    @PostMapping("/workflow-statuses")
    public ResponseEntity<WorkflowStatusResponse> createStatus(
            @PathVariable UUID projectId, @Valid @RequestBody WorkflowStatusCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                workflowService.createStatus(projectId, CurrentUser.id(), request)
        );
    }

    @PatchMapping("/workflow-statuses/{statusId}")
    public WorkflowStatusResponse updateStatus(
            @PathVariable UUID projectId, @PathVariable UUID statusId, @RequestBody WorkflowStatusUpdateRequest request
    ) {
        return workflowService.updateStatus(projectId, statusId, CurrentUser.id(), request);
    }

    @DeleteMapping("/workflow-statuses/{statusId}")
    public ResponseEntity<Void> deleteStatus(@PathVariable UUID projectId, @PathVariable UUID statusId) {
        workflowService.deleteStatus(projectId, statusId, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }
}

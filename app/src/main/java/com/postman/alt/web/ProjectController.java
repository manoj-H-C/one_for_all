package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.ProjectService;
import com.postman.alt.service.dto.ProjectCreateRequest;
import com.postman.alt.service.dto.ProjectResponse;
import com.postman.alt.service.dto.ProjectUpdateRequest;
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
@RequestMapping(path = "/api/projects", version = "1")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> create(@Valid @RequestBody ProjectCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.create(CurrentUser.id(), request));
    }

    @GetMapping
    public List<ProjectResponse> list() {
        return projectService.listForOrg(CurrentUser.id());
    }

    @GetMapping("/{id}")
    public ProjectResponse get(@PathVariable UUID id) {
        return projectService.get(id, CurrentUser.id());
    }

    @PatchMapping("/{id}")
    public ProjectResponse update(@PathVariable UUID id, @RequestBody ProjectUpdateRequest request) {
        return projectService.update(id, CurrentUser.id(), request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        projectService.delete(id, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }
}

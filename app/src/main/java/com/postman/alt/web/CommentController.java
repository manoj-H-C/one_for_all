package com.postman.alt.web;

import com.postman.alt.security.CurrentUser;
import com.postman.alt.service.CommentService;
import com.postman.alt.service.dto.CommentCreateRequest;
import com.postman.alt.service.dto.CommentResponse;
import com.postman.alt.service.dto.CommentUpdateRequest;
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
@RequestMapping(version = "1")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/api/work-items/{workItemId}/comments")
    public List<CommentResponse> list(@PathVariable UUID workItemId) {
        return commentService.list(workItemId, CurrentUser.id());
    }

    @PostMapping("/api/work-items/{workItemId}/comments")
    public ResponseEntity<CommentResponse> create(
            @PathVariable UUID workItemId, @Valid @RequestBody CommentCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                commentService.create(workItemId, CurrentUser.id(), request)
        );
    }

    @PatchMapping("/api/comments/{commentId}")
    public CommentResponse update(@PathVariable UUID commentId, @Valid @RequestBody CommentUpdateRequest request) {
        return commentService.update(commentId, CurrentUser.id(), request);
    }

    @DeleteMapping("/api/comments/{commentId}")
    public ResponseEntity<Void> delete(@PathVariable UUID commentId) {
        commentService.delete(commentId, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }
}

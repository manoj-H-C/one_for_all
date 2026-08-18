package com.postman.alt.repository;

import com.postman.alt.entity.WorkItem;
import com.postman.alt.enums.Priority;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Composable filters for the work-item list/search endpoint. Kept separate
 * from WorkItemServiceImpl so the query-building logic (JPA Criteria) stays
 * out of the service's business logic.
 */
public final class WorkItemSpecifications {

    private WorkItemSpecifications() {
    }

    public static Specification<WorkItem> forListing(
            UUID projectId, UUID statusId, UUID assigneeId, Priority priority, String searchText
    ) {
        List<Specification<WorkItem>> specs = new ArrayList<>();
        specs.add((root, query, cb) -> cb.isNull(root.get("deletedAt")));
        specs.add((root, query, cb) -> cb.equal(root.get("project").get("id"), projectId));

        if (statusId != null) {
            specs.add((root, query, cb) -> cb.equal(root.get("status").get("id"), statusId));
        }
        if (assigneeId != null) {
            specs.add((root, query, cb) -> cb.equal(root.get("assignee").get("id"), assigneeId));
        }
        if (priority != null) {
            specs.add((root, query, cb) -> cb.equal(root.get("priority"), priority));
        }
        if (searchText != null && !searchText.isBlank()) {
            String pattern = "%" + searchText.trim().toLowerCase() + "%";
            specs.add((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)
            ));
        }

        return specs.stream().reduce(Specification::and).orElseThrow();
    }
}

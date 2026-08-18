package com.postman.alt.enums;

/**
 * Directed relation between two work items: (source, type, target). Kept as
 * one generic link table rather than a dedicated parent_id column so the
 * same mechanism covers subtasks, blocking, and duplicates across every
 * industry template.
 */
public enum WorkItemLinkType {
    // source is the parent of target (source is the epic/parent task, target the subtask)
    PARENT_OF,
    // source blocks target from proceeding
    BLOCKS,
    // source is a duplicate of target
    DUPLICATES,
    // non-directional catch-all association
    RELATES_TO
}

package com.postman.alt.enums;

/**
 * A stable bucket every custom WorkflowStatus name maps to.
 * "Rough-in" (electrical) and "In progress" (software) are both
 * StatusCategory.IN_PROGRESS - this is what lets the board UI and any
 * cross-project reporting logic work without knowing project-specific
 * status names.
 */
public enum StatusCategory {
    TODO,
    IN_PROGRESS,
    DONE
}

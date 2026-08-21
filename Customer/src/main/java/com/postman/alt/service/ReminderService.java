package com.postman.alt.service;

import com.postman.alt.service.dto.ReminderCreateRequest;
import com.postman.alt.service.dto.ReminderResponse;

import java.util.List;
import java.util.UUID;

/**
 * Personal "remind me about this work item" alarms - see Reminder's class
 * comment. Creating/listing a work item's reminders only needs the same
 * view access every other read on that item requires (requireMemberOrOwner)
 * - deliberately not a dedicated permission, since a reminder is a personal
 * utility for whoever's tracking the item, not a piece of shared content
 * like a comment.
 */
public interface ReminderService {

    // always the requester's own reminders on this item, never anyone
    // else's who's also set one.
    List<ReminderResponse> listForWorkItem(UUID workItemId, UUID requesterId);

    // the reminder's recipient is always the requester themselves.
    ReminderResponse create(UUID workItemId, UUID requesterId, ReminderCreateRequest request);

    // not tied to any work item - just "remind me to X", for the requester
    // themselves. No project/permission check applies since there's no
    // project context, same as listMine below.
    ReminderResponse createStandalone(UUID requesterId, ReminderCreateRequest request);

    // only the reminder's own recipient can edit it, and only while it's
    // still PENDING - editing when/what it says stops making sense once
    // it's already fired (SENT) or been cleared (DISMISSED).
    ReminderResponse update(UUID reminderId, UUID requesterId, ReminderCreateRequest request);

    // every reminder across every project the requester can see, sorted
    // soonest-first - statusFilter is an optional raw ReminderStatus name.
    List<ReminderResponse> listMine(UUID requesterId, String statusFilter);

    // only the reminder's own recipient can dismiss it.
    void dismiss(UUID reminderId, UUID requesterId);
}

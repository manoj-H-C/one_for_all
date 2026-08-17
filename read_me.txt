Still missing, worth prioritizing next:





Password reset / email verification tokens — AppUser has passwordHash but no way to run "forgot password" or "verify your email." Same shape problem as invitations (a token + expiry + purpose), so this is a fast follow-up now that you've got the pattern fresh.



Activity/audit log — nothing records who changed a work item's status/assignee/fields, or when. Gets harder to retrofit the more real data you accumulate.



Parent/child or generic relations on work_item — no way to express subtasks, "blocks," or "duplicate of" yet.



priority / due_date as native columns on WorkItem — currently only achievable via custom fields, meaning every project template has to redefine them separately.



Notifications — no record of what a user should be alerted about (assigned, mentioned, status changed).






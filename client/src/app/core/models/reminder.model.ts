export const REMINDER_STATUSES = ['PENDING', 'SENT', 'DISMISSED'] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export interface ReminderResponse {
  id: string;
  // null for a standalone reminder - not tied to any work item
  workItemId: string | null;
  workItemTitle: string | null;
  projectId: string | null;
  projectName: string | null;
  // always populated - the work item's title, or the reminder's own for a standalone one
  title: string;
  remindAt: string;
  note: string | null;
  status: ReminderStatus;
  createdAt: string;
}

export interface ReminderCreateRequest {
  remindAt: string;
  note?: string | null;
  // only read for a standalone reminder (ReminderService.createStandalone) - ignored when scoped to a work item
  title?: string | null;
}

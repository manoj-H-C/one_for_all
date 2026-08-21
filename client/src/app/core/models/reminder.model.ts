export const REMINDER_STATUSES = ['PENDING', 'SENT', 'DISMISSED'] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export interface ReminderResponse {
  id: string;
  workItemId: string;
  workItemTitle: string;
  projectId: string;
  projectName: string;
  remindAt: string;
  note: string | null;
  status: ReminderStatus;
  createdAt: string;
}

export interface ReminderCreateRequest {
  remindAt: string;
  note?: string | null;
}

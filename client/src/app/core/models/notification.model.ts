import { NotificationType } from './common.model';

export interface NotificationResponse {
  id: string;
  workItemId: string;
  actorId: string;
  actorName: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}

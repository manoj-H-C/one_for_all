import { WorkItemLinkType } from './common.model';

export interface WorkItemLinkResponse {
  id: string;
  sourceWorkItemId: string;
  targetWorkItemId: string;
  linkType: WorkItemLinkType;
  createdById: string;
  createdAt: string;
}

export interface WorkItemLinkCreateRequest {
  targetWorkItemId: string;
  linkType: WorkItemLinkType;
}

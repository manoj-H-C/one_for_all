export interface Page<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  status: number;
  message: string;
  data: T | null;
  timestamp: string;
}

export interface ApiError {
  status: number;
  message: string;
}

export const PRIORITIES = ['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const FIELD_TYPES = [
  'TEXT',
  'NUMBER',
  'DATE',
  'BOOLEAN',
  'DROPDOWN',
  'USER_REFERENCE',
  'PHOTO',
  'GEOLOCATION',
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const WORK_ITEM_LINK_TYPES = ['PARENT_OF', 'BLOCKS', 'DUPLICATES', 'RELATES_TO'] as const;
export type WorkItemLinkType = (typeof WORK_ITEM_LINK_TYPES)[number];

export const NOTIFICATION_TYPES = [
  'ASSIGNED',
  'MENTIONED',
  'STATUS_CHANGED',
  'COMMENT_ADDED',
  'SUPPLY_REQUEST_APPROVED',
  'SUPPLY_REQUEST_REJECTED',
  'SUPPLY_REQUEST_FULFILLED',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

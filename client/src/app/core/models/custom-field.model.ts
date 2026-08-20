import { FieldType } from './common.model';

export interface CustomFieldResponse {
  id: string;
  projectId: string;
  name: string;
  fieldType: FieldType;
  required: boolean;
  options: string[] | null;
}

export interface CustomFieldCreateRequest {
  name: string;
  fieldType: FieldType;
  required: boolean;
  options?: string[] | null;
}

export interface CustomFieldUpdateRequest {
  name?: string | null;
  required?: boolean | null;
  options?: string[] | null;
}

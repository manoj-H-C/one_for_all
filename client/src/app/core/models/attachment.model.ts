export interface AttachmentResponse {
  id: string;
  workItemId: string;
  fileUrl: string;
  fileName: string | null;
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
}

export interface AttachmentCreateRequest {
  fileUrl: string;
  fileName?: string | null;
}

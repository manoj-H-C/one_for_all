export interface CommentResponse {
  id: string;
  workItemId: string;
  authorId: string;
  authorName: string;
  body: string;
  timecodeMs: number | null;
  mentionedUserIds: string[];
  createdAt: string;
}

export interface CommentCreateRequest {
  body: string;
  timecodeMs?: number | null;
  // optional - picked from an autocomplete client-side, each must be an
  // existing member of the work item's project. Mentioned members get a
  // notification when the comment is created.
  mentionedUserIds?: string[];
}

export interface CommentUpdateRequest {
  body: string;
}

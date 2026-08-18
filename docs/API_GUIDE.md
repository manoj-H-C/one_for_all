# jeera_alt API Guide

A step-by-step walk-through of every endpoint, in the order you'd realistically call them building a frontend against this API: register → set up a project → invite people → configure the workflow → work with items.

## 0. Before you start

**Base URL:** `http://localhost:8090` (see `app/src/main/resources/application.yml`, `server.port`)

**Encryption — read this first.** By default (`ENCRYPTION_ENABLED=true`), every request/response body on `/api/*` is wrapped in AES-GCM and carried as `{"data": "<base64>"}`, not plain JSON. For local frontend development, start the backend with encryption off so you can work with plain JSON like every example below:

```bash
# from the app/ directory
ENCRYPTION_ENABLED=false mvn spring-boot:run
```

Re-enable it (drop the env var, or set it `true`) before shipping anywhere real — see `common-service/.../AesGcmEncryptionService`.

**Auth header.** Every endpoint except the ones marked *public* below requires:

```
Authorization: Bearer <accessToken>
```

**API version header (optional).** `X-API-Version: 1` — not required, defaults to `1`.

**Response envelope.** Every response, success or error, is wrapped the same way:

```json
{
  "success": true,
  "status": 200,
  "message": "OK",
  "data": { "...": "the actual payload, shown unwrapped in every example below" },
  "timestamp": "2026-08-18T14:30:44.007192Z"
}
```

On error, `success` is `false`, `data` is `null`, and `message` holds a human-readable reason:

```json
{ "success": false, "status": 400, "message": "title: must not be blank", "data": null, "timestamp": "..." }
```

| Status | Meaning here |
|---|---|
| 400 | Bad request body / invalid value |
| 401 | Missing/expired/invalid token |
| 403 | Authenticated, but not allowed to do this |
| 404 | Doesn't exist (or you can't see it) |
| 409 | Conflicts with existing data (duplicate key, still-referenced row) |
| 429 | Rate-limited (login/forgot-password) |
| 500 | Unexpected server error |

**Pagination shape.** Endpoints that return a page (`Page<T>` — work items, activity, notifications) return this shape instead of a bare array. `content` is what you render; the rest drives your pager:

```json
{
  "content": [ "...items..." ],
  "number": 0,
  "size": 20,
  "totalElements": 5,
  "totalPages": 1,
  "first": true,
  "last": true,
  "numberOfElements": 5,
  "empty": false
}
```
Query params: `?page=0&size=20&sort=createdAt,desc`.

---

## 1. Authentication

### 1.1 Register *(public)*

Creates a brand-new organization plus its first user, who becomes that org's owner. There's no separate "create org" call — registering *is* creating one.

```
POST /api/auth/register
Content-Type: application/json
```
```json
{
  "orgName": "Acme Electrical",
  "name": "Jane Doe",
  "email": "jane@acme.com",
  "password": "Password123!"
}
```
**201** →
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": "fbd07931-4f8e-4bbf-a345-13b9a239eb92",
  "orgId": "d24cef30-7bfe-4361-9296-37eb93e1115d",
  "email": "jane@acme.com",
  "name": "Jane Doe"
}
```
Store both tokens. Access token is short-lived (15 min); refresh token lasts 30 days (see `jwt.*` in `application.yml`).

### 1.2 Login *(public)*

```
POST /api/auth/login
```
```json
{ "email": "jane@acme.com", "password": "Password123!" }
```
**200** → same shape as register's response.

5 failed attempts for the same email locks it out for 15 minutes (**429**): `{"message": "Too many failed login attempts. Try again in a few minutes."}`.

### 1.3 Refresh token *(public)*

```
POST /api/auth/refresh
```
```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiJ9..." }
```
**200** → a fresh `{accessToken, refreshToken, ...}` pair (same shape as login).

### 1.4 Get current user

```
GET /api/auth/me
Authorization: Bearer <accessToken>
```
**200** →
```json
{
  "id": "fbd07931-4f8e-4bbf-a345-13b9a239eb92",
  "orgId": "d24cef30-7bfe-4361-9296-37eb93e1115d",
  "email": "jane@acme.com",
  "name": "Jane Doe",
  "owner": true,
  "canCreateProjects": false,
  "emailVerified": false,
  "createdAt": "2026-08-18T14:30:44Z"
}
```
Use `owner`/`canCreateProjects`/`canManageMembers` client-side to show/hide org-admin UI (the "New Project" button, the org members screen, etc.) — most other authorization is per-project role, not these flags. See §1.7–1.13 for what these mean and how they're granted.

### 1.5 Email verification (optional to wire up first)

```
POST /api/auth/resend-verification      Authorization: Bearer <accessToken>, no body → 202
POST /api/auth/verify-email             (public)
```
```json
{ "token": "the-token-from-the-verification-email" }
```
**204** on success. (Locally, since there's no email provider wired up yet, the token is only logged server-side — check the console.)

### 1.6 Forgot / reset password

```
POST /api/auth/forgot-password          (public)
```
```json
{ "email": "jane@acme.com" }
```
**202** always (doesn't reveal whether the email exists). Rate-limited to 1 request/60s per email. Again, the reset token is only server-logged locally.

```
POST /api/auth/reset-password           (public)
```
```json
{ "token": "the-token-from-the-reset-email", "newPassword": "NewPassword456!" }
```
**204** — and this invalidates every access/refresh token issued before the reset.

### 1.7 Organizations: who can do what

Every org starts with exactly one person — whoever ran §1.1 — who is its `owner`. An org only ever grows by the owner (or a delegated admin) inviting people in directly; there's no self-serve way to join an existing org. Two independent flags an owner can delegate to other members:

| Flag | Grants | Who can grant it |
|---|---|---|
| `canCreateProjects` | Create new projects (§2.1) | Owner, or anyone with `canManageMembers` |
| `canManageMembers` | Invite new org members, list members, grant `canCreateProjects` to others | **Owner only** — deliberately not delegable further, so admin power can't chain outward uncontrolled |

### 1.8 List organization members

Owner or a `canManageMembers` admin only.

```
GET /api/organizations/members
```
**200** →
```json
[
  { "id": "5d27...", "name": "Owner", "email": "owner@acme.com", "owner": true, "canCreateProjects": false, "canManageMembers": false, "createdAt": "..." },
  { "id": "c320...", "name": "Admin Person", "email": "admin@acme.com", "owner": false, "canCreateProjects": false, "canManageMembers": true, "createdAt": "..." }
]
```

### 1.9 Grant/revoke project-creation access

Owner or a `canManageMembers` admin. `userId` must belong to the same org (**404** otherwise — not 403, so it doesn't confirm whether that id exists elsewhere).

```
PATCH /api/users/{userId}/project-creation-access
```
```json
{ "canCreateProjects": true }
```
**204**

### 1.10 Grant/revoke member-management access

**Owner only**, regardless of who's asking.

```
PATCH /api/users/{userId}/member-management-access
```
```json
{ "canManageMembers": true }
```
**204**

### 1.11 Invite someone to the organization

Owner or a `canManageMembers` admin. Decide their starting access level up front (adjustable later via §1.9/§1.10). Fails **409** if the email already has an account *anywhere* — a person can only ever belong to one org, so an existing account can't be pulled into a different one.

```
POST /api/organizations/invitations
```
```json
{ "email": "newperson@acme.com", "canCreateProjects": true, "canManageMembers": false }
```
**201** →
```json
{
  "id": "13f0d806-ab1e-4679-8133-50dd944ba450",
  "orgId": "d24cef30-7bfe-4361-9296-37eb93e1115d",
  "email": "newperson@acme.com",
  "invitedById": "5d27c29a-a320-4e0f-9d76-6f43bb111934",
  "canCreateProjects": true,
  "canManageMembers": false,
  "status": "PENDING",
  "expiresAt": "2026-08-25T16:21:04Z",
  "createdAt": "2026-08-18T16:21:04Z"
}
```
Token never returned (same rationale as project invitations) — locally, grab it from the server console log.

### 1.12 List / revoke organization invitations

```
GET    /api/organizations/invitations                       → 200, [ {...OrganizationInvitationResponse} ]  (pending only)
DELETE /api/organizations/invitations/{invitationId}         → 204
```

### 1.13 Accept an organization invitation *(public)*

Unlike accepting a *project* invitation (§4.3), the invited person has no account yet — this call creates one, under the inviting org, and logs them straight in.

```
POST /api/organizations/invitations/{token}/accept
```
```json
{ "name": "New Person", "password": "Password123!" }
```
**201** → an `AuthResponse` (same shape as §1.1's register response) — store the tokens, they're logged in immediately.

---

## 2. Projects

### 2.1 Create a project

Also seeds an "Admin" role (every permission) with you as its first member, plus a To Do / In Progress / Done workflow — a new project is immediately usable. Requires org ownership or a delegated `canCreateProjects` flag (§1.7) — **403** otherwise.

```
POST /api/projects
Authorization: Bearer <accessToken>
```
```json
{ "name": "Substation Rewire", "key": "SUB", "templateType": "electrical" }
```
`key` must be unique per org; `templateType` is a free-text label only (no behavior currently keys off it).

**201** →
```json
{
  "id": "6674c543-ad37-4531-b470-646159fbbf0a",
  "orgId": "d24cef30-7bfe-4361-9296-37eb93e1115d",
  "name": "Substation Rewire",
  "key": "SUB",
  "templateType": "electrical",
  "itemDisplayNameSingular": "Work item",
  "itemDisplayNamePlural": "Work items",
  "createdAt": "2026-08-18T14:31:09Z"
}
```

### 2.2 List projects (in your org)

```
GET /api/projects
```
**200** → `[ {...ProjectResponse}, ... ]`

### 2.3 Get a project

```
GET /api/projects/{projectId}
```
**200** → single `ProjectResponse` (same shape as 2.1). **404** if it doesn't exist, isn't yours, or was deleted.

### 2.4 Update a project

Requires the `PROJECT_MANAGE` permission (org owners always have it; other members need a role granting it — see §3). Only non-null fields are applied; `key` can't be changed once set.

```
PATCH /api/projects/{projectId}
```
```json
{ "name": "Substation Rewire — Phase 2", "itemDisplayNameSingular": "Ticket", "itemDisplayNamePlural": "Tickets" }
```
**200** → updated `ProjectResponse`.

### 2.5 Delete a project

Also requires `PROJECT_MANAGE`. Soft-delete — the project and its data survive, just become inaccessible via the API.

```
DELETE /api/projects/{projectId}
```
**204**

---

## 3. Roles & permissions

Every project gets a seeded "Admin" role with every permission. Build more roles ("Electrician", "Client Viewer", ...) by picking from the fixed permission catalog.

### 3.1 List the permission catalog

```
GET /api/permissions
```
**200** →
```json
[
  { "code": "WORK_ITEM_CREATE", "description": "Create new work items" },
  { "code": "WORK_ITEM_EDIT", "description": "Edit existing work items" },
  { "code": "WORK_ITEM_DELETE", "description": "Delete work items" },
  { "code": "WORK_ITEM_ASSIGN", "description": "Assign work items to members" },
  { "code": "COMMENT_CREATE", "description": "Add comments" },
  { "code": "MEMBER_INVITE", "description": "Invite new members to the project" },
  { "code": "MEMBER_REMOVE", "description": "Remove members from the project" },
  { "code": "ROLE_MANAGE", "description": "Create/edit roles and their permissions" },
  { "code": "WORKFLOW_MANAGE", "description": "Add/edit workflow statuses" },
  { "code": "CUSTOM_FIELD_MANAGE", "description": "Add/edit custom field definitions" },
  { "code": "PROJECT_MANAGE", "description": "Rename or delete this project" }
]
```
Use this to build a permissions checklist UI when creating/editing a role.

### 3.2 List roles

```
GET /api/projects/{projectId}/roles
```
**200** →
```json
[
  {
    "id": "9fc42257-ed6e-452e-8200-10bffe6a6798",
    "projectId": "6674c543-ad37-4531-b470-646159fbbf0a",
    "name": "Admin",
    "description": "Full access to this project",
    "permissionCodes": ["WORK_ITEM_CREATE", "WORK_ITEM_EDIT", "..."]
  }
]
```

### 3.3 Create a role

Requires `ROLE_MANAGE`. Starts with no permissions granted.

```
POST /api/projects/{projectId}/roles
```
```json
{ "name": "Electrician", "description": "Field technician" }
```
**201** → `RoleResponse` (same shape as 3.2, `permissionCodes: []`).

### 3.4 Grant permissions to a role

Full replace, not additive — send the complete set you want the role to have.

```
PUT /api/projects/{projectId}/roles/{roleId}/permissions
```
```json
{ "permissionCodes": ["WORK_ITEM_CREATE", "WORK_ITEM_EDIT", "COMMENT_CREATE"] }
```
**200** → updated `RoleResponse`.

### 3.5 Update a role's name/description

```
PATCH /api/projects/{projectId}/roles/{roleId}
```
```json
{ "name": "Senior Electrician", "description": "Field lead" }
```
**200** → updated `RoleResponse`.

### 3.6 Delete a role

Requires `ROLE_MANAGE`; fails with **409** if any member still holds it.

```
DELETE /api/projects/{projectId}/roles/{roleId}
```
**204**

---

## 4. Members & invitations

Adding someone to a project always goes through an invitation, even for people who already have an account — there's no direct "add member" call.

### 4.1 Invite someone by email

Requires `MEMBER_INVITE`.

```
POST /api/projects/{projectId}/invitations
```
```json
{ "email": "bob@acme.com", "roleId": "9fc42257-ed6e-452e-8200-10bffe6a6798" }
```
**201** →
```json
{
  "id": "d7e2dd07-14c5-4a55-9585-d3ed72e6691e",
  "projectId": "6674c543-ad37-4531-b470-646159fbbf0a",
  "email": "bob@acme.com",
  "roleId": "9fc42257-ed6e-452e-8200-10bffe6a6798",
  "roleName": "Electrician",
  "status": "PENDING",
  "expiresAt": "2026-08-25T15:02:25Z",
  "createdAt": "2026-08-18T15:02:25Z"
}
```
Note: the invite **token itself is never returned** (by design — it's delivered out-of-band). Locally, no email provider is wired up yet, so grab it from the server console log.

### 4.2 List pending invitations

Requires `MEMBER_INVITE`.

```
GET /api/projects/{projectId}/invitations
```
**200** → `[ {...InvitationResponse}, ... ]` (pending only)

### 4.3 Accept an invitation

Called by the **invited person**, logged in as themselves, with the token from the invite email/log. Their account email must match the invitation's email exactly.

```
POST /api/invitations/{token}/accept
Authorization: Bearer <invited user's accessToken>
```
**200** →
```json
{
  "userId": "5a976328-3ee2-4320-a321-45c131f49b75",
  "name": "Bob Smith",
  "email": "bob@acme.com",
  "roleId": "9fc42257-ed6e-452e-8200-10bffe6a6798",
  "roleName": "Electrician"
}
```

### 4.4 Revoke an invitation

```
DELETE /api/projects/{projectId}/invitations/{invitationId}
```
**204**

### 4.5 List members

```
GET /api/projects/{projectId}/members
```
**200** →
```json
[
  { "userId": "fbd07931-...", "name": "Jane Doe", "email": "jane@acme.com", "roleId": "9fc4...", "roleName": "Admin" }
]
```

### 4.6 Change a member's role

Requires `MEMBER_INVITE` (re-assigning a role uses the same permission as inviting).

```
PATCH /api/projects/{projectId}/members/{userId}
```
```json
{ "roleId": "a-different-role-id" }
```
**200** → updated `MemberResponse`.

### 4.7 Remove a member

Requires `MEMBER_REMOVE`.

```
DELETE /api/projects/{projectId}/members/{userId}
```
**204**

---

## 5. Workflow: statuses & categories

Every board column is a `WorkflowStatus` (free-text name, e.g. "Rough-in", "Awaiting Parts"), mapped onto a stable `StatusCategory` bucket (e.g. "To Do"/"In Progress"/"Done") so board grouping/coloring stays consistent even with fully custom status names. New projects get 3 categories + 3 statuses seeded automatically (§2.1).

### 5.1 List status categories

```
GET /api/projects/{projectId}/status-categories
```
**200** → `[ { "id": "...", "projectId": "...", "name": "To Do", "description": null }, ... ]`

### 5.2 Create a status category

Requires `WORKFLOW_MANAGE`.

```
POST /api/projects/{projectId}/status-categories
```
```json
{ "name": "Blocked", "description": "Waiting on something external" }
```
**201** → `StatusCategoryResponse`.

### 5.3 Update / 5.4 Delete a status category

```
PATCH /api/projects/{projectId}/status-categories/{categoryId}   { "name": "...", "description": "..." }   → 200
DELETE /api/projects/{projectId}/status-categories/{categoryId}                                            → 204
```

### 5.5 List workflow statuses

```
GET /api/projects/{projectId}/workflow-statuses
```
**200** →
```json
[
  { "id": "adc4...", "projectId": "6674...", "name": "To Do", "sortOrder": 0, "categoryId": "...", "categoryName": "To Do" }
]
```
Sorted by `sortOrder` — use that for column order on a board.

### 5.6 Create a workflow status

Requires `WORKFLOW_MANAGE`.

```
POST /api/projects/{projectId}/workflow-statuses
```
```json
{ "name": "Awaiting Parts", "sortOrder": 1, "categoryId": "the-category-id" }
```
**201** → `WorkflowStatusResponse`.

### 5.7 Update / 5.8 Delete a workflow status

```
PATCH /api/projects/{projectId}/workflow-statuses/{statusId}   { "name": "...", "sortOrder": 2, "categoryId": "..." }  → 200
DELETE /api/projects/{projectId}/workflow-statuses/{statusId}                                                          → 204
```
Delete fails with **409** if any (non-deleted) work item is still on that status.

---

## 6. Custom fields

The mechanism that lets one generic `WorkItem` cover any industry: per-project field definitions, stored as JSON on the work item. See §7.6 for exactly how values are validated.

### 6.1 List custom field definitions

```
GET /api/projects/{projectId}/custom-fields
```
**200** →
```json
[
  { "id": "c32f...", "projectId": "...", "name": "voltage", "fieldType": "TEXT", "required": true, "options": null },
  { "id": "ca94...", "projectId": "...", "name": "type", "fieldType": "DROPDOWN", "required": true, "options": ["Bug", "Task", "Story"] }
]
```

### 6.2 Create a custom field

Requires `CUSTOM_FIELD_MANAGE`. `fieldType` is one of: `TEXT`, `NUMBER`, `DATE`, `BOOLEAN`, `DROPDOWN`, `USER_REFERENCE`, `PHOTO`, `GEOLOCATION`. `options` only applies to `DROPDOWN`.

```
POST /api/projects/{projectId}/custom-fields
```
```json
{ "name": "type", "fieldType": "DROPDOWN", "required": true, "options": ["Bug", "Task", "Story", "Epic"] }
```
**201** → `CustomFieldResponse` (same shape as 6.1's items).

### 6.3 Update / 6.4 Delete a custom field

```
PATCH /api/projects/{projectId}/custom-fields/{fieldId}   { "name": "...", "required": false, "options": [...] }   → 200
DELETE /api/projects/{projectId}/custom-fields/{fieldId}                                                            → 204
```

---

## 7. Work items

The core resource — a generic Bug/Task/Lead/Punch-List-Item/Shot depending on the project.

### 7.1 Create a work item

Requires `WORK_ITEM_CREATE`. `statusId` optional (defaults to the project's first status by `sortOrder`); `priority` optional (defaults `MEDIUM`; one of `LOWEST`,`LOW`,`MEDIUM`,`HIGH`,`HIGHEST`); `assigneeId` optional but **must be an existing member of this project** — assigning an outsider is rejected with 400.

```
POST /api/projects/{projectId}/work-items
```
```json
{
  "title": "Replace breaker panel",
  "description": "Panel is arcing intermittently",
  "statusId": "adc4c41c-c27c-4be9-be61-0181c7e4b11d",
  "assigneeId": "fbd07931-4f8e-4bbf-a345-13b9a239eb92",
  "priority": "HIGH",
  "dueDate": "2026-09-01",
  "customFields": { "voltage": "240V", "permit_number": "EL-2026-0143", "type": "Bug" }
}
```
**201** →
```json
{
  "id": "e7dfaf11-87c6-42dc-860f-ed861eae2310",
  "projectId": "6674c543-ad37-4531-b470-646159fbbf0a",
  "statusId": "adc4c41c-c27c-4be9-be61-0181c7e4b11d",
  "statusName": "To Do",
  "assigneeId": "fbd07931-4f8e-4bbf-a345-13b9a239eb92",
  "reporterId": "fbd07931-4f8e-4bbf-a345-13b9a239eb92",
  "title": "Replace breaker panel",
  "description": "Panel is arcing intermittently",
  "priority": "HIGH",
  "dueDate": "2026-09-01",
  "customFields": { "voltage": "240V", "permit_number": "EL-2026-0143", "type": "Bug" },
  "createdAt": "2026-08-18T14:51:10Z",
  "updatedAt": "2026-08-18T14:51:10Z"
}
```
`customFields` is validated against §6's definitions: unknown keys rejected, required fields enforced, values type-checked (dropdown values must be one of `options`, etc.) — a **400** with a joined message on any violation, e.g. `"voltage is required; type must be one of [Bug, Task, Story]"`.

### 7.2 List / search / filter / paginate work items

```
GET /api/projects/{projectId}/work-items?statusId=...&assigneeId=...&priority=HIGH&q=breaker&page=0&size=20&sort=createdAt,desc
```
All query params optional. `q` does a case-insensitive substring match on title **or** description.

**200** → the [pagination shape](#0-before-you-start) from §0, `content` full of `WorkItemResponse` (same shape as 7.1's response).

### 7.3 Get a single work item

```
GET /api/work-items/{id}
```
**200** → `WorkItemResponse`. **404** if deleted or you're not a project member.

### 7.4 Update title/description/priority/dueDate/customFields

Requires `WORK_ITEM_EDIT`. Partial update — omit fields you're not changing.

```
PATCH /api/work-items/{id}
```
```json
{ "priority": "HIGHEST", "customFields": { "type": "Task" } }
```
**200** → updated `WorkItemResponse`.

**Important: `customFields` merges, it doesn't replace.** The example above only changes `type` — `voltage` and `permit_number` from 7.1 are left untouched. To *clear* a field, send it explicitly as `null`:
```json
{ "customFields": { "permit_number": null } }
```
If that would leave a `required` field empty, you'll get a **400** instead.

### 7.5 Change status (drag between board columns)

Separate endpoint from 7.4 because it has its own side effects (activity log entry + a notification to the assignee).

```
PATCH /api/work-items/{id}/status
```
```json
{ "statusId": "the-target-status-id" }
```
**200** → updated `WorkItemResponse`.

### 7.6 Reassign

Requires `WORK_ITEM_ASSIGN`. `assigneeId: null` unassigns. Same project-membership check as create.

```
PATCH /api/work-items/{id}/assignee
```
```json
{ "assigneeId": "the-new-assignee-user-id" }
```
**200** → updated `WorkItemResponse`.

### 7.7 Delete

Requires `WORK_ITEM_DELETE`. Soft-delete — comments/attachments/links/activity history all survive, the item just disappears from the API.

```
DELETE /api/work-items/{id}
```
**204**

### 7.8 Activity history

Every field change (`title`, `status`, `assignee`, etc.) is logged automatically — this is your audit trail / activity feed UI.

```
GET /api/work-items/{id}/activity?page=0&size=20
```
**200** → paginated, `content` full of:
```json
{
  "id": "...", "actorId": "...", "actorName": "Jane Doe",
  "fieldName": "status", "oldValue": "To Do", "newValue": "In Progress",
  "createdAt": "2026-08-18T15:00:00Z"
}
```

---

## 8. Comments

```
GET    /api/work-items/{workItemId}/comments                                → 200, [ {...CommentResponse} ]
POST   /api/work-items/{workItemId}/comments   (needs COMMENT_CREATE)        → 201
PATCH  /api/comments/{commentId}               (author only)                 → 200
DELETE /api/comments/{commentId}               (author only)                 → 204
```
Create/update body:
```json
{ "body": "Confirmed the arc fault, ordering a replacement breaker.", "timecodeMs": null }
```
`timecodeMs` is optional — set it to anchor a comment to a moment in a video attachment (milliseconds), otherwise omit/null for a regular comment.

Response shape:
```json
{
  "id": "...", "workItemId": "...", "authorId": "...", "authorName": "Jane Doe",
  "body": "Confirmed the arc fault, ordering a replacement breaker.",
  "timecodeMs": null, "createdAt": "2026-08-18T15:05:00Z"
}
```

---

## 9. Attachments

The API only stores a **reference** to a file — your frontend uploads the actual bytes to your own blob storage (S3, etc.) first, then registers the resulting URL here.

```
GET    /api/work-items/{workItemId}/attachments                       → 200, [ {...AttachmentResponse} ]
POST   /api/work-items/{workItemId}/attachments  (needs WORK_ITEM_EDIT) → 201
DELETE /api/attachments/{attachmentId}  (uploader, or WORK_ITEM_EDIT)   → 204
```
Create body:
```json
{ "fileUrl": "https://your-bucket.example.com/uploads/panel-photo.jpg", "fileName": "panel-photo.jpg" }
```
Response shape:
```json
{
  "id": "...", "workItemId": "...", "fileUrl": "https://.../panel-photo.jpg", "fileName": "panel-photo.jpg",
  "uploadedById": "...", "uploadedByName": "Jane Doe", "createdAt": "2026-08-18T15:06:00Z"
}
```

---

## 10. Work item links

Directed relations between two work items — subtasks, blockers, duplicates all use this one mechanism.

```
GET    /api/work-items/{workItemId}/links                            → 200, [ {...WorkItemLinkResponse} ]
POST   /api/work-items/{workItemId}/links  (needs WORK_ITEM_EDIT)     → 201
DELETE /api/work-items/{workItemId}/links/{linkId}                    → 204
```
Create body — `linkType` is one of `PARENT_OF`, `BLOCKS`, `DUPLICATES`, `RELATES_TO`:
```json
{ "targetWorkItemId": "the-other-work-item-id", "linkType": "BLOCKS" }
```
Response shape:
```json
{
  "id": "...", "sourceWorkItemId": "...", "targetWorkItemId": "...",
  "linkType": "BLOCKS", "createdById": "...", "createdAt": "2026-08-18T15:07:00Z"
}
```

---

## 11. Notifications

Fired automatically for you — on assignment (§7.1, §7.6) and status changes (§7.5). Types: `ASSIGNED`, `MENTIONED`, `STATUS_CHANGED`, `COMMENT_ADDED` (the last two aren't wired up as triggers yet beyond status).

```
GET   /api/notifications?unread=false&page=0&size=20
PATCH /api/notifications/{id}/read
PATCH /api/notifications/read-all
```
List response: the [pagination shape](#0-before-you-start), `content` full of:
```json
{
  "id": "...", "workItemId": "...", "actorId": "...", "actorName": "Jane Doe",
  "type": "ASSIGNED", "message": "You were assigned to \"Replace breaker panel\"",
  "read": false, "createdAt": "2026-08-18T15:08:00Z"
}
```
Mark-read endpoints return **204** with no body.

---

## A realistic first end-to-end session

1. `POST /api/auth/register` → save `accessToken`/`refreshToken`
2. `POST /api/projects` → save `id` as `projectId`, note the auto-created "To Do" status and "Admin" role
3. `GET /api/projects/{projectId}/workflow-statuses` → grab a `statusId` for step 5
4. `POST /api/projects/{projectId}/custom-fields` → define whatever fields your project's industry needs
5. `POST /api/projects/{projectId}/work-items` → create your first item
6. `GET /api/projects/{projectId}/work-items` → render the board, grouped by `statusName`
7. `PATCH /api/work-items/{id}/status` → drag a card to a new column
8. `POST /api/work-items/{workItemId}/comments` → add a comment
9. `GET /api/notifications?unread=true` → badge count for the bell icon

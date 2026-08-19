export type WorkspaceMemberRole = "editor";

export type WorkspaceMemberProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceMemberRole;
  joined_at: string;
  created_at: string;
  profile: WorkspaceMemberProfile | null;
};

export type AddWorkspaceMemberInput = {
  workspaceId: string;
  userId: string;
  role?: WorkspaceMemberRole;
};

export type UpdateWorkspaceMemberRoleInput = {
  memberId: string;
  role: WorkspaceMemberRole;
};

export type WorkspaceInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired";

export type WorkspaceInvitation = {
  id: string;
  workspace_id: string;
  inviter_id: string;
  invitee_email: string;
  role: WorkspaceMemberRole;
  token: string;
  status: WorkspaceInvitationStatus;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  workspace?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
};

export type CreateWorkspaceInvitationInput = {
  workspaceId: string;
  inviteeEmail: string;
  role?: WorkspaceMemberRole;
};

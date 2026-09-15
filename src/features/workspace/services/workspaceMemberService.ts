import { supabase } from "@/lib/supabase";

import type {
  AddWorkspaceMemberInput,
  UpdateWorkspaceMemberRoleInput,
  WorkspaceInvitation,
  WorkspaceInvitationStatus,
  WorkspaceMember,
  WorkspaceMemberRole,
} from "../types/workspaceMember.types";

const MEMBER_SELECT = `
  id,
  workspace_id,
  user_id,
  role,
  joined_at,
  created_at,
  profile:profiles (
    id,
    email,
    full_name,
    avatar_url
  )
`;

const INVITATION_SELECT = `
  id,
  workspace_id,
  inviter_id,
  invitee_email,
  role,
  token,
  status,
  expires_at,
  accepted_at,
  created_at,
  workspace:workspaces (
    id,
    name,
    description
  )
`;

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
};

type WorkspaceRow = {
  id: string;
  name: string;
  description: string | null;
};

type MemberRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  created_at: string;
  profile: ProfileRow | ProfileRow[] | null;
};

type InvitationRow = {
  id: string;
  workspace_id: string;
  inviter_id: string;
  invitee_email: string;
  role: string;
  token: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  workspace: WorkspaceRow | WorkspaceRow[] | null;
};

function normalizeProfile(profile: MemberRow["profile"]): ProfileRow | null {
  if (Array.isArray(profile)) {
    return profile[0] ?? null;
  }

  return profile;
}

function normalizeWorkspace(
  workspace: InvitationRow["workspace"],
): WorkspaceRow | null {
  if (Array.isArray(workspace)) {
    return workspace[0] ?? null;
  }

  return workspace;
}

function mapMember(row: MemberRow): WorkspaceMember {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    user_id: row.user_id,
    role: row.role as WorkspaceMemberRole,
    joined_at: row.joined_at,
    created_at: row.created_at,
    profile: normalizeProfile(row.profile),
  };
}

function mapInvitation(row: InvitationRow): WorkspaceInvitation {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    inviter_id: row.inviter_id,
    invitee_email: row.invitee_email,
    role: row.role as WorkspaceMemberRole,
    token: row.token,
    status: row.status as WorkspaceInvitationStatus,
    expires_at: row.expires_at,
    accepted_at: row.accepted_at,
    created_at: row.created_at,
    workspace: normalizeWorkspace(row.workspace),
  };
}

export const workspaceMemberService = {
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const [workspaceResult, membersResult] = await Promise.all([
      supabase
        .from("workspaces")
        .select("id, owner_id")
        .eq("id", workspaceId)
        .maybeSingle(),
      supabase
        .from("workspace_members")
        .select(MEMBER_SELECT)
        .eq("workspace_id", workspaceId)
        .order("created_at", {
          ascending: true,
        }),
    ]);

    if (membersResult.error) {
      throw new Error(membersResult.error.message);
    }

    const members = ((membersResult.data ?? []) as MemberRow[]).map(mapMember);

    const ownerId = workspaceResult.data?.owner_id;
    if (ownerId && !members.some((m) => m.user_id === ownerId)) {
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url")
        .eq("id", ownerId)
        .maybeSingle();

      if (ownerProfile) {
        members.unshift({
          id: `owner-${ownerId}`,
          workspace_id: workspaceId,
          user_id: ownerId,
          role: "owner" as WorkspaceMemberRole,
          joined_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          profile: {
            id: ownerProfile.id,
            email: ownerProfile.email,
            full_name: ownerProfile.full_name,
            avatar_url: ownerProfile.avatar_url,
          },
        });
      }
    }

    return members;
  },

  async addMember({
    workspaceId,
    userId,
    role = "editor",
  }: AddWorkspaceMemberInput): Promise<WorkspaceMember> {
    const { data, error } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role,
      })
      .select(MEMBER_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapMember(data as MemberRow);
  },

  async updateMemberRole({
    memberId,
    role,
  }: UpdateWorkspaceMemberRoleInput): Promise<WorkspaceMember> {
    const { data, error } = await supabase
      .from("workspace_members")
      .update({
        role,
      })
      .eq("id", memberId)
      .select(MEMBER_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapMember(data as MemberRow);
  },

  async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      throw new Error(error.message);
    }
  },

  async searchUsers(query: string): Promise<ProfileRow[]> {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return [];
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id,
        email,
        full_name,
        avatar_url
      `,
      )
      .or(`email.ilike.%${trimmedQuery}%,full_name.ilike.%${trimmedQuery}%`)
      .order("full_name", {
        ascending: true,
      })
      .limit(10);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as ProfileRow[];
  },

  async getMember(
    workspaceId: string,
    memberId: string,
  ): Promise<WorkspaceMember | null> {
    const { data, error } = await supabase
      .from("workspace_members")
      .select(MEMBER_SELECT)
      .eq("workspace_id", workspaceId)
      .eq("id", memberId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return mapMember(data as MemberRow);
  },

  async isMember(workspaceId: string, userId: string): Promise<boolean> {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("owner_id")
      .eq("id", workspaceId)
      .maybeSingle();

    if (ws?.owner_id === userId) {
      return true;
    }

    const { data, error } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return !!data;
  },

  async getCurrentUserRole(
    workspaceId: string,
  ): Promise<WorkspaceMemberRole | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: ws } = await supabase
      .from("workspaces")
      .select("owner_id")
      .eq("id", workspaceId)
      .maybeSingle();

    if (ws?.owner_id === user.id) {
      return "owner";
    }

    const { data, error } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data?.role as WorkspaceMemberRole) ?? null;
  },

  async createInvitation({
    workspaceId,
    inviteeEmail,
    role = "editor",
  }: {
    workspaceId: string;
    inviteeEmail: string;
    role?: WorkspaceMemberRole;
  }): Promise<WorkspaceInvitation> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(userError.message);
    }

    if (!user) {
      throw new Error("User is not authenticated.");
    }

    const email = inviteeEmail.trim().toLowerCase();

    if (!email) {
      throw new Error("Email member wajib diisi.");
    }

    const { data, error } = await supabase
      .from("workspace_invitations")
      .insert({
        workspace_id: workspaceId,
        inviter_id: user.id,
        invitee_email: email,
        role,
      })
      .select(INVITATION_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapInvitation(data as InvitationRow);
  },

  async getWorkspaceInvitations(
    workspaceId: string,
  ): Promise<WorkspaceInvitation[]> {
    const { data, error } = await supabase
      .from("workspace_invitations")
      .select(INVITATION_SELECT)
      .eq("workspace_id", workspaceId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as InvitationRow[]).map(mapInvitation);
  },

  async getMyInvitations(): Promise<WorkspaceInvitation[]> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(userError.message);
    }

    if (!user?.email) {
      return [];
    }

    const { data, error } = await supabase
      .from("workspace_invitations")
      .select(INVITATION_SELECT)
      .eq("status", "pending")
      .ilike("invitee_email", user.email)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as InvitationRow[]).map(mapInvitation);
  },

  async acceptInvitation(invitationId: string): Promise<void> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(userError.message);
    }

    if (!user) {
      throw new Error("User is not authenticated.");
    }

    // 1. Coba panggil RPC accept_workspace_invitation
    let rpcSucceeded = false;
    try {
      const { data, error } = await supabase.rpc(
        "accept_workspace_invitation",
        {
          p_invitation_id: invitationId,
        },
      );

      if (!error && (data === null || data?.success !== false)) {
        rpcSucceeded = true;
        return;
      }
      if (error && !error.message.includes("Could not find the function")) {
        // Jika RPC ada tapi melempar error spesifik
        throw new Error(error.message);
      }
    } catch (rpcErr: any) {
      if (
        rpcErr?.message &&
        !rpcErr.message.includes("Could not find the function") &&
        !rpcErr.message.includes("function public.accept_workspace_invitation")
      ) {
        throw rpcErr;
      }
    }

    // 2. Fallback: Langsung lakukan insert ke workspace_members dan update workspace_invitations
    if (!rpcSucceeded) {
      const { data: invitation, error: fetchError } = await supabase
        .from("workspace_invitations")
        .select("workspace_id, role, invitee_email")
        .eq("id", invitationId)
        .single();

      if (fetchError || !invitation) {
        throw new Error(
          fetchError?.message || "Data undangan tidak ditemukan.",
        );
      }

      // Masukkan member
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: invitation.workspace_id,
          user_id: user.id,
          role: invitation.role || "member",
        });

      if (
        memberError &&
        !memberError.message.toLowerCase().includes("unique") &&
        !memberError.message.toLowerCase().includes("duplicate")
      ) {
        throw new Error(memberError.message);
      }

      // Update status undangan
      const { error: updateError } = await supabase
        .from("workspace_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invitationId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }
  },

  async declineInvitation(invitationId: string): Promise<void> {
    // 1. Coba panggil RPC decline_workspace_invitation
    try {
      const { data, error } = await supabase.rpc(
        "decline_workspace_invitation",
        {
          p_invitation_id: invitationId,
        },
      );

      if (!error && (data === null || data?.success !== false)) {
        return;
      }
    } catch {
      // lanjut ke fallback direct update
    }

    // 2. Fallback direct update
    const { error } = await supabase
      .from("workspace_invitations")
      .update({
        status: "declined",
      })
      .eq("id", invitationId);

    if (error) {
      throw new Error(error.message);
    }
  },

  async cancelInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from("workspace_invitations")
      .update({
        status: "cancelled",
      })
      .eq("id", invitationId);

    if (error) {
      throw new Error(error.message);
    }
  },
};


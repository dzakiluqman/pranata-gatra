import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { workspaceMemberService } from "../services/workspaceMemberService";

export function useWorkspaceMembers(workspaceId: string) {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: () => workspaceMemberService.getMembers(workspaceId),
    enabled: !!workspaceId,
  });

  const invitationsQuery = useQuery({
    queryKey: ["workspace-invitations", workspaceId],
    queryFn: () => workspaceMemberService.getWorkspaceInvitations(workspaceId),
    enabled: !!workspaceId,
  });

  const inviteMutation = useMutation({
    mutationFn: ({ email }: { email: string }) =>
      workspaceMemberService.createInvitation({
        workspaceId,
        inviteeEmail: email,
        role: "editor",
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-invitations", workspaceId],
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) =>
      workspaceMemberService.removeMember(memberId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      });
    },
  });

  return {
    members: membersQuery.data ?? [],
    invitations: invitationsQuery.data ?? [],
    isLoading: membersQuery.isLoading || invitationsQuery.isLoading,
    error: membersQuery.error ?? invitationsQuery.error ?? null,
    inviteMember: inviteMutation.mutateAsync,
    removeMember: removeMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

export function useMyWorkspaceInvitations() {
  const queryClient = useQueryClient();

  const invitationsQuery = useQuery({
    queryKey: ["my-workspace-invitations"],
    queryFn: () => workspaceMemberService.getMyInvitations(),
  });

  const acceptMutation = useMutation({
    mutationFn: (invitationId: string) =>
      workspaceMemberService.acceptInvitation(invitationId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["my-workspace-invitations"],
      });

      queryClient.invalidateQueries({
        queryKey: ["workspaces"],
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (invitationId: string) =>
      workspaceMemberService.declineInvitation(invitationId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["my-workspace-invitations"],
      });
    },
  });

  return {
    invitations: invitationsQuery.data ?? [],
    isLoading: invitationsQuery.isLoading,
    error: invitationsQuery.error ?? null,
    acceptInvitation: acceptMutation.mutateAsync,
    declineInvitation: declineMutation.mutateAsync,
    isAccepting: acceptMutation.isPending,
    isDeclining: declineMutation.isPending,
  };
}

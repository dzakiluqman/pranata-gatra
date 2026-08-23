import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { subjectService } from "../services/subjectService";

import type {
  CreateSubjectInput,
  UpdateSubjectInput,
} from "../types/subject.types";

export function useSubjects(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["subjects", "workspace", workspaceId],
    queryFn: () => subjectService.getByWorkspace(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useSubject(subjectId: string | undefined) {
  return useQuery({
    queryKey: ["subjects", "detail", subjectId],
    queryFn: () => subjectService.getById(subjectId!),
    enabled: !!subjectId,
  });
}

export function useSubjectMutation() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (input: CreateSubjectInput) => subjectService.create(input),

    onSuccess: (subject) => {
      queryClient.invalidateQueries({
        queryKey: ["subjects", "workspace", subject.workspace_id],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      subjectId,
      input,
    }: {
      subjectId: string;
      input: UpdateSubjectInput;
    }) => subjectService.update(subjectId, input),

    onSuccess: (subject) => {
      queryClient.invalidateQueries({
        queryKey: ["subjects", "workspace", subject.workspace_id],
      });

      queryClient.invalidateQueries({
        queryKey: ["subjects", "detail", subject.id],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (subjectId: string) => subjectService.remove(subjectId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subjects"],
      });

      queryClient.invalidateQueries({
        queryKey: ["schedules"],
      });
    },
  });

  return {
    createSubject: createMutation.mutateAsync,
    updateSubject: updateMutation.mutateAsync,
    deleteSubject: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

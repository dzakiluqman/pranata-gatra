import { useMutation, useQueryClient } from "@tanstack/react-query";

import { scheduleService } from "../services/scheduleService";

import type {
  CreateScheduleInput,
  UpdateScheduleInput,
} from "../types/schedule.types";

export function useSchedule() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (input: CreateScheduleInput) => scheduleService.create(input),

    onSuccess: (schedule) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: ["schedules", "workspace", schedule.workspaceId],
      });

      queryClient.invalidateQueries({
        queryKey: ["schedules", "subject", schedule.subjectId],
      });

      queryClient.invalidateQueries({
        queryKey: ["schedules", "today"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateScheduleInput) => scheduleService.update(input),

    onSuccess: (schedule) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: ["schedules", "workspace", schedule.workspaceId],
      });

      queryClient.invalidateQueries({
        queryKey: ["schedules", "subject", schedule.subjectId],
      });

      queryClient.invalidateQueries({
        queryKey: ["schedules", "today"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (scheduleId: string) => scheduleService.remove(scheduleId),

    onSuccess: () => {
      // Invalidate all schedule queries since we don't know which subject/workspace was affected
      queryClient.invalidateQueries({
        queryKey: ["schedules"],
      });
    },
  });

  return {
    createSchedule: createMutation.mutateAsync,
    updateSchedule: updateMutation.mutateAsync,
    deleteSchedule: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

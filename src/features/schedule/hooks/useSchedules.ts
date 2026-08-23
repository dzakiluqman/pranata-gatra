import { useQuery } from "@tanstack/react-query";

import { scheduleService } from "../services/scheduleService";

export function useSchedules(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["schedules", "workspace", workspaceId],
    queryFn: () => scheduleService.getByWorkspace(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useSubjectSchedules(subjectId: string | undefined) {
  return useQuery({
    queryKey: ["schedules", "subject", subjectId],
    queryFn: () => scheduleService.getBySubject(subjectId!),
    enabled: !!subjectId,
  });
}

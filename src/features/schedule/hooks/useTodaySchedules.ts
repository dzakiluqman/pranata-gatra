import { useQuery } from "@tanstack/react-query";

import { scheduleService } from "../services/scheduleService";

import type { TodaySchedule } from "../types/schedule.types";

import { getTodayDateString, isScheduleOnDate } from "../utils/recurrence";

export function useTodaySchedules(workspaceId: string | undefined) {
  const today = getTodayDateString();

  return useQuery({
    queryKey: ["schedules", "today", workspaceId, today],

    queryFn: async (): Promise<TodaySchedule[]> => {
      const schedules = await scheduleService.getByWorkspace(workspaceId!);

      const now = new Date();

      return schedules
        .filter((schedule) => isScheduleOnDate(schedule, now))
        .map((schedule) => {
          const start = new Date(`${today}T${schedule.startTime}`);
          const end = new Date(`${today}T${schedule.endTime}`);

          return {
            ...schedule,
            occurrenceDate: today,
            isStarted: now >= start,
            isFinished: now >= end,
            isUpcoming: now < start,
          };
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    },

    enabled: !!workspaceId,

    refetchInterval: 60_000,
  });
}

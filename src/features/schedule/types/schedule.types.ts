export type RecurrenceUnit = "day" | "week" | "month";

export interface Schedule {
  occurrenceDate: string;
  id: string;
  subjectId: string;
  workspaceId: string;
  startDate: string;
  startTime: string;
  endTime: string;
  recurrenceEnabled: boolean;
  recurrenceInterval: number;
  recurrenceUnit: RecurrenceUnit;
  recurrenceEndDate: string | null;
  reminderEnabled: boolean;
  reminderMinutes: number;
  createdAt: string;
  updatedAt: string;
  subject?: {
    id: string;
    name: string;
    lecturer: string | null;
    room: string | null;
  };
}

export interface CreateScheduleInput {
  subjectId: string;
  workspaceId: string;
  startDate: string;
  startTime: string;
  endTime: string;
  recurrenceEnabled?: boolean;
  recurrenceInterval?: number;
  recurrenceUnit?: RecurrenceUnit;
  recurrenceEndDate?: string | null;
  reminderEnabled?: boolean;
  reminderMinutes?: number;
}

export interface UpdateScheduleInput {
  id: string;
  startDate?: string;
  startTime?: string;
  endTime?: string;
  recurrenceEnabled?: boolean;
  recurrenceInterval?: number;
  recurrenceUnit?: RecurrenceUnit;
  recurrenceEndDate?: string | null;
  reminderEnabled?: boolean;
  reminderMinutes?: number;
}

export interface ScheduleWithOccurrence extends Schedule {
  occurrenceDate: string;
}

export interface TodaySchedule extends ScheduleWithOccurrence {
  isStarted: boolean;
  isFinished: boolean;
  isUpcoming: boolean;
}

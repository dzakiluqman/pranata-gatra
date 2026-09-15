import { supabase } from "@/lib/supabase";

import type {
  CreateScheduleInput,
  Schedule,
  UpdateScheduleInput,
} from "../types/schedule.types";

function mapSchedule(row: any): Schedule {
  const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject;

  return {
    id: row.id,
    subjectId: row.subject_id,
    workspaceId: row.workspace_id,
    occurrenceDate: row.occurrence_date ?? row.start_date ?? "",
    startDate: row.start_date,
    startTime: row.start_time,
    endTime: row.end_time,
    recurrenceEnabled: row.recurrence_enabled,
    recurrenceInterval: row.recurrence_interval,
    recurrenceUnit: row.recurrence_unit,
    recurrenceEndDate: row.recurrence_end_date,
    reminderEnabled: row.reminder_enabled,
    reminderMinutes: row.reminder_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    subject: subject
      ? {
          id: subject.id,
          name: subject.name,
          lecturer: subject.lecturer,
          room: subject.room,
        }
      : undefined,
  };
}

const scheduleSelect = `
  id,
  subject_id,
  workspace_id,
  start_date,
  start_time,
  end_time,
  recurrence_enabled,
  recurrence_interval,
  recurrence_unit,
  recurrence_end_date,
  reminder_enabled,
  reminder_minutes,
  created_at,
  updated_at,
  subject:subjects (
    id,
    name,
    lecturer,
    room
  )
`;

export const scheduleService = {
  async getById(scheduleId: string): Promise<Schedule> {
    const { data, error } = await supabase
      .from("subject_schedules")
      .select(scheduleSelect)
      .eq("id", scheduleId)
      .single();

    if (error) {
      throw error;
    }

    return mapSchedule(data);
  },

  async getBySubject(subjectId: string): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from("subject_schedules")
      .select(scheduleSelect)
      .eq("subject_id", subjectId)
      .order("start_date", {
        ascending: true,
      })
      .order("start_time", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapSchedule);
  },

  async getByWorkspace(workspaceId: string): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from("subject_schedules")
      .select(scheduleSelect)
      .eq("workspace_id", workspaceId)
      .order("start_date", {
        ascending: true,
      })
      .order("start_time", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapSchedule);
  },

  async create(input: CreateScheduleInput): Promise<Schedule> {
    const insertPayload: Record<string, any> = {
      subject_id: input.subjectId,
      workspace_id: input.workspaceId,
      start_date: input.startDate,
      start_time: input.startTime,
      end_time: input.endTime,
      recurrence_enabled: input.recurrenceEnabled ?? false,
      recurrence_interval: input.recurrenceInterval ?? 1,
      recurrence_unit: input.recurrenceUnit ?? "week",
      recurrence_end_date: input.recurrenceEndDate || null,
      reminder_enabled: input.reminderEnabled ?? false,
      reminder_minutes: input.reminderMinutes ?? 60,
    };

    const { data, error } = await supabase
      .from("subject_schedules")
      .insert(insertPayload)
      .select(scheduleSelect)
      .single();

    if (error) {
      // Jika join select gagal, coba dengan select(*) sederhana
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("subject_schedules")
        .insert(insertPayload)
        .select("*")
        .single();

      if (fallbackError) {
        throw new Error(fallbackError.message || error.message);
      }

      return mapSchedule(fallbackData);
    }

    return mapSchedule(data);
  },


  async update(input: UpdateScheduleInput): Promise<Schedule> {
    const updateData: Record<string, unknown> = {};

    if (input.startDate !== undefined) {
      updateData.start_date = input.startDate;
    }

    if (input.startTime !== undefined) {
      updateData.start_time = input.startTime;
    }

    if (input.endTime !== undefined) {
      updateData.end_time = input.endTime;
    }

    if (input.recurrenceEnabled !== undefined) {
      updateData.recurrence_enabled = input.recurrenceEnabled;
    }

    if (input.recurrenceInterval !== undefined) {
      updateData.recurrence_interval = input.recurrenceInterval;
    }

    if (input.recurrenceUnit !== undefined) {
      updateData.recurrence_unit = input.recurrenceUnit;
    }

    if (input.recurrenceEndDate !== undefined) {
      updateData.recurrence_end_date = input.recurrenceEndDate;
    }

    if (input.reminderEnabled !== undefined) {
      updateData.reminder_enabled = input.reminderEnabled;
    }

    if (input.reminderMinutes !== undefined) {
      updateData.reminder_minutes = input.reminderMinutes;
    }

    const { data, error } = await supabase
      .from("subject_schedules")
      .update(updateData)
      .eq("id", input.id)
      .select(scheduleSelect)
      .single();

    if (error) {
      throw error;
    }

    return mapSchedule(data);
  },

  async remove(scheduleId: string): Promise<void> {
    const { error } = await supabase
      .from("subject_schedules")
      .delete()
      .eq("id", scheduleId);

    if (error) {
      throw error;
    }
  },
};

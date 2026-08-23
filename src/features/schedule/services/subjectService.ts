import { supabase } from "@/lib/supabase";

import type {
  CreateSubjectInput,
  Subject,
  UpdateSubjectInput,
} from "../types/subject.types";

const subjectSelect = `
  id,
  workspace_id,
  name,
  description,
  lecturer,
  room,
  reminder_enabled,
  reminder_minutes,
  created_at,
  updated_at
`;

function mapSubject(row: any): Subject {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    name: row.name,
    description: row.description,
    lecturer: row.lecturer,
    room: row.room,
    reminder_enabled: row.reminder_enabled,
    reminder_minutes: row.reminder_minutes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const subjectService = {
  async getById(subjectId: string): Promise<Subject> {
    const { data, error } = await supabase
      .from("subjects")
      .select(subjectSelect)
      .eq("id", subjectId)
      .single();

    if (error) {
      throw error;
    }

    return mapSubject(data);
  },

  async getByWorkspace(workspaceId: string): Promise<Subject[]> {
    const { data, error } = await supabase
      .from("subjects")
      .select(subjectSelect)
      .eq("workspace_id", workspaceId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapSubject);
  },

  async create(input: CreateSubjectInput): Promise<Subject> {
    const { data, error } = await supabase
      .from("subjects")
      .insert({
        workspace_id: input.workspaceId,
        name: input.name,
        description: input.description ?? null,
        lecturer: input.lecturer ?? null,
        room: input.room ?? null,
        reminder_enabled: input.reminderEnabled ?? false,
        reminder_minutes: input.reminderMinutes ?? 60,
      })
      .select(subjectSelect)
      .single();

    if (error) {
      throw error;
    }

    return mapSubject(data);
  },

  async update(subjectId: string, input: UpdateSubjectInput): Promise<Subject> {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.lecturer !== undefined) {
      updateData.lecturer = input.lecturer;
    }

    if (input.room !== undefined) {
      updateData.room = input.room;
    }

    if (input.reminderEnabled !== undefined) {
      updateData.reminder_enabled = input.reminderEnabled;
    }

    if (input.reminderMinutes !== undefined) {
      updateData.reminder_minutes = input.reminderMinutes;
    }

    const { data, error } = await supabase
      .from("subjects")
      .update(updateData)
      .eq("id", subjectId)
      .select(subjectSelect)
      .single();

    if (error) {
      throw error;
    }

    return mapSubject(data);
  },

  async remove(subjectId: string): Promise<void> {
    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", subjectId);

    if (error) {
      throw error;
    }
  },
};

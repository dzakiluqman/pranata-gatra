export interface Subject {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  lecturer: string | null;
  room: string | null;
  reminder_enabled: boolean;
  reminder_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSubjectInput {
  workspaceId: string;
  name: string;
  description?: string | null;
  lecturer?: string | null;
  room?: string | null;
  reminderEnabled?: boolean;
  reminderMinutes?: number;
}

export interface UpdateSubjectInput {
  name?: string;
  description?: string | null;
  lecturer?: string | null;
  room?: string | null;
  reminderEnabled?: boolean;
  reminderMinutes?: number;
}

export type TaskStatus = "pending" | "in_progress" | "completed";

export type TaskPriority = "critical" | "high" | "medium" | "low" | "none";

export interface Task {
  id: string;
  workspace_id: string;
  subject_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  deadline: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskWithRelations extends Task {
  workspace?: {
    id: string;
    name: string;
  } | null;
  subject?: {
    id: string;
    name: string;
    lecturer?: string | null;
    room?: string | null;
  } | null;
  assignee?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface CreateTaskInput {
  workspace_id: string;
  subject_id?: string | null;
  assigned_to?: string | null;
  title: string;
  description?: string | null;
  deadline?: string | null;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  id: string;
  subject_id?: string | null;
  assigned_to?: string | null;
  title?: string;
  description?: string | null;
  deadline?: string | null;
  status?: TaskStatus;
}

export interface TaskFilters {
  workspaceId?: string;
  subjectId?: string;
  assignedTo?: string;
  status?: TaskStatus | "all";
  search?: string;
  deadline?: "all" | "overdue" | "today" | "upcoming" | "none";
}

export interface TaskPriorityInfo {
  priority: TaskPriority;
  label: string;
  description: string;
}

export interface TaskFormValues {
  title: string;
  description: string;
  workspace_id: string;
  subject_id: string | null;
  assigned_to: string | null;
  deadline: string | null;
}

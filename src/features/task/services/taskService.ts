import { supabase } from "@/lib/supabase";
import type {
    CreateTaskInput,
    TaskFilters,
    TaskStatus,
    TaskWithRelations,
    UpdateTaskInput
} from "../types/task.types";

const TASK_SELECT = `
  *,
  workspace:workspaces (
    id,
    name
  ),
  subject:subjects (
    id,
    name,
    lecturer,
    room
  ),
  assignee:profiles!tasks_assigned_to_fkey (
    id,
    email,
    full_name,
    avatar_url
  )
`;

function mapTask(data: any): TaskWithRelations {
  return {
    id: data.id,
    workspace_id: data.workspace_id,
    subject_id: data.subject_id,
    assigned_to: data.assigned_to,
    title: data.title,
    description: data.description,
    status: data.status,
    deadline: data.deadline,
    completed_at: data.completed_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
    workspace: data.workspace ?? null,
    subject: data.subject ?? null,
    assignee: data.assignee ?? null,
  };
}

function applyDeadlineFilter(query: any, deadline?: TaskFilters["deadline"]) {
  if (!deadline || deadline === "all") {
    return query;
  }

  const now = new Date();

  if (deadline === "none") {
    return query.is("deadline", null);
  }

  if (deadline === "overdue") {
    return query
      .not("deadline", "is", null)
      .lt("deadline", now.toISOString())
      .neq("status", "completed");
  }

  if (deadline === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return query
      .gte("deadline", start.toISOString())
      .lte("deadline", end.toISOString());
  }

  if (deadline === "upcoming") {
    return query.not("deadline", "is", null).gte("deadline", now.toISOString());
  }

  return query;
}

export async function getTasks(
  filters: TaskFilters = {},
): Promise<TaskWithRelations[]> {
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .order("deadline", {
      ascending: true,
      nullsFirst: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (filters.workspaceId) {
    query = query.eq("workspace_id", filters.workspaceId);
  }

  if (filters.subjectId) {
    query = query.eq("subject_id", filters.subjectId);
  }

  if (filters.assignedTo) {
    query = query.eq("assigned_to", filters.assignedTo);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.search?.trim()) {
    const search = filters.search.trim().replace(/[%(),]/g, "");

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
  }

  query = applyDeadlineFilter(query, filters.deadline);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Gagal mengambil task: ${error.message}`);
  }

  return (data ?? []).map(mapTask);
}

export async function getTaskById(taskId: string): Promise<TaskWithRelations> {
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("id", taskId)
    .single();

  if (error) {
    throw new Error(`Gagal mengambil task: ${error.message}`);
  }

  return mapTask(data);
}

export async function getTasksByWorkspace(
  workspaceId: string,
): Promise<TaskWithRelations[]> {
  return getTasks({
    workspaceId,
  });
}

export async function getTasksBySubject(
  subjectId: string,
): Promise<TaskWithRelations[]> {
  return getTasks({
    subjectId,
  });
}

export async function getTasksByAssignee(
  assignedTo: string,
): Promise<TaskWithRelations[]> {
  return getTasks({
    assignedTo,
  });
}

export async function getMyTasks(
  userId: string,
  filters: Omit<TaskFilters, "assignedTo"> = {},
): Promise<TaskWithRelations[]> {
  return getTasks({
    ...filters,
    assignedTo: userId,
  });
}

async function validateSubjectBelongsToWorkspace(
  subjectId: string,
  workspaceId: string,
) {
  const { data: subject, error } = await supabase
    .from("subjects")
    .select("id, workspace_id")
    .eq("id", subjectId)
    .maybeSingle();

  if (error || !subject || subject.workspace_id !== workspaceId) {
    throw new Error(
      "Subject yang dipilih tidak valid atau tidak berasal dari workspace ini.",
    );
  }
}

async function validateAssigneeBelongsToWorkspace(
  userId: string,
  workspaceId: string,
) {
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, owner_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspace?.owner_id === userId) {
    return;
  }

  const { data: member, error } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !member) {
    throw new Error(
      "Assignee yang dipilih bukan merupakan member dari workspace ini.",
    );
  }
}

export async function createTask(
  input: CreateTaskInput,
): Promise<TaskWithRelations> {
  if (input.subject_id) {
    await validateSubjectBelongsToWorkspace(input.subject_id, input.workspace_id);
  }

  if (input.assigned_to) {
    await validateAssigneeBelongsToWorkspace(input.assigned_to, input.workspace_id);
  }

  const payload = {
    workspace_id: input.workspace_id,
    subject_id: input.subject_id ?? null,
    assigned_to: input.assigned_to ?? null,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    deadline: input.deadline ?? null,
    status: input.status ?? "pending",
    completed_at:
      input.status === "completed" ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(payload)
    .select(TASK_SELECT)
    .single();

  if (error) {
    throw new Error(`Gagal membuat task: ${error.message}`);
  }

  return mapTask(data);
}

export async function updateTask(
  input: UpdateTaskInput,
): Promise<TaskWithRelations> {
  const { data: existingTask, error: fetchError } = await supabase
    .from("tasks")
    .select("id, workspace_id, subject_id, assigned_to")
    .eq("id", input.id)
    .single();

  if (fetchError || !existingTask) {
    throw new Error("Task tidak ditemukan.");
  }

  const targetWorkspaceId = input.workspace_id ?? existingTask.workspace_id;

  if (input.subject_id !== undefined && input.subject_id !== null) {
    await validateSubjectBelongsToWorkspace(input.subject_id, targetWorkspaceId);
  }

  if (input.assigned_to !== undefined && input.assigned_to !== null) {
    await validateAssigneeBelongsToWorkspace(input.assigned_to, targetWorkspaceId);
  }

  const updates: Record<string, unknown> = {};

  if (input.workspace_id !== undefined) {
    updates.workspace_id = input.workspace_id;
  }

  if (input.title !== undefined) {
    updates.title = input.title.trim();
  }

  if (input.description !== undefined) {
    updates.description = input.description?.trim() || null;
  }

  if (input.subject_id !== undefined) {
    updates.subject_id = input.subject_id;
  }

  if (input.assigned_to !== undefined) {
    updates.assigned_to = input.assigned_to;
  }

  if (input.deadline !== undefined) {
    updates.deadline = input.deadline;
  }

  if (input.status !== undefined) {
    updates.status = input.status;

    if (input.status === "completed") {
      updates.completed_at = new Date().toISOString();
    } else {
      updates.completed_at = null;
    }
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", input.id)
    .select(TASK_SELECT)
    .single();

  if (error) {
    throw new Error(`Gagal memperbarui task: ${error.message}`);
  }

  return mapTask(data);
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    throw new Error(`Gagal menghapus task: ${error.message}`);
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<TaskWithRelations> {
  const completedAt = status === "completed" ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select(TASK_SELECT)
    .single();

  if (error) {
    throw new Error(`Gagal memperbarui status task: ${error.message}`);
  }

  return mapTask(data);
}

export async function completeTask(taskId: string): Promise<TaskWithRelations> {
  return updateTaskStatus(taskId, "completed");
}

export async function reopenTask(taskId: string): Promise<TaskWithRelations> {
  return updateTaskStatus(taskId, "pending");
}

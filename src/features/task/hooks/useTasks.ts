import { useQuery } from "@tanstack/react-query";
import {
    getMyTasks,
    getTasks,
    getTasksBySubject,
    getTasksByWorkspace,
} from "../services/taskService";
import type { TaskFilters } from "../types/task.types";

export const taskKeys = {
  all: ["tasks"] as const,

  lists: () => [...taskKeys.all, "list"] as const,

  list: (filters: TaskFilters = {}) => [...taskKeys.lists(), filters] as const,

  workspace: (workspaceId: string) =>
    [...taskKeys.all, "workspace", workspaceId] as const,

  subject: (subjectId: string) =>
    [...taskKeys.all, "subject", subjectId] as const,

  mine: (userId: string, filters: TaskFilters = {}) =>
    [...taskKeys.all, "mine", userId, filters] as const,
};

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => getTasks(filters),
  });
}

export function useWorkspaceTasks(workspaceId?: string) {
  return useQuery({
    queryKey: workspaceId ? taskKeys.workspace(workspaceId) : taskKeys.lists(),
    queryFn: () => getTasksByWorkspace(workspaceId!),
    enabled: Boolean(workspaceId),
  });
}

export function useSubjectTasks(subjectId?: string) {
  return useQuery({
    queryKey: subjectId ? taskKeys.subject(subjectId) : taskKeys.lists(),
    queryFn: () => getTasksBySubject(subjectId!),
    enabled: Boolean(subjectId),
  });
}

export function useMyTasks(
  userId?: string,
  filters: Omit<TaskFilters, "assignedTo"> = {},
) {
  return useQuery({
    queryKey: userId ? taskKeys.mine(userId, filters) : taskKeys.lists(),
    queryFn: () => getMyTasks(userId!, filters),
    enabled: Boolean(userId),
  });
}

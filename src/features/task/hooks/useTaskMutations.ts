import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    completeTask,
    createTask,
    deleteTask,
    reopenTask,
    updateTask,
    updateTaskStatus,
} from "../services/taskService";

import type {
    CreateTaskInput,
    TaskStatus,
    UpdateTaskInput,
} from "../types/task.types";

import { taskKeys } from "./useTasks";

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.all,
      });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTaskInput) => updateTask(input),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: [...taskKeys.all, "detail", variables.id],
      });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.all,
      });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      updateTaskStatus(taskId, status),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.all,
      });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => completeTask(taskId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.all,
      });
    },
  });
}

export function useReopenTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => reopenTask(taskId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.all,
      });
    },
  });
}

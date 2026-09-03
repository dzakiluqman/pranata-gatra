import { useQuery } from "@tanstack/react-query";
import { getTaskById } from "../services/taskService";
import { taskKeys } from "./useTasks";

export function useTask(taskId?: string) {
  return useQuery({
    queryKey: taskId
      ? [...taskKeys.all, "detail", taskId]
      : [...taskKeys.all, "detail"],
    queryFn: () => getTaskById(taskId!),
    enabled: Boolean(taskId),
  });
}

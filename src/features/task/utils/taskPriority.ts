import type { TaskPriority, TaskPriorityInfo } from "../types/task.types";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getTaskPriority(deadline: string | null): TaskPriority {
  if (!deadline) {
    return "none";
  }

  const deadlineTime = new Date(deadline).getTime();

  if (Number.isNaN(deadlineTime)) {
    return "none";
  }

  const now = Date.now();
  const difference = deadlineTime - now;

  if (difference < 0) {
    return "critical";
  }

  if (difference <= DAY_IN_MS) {
    return "high";
  }

  if (difference <= 3 * DAY_IN_MS) {
    return "medium";
  }

  return "low";
}

export function getTaskPriorityInfo(deadline: string | null): TaskPriorityInfo {
  const priority = getTaskPriority(deadline);

  switch (priority) {
    case "critical":
      return {
        priority,
        label: "Critical",
        description: "Deadline sudah lewat",
      };

    case "high":
      return {
        priority,
        label: "High",
        description: "Deadline kurang dari 1 hari",
      };

    case "medium":
      return {
        priority,
        label: "Medium",
        description: "Deadline kurang dari 3 hari",
      };

    case "low":
      return {
        priority,
        label: "Low",
        description: "Deadline masih lebih dari 3 hari",
      };

    case "none":
      return {
        priority,
        label: "No Priority",
        description: "Tidak memiliki deadline",
      };
  }
}

export function isTaskOverdue(deadline: string | null): boolean {
  if (!deadline) {
    return false;
  }

  const deadlineTime = new Date(deadline).getTime();

  if (Number.isNaN(deadlineTime)) {
    return false;
  }

  return deadlineTime < Date.now();
}

export function isTaskDueToday(deadline: string | null): boolean {
  if (!deadline) {
    return false;
  }

  const deadlineDate = new Date(deadline);

  if (Number.isNaN(deadlineDate.getTime())) {
    return false;
  }

  const now = new Date();

  return (
    deadlineDate.getFullYear() === now.getFullYear() &&
    deadlineDate.getMonth() === now.getMonth() &&
    deadlineDate.getDate() === now.getDate()
  );
}

export function isTaskUpcoming(deadline: string | null): boolean {
  if (!deadline) {
    return false;
  }

  const deadlineTime = new Date(deadline).getTime();

  if (Number.isNaN(deadlineTime)) {
    return false;
  }

  return deadlineTime >= Date.now();
}

export function getDaysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) {
    return null;
  }

  const deadlineTime = new Date(deadline).getTime();

  if (Number.isNaN(deadlineTime)) {
    return null;
  }

  return Math.ceil((deadlineTime - Date.now()) / DAY_IN_MS);
}

export function formatDeadlineRelative(deadline: string | null): string {
  if (!deadline) {
    return "Tidak ada deadline";
  }

  const deadlineTime = new Date(deadline).getTime();

  if (Number.isNaN(deadlineTime)) {
    return "Deadline tidak valid";
  }

  const difference = deadlineTime - Date.now();
  const days = Math.ceil(Math.abs(difference) / DAY_IN_MS);

  if (difference < 0) {
    if (days === 0) {
      return "Terlambat";
    }

    return `Terlambat ${days} hari`;
  }

  if (days === 0) {
    return "Hari ini";
  }

  if (days === 1) {
    return "Besok";
  }

  return `${days} hari lagi`;
}

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { setupNotificationChannelsAsync } from './notificationService';

export const REMINDER_INTERVALS = [
  { hoursBefore: 12, label: '12 jam', idSuffix: '12h' },
  { hoursBefore: 6, label: '6 jam', idSuffix: '6h' },
  { hoursBefore: 1, label: '1 jam', idSuffix: '1h' },
] as const;

export interface SchedulableTask {
  id: string;
  title: string;
  deadline: string | null;
  status?: string;
}

export interface SchedulableSchedule {
  id: string;
  startDate: string;
  startTime: string;
  subject?: { name: string } | null;
  reminderEnabled?: boolean;
}

/**
 * Handle notification permissions and Android channels initialization on app startup.
 */
export async function requestNotificationPermissionsOnStartup(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    await setupNotificationChannelsAsync();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('[reminderScheduler] Error requesting notification permissions on startup:', error);
    return false;
  }
}

/**
 * Cancel all scheduled reminders for a specific task.
 */
export async function cancelTaskReminders(taskId: string): Promise<void> {
  if (Platform.OS === 'web' || !taskId) return;

  try {
    for (const interval of REMINDER_INTERVALS) {
      const identifier = `task-${taskId}-${interval.idSuffix}`;
      await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
    }
  } catch (error) {
    console.warn(`[reminderScheduler] Error cancelling reminders for task ${taskId}:`, error);
  }
}

/**
 * Cancel all scheduled reminders for a specific schedule.
 */
export async function cancelScheduleReminders(scheduleId: string): Promise<void> {
  if (Platform.OS === 'web' || !scheduleId) return;

  try {
    for (const interval of REMINDER_INTERVALS) {
      const identifier = `schedule-${scheduleId}-${interval.idSuffix}`;
      await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
    }
  } catch (error) {
    console.warn(`[reminderScheduler] Error cancelling reminders for schedule ${scheduleId}:`, error);
  }
}

/**
 * Automatically schedule up to 3 reminder notifications (12h, 6h, 1h before deadline) for a task.
 * Notifications are strictly scheduled ONLY if the trigger time is in the future.
 */
export async function scheduleTaskReminders(task: SchedulableTask): Promise<string[]> {
  if (Platform.OS === 'web' || !task.id) return [];

  // Always cancel previous notifications for this task first to prevent duplicates
  await cancelTaskReminders(task.id);

  // If the task is completed or does not have a deadline, do not schedule reminders
  if (task.status === 'completed' || !task.deadline) {
    return [];
  }

  const targetDate = new Date(task.deadline);
  if (isNaN(targetDate.getTime())) {
    return [];
  }

  const now = Date.now();
  if (targetDate.getTime() <= now) {
    return [];
  }

  const scheduledIds: string[] = [];

  for (const interval of REMINDER_INTERVALS) {
    const triggerTimestamp = targetDate.getTime() - interval.hoursBefore * 3600 * 1000;

    // Strict validation: trigger time must be strictly in the future
    if (triggerTimestamp <= Date.now()) {
      continue;
    }

    try {
      const notifId = await Notifications.scheduleNotificationAsync({
        identifier: `task-${task.id}-${interval.idSuffix}`,
        content: {
          title: `Reminder Tugas: ${task.title}`,
          body: `Tenggat waktu tugas "${task.title}" tersisa ${interval.label} lagi.`,
          sound: 'default',
          data: {
            type: 'task_reminder',
            task_id: task.id,
            reference_id: task.id,
            hours_before: interval.hoursBefore,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerTimestamp,
          channelId: 'default',
        },
      });

      scheduledIds.push(notifId);
    } catch (err) {
      console.warn(`[reminderScheduler] Failed to schedule ${interval.label} reminder for task ${task.id}:`, err);
    }
  }

  return scheduledIds;
}

/**
 * Automatically schedule up to 3 reminder notifications (12h, 6h, 1h before start_time) for a schedule.
 * Notifications are strictly scheduled ONLY if the trigger time is in the future.
 */
export async function scheduleScheduleReminders(schedule: SchedulableSchedule): Promise<string[]> {
  if (Platform.OS === 'web' || !schedule.id) return [];

  // Always cancel previous notifications for this schedule first
  await cancelScheduleReminders(schedule.id);

  if (schedule.reminderEnabled === false) {
    return [];
  }

  if (!schedule.startDate || !schedule.startTime) {
    return [];
  }

  const datePart = schedule.startDate.split('T')[0];
  const timePart = schedule.startTime.length === 5 ? `${schedule.startTime}:00` : schedule.startTime;
  const targetDate = new Date(`${datePart}T${timePart}`);

  if (isNaN(targetDate.getTime())) {
    return [];
  }

  const now = Date.now();
  if (targetDate.getTime() <= now) {
    return [];
  }

  const scheduledIds: string[] = [];
  const subjectName = schedule.subject?.name || 'Mata Kuliah / Kegiatan';

  for (const interval of REMINDER_INTERVALS) {
    const triggerTimestamp = targetDate.getTime() - interval.hoursBefore * 3600 * 1000;

    // Strict validation: trigger time must be strictly in the future
    if (triggerTimestamp <= Date.now()) {
      continue;
    }

    try {
      const notifId = await Notifications.scheduleNotificationAsync({
        identifier: `schedule-${schedule.id}-${interval.idSuffix}`,
        content: {
          title: `Jadwal Kuliah: ${subjectName}`,
          body: `Jadwal "${subjectName}" akan dimulai dalam ${interval.label}.`,
          sound: 'default',
          data: {
            type: 'schedule_reminder',
            schedule_id: schedule.id,
            reference_id: schedule.id,
            hours_before: interval.hoursBefore,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerTimestamp,
          channelId: 'default',
        },
      });

      scheduledIds.push(notifId);
    } catch (err) {
      console.warn(`[reminderScheduler] Failed to schedule ${interval.label} reminder for schedule ${schedule.id}:`, err);
    }
  }

  return scheduledIds;
}

export type PushNotificationType =
  | 'workspace_invitation'
  | 'task_reminder'
  | 'schedule_reminder';

export interface PushNotificationPayload {
  type: PushNotificationType;
  reference_id: string;
  workspace_id?: string;
  task_id?: string;
  schedule_id?: string;
}

export interface PushTokenRecord {
  id: string;
  user_id: string;
  token: string;
  device_type: 'android' | 'ios' | 'web';
  created_at: string;
  updated_at: string;
}

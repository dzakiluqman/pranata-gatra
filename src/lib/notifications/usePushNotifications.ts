import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { useSession } from '@/features/auth/hooks/useSession';

import { useNotificationModal } from './NotificationModalContext';
import {
  registerForPushNotificationsAsync,
  unregisterPushTokenAsync,
} from './notificationService';
import type { PushNotificationPayload } from './notificationTypes';

/**
 * Hook to manage push notifications lifecycle, token synchronization,
 * and deep link navigation upon notification interaction.
 */
export function usePushNotifications() {
  const router = useRouter();
  const { user, isAuthenticated } = useSession();
  const { openNotificationModal } = useNotificationModal();

  const currentTokenRef = useRef<string | null>(null);
  const isNavigatingRef = useRef(false);

  // 1. Handle user tap on notification
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      try {
        const rawData = response.notification.request.content.data;
        if (!rawData || typeof rawData !== 'object') return;

        const data = rawData as Partial<PushNotificationPayload>;

        // Throttle rapid repeated taps
        if (isNavigatingRef.current) return;
        isNavigatingRef.current = true;
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 1200);

        if (data.type === 'workspace_invitation') {
          // Open existing NotificationModal UI
          openNotificationModal();
        } else if (data.type === 'task_reminder') {
          const taskId = data.task_id || data.reference_id;
          if (taskId) {
            router.push({
              pathname: '/(app)/task/[taskId]',
              params: { taskId },
            });
          }
        } else if (data.type === 'schedule_reminder') {
          router.push('/(app)/(tabs)/schedule');
        }
      } catch (err) {
        console.error('[usePushNotifications] Navigation error on notification tap:', err);
      }
    },
    [openNotificationModal, router]
  );

  // 2. Cold Start: Check if app was launched from a notification tap
  useEffect(() => {
    let isMounted = true;

    async function checkInitialNotification() {
      try {
        const lastResponse =
          await Notifications.getLastNotificationResponseAsync();
        if (isMounted && lastResponse?.notification) {
          // Small delay to ensure router mounts and layout tree is ready
          setTimeout(() => {
            if (isMounted) {
              handleNotificationResponse(lastResponse);
            }
          }, 600);
        }
      } catch (e) {
        console.warn('[usePushNotifications] Error checking initial response:', e);
      }
    }

    checkInitialNotification();

    return () => {
      isMounted = false;
    };
  }, [handleNotificationResponse]);

  // 3. Background & Foreground: Listen to user interactions with notifications
  useEffect(() => {
    const subscription =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );

    return () => {
      subscription.remove();
    };
  }, [handleNotificationResponse]);

  // 4. Token Registration & Lifecycle Management
  useEffect(() => {
    let isMounted = true;

    async function syncToken() {
      if (isAuthenticated && user?.id) {
        const token = await registerForPushNotificationsAsync(user.id);
        if (isMounted && token) {
          currentTokenRef.current = token;
        }
      } else if (!isAuthenticated && currentTokenRef.current) {
        const tokenToDrop = currentTokenRef.current;
        currentTokenRef.current = null;
        await unregisterPushTokenAsync(tokenToDrop);
      }
    }

    syncToken();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);
}

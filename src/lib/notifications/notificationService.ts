import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase/client';

// Configure foreground notification behavior:
// Banners and sounds are shown even if the app is currently in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Setup default notification channel for Android (required for Android 8.0+ and 13+ permission prompts).
 */
export async function setupNotificationChannelsAsync(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#B38D46',
      sound: 'default',
      showBadge: true,
    });
  }
}

/**
 * Request notification permissions and register Expo Push Token in Supabase.
 */
export async function registerForPushNotificationsAsync(
  userId: string
): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return null;
    }

    // Android notification channel must be initialized before requesting permissions on Android 13+
    await setupNotificationChannelsAsync();

    if (!Device.isDevice) {
      console.info(
        '[NotificationService] Push notifications require a physical device or emulator with Play Services.'
      );
    }

    // 1. Check existing permissions
    const { status: existingStatus, ios } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 2. Request permissions if not yet granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Verify iOS authorization status or general status
    const isGranted =
      finalStatus === 'granted' ||
      (Platform.OS === 'ios' &&
        (ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
          ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL));

    if (!isGranted) {
      console.warn(
        '[NotificationService] Permission not granted for push notifications:',
        finalStatus
      );
      return null;
    }

    // 3. Obtain EAS Project ID
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      '8bd95e85-5453-4375-895f-1fe9c79de6f7';

    if (!projectId) {
      console.error('[NotificationService] Missing EAS projectId in app.json.');
      return null;
    }

    // 4. Generate Expo Push Token
    const pushTokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = pushTokenResponse.data;

    if (!token) {
      console.warn('[NotificationService] Failed to obtain Expo push token.');
      return null;
    }

    // 5. Store / Upsert token in Supabase
    const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';

    // Try RPC stored procedure first
    const { error: rpcError } = await supabase.rpc('register_push_token', {
      p_token: token,
      p_device_type: deviceType,
    });

    if (rpcError) {
      // Fallback to direct upsert into push_tokens table
      const { error: upsertError } = await supabase.from('push_tokens').upsert(
        {
          user_id: userId,
          token,
          device_type: deviceType,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' }
      );

      if (upsertError) {
        console.error(
          '[NotificationService] Failed to save push token in Supabase:',
          upsertError
        );
      }
    }

    return token;
  } catch (error) {
    console.error(
      '[NotificationService] Error in registerForPushNotificationsAsync:',
      error
    );
    return null;
  }
}

/**
 * Remove token from database upon logout to prevent sending notifications to disconnected sessions.
 */
export async function unregisterPushTokenAsync(token: string): Promise<void> {
  try {
    if (!token) return;

    const { error: rpcError } = await supabase.rpc('unregister_push_token', {
      p_token: token,
    });

    if (rpcError) {
      await supabase.from('push_tokens').delete().eq('token', token);
    }
  } catch (error) {
    console.warn(
      '[NotificationService] Failed to unregister push token:',
      error
    );
  }
}

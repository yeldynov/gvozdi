// Native: one-shot reminders for the next two weeks, so a day already practised can be skipped.
// Rescheduled on launch, on foreground and after each save; a user away for 14+ days stops getting them.
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { reminderDates } from './practice';

const PREFIX = 'reminder-'; // 'daily-reminder' was the old repeating one

export const remindersSupported = true;

export async function allowReminders(): Promise<boolean> {
  try {
    // Android 13+ shows the permission prompt only once a channel exists; without it the request is denied silently.
    if (Platform.OS === 'android')
      await Notifications.setNotificationChannelAsync('default', { name: 'Reminders', importance: AndroidImportance.DEFAULT });
    let perm = await Notifications.getPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) perm = await Notifications.requestPermissionsAsync();
    return perm.granted;
  } catch {
    return false;
  }
}

export const openNotificationSettings = () => Linking.openSettings().catch(() => {});

export async function syncReminder(time: string | undefined, practisedToday: boolean, title: string, body: string) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith(PREFIX) || n.identifier === 'daily-reminder')
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
    if (!time) return;
    for (const [i, date] of reminderDates(time, practisedToday).entries())
      await Notifications.scheduleNotificationAsync({
        identifier: PREFIX + i,
        content: { title, body, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
      });
  } catch {}
}

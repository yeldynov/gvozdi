// Native: one-shot reminders for the next two weeks, so a day already practised can be skipped.
// Rescheduled on launch, on foreground and after each save; a user away for 14+ days stops getting them.
import * as Notifications from 'expo-notifications';

import { reminderDates } from './practice';

const PREFIX = 'reminder-'; // 'daily-reminder' was the old repeating one

export const remindersSupported = true;

export async function allowReminders(): Promise<boolean> {
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status === 'undetermined') ({ status } = await Notifications.requestPermissionsAsync());
    return status === 'granted';
  } catch {
    return false;
  }
}

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

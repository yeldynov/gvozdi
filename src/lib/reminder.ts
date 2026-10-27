// Native: one repeating daily notification under a fixed id, so rescheduling replaces it.
import * as Notifications from 'expo-notifications';

const ID = 'daily-reminder';

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

// ponytail: fires even on days already practised; a one-shot per day rescheduled after save would skip those
export async function syncReminder(time: string | undefined, title: string, body: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(ID);
    if (!time) return;
    const [hour, minute] = time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      identifier: ID,
      content: { title, body, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  } catch {}
}

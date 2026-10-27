// Native: a local notification at the goal, so the cue still fires with the screen locked.
import * as Notifications from 'expo-notifications';

export async function scheduleGoalAlert(inSec: number, title: string, body: string): Promise<string | null> {
  if (inSec <= 0) return null;
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status === 'undetermined') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return null;
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: inSec },
    });
  } catch {
    return null; // the in-app gong still covers the foreground case
  }
}

export function cancelGoalAlert(id: string | null) {
  if (id) Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

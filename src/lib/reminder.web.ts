// Web: no scheduled notifications without web push (out of MVP scope); Settings shows the row disabled.
export const remindersSupported = false;

export async function allowReminders(): Promise<boolean> {
  return false;
}

export async function syncReminder(_time: string | undefined, _practisedToday: boolean, _title: string, _body: string) {}

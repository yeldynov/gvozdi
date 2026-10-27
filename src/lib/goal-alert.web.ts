// Web: no reliable scheduled notifications; the in-app gong and vibration are the cue.
export async function scheduleGoalAlert(_inSec: number, _title: string, _body: string): Promise<string | null> {
  return null;
}

export function cancelGoalAlert(_id: string | null) {}

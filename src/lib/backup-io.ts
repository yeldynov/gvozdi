import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Writes the backup to the cache dir and opens the share sheet (save to Files, AirDrop, mail…). */
export async function exportBackup(json: string, name: string) {
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  await file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
}

/** Resolves with the picked file's text, or null if cancelled. */
export async function pickBackup(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  return res.canceled ? null : new File(res.assets[0].uri).text();
}

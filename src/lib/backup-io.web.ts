export async function exportBackup(json: string, name: string) {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Resolves with the picked file's text; never resolves if the browser dialog is cancelled. */
export function pickBackup(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept: 'application/json,.json' });
    input.onchange = () => input.files?.[0]?.text().then(resolve);
    input.click();
  });
}

// Clipboard, download and file picker for the pilot code (doc 08). Thin browser wrappers; every failure is a
// return value, never an exception.

/** Copies text to the clipboard; false when the browser refuses (insecure page, no permission, no user gesture). */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Offers text as a file download (`name`, plain UTF-8 text). */
export function downloadText(name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Opens the browser's file dialog for a text file; `onPick` gets its text, or 'too-big' over `maxBytes`.
 *  Nothing happens when the dialog is cancelled. */
export function pickTextFile(maxBytes: number, onPick: (result: string | 'too-big') => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt,text/plain';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > maxBytes) return onPick('too-big');
    file.text().then(onPick, () => onPick(''));
  });
  input.click();
}

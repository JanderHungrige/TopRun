// Clipboard, download and file picker for the pilot code and ID card (doc 08). Thin browser wrappers; every
// failure is a return value, never an exception.

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

/** Offers bytes as a file download (`name`, MIME `type`). */
export function downloadFile(name: string, data: Uint8Array, type: string): void {
  const url = URL.createObjectURL(new Blob([new Uint8Array(data)], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Opens the browser's file dialog; `onPick` gets the file's bytes, or 'too-big' over `maxBytes`. Nothing
 *  happens when the dialog is cancelled. */
export function pickFile(accept: string, maxBytes: number, onPick: (result: Uint8Array | 'too-big') => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > maxBytes) return onPick('too-big');
    file.arrayBuffer().then((buf) => onPick(new Uint8Array(buf)), () => onPick(new Uint8Array()));
  });
  input.click();
}

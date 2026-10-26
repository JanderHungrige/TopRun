// Persistent storage (doc 08): asks the browser not to evict this site's data (the pilots) under storage
// pressure. Called after a pilot is created or restored — never at boot, because Firefox may show a prompt.
// Chrome, Edge and Safari decide silently; a refusal or a browser without the API changes nothing.

export function requestPersistence(): void {
  const storage = typeof navigator === 'undefined' ? undefined : navigator.storage;
  if (!storage?.persist || !storage.persisted) return;
  void storage.persisted()
    .then((already) => (already ? true : storage.persist()))
    .catch(() => false);
}

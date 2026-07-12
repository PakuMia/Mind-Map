// Matches a KeyboardEvent against a shortcut string such as "v" or "Alt+L".
export function matchesShortcut(event, shortcut) {
  if (!shortcut) return false;
  const parts = shortcut.toLowerCase().split('+').map((s) => s.trim());
  const key = parts.at(-1);
  return (
    event.key.toLowerCase() === key &&
    event.altKey === parts.includes('alt') &&
    (event.ctrlKey || event.metaKey) === parts.some((p) => p === 'ctrl' || p === 'cmd' || p === 'meta') &&
    event.shiftKey === parts.includes('shift')
  );
}

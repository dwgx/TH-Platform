// Clipboard writes, in one place, because the app was lying about this.
//
// Three invite buttons (room, group, DM room-share) each toasted "已复制邀请链接"
// the instant they were clicked, without touching `navigator.clipboard` at all.
// The user is then told their invite is on the clipboard, it is not, and they
// paste the wrong text into a chat. A copy button that reports a copy it did
// not perform is worse than no copy button, so every caller now goes through
// this one function and reports what actually happened.
//
// It returns false rather than throwing, because the common failure is a
// permission policy on an `http://` origin, which is an ordinary user-facing
// state here (the dev server is http://127.0.0.1:4173), not an exception.

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * The URL that reopens the current view. Uses `location.href` rather than
 * rebuilding a route, so whatever the user is looking at is what gets copied —
 * including a `#/room/4912` dev-switcher deep link, which is exactly what they
 * need to paste if they opened the app through one.
 */
export function currentViewUrl(): string {
  return typeof location === 'undefined' ? '' : location.href;
}
/** Accept only the native account controller's configured consent destinations. */
export function accountLoginLink(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return undefined;
    if (url.origin === "https://synapseklabs.org" && url.pathname === "/desktop/authorize") return url.href;
    if (url.origin === "https://dyoumwofjcaclunxbeiw.supabase.co" && url.pathname === "/auth/v1/oauth/authorize") return url.href;
  } catch { /* Refuse malformed authorization links. */ }
  return undefined;
}

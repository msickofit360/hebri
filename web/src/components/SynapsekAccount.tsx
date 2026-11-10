import { useCallback, useEffect, useState } from "react";
import { Button } from "@nous-research/ui/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@nous-research/ui/ui/components/card";
import { useProfileScope } from "@/contexts/useProfileScope";
import { fetchJSON } from "@/lib/api";
import { accountLoginLink } from "@/lib/synapsek-account";

interface AccountView {
  state: "signed_out" | "signed_in" | "signing_in" | "unavailable";
  authorize_url?: string;
  error?: string;
  account?: {
    userId: string;
    email: string;
    managedInferenceEnabled?: boolean;
    billing: { plan: string };
  };
}

const ERRORS: Record<string, string> = {
  secure_storage_unavailable: "Unlock your OS keychain and retry. On Linux, start a Secret Service keyring. Hebri never falls back to plaintext credential storage.",
  callback_unavailable: "The sign-in callback port is busy. Finish any other Hebri sign-in, then retry.",
  sign_in_timed_out: "Sign-in expired. Try again to get a new link.",
  authorization_denied: "Sign-in was cancelled. You can try again when ready.",
  sign_out_before_switching: "This Bit already has a Synapsek account. Refresh its status before switching accounts.",
  reauthentication_required: "Your account needs to sign in again.",
  revocation_incomplete: "Server sign-out is incomplete. Retry; Hebri has kept the saved session so revocation can finish.",
};

interface SynapsekAccountProps {
  onChanged: () => void;
}

interface AccountPanelProps extends SynapsekAccountProps {
  profile: string;
}

function AccountPanel({ profile, onChanged }: AccountPanelProps) {
  const [view, setView] = useState<AccountView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const path = useCallback((suffix = "") => `/api/synapsek/account${suffix}?profile=${encodeURIComponent(profile)}`, [profile]);
  const read = useCallback(() => fetchJSON<AccountView>(path()), [path]);

  useEffect(() => {
    let active = true;
    void read().then(value => { if (active) setView(value); }, () => {
      if (active) setError("Could not load the Synapsek account. Refresh to retry.");
    });
    return () => { active = false; };
  }, [read]);

  useEffect(() => {
    if (view?.state !== "signing_in") return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = await read();
        if (!active) return;
        setView(next);
        if (next.state === "signed_in") onChanged();
        if (next.state === "signing_in") timer = setTimeout(() => void poll(), 1500);
      } catch {
        if (active) { setError("Lost contact with Hebri. Refresh to check sign-in."); }
      }
    };
    timer = setTimeout(() => void poll(), 500);
    return () => { active = false; clearTimeout(timer); };
  }, [view?.state, read, onChanged]);

  async function act(action: "login" | "logout" | "refresh") {
    setBusy(true); setError("");
    try {
      const result = await fetchJSON<AccountView>(path(`/${action}`), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "logout" ? { expected_user_id: view?.account?.userId } : {}),
      });
      setView(action === "refresh" ? await read() : result);
      if (action === "logout") onChanged();
    } catch { setError("That action did not finish. Refresh to check the account before retrying."); }
    finally { setBusy(false); }
  }

  const authorize = accountLoginLink(view?.authorize_url);
  const pending = view?.state === "signing_in";
  return <Card>
    <CardHeader><CardTitle>Synapsek account</CardTitle></CardHeader>
    <CardContent className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Use your Synapsek plan in this Bit, in the terminal or this local browser. Desktop is not required.</p>
      {view?.state === "signed_in" && <>
        <p>{view.account?.email} · {view.account?.billing.plan}</p>
        <p className="text-sm">{view.account?.managedInferenceEnabled ? "Synapsek is connected. Start a new chat to use this Bit’s selected model." : "Signed in. Model access is off for this connection. It requires sign-in consent and an eligible plan."}</p>
      </>}
      {pending && <p role="status">Complete sign-in and account consent in your browser. A second consent link may appear here.</p>}
      {authorize && pending && <a href={authorize} target="_blank" rel="noopener noreferrer" className="underline">Continue Synapsek sign-in</a>}
      {(error || view?.error) && <p role="alert" className="text-destructive">{error || ERRORS[view?.error ?? ""] || `Synapsek could not complete this action (${view?.error}). Refresh or retry.`}</p>}
      <div className="flex flex-wrap gap-2">
        {view?.state !== "signed_in" && <Button disabled={busy || pending || !view} onClick={() => void act("login")}>Sign in to Synapsek</Button>}
        {view?.state === "signed_in" && <Button outlined disabled={busy} onClick={() => void act("logout")}>Sign out of Synapsek</Button>}
        <Button ghost disabled={busy} onClick={() => void act("refresh")}>Refresh account</Button>
        <a href="https://synapseklabs.org/billing" target="_blank" rel="noopener noreferrer" className="self-center text-sm underline">Manage plan</a>
      </div>
      <p className="text-xs text-muted-foreground">Credentials stay in your OS-protected store. Terminal: <code>hebri auth synapsek login</code></p>
    </CardContent>
  </Card>;
}

export function SynapsekAccount({ onChanged }: SynapsekAccountProps) {
  const { profile, currentProfile } = useProfileScope();
  const selected = profile || currentProfile || "default";
  return <AccountPanel key={selected} profile={selected} onChanged={onChanged} />;
}

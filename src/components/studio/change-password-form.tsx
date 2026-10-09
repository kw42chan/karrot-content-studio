"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export function ChangePasswordForm({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (newPassword.length < 8) {
      setIsError(true);
      setMessage("Use at least 8 characters for the new password.");
      return;
    }
    if (newPassword !== confirm) {
      setIsError(true);
      setMessage("New password and confirmation do not match.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (verifyError) {
        setIsError(true);
        setMessage("Current password is incorrect.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setIsError(true);
        setMessage(updateError.message);
        return;
      }

      setIsError(false);
      setMessage("Password updated.");
      setCurrent("");
      setNewPassword("");
      setConfirm("");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="studio-signout" onClick={() => setOpen(true)}>
        Change password
      </button>
    );
  }

  return (
    <form className="studio-change-password" onSubmit={onSubmit}>
      <p className="studio-change-password-title">Change password</p>
      <label className="studio-change-password-field">
        <span>Current</span>
        <input
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      </label>
      <label className="studio-change-password-field">
        <span>New</span>
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
      </label>
      <label className="studio-change-password-field">
        <span>Confirm</span>
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
        />
      </label>
      {message && (
        <p className={isError ? "studio-change-password-error" : "studio-change-password-ok"}>
          {message}
        </p>
      )}
      <div className="studio-change-password-actions">
        <button type="submit" className="studio-btn studio-btn-primary h-8 text-xs" disabled={busy}>
          {busy ? "Saving…" : "Update password"}
        </button>
        <button
          type="button"
          className="studio-btn studio-btn-ghost h-8 text-xs"
          onClick={() => {
            setOpen(false);
            setMessage(null);
            setCurrent("");
            setNewPassword("");
            setConfirm("");
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

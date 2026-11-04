"use client";

import { useActionState } from "react";
import { changePassword, signIn } from "@/cms/staff-actions";

function Shell({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-ink px-5 py-16 text-ivory">
      <div className="w-full max-w-md bg-ivory p-8 text-ink sm:p-12">
        <div className="eyebrow mb-4 text-bronze-deep">Editor</div>
        <h1 className="display mb-4 text-5xl">{title}</h1>
        {intro && <p className="mb-8 text-sm leading-relaxed text-muted">{intro}</p>}
        {children}
      </div>
    </main>
  );
}

function ErrorText({ text }: { text?: string }) {
  return text ? (
    <p role="alert" className="text-sm text-error">
      {text}
    </p>
  ) : null;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <Shell title="Sign in">
      <form action={action} className="flex flex-col gap-7">
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="username" required defaultValue={state?.email} />
        </label>
        <label className="field">
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <ErrorText text={state?.error} />
        <button className="btn btn-ink mt-2" disabled={pending}>
          <span>{pending ? "Signing in…" : "Sign in"}</span>
        </button>
        <p className="text-xs text-muted">Forgot your password? Ask the owner to reset it from the Staff page.</p>
      </form>
    </Shell>
  );
}

export function PasswordForm({ forced }: { forced: boolean }) {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <Shell title="New password" intro={forced ? "You signed in with a temporary password. Choose your own to continue." : "Choose a new password."}>
      <form action={action} className="flex flex-col gap-7">
        <label className="field">
          <span>New password (10+ characters)</span>
          <input name="password" type="password" autoComplete="new-password" minLength={10} required />
        </label>
        <label className="field">
          <span>Repeat it</span>
          <input name="confirm" type="password" autoComplete="new-password" minLength={10} required />
        </label>
        <ErrorText text={state?.error} />
        <button className="btn btn-ink mt-2" disabled={pending}>
          <span>{pending ? "Saving…" : "Save password"}</span>
        </button>
      </form>
    </Shell>
  );
}

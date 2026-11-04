"use client";

import { useActionState, useId, useState, useTransition } from "react";
import Select from "@/components/forms/Select";
import { MiniSelect, SELECT_TRIGGER } from "./inputs";
import type { Role } from "@/cms/auth";
import { useConfirm } from "@/components/ui/useConfirm";
import { addStaff, removeStaff, resetStaffPassword, setRole, type FormState } from "@/cms/staff-actions";

export type StaffRow = { id: string; name: string; email: string; role: Role; lastSignIn: string | null; pending: boolean; isMe: boolean };

/** Shown once after creating an account or resetting a password. */
function TempPassword({ state }: { state: FormState }) {
  if (!state?.tempPassword) return null;
  return (
    <div role="status" className="border border-bronze bg-champagne/30 p-5 text-sm">
      <p className="mb-2">{state.ok}</p>
      <p>
        Temporary password for <strong>{state.email}</strong>: <code className="select-all bg-ivory px-2 py-1 font-mono text-base">{state.tempPassword}</code>
      </p>
      <p className="mt-2 text-xs text-muted">Share it privately. It&apos;s shown only once, and they&apos;ll choose their own password at first sign-in.</p>
    </div>
  );
}

const ROLES = [
  { value: "editor", label: "Editor" },
  { value: "owner", label: "Owner" },
];

export default function StaffManager({ rows }: { rows: StaffRow[] }) {
  const [added, addAction, adding] = useActionState(addStaff, undefined);
  const [result, setResult] = useState<FormState>(undefined);
  const [busy, start] = useTransition();
  const [ask, confirmDialog] = useConfirm();
  const run = (fn: () => Promise<FormState>) => start(async () => setResult(await fn()));

  return (
    <div className="flex flex-col gap-12">
      {confirmDialog}
      <TempPassword state={result} />
      {result?.error && (
        <p role="alert" className="text-sm text-error">
          {result.error}
        </p>
      )}

      <ul className="border-t border-ink/10">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-ink/10 py-4">
            <div className="min-w-0 flex-1">
              <div className="font-serif text-xl">
                {r.name || r.email} {r.isMe && <span className="text-sm text-muted">(you)</span>}
              </div>
              <div className="text-xs text-muted">
                {r.email} · {r.pending ? "Hasn't set a password yet" : r.lastSignIn ? `Last signed in ${new Date(r.lastSignIn).toLocaleDateString()}` : "Never signed in"}
              </div>
            </div>
            <MiniSelect label="Role" value={r.role} disabled={busy} options={ROLES} onChange={(v) => v !== r.role && run(() => setRole(r.id, v as Role))} />
            <button type="button" disabled={busy} onClick={() => run(() => resetStaffPassword(r.id))} className="text-[11px] uppercase tracking-[0.18em] text-bronze-deep hover:underline">
              Reset password
            </button>
            {!r.isMe && (
              <button
                type="button"
                disabled={busy}
                onClick={async () => (await ask({ title: `Remove ${r.name || r.email}?`, message: "They won't be able to sign in any more.", confirmLabel: "Remove", danger: true })) && run(() => removeStaff(r.id))}
                className="text-[11px] uppercase tracking-[0.18em] text-error hover:underline"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      <form action={addAction} className="flex flex-col gap-6 border border-ink/10 p-6">
        <h2 className="font-serif text-2xl">Add a person</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="field">
            <span>Name</span>
            <input name="name" required maxLength={80} />
          </label>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" required />
          </label>
          <RoleField />
        </div>
        {added?.error && (
          <p role="alert" className="text-sm text-error">
            {added.error}
          </p>
        )}
        <TempPassword state={added} />
        <div>
          <button className="btn btn-ink min-h-10 px-6" disabled={adding}>
            <span>{adding ? "Adding…" : "Add person"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

/** Role picker for the "Add a person" form; a hidden input carries the value. */
function RoleField() {
  const id = useId();
  const [role, setRole] = useState("editor");
  return (
    <div className="field">
      <span id={`${id}-label`}>Role</span>
      <Select id={id} labelledBy={`${id}-label`} value={role} onChange={setRole} options={ROLES} triggerClassName={SELECT_TRIGGER} />
      <input type="hidden" name="role" value={role} />
    </div>
  );
}

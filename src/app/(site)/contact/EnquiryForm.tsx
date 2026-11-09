"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { emailSuggestion, enquirySchema, fieldErrors, MESSAGE_MAX, SUBJECTS } from "@/lib/booking-schema";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import SendButton from "@/components/booking/SendButton";
import SuccessCheck from "@/components/booking/SuccessCheck";
import Field from "@/components/forms/Field";
import Select from "@/components/forms/Select";
import PhoneField, { toE164, type PhoneValue } from "@/components/forms/PhoneField";
import { EASE_LUXE } from "@/lib/motion";

type Form = { name: string; email: string; phone: PhoneValue; subject: string; message: string; company: string };

const empty: Form = { name: "", email: "", phone: { country: DEFAULT_COUNTRY, national: "" }, subject: SUBJECTS[0], message: "", company: "" };
const payloadOf = (f: Form) => ({ type: "enquiry" as const, ...f, phone: toE164(f.phone) });

const noSubscribe = () => () => {};

/** ?subject=… from the address bar ("" on the server, so the page stays static). */
function useUrlSubject() {
  const wanted = useSyncExternalStore(noSubscribe, () => new URLSearchParams(window.location.search).get("subject") ?? "", () => "");
  return SUBJECTS.find((s) => s === wanted);
}

export default function EnquiryForm() {
  const [form, setForm] = useState<Form>(empty);
  // Links such as /contact?subject=Meeting%20hall preselect the subject once,
  // right after hydration (state adjusted during render, no effect or remount).
  const urlSubject = useUrlSubject();
  const [appliedSubject, setAppliedSubject] = useState(false);
  if (urlSubject && !appliedSubject) {
    setAppliedSubject(true);
    setForm((f) => ({ ...f, subject: urlSubject }));
  }
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ref: string; previews: string[] } | null>(null);

  const all = useMemo(() => {
    const p = enquirySchema.safeParse(payloadOf(form));
    return p.success ? {} : fieldErrors(p.error);
  }, [form]);
  const err = (k: string) => serverErrors[k] || (touched[k] || submitted ? all[k] : undefined);
  const ok = (k: string) => !!touched[k] && !all[k];
  const touch = (k: string) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setServerErrors({});
  };
  const suggestion = emailSuggestion(form.email);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const bad = Object.keys(all);
    if (bad.length) {
      document.getElementById(`eq-${bad[0]}`)?.focus();
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payloadOf(form)) });
      const data = await res.json();
      if (!res.ok || !data.ok) setServerErrors(data.errors ?? { form: data.error ?? "Something went wrong." });
      else setResult({ ref: data.ref, previews: data.previews ?? [] });
    } catch {
      setServerErrors({ form: "Network error — please try again." });
    } finally {
      setSending(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {result ? (
        <motion.div key="ok" role="status" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE_LUXE }} className="flex flex-col items-start gap-6">
          <SuccessCheck />
          <div className="eyebrow text-bronze-deep">Message sent · Ref {result.ref}</div>
          <h3 className="display text-[clamp(36px,3.6vw,54px)]">
            Thank you, <em>{form.name.trim().split(/\s+/)[0]}</em>
          </h3>
          <p className="text-[15px] leading-[1.9] text-muted">Our team will reply to {form.email.trim().toLowerCase()} shortly.</p>
          <PreviewLinks previews={result.previews} />
        </motion.div>
      ) : (
        <motion.form key="form" exit={{ opacity: 0, y: -20 }} onSubmit={submit} noValidate className="flex flex-col gap-8">
          <div className="grid gap-8 sm:grid-cols-2">
            <Field id="eq-name" label="Name *" error={err("name")} valid={ok("name")}>
              <input
                id="eq-name"
                value={form.name}
                maxLength={80}
                onChange={(e) => set("name", e.target.value)}
                onBlur={() => touch("name")}
                autoComplete="name"
                aria-invalid={!!err("name")}
                aria-describedby="eq-name-msg"
              />
            </Field>
            <Field
              id="eq-email"
              label="Email *"
              error={err("email")}
              valid={ok("email") && !suggestion}
              hint={
                suggestion ? (
                  <>
                    Did you mean{" "}
                    <button type="button" className="text-ink underline" onClick={() => set("email", suggestion)}>
                      {suggestion}
                    </button>
                    ?
                  </>
                ) : undefined
              }
            >
              <input
                id="eq-email"
                type="email"
                inputMode="email"
                maxLength={120}
                value={form.email}
                onChange={(e) => set("email", e.target.value.replace(/\s/g, ""))}
                onBlur={() => touch("email")}
                autoComplete="email"
                aria-invalid={!!err("email")}
                aria-describedby="eq-email-msg"
              />
            </Field>
            <PhoneField id="eq-phone" label="Phone (optional)" value={form.phone} onChange={(v) => set("phone", v)} onBlur={() => touch("phone")} error={err("phone")} valid={ok("phone") && !!form.phone.national} />
            <Field id="eq-subject" label="Subject" error={err("subject")}>
              <Select
                id="eq-subject"
                labelledBy="eq-subject-label"
                value={form.subject}
                onChange={(v) => set("subject", v)}
                options={SUBJECTS.map((s) => ({ value: s, label: s }))}
                triggerClassName="min-h-12 border-b border-ink/28 py-3 text-base hover:border-ink/60 aria-expanded:border-bronze"
              />
            </Field>
          </div>
          <Field id="eq-message" label="Message *" error={err("message")} counter={{ value: form.message.length, max: MESSAGE_MAX }}>
            <textarea
              id="eq-message"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              onBlur={() => touch("message")}
              rows={5}
              placeholder="How can we help?"
              aria-invalid={!!err("message")}
              aria-describedby="eq-message-msg"
            />
          </Field>
          <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={form.company} onChange={(e) => set("company", e.target.value)} name="company" />
          {serverErrors.form && (
            <p role="alert" className="text-sm text-error">
              {serverErrors.form}
            </p>
          )}
          <div>
            <SendButton sending={sending} label="Send message" />
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

/** In demo mode (no SMTP configured) the API returns Ethereal preview links. */
export function PreviewLinks({ previews }: { previews: string[] }) {
  if (!previews.length) return null;
  return (
    <div className="border border-dashed border-bronze/60 p-4 text-[13px] leading-7 text-muted">
      <div className="eyebrow mb-1 text-[10px] text-bronze-deep">Demo mode — email previews</div>
      {previews.map((p, i) => (
        <a key={p} href={p} target="_blank" rel="noreferrer" className="block underline hover:text-ink">
          {i === 0 ? "Email sent to reception" : "Copy sent to guest"} ↗
        </a>
      ))}
    </div>
  );
}

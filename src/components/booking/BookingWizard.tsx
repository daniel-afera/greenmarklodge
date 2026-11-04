"use client";

import CmsImage from "@/components/ui/CmsImage";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import type { RoomOption } from "@/content/types";
import { makeBookingSchema, type RoomRule, emailSuggestion, ETAS, fieldErrors, MAX_DAYS_AHEAD, MAX_NIGHTS, nightsBetween, NOTES_MAX, stayIssues } from "@/lib/booking-schema";
import { addDaysISO, prettyDate, todayISO } from "@/lib/dates";
import { countryByCode, DEFAULT_COUNTRY } from "@/lib/countries";
import { EASE_LUXE } from "@/lib/motion";
import { useSite } from "@/components/layout/SiteContext";
import Field from "@/components/forms/Field";
import Calendar from "@/components/forms/Calendar";
import Stepper from "@/components/forms/Stepper";
import Select from "@/components/forms/Select";
import CountrySelect from "@/components/forms/CountrySelect";
import PhoneField, { toE164, type PhoneValue } from "@/components/forms/PhoneField";
import { guestLabel } from "@/components/forms/GuestField";
import { useMediaQuery } from "@/components/forms/hooks";
import { PreviewLinks } from "@/app/(site)/contact/EnquiryForm";
import SendButton from "./SendButton";
import SuccessCheck from "./SuccessCheck";
import { Arrow } from "@/components/ui/ButtonLink";

const STEPS = ["Dates", "Residence", "Details", "Review"] as const;
const STEP_OF: Record<string, number> = { checkin: 0, checkout: 0, adults: 0, children: 0, room: 1, name: 2, email: 2, phone: 2, country: 2, eta: 2, notes: 2 };
const FOCUS_ID: Record<string, string> = { name: "bk-name", email: "bk-email", phone: "bk-phone", country: "bk-country", eta: "bk-eta", notes: "bk-notes" };

type Form = {
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  room: string;
  name: string;
  email: string;
  phone: PhoneValue;
  country: string;
  eta: string;
  transfer: boolean;
  notes: string;
  company: string;
};

function initialForm(params: URLSearchParams, rooms: RoomOption[]): Form {
  const today = todayISO();
  const ci = params.get("checkin") ?? "";
  const co = params.get("checkout") ?? "";
  const checkin = ci >= today && ci <= addDaysISO(today, MAX_DAYS_AHEAD) ? ci : addDaysISO(today, 14);
  const checkout = co > checkin && co <= addDaysISO(checkin, MAX_NIGHTS) ? co : addDaysISO(checkin, 3);
  const room = rooms.some((r) => r.slug === params.get("room")) ? params.get("room")! : rooms[0].slug;
  const clamp = (v: string | null, lo: number, hi: number, d: number) => Math.min(hi, Math.max(lo, Number.isFinite(Number(v)) && v ? Number(v) : d));
  return {
    checkin,
    checkout,
    adults: clamp(params.get("adults"), 1, 8, 2),
    children: clamp(params.get("children"), 0, 6, 0),
    room,
    name: "",
    email: "",
    phone: { country: DEFAULT_COUNTRY, national: "" },
    country: DEFAULT_COUNTRY,
    eta: ETAS[1],
    transfer: true,
    notes: "",
    company: "",
  };
}

const payloadOf = (f: Form) => ({ type: "booking" as const, ...f, phone: toE164(f.phone) });

function validate(f: Form, rooms: RoomRule[]): Record<string, string> {
  const parsed = makeBookingSchema(rooms).safeParse(payloadOf(f));
  return { ...(parsed.success ? {} : fieldErrors(parsed.error)), ...stayIssues(f, rooms) };
}

export default function BookingWizard({ rooms }: { rooms: RoomOption[] }) {
  const params = useSearchParams();
  const { settings: site } = useSite();
  const desktop = useMediaQuery("(min-width: 1280px)", true);
  const [form, setForm] = useState<Form>(() => initialForm(params, rooms));
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [checkedUpTo, setCheckedUpTo] = useState(-1);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ ref: string; previews: string[] } | null>(null);

  const all = useMemo(() => validate(form, rooms), [form, rooms]);
  const show = (k: string) => touched[k] || (STEP_OF[k] ?? 0) <= checkedUpTo;
  const err = (k: string) => serverErrors[k] || (show(k) ? all[k] : undefined);
  const ok = (k: string) => !!touched[k] && !all[k];

  const room = rooms.find((r) => r.slug === form.room) ?? rooms[0];
  const party = form.adults + form.children;
  const nights = nightsBetween(form.checkin, form.checkout);
  const suggestion = emailSuggestion(form.email);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (serverErrors[k as string])
      setServerErrors((s) => {
        const next = { ...s };
        delete next[k as string];
        return next;
      });
  };
  const touch = (k: string) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));

  function go(to: number) {
    if (to > step) {
      setCheckedUpTo((c) => Math.max(c, step));
      const bad = Object.keys(all).filter((k) => (STEP_OF[k] ?? 99) <= step);
      if (bad.length) {
        const first = bad.find((k) => FOCUS_ID[k]);
        if (first) document.getElementById(FOCUS_ID[first])?.focus();
        return;
      }
    }
    setDir(to > step ? 1 : -1);
    setStep(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 3) return go(step + 1);
    setCheckedUpTo(3);
    const bad = Object.keys(all);
    if (bad.length) {
      setDir(-1);
      return setStep(Math.min(...bad.map((k) => STEP_OF[k] ?? 0)));
    }
    setSending(true);
    setServerErrors({});
    try {
      const res = await fetch("/api/booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payloadOf(form)) });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const errs: Record<string, string> = data.errors ?? { form: data.error ?? "Something went wrong. Please try again." };
        setServerErrors(errs);
        const back = Math.min(3, ...Object.keys(errs).map((k) => STEP_OF[k] ?? 3));
        if (back < 3) setStep(back);
      } else setDone({ ref: data.ref, previews: data.previews ?? [] });
    } catch {
      setServerErrors({ form: "Network error — please check your connection and try again." });
    } finally {
      setSending(false);
    }
  }

  const slide = {
    initial: (d: number) => ({ opacity: 0, x: d * 48 }),
    animate: { opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE_LUXE } },
    exit: (d: number) => ({ opacity: 0, x: d * -32, transition: { duration: 0.3 } }),
  };

  const phoneDisplay = parsePhoneNumberFromString(form.phone.national, form.phone.country)?.formatInternational() ?? form.phone.national;
  const countryName = countryByCode(form.country)?.name ?? form.country;

  return (
    <div className="flex min-h-svh flex-wrap">
      {/* Summary panel */}
      <aside className="relative hidden min-h-svh flex-[1_1_420px] overflow-hidden bg-ink text-ivory lg:block">
        <div className="sticky top-0 h-svh">
          <AnimatePresence initial={false}>
            <motion.div key={room.slug} className="absolute inset-0" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4, ease: EASE_LUXE }}>
              <CmsImage image={room.image} alt="" fill priority sizes="40vw" className="object-cover" />
            </motion.div>
          </AnimatePresence>
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-night/40 via-night/5 to-night/90" />
          <div className="absolute inset-x-0 bottom-0 p-[clamp(28px,4vw,56px)]">
            <div className="eyebrow mb-4 text-champagne">Your stay</div>
            <AnimatePresence mode="wait">
              <motion.div key={room.slug} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.6, ease: EASE_LUXE }} className="display mb-8 text-[clamp(40px,3.6vw,60px)]">
                {room.name}
              </motion.div>
            </AnimatePresence>
            <dl className="grid grid-cols-3 gap-6 border-t border-ivory/25 pt-6">
              {[
                ["Arrive", prettyDate(form.checkin)],
                ["Depart", prettyDate(form.checkout)],
                ["Guests", `${form.adults}${form.children ? ` + ${form.children}` : ""}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="eyebrow mb-2 text-[10px] text-champagne">{k}</dt>
                  <dd className="font-serif text-[22px]">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-[13px] text-ivory/80">{nights > 0 ? `${nights} night${nights > 1 ? "s" : ""} · ${room.view}` : "Select your dates"}</p>
          </div>
        </div>
      </aside>

      {/* Wizard */}
      <div className="flex min-w-0 flex-[999_1_600px] flex-col px-[clamp(20px,5vw,88px)] pb-16 pt-32">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.section key="done" role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex max-w-[620px] flex-1 flex-col items-start justify-center gap-7 py-10">
              <SuccessCheck />
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 1, ease: EASE_LUXE }} className="flex flex-col items-start gap-6">
                <div className="eyebrow text-bronze-deep">Request received · Ref {done.ref}</div>
                <h1 className="display text-[clamp(44px,4.6vw,72px)]">
                  Thank you, <em>{form.name.trim().split(/\s+/)[0]}</em>
                </h1>
                <p className="text-base leading-[1.9] text-muted">
                  Your request for the {room.name} ({nights} night{nights > 1 ? "s" : ""}, {prettyDate(form.checkin, { day: "numeric", month: "long" })} –{" "}
                  {prettyDate(form.checkout, { day: "numeric", month: "long" })}) is with our reception team. We&apos;ll confirm availability within 24 hours. A copy
                  has been sent to {form.email.trim().toLowerCase()}.
                </p>
                <PreviewLinks previews={done.previews} />
                <div className="mt-2 flex flex-wrap items-center gap-6">
                  <Link href="/" className="btn btn-dark">
                    <span>Return to the lodge</span>
                  </Link>
                  <Link href="/experiences" className="hlink eyebrow">
                    Plan your days
                  </Link>
                </div>
              </motion.div>
            </motion.section>
          ) : (
            <motion.form key="form" exit={{ opacity: 0, y: -20 }} onSubmit={submit} noValidate className="flex flex-1 flex-col">
              <nav aria-label="Booking steps" className="mb-12">
                <ol className="grid grid-cols-4 gap-3">
                  {STEPS.map((label, i) => (
                    <li key={label} aria-current={i === step ? "step" : undefined}>
                      <button type="button" disabled={i > step} onClick={() => go(i)} className="flex w-full flex-col gap-3 text-left disabled:cursor-default">
                        <span className="relative block h-0.5 overflow-hidden bg-ink/10">
                          <motion.span className="absolute inset-0 origin-left bg-bronze" animate={{ scaleX: i <= step ? 1 : 0 }} transition={{ duration: 0.8, ease: EASE_LUXE }} />
                        </span>
                        <span className={`eyebrow text-[10px] transition-colors ${i <= step ? "text-ink" : "text-muted/70"}`}>
                          0{i + 1}
                          <span className="hidden sm:inline"> · {label}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>

              <AnimatePresence mode="wait" custom={dir}>
                <motion.section key={step} custom={dir} variants={slide} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-9">
                  {step === 0 && (
                    <>
                      <header>
                        <h1 className="display mb-3 text-[clamp(40px,4vw,60px)]">
                          When will you <em>arrive?</em>
                        </h1>
                        <p className="text-[15px] leading-[1.8] text-muted">Choose your dates and party. Nothing is charged — our team confirms availability with you directly.</p>
                      </header>

                      <div className="grid grid-cols-2 border-y border-ink/15">
                        {(["checkin", "checkout"] as const).map((k, i) => (
                          <div key={k} className={`py-4 ${i ? "border-l border-ink/15 pl-6" : "pr-6"}`}>
                            <div className={`eyebrow mb-1.5 text-[10px] ${err(k) ? "text-error" : "text-muted"}`}>{i ? "Departure" : "Arrival"}</div>
                            <div className={`font-serif text-[clamp(22px,2.4vw,30px)] ${form[k] ? "" : "text-muted/60"}`}>
                              {form[k] ? prettyDate(form[k], { weekday: "short", day: "numeric", month: "long" }) : i && form.checkin ? "Select departure" : "Add date"}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <Calendar
                          value={{ from: form.checkin, to: form.checkout }}
                          onChange={(r) => {
                            setForm((f) => ({ ...f, checkin: r.from, checkout: r.to }));
                            setTouched((t) => ({ ...t, checkin: true, checkout: !!r.to || t.checkout }));
                          }}
                          months={desktop ? 2 : 1}
                          min={todayISO()}
                          max={addDaysISO(todayISO(), MAX_DAYS_AHEAD)}
                          maxNights={MAX_NIGHTS}
                        />
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px]">
                          <span className="text-muted">{nights > 0 ? `${nights} night${nights > 1 ? "s" : ""} selected` : `Stays of 1–${MAX_NIGHTS} nights`}</span>
                          <AnimatePresence>
                            {(err("checkin") || err("checkout")) && (
                              <motion.span role="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-error">
                                {err("checkin") || err("checkout")}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="grid gap-x-10 border-t border-ink/15 sm:grid-cols-2">
                        <Stepper label="Adults" hint="Ages 13+" value={form.adults} min={1} max={8} onChange={(n) => set("adults", n)} />
                        <Stepper label="Children" hint="Ages 0–12" value={form.children} min={0} max={6} onChange={(n) => set("children", n)} />
                      </div>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <header>
                        <h1 className="display mb-3 text-[clamp(40px,4vw,60px)]">
                          Choose your <em>residence</em>
                        </h1>
                        <p className="text-[15px] leading-[1.8] text-muted">
                          For {guestLabel(form.adults, form.children)}. All residences include breakfast, Wi-Fi and the evening coffee ceremony.
                        </p>
                      </header>
                      <div role="radiogroup" aria-label="Residence" aria-describedby="room-msg" className="flex flex-col gap-3.5">
                        {rooms.map((r) => {
                          const on = r.slug === form.room;
                          const fits = party <= r.maxGuests;
                          return (
                            <button
                              key={r.slug}
                              type="button"
                              role="radio"
                              aria-checked={on}
                              aria-disabled={!fits}
                              onClick={() => fits && set("room", r.slug)}
                              className={`group flex w-full items-center gap-5 border p-3.5 text-left transition-all duration-500 ${
                                !fits ? "cursor-not-allowed border-ink/10 opacity-50" : on ? "border-ink bg-bronze/10 hover:translate-x-1.5" : "border-ink/15 hover:translate-x-1.5 hover:border-ink/40"
                              } ${on && !fits ? "!border-error !opacity-100" : ""}`}
                            >
                              <span className="relative h-[88px] w-[120px] shrink-0 overflow-hidden">
                                <CmsImage image={r.image} alt="" fill sizes="120px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                              </span>
                              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <span className="font-serif text-[26px] leading-none">{r.name}</span>
                                <span className="text-xs text-muted">
                                  {r.bed} · {r.view} · Up to {r.maxGuests} guests
                                </span>
                                {!fits && <span className="text-xs text-error">Sleeps up to {r.maxGuests} — your party is {party}</span>}
                              </span>
                              <span className="hidden shrink-0 text-right sm:block">
                                <span className="eyebrow block text-[9px] text-muted">From</span>
                                <span className="font-serif text-xl">{r.priceFrom}</span>
                              </span>
                              <span aria-hidden="true" className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-ink">
                                <motion.span className="h-2.5 w-2.5 rounded-full bg-bronze" animate={{ scale: on ? 1 : 0 }} transition={{ duration: 0.4, ease: EASE_LUXE }} />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {err("room") && (
                        <p id="room-msg" role="alert" className="text-[13px] text-error">
                          {err("room")}{" "}
                          <button type="button" className="underline" onClick={() => go(0)}>
                            Change guests
                          </button>
                        </p>
                      )}
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <header>
                        <h1 className="display mb-3 text-[clamp(40px,4vw,60px)]">
                          A little about <em>you</em>
                        </h1>
                        <p className="text-[15px] leading-[1.8] text-muted">So reception can confirm your request and prepare for your arrival. Fields marked * are required.</p>
                      </header>
                      <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
                        <Field id="bk-name" label="Full name *" error={err("name")} valid={ok("name")}>
                          <input
                            id="bk-name"
                            value={form.name}
                            onChange={(e) => set("name", e.target.value)}
                            onBlur={() => touch("name")}
                            autoComplete="name"
                            maxLength={80}
                            placeholder="First and last name"
                            aria-invalid={!!err("name")}
                            aria-describedby="bk-name-msg"
                          />
                        </Field>
                        <Field
                          id="bk-email"
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
                            id="bk-email"
                            type="email"
                            inputMode="email"
                            value={form.email}
                            onChange={(e) => set("email", e.target.value.replace(/\s/g, ""))}
                            onBlur={() => touch("email")}
                            autoComplete="email"
                            maxLength={120}
                            placeholder="name@example.com"
                            aria-invalid={!!err("email")}
                            aria-describedby="bk-email-msg"
                          />
                        </Field>
                        <PhoneField id="bk-phone" label="Phone / WhatsApp *" value={form.phone} onChange={(v) => set("phone", v)} onBlur={() => touch("phone")} error={err("phone")} valid={ok("phone")} />
                        <Field id="bk-country" label="Country of residence *" error={err("country")}>
                          <CountrySelect
                            id="bk-country"
                            value={form.country}
                            onChange={(c) => {
                              setForm((f) => ({ ...f, country: c, phone: f.phone.national ? f.phone : { ...f.phone, country: c as CountryCode } }));
                            }}
                            onBlur={() => touch("country")}
                            invalid={!!err("country")}
                          />
                        </Field>
                        <Field id="bk-eta" label="Estimated arrival time" error={err("eta")}>
                          <Select
                            id="bk-eta"
                            labelledBy="bk-eta-label"
                            value={form.eta}
                            onChange={(v) => set("eta", v)}
                            onBlur={() => touch("eta")}
                            options={ETAS.map((e) => ({ value: e, label: e }))}
                            triggerClassName="min-h-12 border-b border-ink/28 py-3 text-base hover:border-ink/60 aria-expanded:border-bronze"
                          />
                        </Field>
                        <label className="flex min-h-12 cursor-pointer items-center gap-3.5 self-end border-b border-ink/15 py-3">
                          <input type="checkbox" checked={form.transfer} onChange={(e) => set("transfer", e.target.checked)} className="h-5 w-5 accent-ink" />
                          <span className="text-sm">Airport transfer from Bole International</span>
                        </label>
                      </div>
                      <Field id="bk-notes" label="Special requests" error={err("notes")} counter={{ value: form.notes.length, max: NOTES_MAX }}>
                        <textarea
                          id="bk-notes"
                          value={form.notes}
                          onChange={(e) => set("notes", e.target.value)}
                          onBlur={() => touch("notes")}
                          placeholder="Celebrations, dietary needs, accessibility, late check-in…"
                          aria-invalid={!!err("notes")}
                          aria-describedby="bk-notes-msg"
                        />
                      </Field>
                      <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" name="company" value={form.company} onChange={(e) => set("company", e.target.value)} />
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <header>
                        <h1 className="display mb-3 text-[clamp(40px,4vw,60px)]">
                          Review your <em>request</em>
                        </h1>
                        <p className="text-[15px] leading-[1.8] text-muted">This sends your request straight to our reception team. You&apos;ll receive a copy by email.</p>
                      </header>
                      <dl className="grid gap-x-10 sm:grid-cols-2">
                        {(
                          [
                            ["Residence", room.name, 1],
                            ["Dates", `${prettyDate(form.checkin)} → ${prettyDate(form.checkout)} · ${nights} night${nights > 1 ? "s" : ""}`, 0],
                            ["Guests", guestLabel(form.adults, form.children), 0],
                            ["Name", form.name.trim(), 2],
                            ["Email", form.email.trim().toLowerCase(), 2],
                            ["Phone", phoneDisplay, 2],
                            ["Country", countryName, 2],
                            ["Arrival", form.eta, 2],
                            ["Airport transfer", form.transfer ? "Yes, please" : "No", 2],
                          ] as const
                        ).map(([k, v, s]) => (
                          <div key={k} className="flex items-end justify-between gap-4 border-b border-ink/10 py-4">
                            <div className="min-w-0">
                              <dt className="eyebrow mb-1.5 text-[10px] text-muted">{k}</dt>
                              <dd className="truncate font-serif text-[22px]">{v || "—"}</dd>
                            </div>
                            <button type="button" onClick={() => go(s)} className="hlink shrink-0 text-xs text-bronze-deep">
                              Edit
                            </button>
                          </div>
                        ))}
                      </dl>
                      {form.notes.trim() && <p className="border-l-2 border-bronze/50 pl-4 text-sm italic leading-[1.8] text-muted">“{form.notes.trim()}”</p>}
                      <p className="text-xs leading-[1.8] text-muted">
                        This is a booking request, not a confirmed reservation. No payment is taken online. Questions? Call {site.phone}.
                      </p>
                    </>
                  )}
                </motion.section>
              </AnimatePresence>

              {serverErrors.form && (
                <p role="alert" className="mt-8 text-sm text-error">
                  {serverErrors.form}
                </p>
              )}

              <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-14">
                {step > 0 ? (
                  <button type="button" onClick={() => go(step - 1)} className="eyebrow min-h-11 text-muted transition-colors hover:text-ink">
                    ← Previous
                  </button>
                ) : (
                  <span />
                )}
                {step < 3 ? (
                  <button type="submit" className="btn btn-ink">
                    <span>Continue</span>
                    <Arrow />
                  </button>
                ) : (
                  <SendButton sending={sending} />
                )}
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

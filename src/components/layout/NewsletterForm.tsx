"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { newsletterSchema } from "@/lib/booking-schema";

/** Visual-only signup for now — wire to a mailing list provider later. */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const check = (v: string) => {
    const r = newsletterSchema.safeParse({ email: v });
    return r.success ? "" : r.error.issues[0].message;
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {done ? (
        <motion.p key="ok" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border-b border-ivory/40 py-4 text-sm text-bronze-light">
          Thank you — you&apos;re on the list.
        </motion.p>
      ) : (
        <motion.form
          key="form"
          noValidate
          exit={{ opacity: 0, y: -10 }}
          onSubmit={(e) => {
            e.preventDefault();
            const msg = check(email);
            setError(msg);
            if (!msg) setDone(true);
          }}
        >
          <div className={`flex border-b transition-colors focus-within:border-bronze-light ${error ? "border-[#E58F7B]" : "border-ivory/40"}`}>
            <label htmlFor="newsletter" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value.replace(/\s/g, ""));
                if (error) setError(check(e.target.value));
              }}
              aria-invalid={!!error}
              aria-describedby="newsletter-msg"
              placeholder="Your email address"
              className="min-w-0 flex-1 bg-transparent py-4 text-[15px] text-ivory placeholder:text-ivory/60 focus:outline-none"
            />
            <button type="submit" className="eyebrow min-h-11 text-bronze-light transition-colors hover:text-ivory">
              Subscribe
            </button>
          </div>
          <AnimatePresence>
            {error && (
              <motion.p id="newsletter-msg" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-[12px] text-[#E58F7B]">
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

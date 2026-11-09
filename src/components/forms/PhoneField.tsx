"use client";

import { AsYouType, parsePhoneNumberFromString, validatePhoneNumberLength, type CountryCode } from "libphonenumber-js";
import { useMemo } from "react";
import Select, { type Option } from "./Select";
import Field from "./Field";
import Flag from "./Flag";
import { countries, countryByCode, PINNED_COUNTRIES } from "@/lib/countries";

export type PhoneValue = { country: CountryCode; national: string };

/** E.164 string for the API (falls back to the raw text so validation fails clearly). */
export function toE164({ country, national }: PhoneValue) {
  if (!national.trim()) return "";
  return parsePhoneNumberFromString(national, country)?.number ?? national;
}

export function isPhoneValid(v: PhoneValue) {
  return !!parsePhoneNumberFromString(v.national, v.country)?.isValid();
}

export default function PhoneField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  valid,
}: {
  id: string;
  label: string;
  value: PhoneValue;
  onChange: (v: PhoneValue) => void;
  onBlur?: () => void;
  error?: string;
  valid?: boolean;
}) {
  const dialOptions: Option[] = useMemo(
    () => countries.map((c) => ({ value: c.code, label: c.name, hint: c.dial, icon: <Flag code={c.code} />, keywords: c.dial })),
    [],
  );
  const example = useMemo(() => {
    const c = countryByCode(value.country);
    return c ? `${c.name} numbers start ${c.dial}` : undefined;
  }, [value.country]);

  const handleInput = (raw: string) => {
    // A pasted international number switches the country automatically.
    if (raw.trim().startsWith("+")) {
      const parsed = parsePhoneNumberFromString(raw);
      if (parsed?.country) return onChange({ country: parsed.country, national: parsed.formatNational() });
      return onChange({ ...value, national: raw.replace(/[^\d+\s()-]/g, "") });
    }
    const digits = raw.replace(/[^\d\s()-]/g, "");
    if (validatePhoneNumberLength(digits, value.country) === "TOO_LONG") return;
    // Only reformat while typing forwards so backspacing over spaces still works.
    const formatted = digits.replace(/\D/g, "").length > value.national.replace(/\D/g, "").length ? new AsYouType(value.country).input(digits) : digits;
    onChange({ ...value, national: formatted });
  };

  return (
    <Field id={id} label={label} error={error} valid={valid} hint={!error && !value.national ? example : undefined}>
      <div className="flex items-stretch border-b border-ink/28 transition-colors focus-within:border-bronze [[data-invalid=true]_&]:border-error">
        <Select
          id={`${id}-country`}
          value={value.country}
          onChange={(c) => onChange({ country: c as CountryCode, national: value.national })}
          options={dialOptions}
          pinned={PINNED_COUNTRIES}
          searchable
          searchPlaceholder="Search country or code"
          labelledBy={`${id}-label`}
          renderValue={(o) => (
            <span className="flex items-center gap-2">
              {o?.icon}
              <span className="tabular-nums">{o?.hint}</span>
            </span>
          )}
          className="shrink-0"
          triggerClassName="min-h-12 pr-3 border-r border-ink/15 text-[15px]"
          menuClassName="w-[min(340px,calc(100vw-40px))]"
        />
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={value.national}
          onChange={(e) => handleInput(e.target.value)}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={`${id}-msg`}
          placeholder="91 123 4567"
          className="!border-0 !pl-4 !pr-6"
        />
      </div>
    </Field>
  );
}

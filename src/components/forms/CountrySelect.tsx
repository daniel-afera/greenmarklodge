"use client";

import { useMemo } from "react";
import Select, { type Option } from "./Select";
import { countries, PINNED_COUNTRIES } from "@/lib/countries";

export default function CountrySelect({
  id,
  value,
  onChange,
  onBlur,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (code: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
}) {
  const options: Option[] = useMemo(() => countries.map((c) => ({ value: c.code, label: c.name, icon: c.flag, keywords: c.dial })), []);
  return (
    <Select
      id={id}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      invalid={invalid}
      options={options}
      pinned={PINNED_COUNTRIES}
      searchable
      searchPlaceholder="Search countries"
      placeholder="Choose country"
      labelledBy={`${id}-label`}
      renderValue={(o) =>
        o ? (
          <span className="flex items-center gap-2.5">
            <span className="text-lg leading-none">{o.icon}</span>
            {o.label}
          </span>
        ) : (
          <span className="opacity-60">Choose country</span>
        )
      }
      triggerClassName="min-h-12 border-b border-ink/28 py-3 text-base transition-colors hover:border-ink/60 aria-[invalid=true]:border-error aria-expanded:border-bronze"
    />
  );
}

import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";

export type Country = { code: CountryCode; name: string; dial: string; flag: string };

const flagOf = (code: string) => String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

const names = new Intl.DisplayNames(["en"], { type: "region" });

export const countries: Country[] = getCountries()
  .map((code) => ({ code, name: names.of(code) ?? code, dial: `+${getCountryCallingCode(code)}`, flag: flagOf(code) }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** Shown first when the list is not filtered. */
export const PINNED_COUNTRIES: CountryCode[] = ["ET", "KE", "DJ", "US", "GB", "AE", "DE", "FR", "IT", "CN"];

export const DEFAULT_COUNTRY: CountryCode = "ET";

export const countryByCode = (code: string) => countries.find((c) => c.code === code);

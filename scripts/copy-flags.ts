/**
 * Copies the flag SVGs the country pickers need (flag-icons, 4:3) into
 * public/flags/<code>.svg. Emoji flags show as two letters on Windows.
 *
 *   npx tsx scripts/copy-flags.ts   (after updating flag-icons)
 */
import { copyFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { getCountries } from "libphonenumber-js";

const src = path.join(process.cwd(), "node_modules/flag-icons/flags/4x3");
const out = path.join(process.cwd(), "public/flags");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
// Territories without their own file use their parent's flag.
const ALIAS: Record<string, string> = { AC: "sh", TA: "sh" };
const missing: string[] = [];
for (const code of getCountries()) {
  const file = path.join(src, `${ALIAS[code] ?? code.toLowerCase()}.svg`);
  if (existsSync(file)) copyFileSync(file, path.join(out, `${code.toLowerCase()}.svg`));
  else missing.push(code);
}
console.log(`${getCountries().length - missing.length} flags copied${missing.length ? `; no flag for ${missing.join(", ")}` : ""}.`);

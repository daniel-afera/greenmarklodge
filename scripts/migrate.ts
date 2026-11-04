/**
 * Applies supabase/migrations/*.sql in order, each in a transaction.
 * Applied versions are recorded in supabase_migrations.schema_migrations
 * (the same table the Supabase CLI uses, so `supabase db push` stays compatible).
 *
 *   npm run migrate            apply pending migrations
 *   npm run migrate -- --list  show applied / pending
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { connect } from "./lib/pg";

const DIR = path.join(process.cwd(), "supabase/migrations");

async function main() {
  const listOnly = process.argv.includes("--list");
  const files = (await readdir(DIR)).filter((f) => /^\d+_.+\.sql$/.test(f)).sort();
  const db = await connect();
  try {
    await db.query(`
      create schema if not exists supabase_migrations;
      create table if not exists supabase_migrations.schema_migrations (
        version text primary key, statements text[], name text
      );`);
    const { rows } = await db.query<{ version: string }>("select version from supabase_migrations.schema_migrations");
    const applied = new Set(rows.map((r) => r.version));

    for (const file of files) {
      const [version, ...rest] = file.replace(/\.sql$/, "").split("_");
      const name = rest.join("_");
      if (applied.has(version)) {
        if (listOnly) console.log(`  applied  ${file}`);
        continue;
      }
      if (listOnly) {
        console.log(`  pending  ${file}`);
        continue;
      }
      const sql = await readFile(path.join(DIR, file), "utf8");
      process.stdout.write(`→ ${file} … `);
      await db.query("begin");
      try {
        await db.query(sql);
        await db.query("insert into supabase_migrations.schema_migrations (version, statements, name) values ($1, $2, $3)", [version, [sql], name]);
        await db.query("commit");
        console.log("done");
      } catch (err) {
        await db.query("rollback");
        console.log("failed");
        throw err;
      }
    }
    if (!listOnly) console.log("Migrations up to date.");
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

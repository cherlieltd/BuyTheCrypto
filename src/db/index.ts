import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

type Sql = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as { sql?: Sql | null; url?: string };

function createSql(connectionString: string) {
  const parsed = new URL(connectionString);
  const hostname = parsed.hostname;
  const local = hostname === "localhost" || hostname === "127.0.0.1";
  return postgres({
    host: hostname,
    port: Number(parsed.port || 5432),
    database: parsed.pathname.replace(/^\//, "") || "postgres",
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    prepare: false,
    max: 1,
    ssl: local ? false : { servername: hostname, rejectUnauthorized: !hostname.endsWith(".pooler.supabase.com") },
  });
}

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!globalForDb.sql || globalForDb.url !== url) {
    globalForDb.url = url;
    globalForDb.sql = createSql(url);
  }
  return drizzle(globalForDb.sql, { schema });
}

export type Database = NonNullable<ReturnType<typeof getDb>>;

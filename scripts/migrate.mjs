import dns from "node:dns/promises";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

async function connectionOptions(connectionString) {
  const parsed = new URL(connectionString);
  const hostname = parsed.hostname;
  let host = hostname;
  try {
    await dns.resolve4(hostname);
  } catch {
    try {
      const addresses = await dns.resolve6(hostname);
      if (addresses[0]) host = addresses[0];
    } catch {
      host = hostname;
    }
  }
  return {
    host,
    port: Number(parsed.port || 5432),
    database: parsed.pathname.replace(/^\//, "") || "postgres",
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    ssl:
    hostname === "localhost" || hostname === "127.0.0.1"
      ? false
      : { servername: hostname, rejectUnauthorized: hostname.endsWith(".pooler.supabase.com") ? false : true },
  };
}

for (const name of [".env", ".env.local"]) {
  try {
    const text = await readFile(join(process.cwd(), name), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Optional local env files.
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const sql = postgres(await connectionOptions(url));
const directory = join(process.cwd(), "supabase", "migrations");
const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();

for (const file of files) {
  const contents = await readFile(join(directory, file), "utf8");
  console.log(`Applying ${file}`);
  await sql.unsafe(contents);
}

await sql.end();
console.log("Migrations applied.");

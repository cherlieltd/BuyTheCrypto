import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { faqs } from "@/db/schema";
import { fallbackFaqs } from "@/content/faqs";

export async function getPublishedFaqs() {
  const db = getDb();
  if (!db) return fallbackFaqs;
  try {
    const rows = await db.select().from(faqs).where(eq(faqs.published, true)).orderBy(asc(faqs.sortOrder));
    if (rows.length === 0) return fallbackFaqs;
    return rows.map((row) => ({ question: row.question, answer: row.answer }));
  } catch {
    return fallbackFaqs;
  }
}

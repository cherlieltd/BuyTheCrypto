"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, writeAuditLog } from "@/lib/auth";
import { cryptoAssets, faqs, siteSettings } from "@/db/schema";
import { faqSchema } from "@/lib/validation/schemas";

export async function createFaq(formData: FormData) {
  const auth = await requireAdmin();
  const parsed = faqSchema.safeParse({
    question: formData.get("question"),
    answer: formData.get("answer"),
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return;
  await auth.db.insert(faqs).values(parsed.data);
  await writeAuditLog({ adminUserId: auth.profile.id, action: "faq.create", targetType: "faq" });
  revalidatePath("/faq");
  revalidatePath("/admin/settings");
}

export async function saveAnnouncement(formData: FormData) {
  const auth = await requireAdmin();
  const value = String(formData.get("announcement") ?? "").slice(0, 280);
  await auth.db
    .insert(siteSettings)
    .values({ key: "announcement", value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
  await writeAuditLog({ adminUserId: auth.profile.id, action: "settings.announcement", targetType: "site_settings", targetId: "announcement" });
  revalidatePath("/");
}

export async function setAssetVisibility(formData: FormData) {
  const auth = await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  const isActive = formData.get("isActive") === "true";
  if (!slug) return;
  await auth.db
    .insert(cryptoAssets)
    .values({
      symbol: String(formData.get("symbol") ?? slug).toUpperCase(),
      name: String(formData.get("name") ?? slug),
      slug,
      network: String(formData.get("network") ?? "unknown"),
      isActive,
    })
    .onConflictDoUpdate({ target: cryptoAssets.slug, set: { isActive } });
  await writeAuditLog({ adminUserId: auth.profile.id, action: "asset.visibility", targetType: "crypto_asset", targetId: slug });
  revalidatePath("/buy-crypto");
}

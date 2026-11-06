import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { cryptoAssets, faqs, siteSettings } from "@/db/schema";
import { createFaq, saveAnnouncement, setAssetVisibility } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export default async function AdminSettingsPage() {
  const auth = await requireAdmin();
  const [faqRows, assets, announcement] = await Promise.all([
    auth.db.select().from(faqs).orderBy(asc(faqs.sortOrder)),
    auth.db.select().from(cryptoAssets).orderBy(asc(cryptoAssets.symbol)),
    auth.db.select().from(siteSettings).where(eq(siteSettings.key, "announcement")).limit(1),
  ]);

  return (
    <main className="space-y-10">
      <section>
        <h1 className="text-3xl font-semibold">Website settings</h1>
        <p className="mt-2 text-sm text-muted">Public copy, FAQs, and which synced assets are visible. This does not change Transak coverage.</p>
        <form action={saveAnnouncement} className="mt-4 flex gap-2">
          <Input name="announcement" defaultValue={announcement[0]?.value ?? ""} placeholder="Optional announcement" aria-label="Announcement" />
          <Button type="submit" variant="outline">Save</Button>
        </form>
      </section>
      <section>
        <h2 className="text-xl font-semibold">FAQs</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {faqRows.map((faq) => (
            <li key={faq.id}>{faq.question}</li>
          ))}
        </ul>
        <form action={createFaq} className="mt-4 grid gap-3">
          <Input name="question" placeholder="Question" aria-label="Question" required />
          <Textarea name="answer" placeholder="Answer" aria-label="Answer" required />
          <label className="text-sm"><input type="checkbox" name="published" defaultChecked className="mr-2" />Published</label>
          <Button type="submit" className="w-fit">Add FAQ</Button>
        </form>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Asset visibility</h2>
        <p className="mt-2 text-sm text-muted">Hidden assets stay out of the buy list even if Transak allows them.</p>
        <ul className="mt-4 space-y-2">
          {assets.map((asset) => (
            <li key={asset.id} className="flex items-center justify-between gap-3 text-sm">
              <span>{asset.symbol} · {asset.network}</span>
              <form action={setAssetVisibility}>
                <input type="hidden" name="slug" value={asset.slug} />
                <input type="hidden" name="symbol" value={asset.symbol} />
                <input type="hidden" name="name" value={asset.name} />
                <input type="hidden" name="network" value={asset.network} />
                <input type="hidden" name="isActive" value={asset.isActive ? "false" : "true"} />
                <Button type="submit" size="sm" variant="outline">{asset.isActive ? "Hide" : "Show"}</Button>
              </form>
            </li>
          ))}
          {assets.length === 0 ? <li className="text-sm text-muted">Assets appear here after they are synced from a purchase catalog update.</li> : null}
        </ul>
      </section>
    </main>
  );
}

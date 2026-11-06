import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const links = [
  ["/admin", "Overview"],
  ["/admin/users", "Users"],
  ["/admin/orders", "Orders"],
  ["/admin/analytics", "Analytics"],
  ["/admin/support", "Support"],
  ["/admin/settings", "Settings"],
  ["/admin/audit-logs", "Audit logs"],
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof ApiError && error.code === "FORBIDDEN") redirect("/dashboard");
    if (!(error instanceof ApiError) || error.code === "UNAUTHORIZED") redirect("/login?next=/admin");
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[220px_1fr]">
      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-2 md:flex-col" aria-label="Administration">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface hover:text-foreground">
            {label}
          </Link>
        ))}
      </nav>
      <div>{children}</div>
    </div>
  );
}

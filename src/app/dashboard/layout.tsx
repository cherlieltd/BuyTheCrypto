import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ApiError } from "@/lib/errors";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  try {
    await requireUser();
  } catch (error) {
    if (!(error instanceof ApiError) || error.code === "UNAUTHORIZED") {
      redirect("/login?next=/dashboard");
    }
  }

  const links = [
    ["/dashboard", "Overview"],
    ["/dashboard/orders", "Orders"],
    ["/dashboard/profile", "Profile"],
    ["/dashboard/settings", "Settings"],
    ["/dashboard/support", "Support"],
  ];

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[200px_1fr]">
      <nav className="flex gap-2 overflow-x-auto md:flex-col" aria-label="Account">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-full px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-foreground">
            {label}
          </Link>
        ))}
      </nav>
      <div>{children}</div>
    </div>
  );
}

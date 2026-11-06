import type { ReactNode } from "react";

export function Article({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-muted">{children}</div>
    </main>
  );
}

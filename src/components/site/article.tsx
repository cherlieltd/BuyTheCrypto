import type { ReactNode } from "react";

export function Article({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{title}</h1>
      <div className="mt-8 space-y-4 text-base leading-8 text-muted [&_a]:font-medium [&_a]:text-accent [&_strong]:text-foreground">{children}</div>
    </main>
  );
}

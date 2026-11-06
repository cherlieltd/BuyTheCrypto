import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground placeholder:text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground placeholder:text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground",
        className,
      )}
      {...props}
    />
  );
}

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-surface text-muted",
  success: "bg-emerald-50 text-success",
  warning: "bg-amber-50 text-warning",
  danger: "bg-rose-50 text-danger",
  accent: "bg-blue-50 text-accent",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: ComponentProps<"span"> & { tone?: keyof typeof tones }) {
  return (
    <span className={cn("inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold", tones[tone], className)} {...props} />
  );
}

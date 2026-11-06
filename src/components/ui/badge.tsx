import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-white/10 text-foreground",
  success: "bg-emerald-400/15 text-emerald-300",
  warning: "bg-amber-300/15 text-amber-200",
  danger: "bg-rose-400/15 text-rose-200",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: ComponentProps<"span"> & { tone?: keyof typeof tones }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", tones[tone], className)} {...props} />
  );
}

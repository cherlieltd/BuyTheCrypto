import type { WidgetSessionInput } from "@/lib/transak/widget";
import { createWidgetSession } from "@/lib/transak/client";

export type CheckoutInput = Omit<WidgetSessionInput, "apiKey" | "referrerDomain">;

export interface OnRampProvider {
  readonly id: string;
  createCheckout(request: Request, input: CheckoutInput): Promise<{ widgetUrl: string; expiresInSeconds: number }>;
}

export const transakOnRamp: OnRampProvider = {
  id: "transak",
  createCheckout(request, input) {
    return createWidgetSession(request, input);
  },
};

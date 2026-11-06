"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { checkoutSchema } from "@/lib/validation/schemas";
import { bindTransakWidgetEvents, extractTransakOrderId } from "@/lib/transak/widget";

type Asset = { symbol: string; name: string; network: string; slug: string };
type Fiat = { symbol: string; name?: string; isPopular?: boolean };

const formSchema = checkoutSchema;
type FormValues = z.infer<typeof formSchema>;

export function BuyCryptoForm({ initialSymbol, initialNetwork }: { initialSymbol?: string; initialNetwork?: string }) {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const assets = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const response = await fetch("/api/crypto/assets");
      if (!response.ok) throw new Error("Supported assets could not be loaded.");
      return response.json() as Promise<{ configured: boolean; assets: Asset[]; message?: string }>;
    },
  });
  const fiats = useQuery({
    queryKey: ["fiats"],
    queryFn: async () => {
      const response = await fetch("/api/crypto/fiat");
      if (!response.ok) throw new Error("Supported fiat currencies could not be loaded.");
      return response.json() as Promise<{ configured: boolean; currencies: Fiat[]; message?: string }>;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fiatCurrency: "USD",
      cryptoCurrency: initialSymbol ?? "ETH",
      network: initialNetwork ?? "ethereum",
      fiatAmount: 100,
      walletAddress: "",
    },
  });

  const selectedSymbol = useWatch({ control: form.control, name: "cryptoCurrency" });
  const fiatCurrency = useWatch({ control: form.control, name: "fiatCurrency" });
  const network = useWatch({ control: form.control, name: "network" });
  const fiatAmount = useWatch({ control: form.control, name: "fiatAmount" });
  const networks = (assets.data?.assets ?? []).filter((asset) => asset.symbol === selectedSymbol);

  const quote = useQuery({
    queryKey: ["quote", fiatCurrency, selectedSymbol, network, fiatAmount],
    enabled: Boolean(assets.data?.configured && fiatAmount > 0 && network),
    queryFn: async () => {
      const params = new URLSearchParams({
        fiatCurrency: form.getValues("fiatCurrency"),
        cryptoCurrency: form.getValues("cryptoCurrency"),
        network: form.getValues("network"),
        fiatAmount: String(form.getValues("fiatAmount")),
      });
      const response = await fetch(`/api/transak/quote?${params.toString()}`);
      if (response.status === 401) return null;
      if (!response.ok) return null;
      return response.json() as Promise<{ quote: { cryptoAmount?: number; totalFee?: number }; notice: string }>;
    },
  });

  const checkout = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await fetch("/api/transak/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await response.json();
      if (response.status === 401) {
        router.push("/login?next=/buy-crypto");
        return null;
      }
      if (!response.ok) throw new Error(body.error?.message ?? "Checkout could not be started.");
      return body as { orderId: string; widgetUrl: string };
    },
    onSuccess: async (session) => {
      if (!session) return;
      const { Transak } = await import("@transak/ui-js-sdk");
      const transak = new Transak({ widgetUrl: session.widgetUrl, themeColor: "#10b981" });
      const report = (payload: unknown) => {
        void fetch("/api/orders", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderId: session.orderId, providerOrderId: extractTransakOrderId(payload) }),
        });
      };
      bindTransakWidgetEvents(Transak, {
        onCreated: report,
        onSuccessful: (payload) => {
          report(payload);
          setNotice("Transak reported the order. BuyTheCrypto will show it as completed only after Transak confirms the status.");
        },
        onCancelled: () => setNotice("Checkout was cancelled. BuyTheCrypto has not recorded a completed purchase."),
        onFailed: () => setNotice("The Transak widget reported a failure. The saved status will update from Transak, not from this browser event."),
        onClose: () => transak.close(),
      });
      transak.init();
    },
    onError: (error: Error) => setNotice(error.message),
  });

  const symbols = [...new Set((assets.data?.assets ?? []).map((asset) => asset.symbol))];

  return (
    <Card>
      <CardContent>
        <form className="grid gap-4" onSubmit={form.handleSubmit((values) => checkout.mutate(values))} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="fiatCurrency">Fiat currency</Label>
              <Select id="fiatCurrency" {...form.register("fiatCurrency")}>
                {(fiats.data?.currencies ?? []).map((fiat) => (
                  <option key={fiat.symbol} value={fiat.symbol}>
                    {fiat.symbol} {fiat.name ? `· ${fiat.name}` : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fiatAmount">Amount</Label>
              <Input id="fiatAmount" type="number" min="1" step="1" {...form.register("fiatAmount", { valueAsNumber: true })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cryptoCurrency">Cryptocurrency</Label>
              <Select
                id="cryptoCurrency"
                {...form.register("cryptoCurrency", {
                  onChange: (event) => {
                    const next = (assets.data?.assets ?? []).find((asset) => asset.symbol === event.target.value);
                    if (next) form.setValue("network", next.network);
                  },
                })}
              >
                {symbols.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="network">Network</Label>
              <Select id="network" {...form.register("network")}>
                {networks.map((asset) => (
                  <option key={asset.slug} value={asset.network}>
                    {asset.network}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="walletAddress">External wallet address</Label>
            <Input id="walletAddress" autoComplete="off" placeholder="Address you control" {...form.register("walletAddress")} />
            <p className="text-xs text-muted">Do not enter a seed phrase or private key. BuyTheCrypto cannot recover one.</p>
          </div>
          {form.formState.errors.walletAddress ? (
            <p className="text-sm text-danger">{form.formState.errors.walletAddress.message}</p>
          ) : null}
          {assets.isLoading || fiats.isLoading ? <p className="text-sm text-muted">Loading supported purchase options from Transak…</p> : null}
          {assets.data && !assets.data.configured ? <p className="text-sm text-warning">{assets.data.message}</p> : null}
          {assets.isError || fiats.isError ? <p className="text-sm text-warning">Supported purchase options could not be loaded from Transak.</p> : null}
          {quote.data?.quote ? (
            <p className="rounded-xl bg-surface p-4 text-sm text-muted">
              Transak estimate: {quote.data.quote.cryptoAmount ?? "—"} {selectedSymbol}
              {quote.data.quote.totalFee != null ? ` · fee ${quote.data.quote.totalFee}` : ""}. {quote.data.notice}
            </p>
          ) : null}
          {notice ? <p className="text-sm text-success">{notice}</p> : null}
          <Button type="submit" disabled={checkout.isPending || assets.data?.configured !== true || fiats.data?.configured !== true}>
            {checkout.isPending ? "Opening Transak…" : "Continue to Transak"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

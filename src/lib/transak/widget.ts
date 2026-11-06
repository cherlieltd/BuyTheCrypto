export type WidgetSessionInput = {
  apiKey: string;
  referrerDomain: string;
  fiatCurrency: string;
  fiatAmount: number;
  cryptoCurrencyCode: string;
  network: string;
  walletAddress: string;
  partnerOrderId: string;
  partnerCustomerId: string;
  email?: string;
};

/** Widget parameters documented at https://docs.transak.com/customization/query-parameters */
export function buildWidgetParams(input: WidgetSessionInput) {
  return {
    apiKey: input.apiKey,
    referrerDomain: input.referrerDomain,
    productsAvailed: "BUY",
    fiatCurrency: input.fiatCurrency,
    fiatAmount: input.fiatAmount,
    cryptoCurrencyCode: input.cryptoCurrencyCode,
    network: input.network,
    walletAddress: input.walletAddress,
    disableWalletAddressForm: true,
    hideExchangeScreen: true,
    partnerOrderId: input.partnerOrderId,
    partnerCustomerId: input.partnerCustomerId,
    ...(input.email ? { email: input.email } : {}),
  };
}

export const TRANSAK_WIDGET_EVENTS = {
  INITIALISED: "TRANSAK_WIDGET_INITIALISED",
  OPEN: "TRANSAK_WIDGET_OPEN",
  ORDER_CREATED: "TRANSAK_ORDER_CREATED",
  ORDER_SUCCESSFUL: "TRANSAK_ORDER_SUCCESSFUL",
  ORDER_CANCELLED: "TRANSAK_ORDER_CANCELLED",
  ORDER_FAILED: "TRANSAK_ORDER_FAILED",
  CLOSE: "TRANSAK_WIDGET_CLOSE",
} as const;

export type WidgetHandlers = {
  onCreated: (payload: unknown) => void;
  onSuccessful: (payload: unknown) => void;
  onCancelled: (payload: unknown) => void;
  onFailed: (payload: unknown) => void;
  onClose: () => void;
};

type TransakEventName =
  | "TRANSAK_WIDGET_INITIALISED"
  | "TRANSAK_ORDER_CREATED"
  | "TRANSAK_ORDER_SUCCESSFUL"
  | "TRANSAK_ORDER_CANCELLED"
  | "TRANSAK_ORDER_FAILED"
  | "TRANSAK_WIDGET_CLOSE"
  | "TRANSAK_WALLET_REDIRECTION"
  | "TRANSAK_WIDGET_CLOSE_REQUEST";

type WidgetEventApi = {
  EVENTS: Record<string, string>;
  on: (event: TransakEventName, handler: (payload?: unknown) => void) => void;
};

/**
 * Binds the documented Transak SDK events.
 * ORDER_SUCCESSFUL only requests server reconciliation. It does not mark an order complete.
 */
export function bindTransakWidgetEvents(sdk: WidgetEventApi, handlers: WidgetHandlers) {
  sdk.on(TRANSAK_WIDGET_EVENTS.ORDER_CREATED, handlers.onCreated);
  sdk.on(TRANSAK_WIDGET_EVENTS.ORDER_SUCCESSFUL, handlers.onSuccessful);
  sdk.on(TRANSAK_WIDGET_EVENTS.ORDER_CANCELLED, handlers.onCancelled);
  sdk.on(TRANSAK_WIDGET_EVENTS.ORDER_FAILED, handlers.onFailed);
  sdk.on(TRANSAK_WIDGET_EVENTS.CLOSE, handlers.onClose);
}

export function extractTransakOrderId(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  const status = record.status;
  if (status && typeof status === "object") {
    const id = (status as Record<string, unknown>).id;
    if (typeof id === "string") return id;
  }
  if (typeof record.id === "string") return record.id;
  return undefined;
}

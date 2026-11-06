import "server-only";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { cryptoAssets, cryptoOrders, webhookEvents } from "@/db/schema";
import type { OrderPatch, OrderRepository, StoredOrder, StoredWebhookEvent } from "@/lib/orders/reconcile";
import { ApiError } from "@/lib/errors";

function mapOrder(row: typeof cryptoOrders.$inferSelect): StoredOrder {
  return {
    id: row.id,
    userId: row.userId,
    provider: "transak",
    providerOrderId: row.providerOrderId,
    fiatCurrency: row.fiatCurrency,
    fiatAmount: String(row.fiatAmount),
    cryptoCurrency: row.cryptoCurrency,
    cryptoAmount: row.cryptoAmount ? String(row.cryptoAmount) : null,
    blockchainNetwork: row.blockchainNetwork,
    walletAddress: row.walletAddress,
    status: row.status,
    providerReference: row.providerReference,
  };
}

export function createDrizzleOrderRepository(): OrderRepository {
  return {
    async findEvent(provider, providerEventId) {
      const db = getDb();
      if (!db) return null;
      const rows = await db
        .select()
        .from(webhookEvents)
        .where(and(eq(webhookEvents.provider, provider), eq(webhookEvents.providerEventId, providerEventId)))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      return {
        provider: "transak",
        providerEventId: row.providerEventId,
        eventType: row.eventType,
        payload: (row.payload ?? {}) as Record<string, unknown>,
        processedAt: row.processedAt?.toISOString() ?? null,
      };
    },
    async insertEvent(event: StoredWebhookEvent) {
      const db = getDb();
      if (!db) throw new ApiError(503, "DATABASE_NOT_CONFIGURED", "DATABASE_URL is not configured.");
      await db.insert(webhookEvents).values({
        provider: event.provider,
        providerEventId: event.providerEventId,
        eventType: event.eventType,
        payload: event.payload,
        processedAt: event.processedAt ? new Date(event.processedAt) : null,
      });
    },
    async findOrderById(id) {
      const db = getDb();
      if (!db) return null;
      const rows = await db.select().from(cryptoOrders).where(eq(cryptoOrders.id, id)).limit(1);
      return rows[0] ? mapOrder(rows[0]) : null;
    },
    async findOrderByProviderOrderId(providerOrderId) {
      const db = getDb();
      if (!db) return null;
      const rows = await db
        .select()
        .from(cryptoOrders)
        .where(and(eq(cryptoOrders.provider, "transak"), eq(cryptoOrders.providerOrderId, providerOrderId)))
        .limit(1);
      return rows[0] ? mapOrder(rows[0]) : null;
    },
    async updateOrder(id, patch: OrderPatch) {
      const db = getDb();
      if (!db) throw new ApiError(503, "DATABASE_NOT_CONFIGURED", "DATABASE_URL is not configured.");
      const rows = await db
        .update(cryptoOrders)
        .set({
          ...(patch.providerOrderId !== undefined ? { providerOrderId: patch.providerOrderId } : {}),
          ...(patch.fiatCurrency ? { fiatCurrency: patch.fiatCurrency } : {}),
          ...(patch.fiatAmount ? { fiatAmount: patch.fiatAmount } : {}),
          ...(patch.cryptoCurrency ? { cryptoCurrency: patch.cryptoCurrency } : {}),
          ...(patch.cryptoAmount !== undefined ? { cryptoAmount: patch.cryptoAmount } : {}),
          ...(patch.blockchainNetwork ? { blockchainNetwork: patch.blockchainNetwork } : {}),
          ...(patch.walletAddress ? { walletAddress: patch.walletAddress } : {}),
          ...(patch.status ? { status: patch.status } : {}),
          ...(patch.providerReference !== undefined ? { providerReference: patch.providerReference } : {}),
          updatedAt: new Date(),
        })
        .where(eq(cryptoOrders.id, id))
        .returning();
      if (!rows[0]) throw new ApiError(404, "NOT_FOUND", "Order not found.");
      return mapOrder(rows[0]);
    },
  };
}

export async function listVisibleAssets() {
  const db = getDb();
  if (!db) return new Map<string, boolean>();
  const rows = await db.select().from(cryptoAssets);
  return new Map(rows.map((row) => [row.slug, row.isActive]));
}

export async function searchAdminOrders(filters: { query?: string; status?: string }) {
  const db = getDb();
  if (!db) return [];
  const conditions = [];
  if (filters.status) conditions.push(eq(cryptoOrders.status, filters.status));
  if (filters.query) {
    const pattern = `%${filters.query}%`;
    conditions.push(
      or(
        ilike(cryptoOrders.cryptoCurrency, pattern),
        ilike(cryptoOrders.providerOrderId, pattern),
        ilike(cryptoOrders.walletAddress, pattern),
        sql`${cryptoOrders.id}::text ilike ${pattern}`,
      ),
    );
  }
  return db
    .select()
    .from(cryptoOrders)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(cryptoOrders.createdAt))
    .limit(100);
}

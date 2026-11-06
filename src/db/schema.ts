import { pgTable, text, timestamp, uuid, boolean, integer, numeric, jsonb, primaryKey, uniqueIndex, index } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: uuid("auth_user_id").notNull().unique(),
  fullName: text("full_name"),
  email: text("email").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.role] })],
);

export const cryptoOrders = pgTable(
  "crypto_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("transak"),
    providerOrderId: text("provider_order_id"),
    fiatCurrency: text("fiat_currency").notNull(),
    fiatAmount: numeric("fiat_amount", { precision: 18, scale: 2 }).notNull(),
    cryptoCurrency: text("crypto_currency").notNull(),
    cryptoAmount: numeric("crypto_amount", { precision: 36, scale: 18 }),
    blockchainNetwork: text("blockchain_network").notNull(),
    walletAddress: text("wallet_address").notNull(),
    status: text("status").notNull(),
    providerReference: text("provider_reference"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("crypto_orders_user_created_idx").on(table.userId, table.createdAt),
    uniqueIndex("crypto_orders_provider_order_idx").on(table.provider, table.providerOrderId),
  ],
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    providerEventId: text("provider_event_id").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("webhook_events_provider_event_idx").on(table.provider, table.providerEventId)],
);

export const cryptoAssets = pgTable(
  "crypto_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    symbol: text("symbol").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    imageUrl: text("image_url"),
    network: text("network").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    coingeckoId: text("coingecko_id"),
  },
  (table) => [uniqueIndex("crypto_assets_slug_idx").on(table.slug)],
);

export const marketPriceCache = pgTable(
  "market_price_cache",
  {
    assetId: text("asset_id").notNull(),
    currency: text("currency").notNull(),
    price: numeric("price", { precision: 36, scale: 12 }).notNull(),
    marketCap: numeric("market_cap", { precision: 36, scale: 2 }),
    volume24h: numeric("volume_24h", { precision: 36, scale: 2 }),
    change24h: numeric("change_24h", { precision: 12, scale: 4 }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.assetId, table.currency] })],
);

export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminUserId: uuid("admin_user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const providerTokens = pgTable("provider_tokens", {
  provider: text("provider").primaryKey(),
  accessToken: text("access_token").notNull(),
  previousAccessToken: text("previous_access_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

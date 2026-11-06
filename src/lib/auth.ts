import "server-only";
import { desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { adminAuditLogs, cryptoOrders, profiles, userRoles } from "@/db/schema";
import { ApiError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export async function getAuthUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function getProfileForAuthUser(authUserId: string) {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(profiles).where(eq(profiles.authUserId, authUserId)).limit(1);
  return rows[0] ?? null;
}

export async function getRoles(profileId: string) {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select().from(userRoles).where(eq(userRoles.userId, profileId));
  return rows.map((row) => row.role);
}

export async function requireUser() {
  const user = await getAuthUser();
  if (!user) throw new ApiError(401, "UNAUTHORIZED", "Sign in to continue.");
  const db = getDb();
  if (!db) {
    throw new ApiError(503, "DATABASE_NOT_CONFIGURED", "DATABASE_URL is not configured.");
  }
  const profile = await getProfileForAuthUser(user.id);
  if (!profile) {
    throw new ApiError(
      409,
      "PROFILE_MISSING",
      "Your profile has not been created yet. Apply the database migration so new accounts receive a profile.",
    );
  }
  const roles = await getRoles(profile.id);
  return { user, profile, roles, db };
}

export async function requireAdmin() {
  const context = await requireUser();
  if (!context.roles.includes("admin")) {
    throw new ApiError(403, "FORBIDDEN", "Administrator access is required.");
  }
  return context;
}

export async function writeAuditLog(input: {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
}) {
  const db = getDb();
  if (!db) return;
  await db.insert(adminAuditLogs).values({
    adminUserId: input.adminUserId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
  });
}

export async function listOrdersForUser(userId: string) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(cryptoOrders).where(eq(cryptoOrders.userId, userId)).orderBy(desc(cryptoOrders.createdAt));
}

export async function searchUsers(query: string) {
  const db = getDb();
  if (!db) return [];
  const pattern = `%${query.trim()}%`;
  const filters = query.trim()
    ? or(ilike(profiles.email, pattern), ilike(profiles.fullName, pattern))
    : undefined;
  return db
    .select({
      id: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      createdAt: profiles.createdAt,
      roles: sql<string[]>`coalesce(array_agg(distinct ${userRoles.role}) filter (where ${userRoles.role} is not null), '{}')`,
    })
    .from(profiles)
    .leftJoin(userRoles, eq(userRoles.userId, profiles.id))
    .where(filters)
    .groupBy(profiles.id)
    .orderBy(desc(profiles.createdAt))
    .limit(50);
}

export async function adminStats() {
  const db = getDb();
  if (!db) {
    return { users: 0, orders: 0, pending: 0, successful: 0, failed: 0 };
  }
  const [users] = await db.select({ count: sql<number>`count(*)::int` }).from(profiles);
  const [orders] = await db.select({ count: sql<number>`count(*)::int` }).from(cryptoOrders);
  const pendingStatuses = [
    "CHECKOUT_OPENED",
    "AWAITING_PAYMENT_FROM_USER",
    "PAYMENT_DONE_MARKED_BY_USER",
    "PROCESSING",
    "PENDING_DELIVERY_FROM_TRANSAK",
    "ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK",
  ];
  const failedStatuses = ["FAILED", "CANCELLED", "EXPIRED"];
  const [pending] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cryptoOrders)
    .where(inArray(cryptoOrders.status, pendingStatuses));
  const [successful] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cryptoOrders)
    .where(eq(cryptoOrders.status, "COMPLETED"));
  const [failed] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cryptoOrders)
    .where(inArray(cryptoOrders.status, failedStatuses));
  return {
    users: users?.count ?? 0,
    orders: orders?.count ?? 0,
    pending: pending?.count ?? 0,
    successful: successful?.count ?? 0,
    failed: failed?.count ?? 0,
  };
}

export { desc, eq };

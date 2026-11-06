import { ApiError } from "@/lib/errors";

export function assertOrderAccess(orderUserId: string, actorUserId: string, isAdmin = false) {
  if (isAdmin || orderUserId === actorUserId) return;
  throw new ApiError(404, "NOT_FOUND", "Order not found.");
}

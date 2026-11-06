import { requireAdmin, searchUsers } from "@/lib/auth";
import { UserAdmin } from "@/components/admin/user-admin";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await searchUsers("");
  return (
    <main>
      <h1 className="text-3xl font-semibold">Users</h1>
      <p className="mt-2 mb-6 text-sm text-muted">Role changes are written to the audit log. They do not change a Transak customer record.</p>
      <UserAdmin initialUsers={users.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() }))} />
    </main>
  );
}

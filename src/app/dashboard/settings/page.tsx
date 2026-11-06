import { requireUser } from "@/lib/auth";
import { SettingsPanel } from "@/components/dashboard/settings-panel";

export default async function SettingsPage() {
  const auth = await requireUser();
  return (
    <main>
      <h1 className="text-3xl font-semibold">Settings</h1>
      <SettingsPanel email={auth.profile.email} />
    </main>
  );
}

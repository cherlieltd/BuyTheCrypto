import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/dashboard/profile-form";

export default async function ProfilePage() {
  const auth = await requireUser();
  return (
    <main>
      <h1 className="text-3xl font-semibold">Profile</h1>
      <ProfileForm fullName={auth.profile.fullName ?? ""} email={auth.profile.email} />
    </main>
  );
}

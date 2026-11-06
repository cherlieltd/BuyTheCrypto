import { SupportForm } from "@/components/support/support-form";

export default function DashboardSupportPage() {
  return (
    <main className="max-w-xl">
      <h1 className="text-3xl font-semibold">Support</h1>
      <p className="mt-2 text-sm text-muted">Payment and identity questions may also need to be handled by Transak.</p>
      <SupportForm />
    </main>
  );
}

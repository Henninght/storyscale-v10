import { CreditCard } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-secondary">Billing</h1>
        <p className="mt-2 text-secondary/80">
          Manage your subscription and payment information.
        </p>
      </div>

      {/* Current Plan */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-secondary">Current Plan</h2>
        </div>

        <div className="mb-6 flex items-center justify-between rounded-lg bg-background p-6">
          <div>
            <h3 className="text-2xl font-bold text-secondary">Free Plan</h3>
            <p className="mt-1 text-secondary/80">5 posts per month</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-secondary">$0</div>
            <div className="text-sm text-secondary/60">per month</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-secondary">Usage this month</h3>
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-secondary/10">
            <div className="h-full w-0 bg-primary"></div>
          </div>
          <p className="text-sm text-secondary/60">0 of 5 posts used</p>
        </div>

        <a
          href="/#pricing"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary-hover"
        >
          <CreditCard className="h-5 w-5" />
          Upgrade Plan
        </a>
      </div>
    </div>
  );
}

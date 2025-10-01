import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-secondary">Settings</h1>
        <p className="mt-2 text-secondary/80">
          Manage your profile and account preferences.
        </p>
      </div>

      <div className="rounded-2xl border border-secondary/10 bg-white p-12 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-4">
          <Settings className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-secondary">
          Settings coming soon
        </h3>
        <p className="mb-6 text-secondary/80">
          Edit your profile, writing style preferences, and account settings.
        </p>
      </div>
    </div>
  );
}

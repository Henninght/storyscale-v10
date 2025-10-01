import { Megaphone } from "lucide-react";

export default function CampaignsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-secondary">Campaigns</h1>
        <p className="mt-2 text-secondary/80">
          Plan and manage your content campaigns with sequential posts.
        </p>
      </div>

      <div className="rounded-2xl border border-secondary/10 bg-white p-12 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-4">
          <Megaphone className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-secondary">
          No active campaigns
        </h3>
        <p className="mb-6 text-secondary/80">
          Create your first campaign to generate a series of related posts.
        </p>
      </div>
    </div>
  );
}

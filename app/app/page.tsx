import { FileText, CheckCircle2, Clock, Megaphone } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary">Workspace</h1>
        <p className="mt-2 text-secondary/80">
          Welcome back! Here's an overview of your content.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Posts This Month"
          value="0 / 5"
          icon={FileText}
          description="Free plan limit"
        />
        <StatCard
          title="Drafts in Progress"
          value="0"
          icon={Clock}
          description="Unfinished posts"
        />
        <StatCard
          title="Ready to Post"
          value="0"
          icon={CheckCircle2}
          description="Completed drafts"
        />
        <StatCard
          title="Active Campaign"
          value="None"
          icon={Megaphone}
          description="No campaigns running"
        />
      </div>

      {/* Recent Drafts Section */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-secondary">Recent Drafts</h2>
          <div className="flex gap-2">
            <button className="rounded-lg border border-secondary/20 px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary/5">
              Grid
            </button>
            <button className="rounded-lg border border-secondary/20 px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary/5">
              List
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="rounded-2xl border border-secondary/10 bg-white p-12 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-secondary">
            No drafts yet
          </h3>
          <p className="mb-6 text-secondary/80">
            Start creating your first LinkedIn post with AI
          </p>
          <a
            href="/app/create"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary-hover"
          >
            <FileText className="h-5 w-5" />
            Create New Post
          </a>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-secondary/10 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-secondary/80">{title}</h3>
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="mb-1 text-3xl font-bold text-secondary">{value}</div>
      <p className="text-sm text-secondary/60">{description}</p>
    </div>
  );
}

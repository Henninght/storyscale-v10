import { FileText } from "lucide-react";

export default function DraftsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-secondary">All Drafts</h1>
        <p className="mt-2 text-secondary/80">
          Manage and organize all your saved draft posts.
        </p>
      </div>

      <div className="rounded-2xl border border-secondary/10 bg-white p-12 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-4">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-secondary">
          No drafts to display
        </h3>
        <p className="mb-6 text-secondary/80">
          Your saved drafts will appear here once you start creating posts.
        </p>
      </div>
    </div>
  );
}

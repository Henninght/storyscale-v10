import { PenSquare } from "lucide-react";

export default function CreatePostPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-secondary">Create New Post</h1>
        <p className="mt-2 text-secondary/80">
          Use AI to generate engaging LinkedIn content tailored to your voice.
        </p>
      </div>

      <div className="rounded-2xl border border-secondary/10 bg-white p-12 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-4">
          <PenSquare className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-secondary">
          Post Creation Wizard
        </h3>
        <p className="mb-6 text-secondary/80">
          This feature is coming soon. You'll be able to create AI-powered LinkedIn posts here.
        </p>
      </div>
    </div>
  );
}

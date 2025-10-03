import { PostWizard } from '@/components/PostWizard';

// Force dynamic rendering since PostWizard uses useSearchParams
export const dynamic = 'force-dynamic';

export default function CreatePostPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-secondary">Create New Post</h1>
        <p className="mt-2 text-secondary/80">
          Use AI to generate engaging LinkedIn content tailored to your voice.
        </p>
      </div>

      <PostWizard />
    </div>
  );
}

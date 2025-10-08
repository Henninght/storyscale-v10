import { PostWizard } from '@/components/PostWizard';

// Force dynamic rendering since PostWizard uses useSearchParams
export const dynamic = 'force-dynamic';

export default function CreatePostPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Create New Post</h1>
        <p className="mt-1.5 text-slate-600">
          Use AI to generate engaging LinkedIn content tailored to your voice.
        </p>
      </div>

      <PostWizard />
    </div>
  );
}

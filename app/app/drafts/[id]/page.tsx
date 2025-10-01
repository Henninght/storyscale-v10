'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { DraftEditor } from '@/components/DraftEditor';

export default function DraftPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.id as string;

  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const db = getFirestore();
        const draftRef = doc(db, 'drafts', draftId);
        const draftSnap = await getDoc(draftRef);

        if (!draftSnap.exists()) {
          setError('Draft not found');
          return;
        }

        const draftData = draftSnap.data();
        setDraft({
          id: draftSnap.id,
          ...draftData,
          createdAt: draftData.createdAt?.toDate(),
          updatedAt: draftData.updatedAt?.toDate(),
        });
      } catch (err) {
        console.error('Error fetching draft:', err);
        setError('Failed to load draft');
      } finally {
        setLoading(false);
      }
    };

    fetchDraft();
  }, [draftId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Draft Not Found</h1>
          <p className="mt-2 text-secondary/80">{error || 'The draft you are looking for does not exist.'}</p>
        </div>
        <button
          onClick={() => router.push('/app')}
          className="rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary-hover"
        >
          Back to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-secondary">Edit Draft</h1>
        <p className="mt-2 text-secondary/80">
          Refine your content or regenerate with different settings.
        </p>
      </div>

      <DraftEditor draft={draft} />
    </div>
  );
}

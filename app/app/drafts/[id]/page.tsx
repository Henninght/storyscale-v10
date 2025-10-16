'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { DraftEditor } from '@/components/DraftEditor';
import { ArrowLeft } from 'lucide-react';

export default function DraftPage() {
  const params = useParams();
  const router = useRouter();
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const auth = getAuth();

        // Wait for auth to initialize
        await new Promise<void>((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve();
          });
        });

        const user = auth.currentUser;

        if (!user) {
          router.push('/login');
          return;
        }

        const db = getFirestore();
        const draftRef = doc(db, 'drafts', params.id as string);
        const draftDoc = await getDoc(draftRef);

        if (!draftDoc.exists()) {
          setError('Draft not found');
          return;
        }

        const draftData = draftDoc.data();

        // Check if user owns this draft
        if (draftData.userId !== user.uid) {
          setError('You do not have permission to view this draft');
          return;
        }

        setDraft({
          id: draftDoc.id,
          ...draftData,
        });
      } catch (err) {
        console.error('Error fetching draft:', err);
        setError('Failed to load draft');
      } finally {
        setLoading(false);
      }
    };

    fetchDraft();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-slate-600">Loading draft...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
          <h3 className="mb-2 text-xl font-semibold text-red-900">{error}</h3>
          <button
            onClick={() => router.push('/app')}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-orange-700 px-6 py-3 font-semibold text-white transition-all hover:bg-orange-800 hover:scale-[1.02]"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Workspace
          </button>
        </div>
      </div>
    );
  }

  if (!draft) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Edit Draft</h1>
        <p className="mt-1.5 text-slate-600">
          Refine and enhance your LinkedIn post.
        </p>
      </div>

      <DraftEditor draft={draft} />
    </div>
  );
}

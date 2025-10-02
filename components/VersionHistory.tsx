'use client';

import { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { History, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Version {
  id: string;
  content: string;
  createdAt: Date;
}

interface VersionHistoryProps {
  draftId: string;
  onLoadVersion: (content: string) => void;
  currentContent: string;
}

export function VersionHistory({ draftId, onLoadVersion, currentContent }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, [draftId]);

  const fetchVersions = async () => {
    try {
      const db = getFirestore();
      const versionsRef = collection(db, 'drafts', draftId, 'versions');
      const q = query(versionsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const versionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        content: doc.data().content,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));

      setVersions(versionsData);
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadVersion = (content: string) => {
    if (confirm('Load this version? Your current unsaved changes will be lost.')) {
      onLoadVersion(content);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-secondary/10 bg-white p-4">
        <div className="text-sm text-secondary/60">Loading version history...</div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="rounded-lg border border-secondary/10 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <History className="h-4 w-4 text-secondary/60" />
          <h3 className="font-semibold text-secondary">Version History</h3>
        </div>
        <p className="text-sm text-secondary/60">
          No previous versions yet. Save or enhance to create versions.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-secondary/10 bg-white p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="mb-3 flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-secondary/60" />
          <h3 className="font-semibold text-secondary">Version History</h3>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {versions.length}
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-secondary/60" />
        ) : (
          <ChevronRight className="h-4 w-4 text-secondary/60" />
        )}
      </button>

      {expanded && (
        <div className="space-y-2">
          {versions.map((version, index) => {
            const preview =
              version.content.length > 80
                ? `${version.content.slice(0, 80)}...`
                : version.content;
            const timeAgo = formatDistanceToNow(version.createdAt, { addSuffix: true });
            const isCurrent = version.content === currentContent;

            return (
              <div
                key={version.id}
                className={`rounded-lg border p-3 transition-colors ${
                  isCurrent
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-secondary/10 hover:border-secondary/20'
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-secondary/60">
                      Version {versions.length - index}
                    </span>
                    {isCurrent && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-secondary/50">{timeAgo}</span>
                </div>
                <p className="mb-2 text-xs text-secondary/70">{preview}</p>
                {!isCurrent && (
                  <Button
                    onClick={() => handleLoadVersion(version.content)}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    Load This Version
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { X, Tag, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LibraryImage, Draft, Campaign } from '@/types';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface TagImageDialogProps {
  image: LibraryImage;
  onClose: () => void;
  onTagsUpdated: () => void;
}

export function TagImageDialog({ image, onClose, onTagsUpdated }: TagImageDialogProps) {
  const [drafts, setDrafts] = useState<(Draft & { id: string })[]>([]);
  const [campaigns, setCampaigns] = useState<(Campaign & { id: string })[]>([]);
  const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set(image.attachedToDrafts || []));
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set(image.attachedToCampaigns || []));
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const db = getFirestore();

        // Fetch drafts
        const draftsRef = collection(db, 'drafts');
        const draftsQuery = query(
          draftsRef,
          where('userId', '==', user.uid),
          orderBy('updatedAt', 'desc')
        );
        const draftsSnapshot = await getDocs(draftsQuery);
        const fetchedDrafts = draftsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as (Draft & { id: string })[];
        setDrafts(fetchedDrafts);

        // Fetch campaigns
        const campaignsRef = collection(db, 'campaigns');
        const campaignsQuery = query(campaignsRef, where('userId', '==', user.uid), where('status', '==', 'active'));
        const campaignsSnapshot = await getDocs(campaignsQuery);
        const fetchedCampaigns = campaignsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as (Campaign & { id: string })[];
        setCampaigns(fetchedCampaigns);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleDraft = (draftId: string) => {
    const newSelected = new Set(selectedDrafts);
    if (newSelected.has(draftId)) {
      newSelected.delete(draftId);
    } else {
      newSelected.add(draftId);
    }
    setSelectedDrafts(newSelected);
  };

  const toggleCampaign = (campaignId: string) => {
    const newSelected = new Set(selectedCampaigns);
    if (newSelected.has(campaignId)) {
      newSelected.delete(campaignId);
    } else {
      newSelected.add(campaignId);
    }
    setSelectedCampaigns(newSelected);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Determine what to attach and detach
      const originalDrafts = new Set(image.attachedToDrafts || []);
      const originalCampaigns = new Set(image.attachedToCampaigns || []);

      const draftsToAttach = Array.from(selectedDrafts).filter(id => !originalDrafts.has(id));
      const draftsToDetach = Array.from(originalDrafts).filter(id => !selectedDrafts.has(id));
      const campaignsToAttach = Array.from(selectedCampaigns).filter(id => !originalCampaigns.has(id));
      const campaignsToDetach = Array.from(originalCampaigns).filter(id => !selectedCampaigns.has(id));

      // Process all changes
      const promises = [];

      for (const draftId of draftsToAttach) {
        promises.push(
          fetch('/api/images/library/tag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.uid,
              imageId: image.id,
              draftId,
              action: 'attach',
            }),
          })
        );
      }

      for (const draftId of draftsToDetach) {
        promises.push(
          fetch('/api/images/library/tag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.uid,
              imageId: image.id,
              draftId,
              action: 'detach',
            }),
          })
        );
      }

      for (const campaignId of campaignsToAttach) {
        promises.push(
          fetch('/api/images/library/tag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.uid,
              imageId: image.id,
              campaignId,
              action: 'attach',
            }),
          })
        );
      }

      for (const campaignId of campaignsToDetach) {
        promises.push(
          fetch('/api/images/library/tag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.uid,
              imageId: image.id,
              campaignId,
              action: 'detach',
            }),
          })
        );
      }

      await Promise.all(promises);

      // Show success message
      const totalChanges = draftsToAttach.length + draftsToDetach.length + campaignsToAttach.length + campaignsToDetach.length;
      if (totalChanges > 0) {
        alert(`✓ Successfully updated ${totalChanges} ${totalChanges === 1 ? 'tag' : 'tags'}`);
      }

      onTagsUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving tags:', error);
      alert('Failed to save tags');
    } finally {
      setIsSaving(false);
    }
  };

  const getDraftTitle = (draft: Draft) => {
    const firstLine = draft.content.split('\n')[0].substring(0, 60);
    return firstLine || 'Untitled draft';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-800">Tag to Posts</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Image Preview */}
        <div className="mb-6 rounded-lg overflow-hidden border border-slate-200 relative group">
          <img
            src={image.url}
            alt={image.prompt || 'Image'}
            className="w-full h-auto max-h-96 object-contain"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={() => {
                // Open in new tab to view full size
                window.open(image.url, '_blank');
              }}
              className="px-4 py-2 bg-white text-slate-800 rounded-lg font-medium hover:bg-slate-100 transition-colors"
            >
              View Full Size
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-600">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Drafts Section */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Tag to Posts</h3>
              {drafts.length === 0 ? (
                <div className="text-sm text-slate-500 italic">No drafts available</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {drafts.map((draft) => (
                    <label
                      key={draft.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDrafts.has(draft.id)}
                        onChange={() => toggleDraft(draft.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 truncate">{getDraftTitle(draft)}</div>
                        <div className="text-xs text-slate-500 capitalize">{draft.status.replace('_', ' ')}</div>
                      </div>
                      {selectedDrafts.has(draft.id) && (
                        <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Campaigns Section */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Tag to Campaigns</h3>
              {campaigns.length === 0 ? (
                <div className="text-sm text-slate-500 italic">No active campaigns</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {campaigns.map((campaign) => (
                    <label
                      key={campaign.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCampaigns.has(campaign.id)}
                        onChange={() => toggleCampaign(campaign.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 truncate">{campaign.name}</div>
                        <div className="text-xs text-slate-500">{campaign.theme}</div>
                      </div>
                      {selectedCampaigns.has(campaign.id) && (
                        <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || loading}
            className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Tag className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

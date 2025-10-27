'use client';

import { useState, useEffect } from 'react';
import { X, Plus, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LibraryImage, Draft } from '@/types';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface StudioGalleryProps {
  images: LibraryImage[];
  onImageDeleted: (imageId: string) => void;
  onImageClick: (image: LibraryImage) => void;
}

export function StudioGallery({ images, onImageDeleted, onImageClick }: StudioGalleryProps) {
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [recentDrafts, setRecentDrafts] = useState<(Draft & { id: string })[]>([]);
  const [showDraftsMenu, setShowDraftsMenu] = useState<string | null>(null);
  const [addingToDraft, setAddingToDraft] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentDrafts();
  }, []);

  const fetchRecentDrafts = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore();
      const draftsRef = collection(db, 'drafts');
      const draftsQuery = query(
        draftsRef,
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(draftsQuery);
      const drafts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as (Draft & { id: string })[];
      setRecentDrafts(drafts);
    } catch (error) {
      console.error('Error fetching recent drafts:', error);
    }
  };

  const handleAddToDraft = async (imageId: string, draftId: string) => {
    setAddingToDraft(`${imageId}-${draftId}`);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const response = await fetch('/api/images/library/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          imageId,
          draftId,
          action: 'attach',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add image to draft');
      }

      // Show success feedback
      const draftTitle = recentDrafts.find(d => d.id === draftId)?.content.split('\n')[0].substring(0, 30) || 'draft';
      alert(`✓ Image added to ${draftTitle}`);

      setShowDraftsMenu(null);
    } catch (error) {
      console.error('Error adding image to draft:', error);
      alert(error instanceof Error ? error.message : 'Failed to add image to draft');
    } finally {
      setAddingToDraft(null);
    }
  };

  const handleDelete = async (imageId: string, storagePath: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Delete this image from your library?')) return;

    setDeletingImageId(imageId);
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/images/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          imageId,
          storagePath,
          isLibraryImage: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }

      onImageDeleted(imageId);
    } catch (error) {
      console.error('Error deleting image:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete image');
    } finally {
      setDeletingImageId(null);
    }
  };

  const getDraftTitle = (draft: Draft) => {
    const firstLine = draft.content.split('\n')[0].substring(0, 50);
    return firstLine || 'Untitled draft';
  };

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
        <FileImage className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 mb-2">No Images</h3>
        <p className="text-sm text-slate-600">
          Use the generator to create images for your LinkedIn posts
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Image Library</h2>
          <p className="text-xs text-slate-600 mt-1">
            {images.length} {images.length === 1 ? 'image' : 'images'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {images.map((image) => {
          const totalTagged = image.attachedToDrafts.length + image.attachedToCampaigns.length;
          const isMenuOpen = showDraftsMenu === image.id;

          return (
            <div
              key={image.id}
              className="relative group rounded-lg border border-slate-200 overflow-hidden bg-white hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <div className="flex gap-3 p-3">
                {/* Image Thumbnail */}
                <div
                  onClick={() => onImageClick(image)}
                  className="aspect-[16/9] w-48 flex-shrink-0 relative bg-slate-100 rounded overflow-hidden cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-blue-400 transition-all"
                  title="Click to view full size"
                >
                  <img
                    src={image.url}
                    alt={image.prompt || 'Library image'}
                    className="w-full h-full object-cover"
                  />
                  {image.style && (
                    <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded capitalize font-medium">
                      {image.style}
                    </div>
                  )}
                </div>

                {/* Info & Actions */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-slate-800 truncate" title={image.subStyle}>
                      {image.subStyle || 'Generated Image'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2" title={image.prompt}>
                      {image.prompt || 'AI Generated Image'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {totalTagged > 0 && (
                      <span className="text-xs text-slate-500">
                        {totalTagged} {totalTagged === 1 ? 'post' : 'posts'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDraftsMenu(isMenuOpen ? null : image.id)}
                      className="h-8 gap-1 text-xs hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add to Post
                    </Button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg border border-slate-200 shadow-lg z-10 py-1">
                        {recentDrafts.length > 0 ? (
                          recentDrafts.map((draft) => {
                            const isAlreadyTagged = image.attachedToDrafts.includes(draft.id);
                            return (
                              <button
                                key={draft.id}
                                onClick={() => handleAddToDraft(image.id, draft.id)}
                                disabled={addingToDraft === `${image.id}-${draft.id}` || isAlreadyTagged}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 disabled:opacity-50"
                              >
                                <span className="truncate">{getDraftTitle(draft)}</span>
                                {addingToDraft === `${image.id}-${draft.id}` ? (
                                  <span className="text-xs text-slate-500">Adding...</span>
                                ) : isAlreadyTagged ? (
                                  <span className="text-xs text-green-600 font-medium">✓ Tagged</span>
                                ) : null}
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-3 py-2 text-sm text-slate-500">No recent drafts</div>
                        )}
                        <div className="border-t border-slate-200 my-1"></div>
                        <button
                          onClick={() => {
                            onImageClick(image);
                            setShowDraftsMenu(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors text-blue-600"
                        >
                          View all posts...
                        </button>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(image.id, image.storagePath, e)}
                    disabled={deletingImageId === image.id}
                    className="h-8 gap-1 text-xs hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                    {deletingImageId === image.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Click outside to close dropdown */}
      {showDraftsMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDraftsMenu(null)}
        />
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { X, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DraftImage } from '@/types';
import { ImageUploadDialog } from '@/components/ImageUploadDialog';
import { AIImageGeneratorDialog } from '@/components/AIImageGeneratorDialog';
import { getAuth } from 'firebase/auth';

interface ImageManagerProps {
  draftId: string;
  images: DraftImage[];
  onImagesChange: (images: DraftImage[]) => void;
}

export function ImageManager({ draftId, images, onImagesChange }: ImageManagerProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const handleImageAdded = (newImage: DraftImage) => {
    onImagesChange([...images, newImage]);
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      setDeletingImageId(imageId);

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
          draftId,
          imageId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }

      // Remove image from local state
      onImagesChange(images.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Error deleting image:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete image');
    } finally {
      setDeletingImageId(null);
    }
  };

  const maxImages = 10;
  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => setShowUploadDialog(true)}
          disabled={!canAddMore}
          variant="outline"
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Image
        </Button>

        <Button
          onClick={() => setShowAIDialog(true)}
          disabled={!canAddMore}
          className="gap-2 bg-purple-600 hover:bg-purple-700"
        >
          <Sparkles className="h-4 w-4" />
          Generate with AI
        </Button>
      </div>

      {/* Image Count */}
      {images.length > 0 && (
        <div className="text-sm text-slate-600">
          {images.length} / {maxImages} images
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group rounded-lg border border-slate-200 overflow-hidden bg-slate-50"
            >
              {/* Image */}
              <div className="aspect-square relative">
                <img
                  src={image.url}
                  alt={image.alt || 'Draft image'}
                  className="w-full h-full object-cover"
                />

                {/* Delete Button Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <Button
                    onClick={() => handleDeleteImage(image.id)}
                    disabled={deletingImageId === image.id}
                    variant="destructive"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                  >
                    {deletingImageId === image.id ? (
                      <>Deleting...</>
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* AI Badge */}
              {image.generatedByAI && (
                <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI
                </div>
              )}

              {/* Alt Text */}
              {image.alt && (
                <div className="p-2 bg-white border-t border-slate-200">
                  <p className="text-xs text-slate-600 truncate" title={image.alt}>
                    {image.alt}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
          <p className="text-sm text-slate-500 mb-4">
            No images attached yet
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => setShowUploadDialog(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
            <Button
              onClick={() => setShowAIDialog(true)}
              size="sm"
              className="gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {showUploadDialog && (
        <ImageUploadDialog
          draftId={draftId}
          onClose={() => setShowUploadDialog(false)}
          onImageUploaded={handleImageAdded}
        />
      )}

      {showAIDialog && (
        <AIImageGeneratorDialog
          draftId={draftId}
          onClose={() => setShowAIDialog(false)}
          onImageGenerated={handleImageAdded}
        />
      )}
    </div>
  );
}

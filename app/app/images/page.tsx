'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { LibraryImage } from '@/types';
import { StyleBasedGenerator } from '@/components/ImageStudio/StyleBasedGenerator';
import { StudioGallery } from '@/components/ImageStudio/StudioGallery';
import { TagImageDialog } from '@/components/ImageStudio/TagImageDialog';
import { PageTransition } from '@/components/PageTransition';

export default function ImageStudioPage() {
  const { user, loading: authLoading } = useAuth();
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<LibraryImage | null>(null);

  const fetchImages = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/images/library/list?userId=${user.uid}`);

      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const result = await response.json();
      setImages(result.images || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchImages();
    }
  }, [user, authLoading]);

  const handleImageGenerated = (newImage: LibraryImage) => {
    setImages([newImage, ...images]);
  };

  const handleImageDeleted = (imageId: string) => {
    setImages(images.filter(img => img.id !== imageId));
  };

  const handleImageClick = (image: LibraryImage) => {
    setSelectedImage(image);
  };

  const handleTagsUpdated = () => {
    // Refresh the images list after tagging
    fetchImages();
  };

  if (authLoading || loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center h-96">
          <p className="text-slate-600">Loading...</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Image Studio</h1>
          <p className="mt-1 text-slate-600">
            Generate AI images with style presets and tag them to your posts
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[400px_1fr] gap-6">
          {/* Left: Generator */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <StyleBasedGenerator onImageGenerated={handleImageGenerated} />
          </div>

          {/* Right: Gallery */}
          <div>
            <StudioGallery
              images={images}
              onImageDeleted={handleImageDeleted}
              onImageClick={handleImageClick}
            />
          </div>
        </div>

        {/* Tag Dialog */}
        {selectedImage && (
          <TagImageDialog
            image={selectedImage}
            onClose={() => setSelectedImage(null)}
            onTagsUpdated={handleTagsUpdated}
          />
        )}
      </div>
    </PageTransition>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { X, Download, Tag, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LibraryImage } from '@/types';

interface ImageViewerProps {
  image: LibraryImage;
  onClose: () => void;
  onTagClick: () => void;
  onDelete: () => void;
}

export function ImageViewer({ image, onClose, onTagClick, onDelete }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, zoom]);

  const handleDownload = () => {
    // Create a temporary link to download the image
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `${image.subStyle || 'image'}-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const totalTagged = image.attachedToDrafts.length + image.attachedToCampaigns.length;

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        aria-label="Close viewer"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Image Container */}
      <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <img
          src={image.url}
          alt={image.prompt || 'Library image'}
          className="max-w-full max-h-[90vh] object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        />

        {/* Zoom Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="p-1 rounded-full hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-white text-sm font-medium min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="p-1 rounded-full hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
        <div className="max-w-5xl mx-auto">
          {/* Metadata */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-white">
                {image.subStyle || 'Generated Image'}
              </h2>
              {image.style && (
                <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded capitalize font-medium">
                  {image.style}
                </span>
              )}
              {totalTagged > 0 && (
                <span className="inline-block bg-white/20 text-white text-xs px-2 py-1 rounded font-medium">
                  {totalTagged} {totalTagged === 1 ? 'post' : 'posts'}
                </span>
              )}
            </div>
            {image.prompt && (
              <p className="text-sm text-slate-300 line-clamp-2">
                {image.prompt}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={onTagClick}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Tag className="h-4 w-4" />
              Tag to Posts
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              onClick={onDelete}
              variant="outline"
              className="gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-100 border-red-500/50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="absolute top-4 left-4 text-white/60 text-sm">
        Press ESC to close
      </div>
    </div>
  );
}

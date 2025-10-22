'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DraftImage } from '@/types';
import { getAuth } from 'firebase/auth';

interface ImageUploadDialogProps {
  draftId: string;
  onClose: () => void;
  onImageUploaded: (image: DraftImage) => void;
}

export function ImageUploadDialog({ draftId, onClose, onImageUploaded }: ImageUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return 'Invalid file type. Please upload JPG, PNG, or WebP images.';
    }

    if (file.size > maxSize) {
      return 'File is too large. Maximum size is 10MB.';
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setError(error);
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', user.uid);
      formData.append('draftId', draftId);
      if (altText) {
        formData.append('alt', altText);
      }

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const result = await response.json();
      onImageUploaded(result.image);
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Upload Image</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Upload Area */}
        <div className="space-y-4">
          {!selectedFile ? (
            <>
              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                  transition-colors
                  ${isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-300 hover:border-primary hover:bg-slate-50'
                  }
                `}
              >
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-medium text-slate-700 mb-2">
                  {isDragging ? 'Drop image here' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-sm text-slate-500">
                  JPG, PNG, or WebP • Max 10MB
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </>
          ) : (
            <>
              {/* Preview */}
              <div className="relative rounded-lg overflow-hidden border border-slate-200">
                <img
                  src={previewUrl!}
                  alt="Preview"
                  className="w-full h-auto"
                />
                <Button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setAltText('');
                  }}
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Alt Text Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Alt Text (Optional)
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe the image for accessibility..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Helps screen readers and improves SEO
                </p>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex-1 gap-2"
          >
            {isUploading ? (
              <>Uploading...</>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

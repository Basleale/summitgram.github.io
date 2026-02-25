'use client';

import React, { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Upload, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PinModalProps {
  onClose: () => void;
  onPinCreated: () => Promise<void>;
}

export default function PinModal({ onClose, onPinCreated }: PinModalProps) {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabaseRef = useRef(createClient());

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'image');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');

    const { url } = await response.json();
    return url;
  };

  const handleCreatePin = async () => {
    if (!image) {
      alert('Please select an image');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = supabaseRef.current;
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Please log in first');
        return;
      }

      // Upload image to Vercel Blob
      const imageUrl = await uploadImage(image);

      // Create pin in database
      const { data: pinData, error: pinError } = await supabase
        .from('pins')
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          description,
          x: 100,
          y: 100,
        })
        .select();

      if (pinError) throw pinError;

      await onPinCreated();
    } catch (error) {
      console.error('Error creating pin:', error);
      alert('Failed to create pin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordAudio = () => {
    if (!isRecording) {
      setIsRecording(true);
      // TODO: Implement audio recording
    } else {
      setIsRecording(false);
      // TODO: Save audio
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border bg-primary/5">
          <h2 className="text-2xl font-bold text-foreground">Create New Pin</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded text-foreground"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Image
            </label>
            {imagePreview ? (
              <div className="relative w-full h-48 bg-muted rounded overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => {
                    setImage(null);
                    setImagePreview('');
                  }}
                  className="absolute top-2 right-2 p-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-8 hover:border-accent hover:bg-accent/5 transition-colors flex flex-col items-center gap-2"
              >
                <Upload size={32} className="text-muted-foreground" />
                <span className="text-foreground">Click to upload image</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this pin..."
              className="w-full border border-border rounded p-3 min-h-24 resize-none bg-card text-foreground"
            />
          </div>

          {/* Audio Note */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Voice Note (optional)
            </label>
            <Button
              onClick={handleRecordAudio}
              className={`w-full ${
                isRecording
                  ? 'bg-destructive hover:bg-destructive/90'
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              <Mic size={16} className="mr-2" />
              {isRecording ? 'Stop Recording' : 'Record Voice Note'}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePin}
              disabled={!image || isLoading}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isLoading ? 'Creating...' : 'Create Pin'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

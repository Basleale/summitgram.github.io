'use client';
import React, { useState, useRef } from 'react';
import { dbLocal } from '@/lib/db';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PinModal({ onClose, onPinCreated }: any) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImage = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleCreate = async () => {
    if (!imageFile) return;
    setLoading(true);

    // In a real local app, we store the file itself in IndexedDB
    await dbLocal.savePin({
      image_blob: imageFile, 
      image_url: preview, // Temp URL for session
      description,
      position_x: 100,
      position_y: 100,
      created_at: new Date().toISOString()
    });

    await onPinCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg max-w-md w-full border border-border">
        <h2 className="text-xl font-bold mb-4">Add Evidence</h2>
        
        <div 
          onClick={() => document.getElementById('local-up')?.click()}
          className="w-full h-48 border-2 border-dashed border-border flex items-center justify-center cursor-pointer mb-4"
        >
          {preview ? <img src={preview} className="h-full w-full object-contain" /> : <Upload />}
        </div>
        <input id="local-up" type="file" hidden onChange={handleImage} />

        <textarea 
          className="w-full bg-background border border-border p-2 mb-4" 
          placeholder="Notes..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleCreate} disabled={loading} className="flex-1 bg-accent">
            {loading ? 'Saving...' : 'Pin to Board'}
          </Button>
        </div>
      </div>
    </div>
  );
}
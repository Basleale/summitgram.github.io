'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { X, Tag, Mic, Plus, Trash2, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Pin {
  id: string;
  image_url: string;
  description?: string;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
  tags?: string[];
  audioNotes?: any[];
}

interface PinDetailsModalProps {
  pin: Pin;
  onClose: () => void;
  onUpdate: () => Promise<void>;
  onUnpin: (pinId: string) => void;
}

export default function PinDetailsModal({
  pin,
  onClose,
  onUpdate,
  onUnpin,
}: PinDetailsModalProps) {
  const [tags, setTags] = useState<string[]>(pin.tags || []);
  const [newTag, setNewTag] = useState('');
  const [audioNotes, setAudioNotes] = useState(pin.audioNotes || []);
  const [isRecording, setIsRecording] = useState(false);
  const [description, setDescription] = useState(pin.description || '');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const supabaseRef = useRef(createClient());

  const createdDate = new Date(pin.created_at).toLocaleDateString();
  const modifiedDate = new Date(pin.updated_at).toLocaleDateString();

  const handleAddTag = async () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      try {
        const supabase = supabaseRef.current;
        const { error } = await supabase
          .from('pin_tags')
          .insert({
            pin_id: pin.id,
            tag: newTag.trim(),
          });

        if (!error) {
          setTags([...tags, newTag.trim()]);
          setNewTag('');
        }
      } catch (error) {
        console.error('Error adding tag:', error);
      }
    }
  };

  const handleDeleteTag = async (tag: string) => {
    try {
      const supabase = supabaseRef.current;
      const { error } = await supabase
        .from('pin_tags')
        .delete()
        .eq('pin_id', pin.id)
        .eq('tag', tag);

      if (!error) {
        setTags(tags.filter((t) => t !== tag));
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const handleUpdateDescription = async () => {
    const { error } = await supabase
      .from('pins')
      .update({ description })
      .eq('id', pin.id);

    if (!error) {
      await onUpdate();
    }
  };

  const handleRecordAudio = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Upload audio to Vercel Blob
          const formData = new FormData();
          formData.append('file', audioBlob, `audio-${Date.now()}.webm`);
          formData.append('type', 'audio');

          try {
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              const { url } = await response.json();
              
              // Save audio note to database
              const supabase = supabaseRef.current;
              const { error } = await supabase
                .from('pin_audio_notes')
                .insert({
                  pin_id: pin.id,
                  audio_url: url,
                });

              if (!error) {
                setAudioNotes([...audioNotes, { id: Date.now(), audio_url: url }]);
              }
            }
          } catch (error) {
            console.error('Error saving audio:', error);
          }

          // Stop all audio tracks
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Unable to access microphone');
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    }
  };

  const handleDeleteAudio = async (audioId: string) => {
    const supabase = supabaseRef.current;
    const { error } = await supabase
      .from('pin_audio_notes')
      .delete()
      .eq('id', audioId);

    if (!error) {
      setAudioNotes(audioNotes.filter((a) => a.id !== audioId));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold font-serif">Pin Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image */}
          <div className="relative w-full h-64 bg-gray-200 rounded overflow-hidden">
            <Image
              src={pin.image_url}
              alt="Pin image"
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600">
                Pinned Date
              </label>
              <p className="text-gray-800">{createdDate}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">
                Last Modified
              </label>
              <p className="text-gray-800">{modifiedDate}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded p-2 min-h-24 resize-none"
              placeholder="Add description..."
            />
            <Button
              onClick={handleUpdateDescription}
              className="mt-2 bg-blue-600 hover:bg-blue-700"
            >
              Save Description
            </Button>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  <Tag size={14} />
                  {tag}
                  <button
                    onClick={() => handleDeleteTag(tag)}
                    className="hover:text-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' && handleAddTag()
                }
                placeholder="Add new tag..."
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
              <Button
                onClick={handleAddTag}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Audio Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Voice Notes
            </label>
            {audioNotes.length > 0 && (
              <div className="space-y-2 mb-3">
                {audioNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center justify-between bg-gray-100 p-3 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Mic size={16} />
                      <audio
                        src={note.audio_url}
                        controls
                        className="h-8"
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteAudio(note.id)}
                      className="hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Button
              onClick={handleRecordAudio}
              className={`w-full ${
                isRecording
                  ? 'bg-destructive hover:bg-destructive/90'
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {isRecording ? (
                <>
                  <StopCircle size={16} className="mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic size={16} className="mr-2" />
                  Record Voice Note
                </>
              )}
            </Button>
          </div>

          {/* Delete Pin */}
          <div className="pt-4 border-t">
            <Button
              onClick={() => {
                onUnpin(pin.id);
                onClose();
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 size={16} className="mr-2" />
              Unpin This Photo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Link as LinkIcon } from 'lucide-react';

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

interface Link {
  id: string;
  pin_a_id: string;
  pin_b_id: string;
}

interface PinCardProps {
  pin: Pin;
  links: Link[];
  onLinkClick: (targetPinId: string) => void;
  onUnlink: (linkId: string) => void;
  onUnpin: (pinId: string) => void;
  contextMenuOpen: boolean;
}

export default function PinCard({
  pin,
  links,
  onLinkClick,
  onUnlink,
  onUnpin,
  contextMenuOpen,
}: PinCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const relatedLinks = links.filter(
    (l) => l.pin_a_id === pin.id || l.pin_b_id === pin.id
  );

  return (
    <div className="relative group">
      {/* Pin card with polaroid style */}
      <div className="relative w-32 h-40 bg-card rounded shadow-lg overflow-hidden border-4 border-card-foreground/20 transform -rotate-2 hover:rotate-0 transition-transform hover:shadow-xl hover:z-50">
        {/* Image container */}
        <div className="relative w-full h-28 bg-muted overflow-hidden">
          <Image
            src={pin.image_url}
            alt="Pinned image"
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Bottom section with text */}
        <div className="p-2 h-12 flex items-center justify-center text-xs text-center text-card-foreground bg-card">
          <p className="truncate">{pin.description || 'Pinned'}</p>
        </div>

        {/* Brass pin fasteners */}
        <div className="absolute top-2 left-4 w-3 h-3 bg-yellow-700 rounded-full shadow-md border border-yellow-900"></div>
        <div className="absolute top-2 right-4 w-3 h-3 bg-yellow-700 rounded-full shadow-md border border-yellow-900"></div>

        {/* Quick action buttons */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnpin(pin.id);
            }}
            className="p-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full text-xs"
            title="Unpin"
          >
            <X size={12} />
          </button>
        </div>

        {/* Link indicator */}
        {relatedLinks.length > 0 && (
          <div className="absolute bottom-1 right-1 flex items-center gap-1 bg-accent text-accent-foreground px-2 py-0.5 rounded text-xs font-semibold">
            <LinkIcon size={10} />
            {relatedLinks.length}
          </div>
        )}
      </div>

      {/* Rotation effect indicator */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(-2deg);
          }
          50% {
            transform: translateY(-4px) rotate(-2deg);
          }
        }
      `}</style>
    </div>
  );
}

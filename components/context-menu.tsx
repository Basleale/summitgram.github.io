'use client';

import React, { useEffect, useRef } from 'react';
import { Link as LinkIcon, Trash2, Unlink } from 'lucide-react';

interface Pin {
  id: string;
  position_x: number;
  position_y: number;
}

interface Link {
  id: string;
  pin_a_id: string;
  pin_b_id: string;
}

interface ContextMenuProps {
  pinId: string;
  x: number;
  y: number;
  pins: Pin[];
  onLinkPin: (targetPinId: string) => Promise<void>;
  onClose: () => void;
}

export default function ContextMenu({
  pinId,
  x,
  y,
  pins,
  onLinkPin,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const otherPins = pins.filter((p) => p.id !== pinId);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <div className="py-1">
        {/* Link options */}
        {otherPins.length > 0 && (
          <>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border">
              Link to Pin
            </div>
            {otherPins.map((pin) => (
              <button
                key={pin.id}
                onClick={async () => {
                  await onLinkPin(pin.id);
                  onClose();
                }}
                className="w-full text-left px-3 py-2 hover:bg-muted text-sm text-foreground flex items-center gap-2 transition-colors"
              >
                <LinkIcon size={14} className="text-accent" />
                Pin {pins.indexOf(pin) + 1}
              </button>
            ))}
            <div className="border-t border-border my-1"></div>
          </>
        )}

        {/* Delete option */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-3 py-2 hover:bg-destructive hover:text-destructive-foreground text-sm text-foreground flex items-center gap-2 transition-colors"
        >
          <Trash2 size={14} />
          Unpin
        </button>
      </div>
    </div>
  );
}
